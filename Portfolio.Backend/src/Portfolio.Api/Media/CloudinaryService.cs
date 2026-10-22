using CloudinaryDotNet;
using CloudinaryDotNet.Actions;
using Microsoft.Extensions.Options;

namespace Portfolio.Api.Media;

public class CloudinaryOptions
{
    public const string Section = "Cloudinary";

    // Formato: cloudinary://API_KEY:API_SECRET@CLOUD_NAME (en el panel de Cloudinary, "API Environment variable")
    public string? Url { get; set; }
    public string Folder { get; set; } = "portfolio";
}

public record UploadedFile(string Url, string PublicId);

public class CloudinaryService(IOptions<CloudinaryOptions> options)
{
    private readonly Cloudinary? _client = string.IsNullOrWhiteSpace(options.Value.Url)
        ? null
        : new Cloudinary(options.Value.Url) { Api = { Secure = true } };

    public bool IsConfigured => _client is not null;

    // publicId relativo a la carpeta del portafolio, ej. "projects/123"
    public async Task<UploadedFile> UploadImageAsync(Stream content, string publicId, CancellationToken ct)
    {
        var result = await Client.UploadAsync(new ImageUploadParams
        {
            File = new FileDescription(publicId, content),
            PublicId = $"{options.Value.Folder}/{publicId}",
            Overwrite = true,
            Invalidate = true
        }, ct);

        if (result.Error is not null)
            throw new InvalidOperationException($"Cloudinary: {result.Error.Message}");
        return new UploadedFile(result.SecureUrl.ToString(), result.PublicId);
    }

    public async Task DeleteAsync(string publicId)
    {
        if (_client is null) return;
        await _client.DestroyAsync(new DeletionParams(publicId) { Invalidate = true });
    }

    private Cloudinary Client => _client
        ?? throw new InvalidOperationException("Cloudinary no está configurado (Cloudinary:Url).");
}
