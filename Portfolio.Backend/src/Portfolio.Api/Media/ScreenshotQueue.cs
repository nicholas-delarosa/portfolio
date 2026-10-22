using System.Threading.Channels;
using Microsoft.EntityFrameworkCore;
using Portfolio.Api.Data;

namespace Portfolio.Api.Media;

public class ScreenshotQueue
{
    private readonly Channel<int> _channel = Channel.CreateUnbounded<int>();

    public void Enqueue(int projectId) => _channel.Writer.TryWrite(projectId);

    public IAsyncEnumerable<int> ReadAllAsync(CancellationToken ct) => _channel.Reader.ReadAllAsync(ct);
}

// Toma las capturas de una en una en segundo plano y las sube a Cloudinary
public class ScreenshotWorker(
    ScreenshotQueue queue,
    IServiceScopeFactory scopes,
    ILogger<ScreenshotWorker> logger) : BackgroundService
{
    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        await foreach (var projectId in queue.ReadAllAsync(stoppingToken))
        {
            await using var scope = scopes.CreateAsyncScope();
            var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
            var screenshots = scope.ServiceProvider.GetRequiredService<ScreenshotService>();
            var cloudinary = scope.ServiceProvider.GetRequiredService<CloudinaryService>();

            var project = await db.Projects.FirstOrDefaultAsync(p => p.Id == projectId, stoppingToken);
            // Puede que ya no la necesite (otra captura en cola, o subiste una imagen a mano mientras tanto)
            if (project is null || !project.NeedsScreenshot()) continue;
            if (!screenshots.IsConfigured || !cloudinary.IsConfigured)
            {
                logger.LogDebug("Capturas desactivadas: falta Playwright o Cloudinary");
                continue;
            }

            var url = project.EffectiveDemoUrl()!;
            try
            {
                var png = await screenshots.CaptureAsync(url, stoppingToken);
                using var stream = new MemoryStream(png);
                var uploaded = await cloudinary.UploadImageAsync(stream, $"projects/{project.Id}", stoppingToken);
                project.ImageUrl = uploaded.Url;
                project.ImagePublicId = uploaded.PublicId;
                project.ImageSourceUrl = url;
                project.ImageCapturedAt = DateTimeOffset.UtcNow;
                project.ImageError = null;
                logger.LogInformation("Captura lista para {Project} ({Url})", project.FullName, url);
            }
            catch (Exception ex) when (ex is not OperationCanceledException)
            {
                logger.LogWarning(ex, "No se pudo capturar {Url}", url);
                project.ImageError = ex.Message.Length > 500 ? ex.Message[..500] : ex.Message;
            }

            await db.SaveChangesAsync(stoppingToken);
        }
    }
}
