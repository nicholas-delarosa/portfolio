using System.Net.Mail;
using Microsoft.EntityFrameworkCore;
using Portfolio.Api.Data;
using Portfolio.Api.Entities;
using Portfolio.Api.Media;

namespace Portfolio.Api.Endpoints;

public record ProfileRequest(
    string DisplayName,
    int Level,
    string? RoleEs, string? RoleEn,
    string? BioEs, string? BioEn,
    string? DialogEs, string? DialogEn,
    string? LocationEs, string? LocationEn,
    string? Email, string? LinkedInUrl, string? WhatsApp, string? GitHubLogin,
    bool AvailableForWork, string? AvailabilityEs, string? AvailabilityEn,
    string ContributorTagColor,
    List<SpokenLanguage> SpokenLanguages);

public record SkillRequest(string Name, SkillCategory Category, int Level, string? Icon);

public record TimelineRequest(
    TimelineKind Kind, string TitleEs, string TitleEn, string? Organization,
    string? DescriptionEs, string? DescriptionEn, DateOnly StartDate, DateOnly? EndDate, string? Url);

public record MessageDto(int Id, string Name, string Email, string Message, string? Language, bool IsRead, bool EmailNotified, DateTimeOffset CreatedAt);
public record ReadRequest(bool IsRead);

public static class AdminContentEndpoints
{
    private const long MaxPhotoBytes = 5 * 1024 * 1024;
    private const long MaxCvBytes = 5 * 1024 * 1024;

