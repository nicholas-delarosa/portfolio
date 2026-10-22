namespace Portfolio.Api.Entities;

// Archivos pequeños guardados en la propia base de datos (ej. el CV en PDF).
// Cloudinary gratis bloquea la descarga de PDF por defecto, y así el CV viaja con los backups de la BD
public class StoredFile
{
    public required string Key { get; set; } // ej. "cv-es"
    public required string FileName { get; set; }
    public required string ContentType { get; set; }
    public required byte[] Data { get; set; }
    public DateTimeOffset UpdatedAt { get; set; }
}
