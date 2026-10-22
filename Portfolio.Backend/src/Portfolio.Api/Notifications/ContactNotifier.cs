using System.Net;
using System.Net.Http.Json;
using System.Threading.Channels;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using Portfolio.Api.Data;
using Portfolio.Api.Entities;

namespace Portfolio.Api.Notifications;

public class EmailOptions
{
    public const string Section = "Email";

    // API key de Resend (resend.com). Sin dominio propio, Resend solo deja enviar al correo de tu cuenta: justo lo que se necesita
    public string? ResendApiKey { get; set; }
    public string From { get; set; } = "Portafolio <onboarding@resend.dev>";
    // A dónde llegan los avisos. Si está vacío se usa el correo del perfil
    public string? NotifyTo { get; set; }
}

// Avisa por correo de cada mensaje de contacto. Si el envío falla, lo reintenta cada 10 minutos (hasta 3 días)
public class ContactNotifier(
    IServiceScopeFactory scopes,
    IHttpClientFactory httpFactory,
    IOptions<EmailOptions> options,
    ILogger<ContactNotifier> logger) : BackgroundService
{
    private readonly Channel<bool> _signal = Channel.CreateBounded<bool>(new BoundedChannelOptions(1) { FullMode = BoundedChannelFullMode.DropWrite });

    public bool IsConfigured => !string.IsNullOrWhiteSpace(options.Value.ResendApiKey);

    public void Notify() => _signal.Writer.TryWrite(true);

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        if (!IsConfigured)
        {
            logger.LogWarning("Sin API key de Resend: los mensajes de contacto se guardan pero no se avisa por correo.");
            return;
        }

        using var timer = new PeriodicTimer(TimeSpan.FromMinutes(10));
        var tick = timer.WaitForNextTickAsync(stoppingToken).AsTask();
        while (!stoppingToken.IsCancellationRequested)
        {
            await SendPendingAsync(stoppingToken);

            var signal = _signal.Reader.WaitToReadAsync(stoppingToken).AsTask();
            var finished = await Task.WhenAny(signal, tick);
            if (finished == tick) tick = timer.WaitForNextTickAsync(stoppingToken).AsTask();
            else _signal.Reader.TryRead(out _);
        }
    }

    private async Task SendPendingAsync(CancellationToken ct)
    {
        try
        {
            await using var scope = scopes.CreateAsyncScope();
            var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
            var since = DateTimeOffset.UtcNow.AddDays(-3);
            var pending = await db.ContactMessages
                .Where(m => !m.EmailNotified && m.CreatedAt >= since)
                .OrderBy(m => m.CreatedAt)
                .ToListAsync(ct);
            if (pending.Count == 0) return;

            var to = options.Value.NotifyTo;
            if (string.IsNullOrWhiteSpace(to))
                to = await db.SiteProfiles.Select(p => p.Email).FirstOrDefaultAsync(ct);
            if (string.IsNullOrWhiteSpace(to))
            {
                logger.LogWarning("No hay correo de destino para los avisos (Email:NotifyTo o el correo del perfil).");
                return;
            }

            foreach (var message in pending)
            {
                if (await SendAsync(message, to, ct))
                {
                    message.EmailNotified = true;
                    await db.SaveChangesAsync(ct);
                }
            }
        }
        catch (Exception ex) when (ex is not OperationCanceledException)
        {
            logger.LogError(ex, "Error enviando avisos de contacto");
        }
    }

    private async Task<bool> SendAsync(ContactMessage message, string to, CancellationToken ct)
    {
        var http = httpFactory.CreateClient(nameof(ContactNotifier));
        var body = WebUtility.HtmlEncode(message.Message).Replace("\n", "<br>");
        var html = $"""
            <div style="font-family:monospace;background:#000;color:#fff;padding:24px">
              <p style="color:#ff0">* Nuevo mensaje desde tu portafolio</p>
              <p><b>{WebUtility.HtmlEncode(message.Name)}</b> &lt;{WebUtility.HtmlEncode(message.Email)}&gt;</p>
              <p style="border:2px solid #fff;padding:16px">{body}</p>
              <p style="color:#999">Responde a este correo para contestarle directamente.</p>
            </div>
            """;

        using var request = new HttpRequestMessage(HttpMethod.Post, "https://api.resend.com/emails")
        {
            Content = JsonContent.Create(new
            {
                from = options.Value.From,
                to = new[] { to },
                reply_to = message.Email,
                subject = $"Portafolio: mensaje de {message.Name}",
                text = $"{message.Name} <{message.Email}> escribió:\n\n{message.Message}\n\nResponde a este correo para contestarle.",
                html
            })
        };
        request.Headers.Authorization = new("Bearer", options.Value.ResendApiKey);

        using var response = await http.SendAsync(request, ct);
        if (response.IsSuccessStatusCode)
        {
            logger.LogInformation("Aviso de contacto enviado a {To} (mensaje {Id})", to, message.Id);
            return true;
        }

        logger.LogWarning("Resend rechazó el aviso del mensaje {Id}: {Status} {Body}",
            message.Id, (int)response.StatusCode, await response.Content.ReadAsStringAsync(ct));
        return false;
    }
}
