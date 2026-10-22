using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using Portfolio.Api.Data;
using Portfolio.Api.Entities;

namespace Portfolio.Api.Sync;

// Ejecuta la sincronización cada X horas y bajo demanda (botón del admin), nunca dos a la vez
public class SyncRunner(
    IServiceScopeFactory scopes,
    IOptions<GitHubSyncOptions> options,
    IHostApplicationLifetime lifetime,
    ILogger<SyncRunner> logger) : BackgroundService
{
    private readonly SemaphoreSlim _gate = new(1, 1);

    public bool IsRunning => _gate.CurrentCount == 0;

    public bool TryStartManual()
    {
        if (!_gate.Wait(0)) return false;
        _ = Task.Run(() => RunLockedAsync(SyncTrigger.Manual, lifetime.ApplicationStopping));
        return true;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        await MarkInterruptedRunsAsync(stoppingToken);

        await using (var scope = scopes.CreateAsyncScope())
        {
            if (!scope.ServiceProvider.GetRequiredService<GitHubClient>().IsConfigured)
            {
                logger.LogWarning("Sin token de GitHub: la sincronización automática está desactivada.");
                return;
            }
        }

        await Task.Delay(TimeSpan.FromSeconds(options.Value.InitialDelaySeconds), stoppingToken);
        using var timer = new PeriodicTimer(TimeSpan.FromHours(options.Value.IntervalHours));
        do
        {
            if (await _gate.WaitAsync(0, stoppingToken))
                await RunLockedAsync(SyncTrigger.Scheduled, stoppingToken);
        } while (await timer.WaitForNextTickAsync(stoppingToken));
    }

    private async Task RunLockedAsync(SyncTrigger trigger, CancellationToken ct)
    {
        try
        {
            await using var scope = scopes.CreateAsyncScope();
            await scope.ServiceProvider.GetRequiredService<GitHubSyncService>().RunAsync(trigger, ct);
        }
        catch (OperationCanceledException) { }
        catch (Exception ex)
        {
            logger.LogError(ex, "Error inesperado en la sincronización");
        }
        finally
        {
            _gate.Release();
        }
    }

    // Si el servidor se apagó en medio de una sincronización, no dejarla "Running" para siempre
    private async Task MarkInterruptedRunsAsync(CancellationToken ct)
    {
        await using var scope = scopes.CreateAsyncScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        await db.SyncRuns
            .Where(r => r.Status == SyncStatus.Running)
            .ExecuteUpdateAsync(s => s
                .SetProperty(r => r.Status, SyncStatus.Failed)
                .SetProperty(r => r.Error, "Interrumpida por un reinicio del servidor.")
                .SetProperty(r => r.FinishedAt, DateTimeOffset.UtcNow), ct);
    }
}