    public static void MapAdminContentEndpoints(this RouteGroupBuilder admin)
    {
        // ---------- Perfil ----------
        admin.MapGet("/profile", async (AppDbContext db, CancellationToken ct) =>
            await db.SiteProfiles.AsNoTracking().FirstAsync(p => p.Id == SiteProfile.SingletonId, ct));

        admin.MapPut("/profile", async (ProfileRequest req, AppDbContext db, CancellationToken ct) =>
        {
            var validation = new Validation()
                .Required("displayName", req.DisplayName).MaxLength("displayName", req.DisplayName, 80)
                .Must(req.Level is >= 1 and <= 99, "level", "El nivel va de 1 a 99.")
                .MaxLength("bioEs", req.BioEs, 1500).MaxLength("bioEn", req.BioEn, 1500)
                .MaxLength("dialogEs", req.DialogEs, 300).MaxLength("dialogEn", req.DialogEn, 300)
                .Must(string.IsNullOrWhiteSpace(req.Email) || MailAddress.TryCreate(req.Email.Trim(), out _), "email", "El correo no es válido.")
                .Url("linkedInUrl", req.LinkedInUrl)
                .Must(string.IsNullOrWhiteSpace(req.WhatsApp) || req.WhatsApp.Count(char.IsDigit) is >= 8 and <= 15, "whatsApp", "Escribe el número con indicativo, ej. +57 300 000 0000.")
                .Color("contributorTagColor", req.ContributorTagColor)
                .Must(req.SpokenLanguages.Count <= 10 && req.SpokenLanguages.All(l =>
                    !string.IsNullOrWhiteSpace(l.NameEs) && !string.IsNullOrWhiteSpace(l.NameEn) && !string.IsNullOrWhiteSpace(l.Level)),
                    "spokenLanguages", "Cada idioma necesita nombre en español, en inglés y nivel.");
            if (!validation.IsValid) return validation.Problem();

            var p = await db.SiteProfiles.FirstAsync(x => x.Id == SiteProfile.SingletonId, ct);
            p.DisplayName = req.DisplayName.Trim();
            p.Level = req.Level;
            p.RoleEs = Validation.Clean(req.RoleEs);
            p.RoleEn = Validation.Clean(req.RoleEn);
            p.BioEs = Validation.Clean(req.BioEs);
            p.BioEn = Validation.Clean(req.BioEn);
            p.DialogEs = Validation.Clean(req.DialogEs);
            p.DialogEn = Validation.Clean(req.DialogEn);
            p.LocationEs = Validation.Clean(req.LocationEs);
            p.LocationEn = Validation.Clean(req.LocationEn);
            p.Email = Validation.Clean(req.Email);
            p.LinkedInUrl = Validation.Clean(req.LinkedInUrl);
            p.WhatsApp = Validation.Clean(req.WhatsApp);
            p.GitHubLogin = Validation.Clean(req.GitHubLogin);
            p.AvailableForWork = req.AvailableForWork;
            p.AvailabilityEs = Validation.Clean(req.AvailabilityEs);
            p.AvailabilityEn = Validation.Clean(req.AvailabilityEn);
            p.ContributorTagColor = req.ContributorTagColor.ToUpperInvariant();
            p.SpokenLanguages = req.SpokenLanguages
                .Select(l => new SpokenLanguage { NameEs = l.NameEs.Trim(), NameEn = l.NameEn.Trim(), Level = l.Level.Trim() })
                .ToList();
            await db.SaveChangesAsync(ct);
            return Results.Ok(p);
        });

        admin.MapPost("/profile/photo", async (IFormFile file, AppDbContext db, CloudinaryService cloudinary, CancellationToken ct) =>
        {
            var validation = new Validation()
                .Must(file.Length is > 0 and <= MaxPhotoBytes, "file", "La foto debe pesar máximo 5 MB.")
                .Must(file.ContentType.StartsWith("image/"), "file", "El archivo debe ser una imagen.")
                .Must(cloudinary.IsConfigured, "file", "Cloudinary no está configurado.");
            if (!validation.IsValid) return validation.Problem();

            await using var stream = file.OpenReadStream();
            var uploaded = await cloudinary.UploadImageAsync(stream, "profile/photo", ct);
            var p = await db.SiteProfiles.FirstAsync(x => x.Id == SiteProfile.SingletonId, ct);
            p.PhotoUrl = uploaded.Url;
            p.PhotoPublicId = uploaded.PublicId;
            await db.SaveChangesAsync(ct);
            return Results.Ok(p);
        }).DisableAntiforgery(); // La cookie SameSite=Strict ya protege contra CSRF

        admin.MapDelete("/profile/photo", async (AppDbContext db, CloudinaryService cloudinary, CancellationToken ct) =>
        {
            var p = await db.SiteProfiles.FirstAsync(x => x.Id == SiteProfile.SingletonId, ct);
            if (p.PhotoPublicId is not null) await cloudinary.DeleteAsync(p.PhotoPublicId);
            p.PhotoUrl = p.PhotoPublicId = null;
            await db.SaveChangesAsync(ct);
            return Results.Ok(p);
        });

        // CV en PDF por idioma: /api/admin/profile/cv/es y /api/admin/profile/cv/en
        admin.MapPost("/profile/cv/{lang}", async (string lang, IFormFile file, AppDbContext db, CancellationToken ct) =>
        {
            if (lang is not ("es" or "en")) return Results.NotFound();

            await using var stream = file.OpenReadStream();
            using var memory = new MemoryStream();
            await stream.CopyToAsync(memory, ct);
            var data = memory.ToArray();

            var validation = new Validation()
                .Must(data.Length is > 0 and <= (int)MaxCvBytes, "file", "El CV debe pesar máximo 5 MB.")
                .Must(data.Length > 4 && data[0] == '%' && data[1] == 'P' && data[2] == 'D' && data[3] == 'F', "file", "El CV debe ser un PDF.");
            if (!validation.IsValid) return validation.Problem();

            var key = $"cv-{lang}";
            var stored = await db.StoredFiles.FindAsync([key], ct);
            if (stored is null)
            {
                stored = new StoredFile { Key = key, FileName = "", ContentType = "", Data = [] };
                db.StoredFiles.Add(stored);
            }
            stored.FileName = $"CV-Nicholas-De-la-Rosa-{lang.ToUpperInvariant()}.pdf";
            stored.ContentType = "application/pdf";
            stored.Data = data;
            stored.UpdatedAt = DateTimeOffset.UtcNow;

            var p = await db.SiteProfiles.FirstAsync(x => x.Id == SiteProfile.SingletonId, ct);
            // El "?v=" cambia con cada versión para que el navegador no muestre un CV viejo guardado en caché
            var url = $"/api/files/{key}?v={stored.UpdatedAt.ToUnixTimeSeconds()}";
            if (lang == "es") p.CvEsUrl = url; else p.CvEnUrl = url;
            await db.SaveChangesAsync(ct);
            return Results.Ok(p);
        }).DisableAntiforgery();

        admin.MapDelete("/profile/cv/{lang}", async (string lang, AppDbContext db, CancellationToken ct) =>
        {
            if (lang is not ("es" or "en")) return Results.NotFound();
            await db.StoredFiles.Where(f => f.Key == $"cv-{lang}").ExecuteDeleteAsync(ct);
            var p = await db.SiteProfiles.FirstAsync(x => x.Id == SiteProfile.SingletonId, ct);
            if (lang == "es") p.CvEsUrl = null; else p.CvEnUrl = null;
            await db.SaveChangesAsync(ct);
            return Results.Ok(p);
        });

        // ---------- Habilidades (se guarda la lista completa, en el orden recibido) ----------
        admin.MapGet("/skills", async (AppDbContext db, CancellationToken ct) =>
            await db.Skills.AsNoTracking().OrderBy(s => s.SortOrder).ToListAsync(ct));

        admin.MapPut("/skills", async (List<SkillRequest> req, AppDbContext db, CancellationToken ct) =>
        {
            var validation = new Validation()
                .Must(req.Count <= 60, "skills", "Máximo 60 habilidades.")
                .Must(req.All(s => !string.IsNullOrWhiteSpace(s.Name) && s.Name.Length <= 40), "skills", "Cada habilidad necesita un nombre de máximo 40 caracteres.")
                .Must(req.All(s => s.Level is >= 0 and <= 5), "skills", "El nivel va de 0 (sin barra) a 5.");
            if (!validation.IsValid) return validation.Problem();

            await db.Skills.ExecuteDeleteAsync(ct);
            db.Skills.AddRange(req.Select((s, i) => new Skill
            {
                Name = s.Name.Trim(), Category = s.Category, Level = s.Level, Icon = Validation.Clean(s.Icon), SortOrder = i
            }));
            await db.SaveChangesAsync(ct);
            return Results.Ok(await db.Skills.AsNoTracking().OrderBy(s => s.SortOrder).ToListAsync(ct));
        });

        // ---------- Línea de tiempo (lista completa) ----------
        admin.MapGet("/timeline", async (AppDbContext db, CancellationToken ct) =>
            await db.TimelineEntries.AsNoTracking().OrderByDescending(t => t.StartDate).ThenBy(t => t.SortOrder).ToListAsync(ct));

        admin.MapPut("/timeline", async (List<TimelineRequest> req, AppDbContext db, CancellationToken ct) =>
        {
            var validation = new Validation()
                .Must(req.Count <= 40, "timeline", "Máximo 40 entradas.")
                .Must(req.All(t => !string.IsNullOrWhiteSpace(t.TitleEs) && !string.IsNullOrWhiteSpace(t.TitleEn)), "timeline", "Cada entrada necesita título en español y en inglés.")
                .Must(req.All(t => t.EndDate is null || t.EndDate >= t.StartDate), "timeline", "La fecha de fin no puede ser antes del inicio.")
                .Must(req.All(t => (t.DescriptionEs?.Length ?? 0) <= 600 && (t.DescriptionEn?.Length ?? 0) <= 600), "timeline", "Las descripciones van hasta 600 caracteres.");
            foreach (var t in req) validation.Url("timeline", t.Url);
            if (!validation.IsValid) return validation.Problem();

            await db.TimelineEntries.ExecuteDeleteAsync(ct);
            db.TimelineEntries.AddRange(req.Select((t, i) => new TimelineEntry
            {
                Kind = t.Kind,
                TitleEs = t.TitleEs.Trim(),
                TitleEn = t.TitleEn.Trim(),
                Organization = Validation.Clean(t.Organization),
                DescriptionEs = Validation.Clean(t.DescriptionEs),
                DescriptionEn = Validation.Clean(t.DescriptionEn),
                StartDate = t.StartDate,
                EndDate = t.Kind == TimelineKind.Milestone ? null : t.EndDate,
                Url = Validation.Clean(t.Url),
                SortOrder = i
            }));
            await db.SaveChangesAsync(ct);
            return Results.Ok(await db.TimelineEntries.AsNoTracking().OrderByDescending(t => t.StartDate).ThenBy(t => t.SortOrder).ToListAsync(ct));
        });

        // ---------- Mensajes de contacto ----------
        admin.MapGet("/messages", async (AppDbContext db, CancellationToken ct) =>
            await db.ContactMessages.AsNoTracking()
                .OrderByDescending(m => m.CreatedAt)
                .Select(m => new MessageDto(m.Id, m.Name, m.Email, m.Message, m.Language, m.IsRead, m.EmailNotified, m.CreatedAt))
                .ToListAsync(ct));

        admin.MapPatch("/messages/{id:int}", async (int id, ReadRequest req, AppDbContext db, CancellationToken ct) =>
        {
            var updated = await db.ContactMessages.Where(m => m.Id == id)
                .ExecuteUpdateAsync(s => s.SetProperty(m => m.IsRead, req.IsRead), ct);
            return updated == 0 ? Results.NotFound() : Results.NoContent();
        });

        admin.MapDelete("/messages/{id:int}", async (int id, AppDbContext db, CancellationToken ct) =>
        {
            var deleted = await db.ContactMessages.Where(m => m.Id == id).ExecuteDeleteAsync(ct);
            return deleted == 0 ? Results.NotFound() : Results.NoContent();
        });
    }

    // Archivos públicos guardados en la BD (el CV)
    public static void MapFileEndpoints(this IEndpointRouteBuilder app)
    {
        app.MapGet("/api/files/{key}", async (string key, AppDbContext db, HttpContext http, CancellationToken ct) =>
        {
            var file = await db.StoredFiles.AsNoTracking().FirstOrDefaultAsync(f => f.Key == key, ct);
            if (file is null) return Results.NotFound();

            http.Response.Headers.CacheControl = "public, max-age=3600";
            return Results.File(file.Data, file.ContentType, file.FileName, lastModified: file.UpdatedAt);
        });
    }
}
