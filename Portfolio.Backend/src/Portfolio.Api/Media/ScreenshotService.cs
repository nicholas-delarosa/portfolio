using System.Net;
using Microsoft.Extensions.Options;
using Microsoft.Playwright;

namespace Portfolio.Api.Media;

public class ScreenshotOptions
{
    public const string Section = "Screenshots";

    // Servidor de Playwright (contenedor "screenshots"), ej. ws://screenshots:3000/
    public string? PlaywrightWsEndpoint { get; set; }
    public int Width { get; set; } = 1280;
    public int Height { get; set; } = 800;
    public int SettleDelayMs { get; set; } = 2500; // espera extra para animaciones y pantallas de carga
}

public class ScreenshotService(IOptions<ScreenshotOptions> options)
{
    public bool IsConfigured => !string.IsNullOrWhiteSpace(options.Value.PlaywrightWsEndpoint);

    public async Task<byte[]> CaptureAsync(string url, CancellationToken ct)
    {
        if (!IsConfigured)
            throw new InvalidOperationException("El servicio de capturas no está configurado (Screenshots:PlaywrightWsEndpoint).");
        if (!IsSafePublicUrl(url))
            throw new InvalidOperationException($"La URL '{url}' no es una dirección pública válida.");

        var o = options.Value;
        using var playwright = await Playwright.CreateAsync();
        await using var browser = await playwright.Chromium.ConnectAsync(o.PlaywrightWsEndpoint!, new() { Timeout = 30_000 });
        var page = await browser.NewPageAsync(new()
        {
            ViewportSize = new() { Width = o.Width, Height = o.Height },
            ColorScheme = ColorScheme.Dark
        });

        try
        {
            await page.GotoAsync(url, new() { WaitUntil = WaitUntilState.NetworkIdle, Timeout = 45_000 });
        }
        catch (TimeoutException)
        {
            // Hay páginas que nunca dejan de pedir cosas (analytics, sockets): se captura igual
        }

        ct.ThrowIfCancellationRequested();
        await page.WaitForTimeoutAsync(o.SettleDelayMs);
        return await page.ScreenshotAsync(new() { Type = ScreenshotType.Png });
    }

    // El demo puede venir del "homepage" de repos ajenos: no permitir que apunte a la red interna
    public static bool IsSafePublicUrl(string url)
    {
        if (!Uri.TryCreate(url, UriKind.Absolute, out var uri)) return false;
        if (uri.Scheme != Uri.UriSchemeHttp && uri.Scheme != Uri.UriSchemeHttps) return false;
        if (IPAddress.TryParse(uri.Host, out _)) return false;
        return uri.Host.Contains('.') && !uri.Host.EndsWith(".local", StringComparison.OrdinalIgnoreCase)
            && !uri.Host.EndsWith(".internal", StringComparison.OrdinalIgnoreCase);
    }
}
