using Microsoft.EntityFrameworkCore;
using Portfolio.Api.Data;
using Portfolio.Api.Entities;
using Portfolio.Api.Media;
using Portfolio.Api.Sync;

namespace Portfolio.Api.Endpoints;

public record AdminProjectDto(
    int Id,
    long? GitHubId,
    string FullName,
    string Name,
    string DisplayTitle,
    string OwnerLogin,
    ProjectRelation Relation,
    string? HtmlUrl,
    string? GitHubHomepage,
    string? GitHubDescription,
    string? PrimaryLanguage,
    List<LanguageStat> Languages,
    List<string> Topics,
    int Stars,
    int Forks,
    bool IsFork,
    bool IsArchived,
    DateTimeOffset? GitHubCreatedAt,
    DateTimeOffset? GitHubPushedAt,
    bool RemovedFromGitHub,
    DateTimeOffset? LastSyncedAt,
    bool IsVisible,
    bool IsFeatured,
    int SortOrder,
    string? TitleEs,
    string? TitleEn,
    string? DescriptionEs,
    string? DescriptionEn,
    string? DemoUrl,
    string? EffectiveDemoUrl,
    List<string> Technologies,
    string? ImageUrl,
    bool ImageLocked,
    DateTimeOffset? ImageCapturedAt,
    string? ImageError,
    bool NeedsScreenshot,
    AssociationTag? Association,
    bool AssociationLocked);

public record ProjectUpdateRequest(
    bool IsVisible,
    bool IsFeatured,
    int SortOrder,
    string? TitleEs,
    string? TitleEn,
    string? DescriptionEs,
    string? DescriptionEn,
    string? DemoUrl,
    List<string>? Technologies,
    int? AssociationId,
    bool AssociationLocked);

public record ManualProjectRequest(string Name, string? RepoUrl, ProjectUpdateRequest Details);
public record VisibilityRequest(List<int> Ids, bool IsVisible);
public record OrderRequest(List<int> Ids);

public static class AdminProjectEndpoints
{
    private const long MaxImageBytes = 5 * 1024 * 1024;

    public static void MapAdminProjectEndpoints(this RouteGroupBuilder admin)
    {
        var group = admin.MapGroup("/projects");

        group.MapGet("/", async (AppDbContext db, IConfiguration config, CancellationToken ct) =>
        {
            var projects = await db.Projects.AsNoTracking().Include(p => p.Association)
                .OrderByDescending(p => p.IsVisible)
                .ThenByDescending(p => p.IsFeatured)
                .ThenBy(p => p.SortOrder)
                .ThenByDescending(p => p.GitHubPushedAt ?? p.CreatedAt)
                .ToListAsync(ct);
            return projects.Select(p => ToDto(p, config));
        });

        group.MapPut("/{id:int}", async (int id, ProjectUpdateRequest req, AppDbContext db, ScreenshotQueue screenshots, IConfiguration config, CancellationToken ct) =>
        {
            var project = await db.Projects.Include(p => p.Association).FirstOrDefaultAsync(p => p.Id == id, ct);
            if (project is null) return Results.NotFound();

            var validation = await ValidateAsync(req, db, ct);
            if (!validation.IsValid) return validation.Problem();

            Apply(project, req);
            await db.SaveChangesAsync(ct);
            await db.Entry(project).Reference(p => p.Association).LoadAsync(ct);

            if (project.IsVisible && project.NeedsScreenshot()) screenshots.Enqueue(project.Id);
            return Results.Ok(ToDto(project, config));
        });

        group.MapPatch("/visibility", async (VisibilityRequest req, AppDbContext db, ScreenshotQueue screenshots, CancellationToken ct) =>
        {
            var projects = await db.Projects.Where(p => req.Ids.Contains(p.Id)).ToListAsync(ct);
            foreach (var project in projects)
            {
                project.IsVisible = req.IsVisible;
                if (project.IsVisible && project.NeedsScreenshot()) screenshots.Enqueue(project.Id);
            }
            await db.SaveChangesAsync(ct);
            return Results.NoContent();
        });

        // Guarda el orden tal cual lo arrastraste en el admin
        group.MapPut("/order", async (OrderRequest req, AppDbContext db, CancellationToken ct) =>
        {
            var projects = await db.Projects.Where(p => req.Ids.Contains(p.Id)).ToDictionaryAsync(p => p.Id, ct);
            for (var i = 0; i < req.Ids.Count; i++)
                if (projects.TryGetValue(req.Ids[i], out var project))
                    project.SortOrder = i;
            await db.SaveChangesAsync(ct);
            return Results.NoContent();
        });

        // Proyectos que no están en GitHub (o si algo falla en la sincronización)
        group.MapPost("/", async (ManualProjectRequest req, AppDbContext db, ScreenshotQueue screenshots, IConfiguration config, CancellationToken ct) =>
        {
            var validation = await ValidateAsync(req.Details, db, ct);
            validation.Required("name", req.Name).MaxLength("name", req.Name, 100).Url("repoUrl", req.RepoUrl);
            if (!validation.IsValid) return validation.Problem();

            var slug = GitHubSyncService.Slugify(req.Name);
            var project = new Project
            {
                FullName = $"manual/{slug}-{Guid.NewGuid().ToString("N")[..6]}",
                Name = req.Name.Trim(),
                OwnerLogin = config["Admin:GitHubLogin"]!,
                Relation = ProjectRelation.Manual,
                HtmlUrl = Validation.Clean(req.RepoUrl)
            };
            Apply(project, req.Details);
            db.Projects.Add(project);
            await db.SaveChangesAsync(ct);
            await db.Entry(project).Reference(p => p.Association).LoadAsync(ct);

            if (project.IsVisible && project.NeedsScreenshot()) screenshots.Enqueue(project.Id);
            return Results.Created($"/api/admin/projects/{project.Id}", ToDto(project, config));
        });

        // Ojo: si el repo sigue en GitHub, volverá (oculto) en la próxima sincronización
        group.MapDelete("/{id:int}", async (int id, AppDbContext db, CloudinaryService cloudinary, CancellationToken ct) =>
        {
            var project = await db.Projects.FindAsync([id], ct);
            if (project is null) return Results.NotFound();
            if (project.ImagePublicId is not null) await cloudinary.DeleteAsync(project.ImagePublicId);
            db.Projects.Remove(project);
            await db.SaveChangesAsync(ct);
            return Results.NoContent();
        });

        group.MapPost("/{id:int}/image", async (int id, IFormFile file, AppDbContext db, CloudinaryService cloudinary, IConfiguration config, CancellationToken ct) =>
        {
            var project = await db.Projects.Include(p => p.Association).FirstOrDefaultAsync(p => p.Id == id, ct);
            if (project is null) return Results.NotFound();

            var validation = new Validation()
                .Must(file.Length is > 0 and <= MaxImageBytes, "file", "La imagen debe pesar máximo 5 MB.")
                .Must(file.ContentType.StartsWith("image/"), "file", "El archivo debe ser una imagen.")
                .Must(cloudinary.IsConfigured, "file", "Cloudinary no está configurado.");
            if (!validation.IsValid) return validation.Problem();

            await using var stream = file.OpenReadStream();
            var uploaded = await cloudinary.UploadImageAsync(stream, $"projects/{project.Id}", ct);
            project.ImageUrl = uploaded.Url;
            project.ImagePublicId = uploaded.PublicId;
            project.ImageLocked = true;
            project.ImageSourceUrl = null;
            project.ImageCapturedAt = DateTimeOffset.UtcNow;
            project.ImageError = null;
            await db.SaveChangesAsync(ct);
            return Results.Ok(ToDto(project, config));
        }).DisableAntiforgery(); // La cookie SameSite=Strict ya protege contra CSRF

        // Quita la imagen manual y vuelve a la captura automática
        group.MapDelete("/{id:int}/image", async (int id, AppDbContext db, CloudinaryService cloudinary, ScreenshotQueue screenshots, IConfiguration config, CancellationToken ct) =>
        {
            var project = await db.Projects.Include(p => p.Association).FirstOrDefaultAsync(p => p.Id == id, ct);
            if (project is null) return Results.NotFound();

            if (project.ImagePublicId is not null) await cloudinary.DeleteAsync(project.ImagePublicId);
            project.ImageUrl = project.ImagePublicId = project.ImageSourceUrl = project.ImageError = null;
            project.ImageCapturedAt = null;
            project.ImageLocked = false;
            await db.SaveChangesAsync(ct);

            if (project.IsVisible && project.NeedsScreenshot()) screenshots.Enqueue(project.Id);
            return Results.Ok(ToDto(project, config));
        });

        // Volver a tomar la captura (ej. cambiaste el diseño del demo)
        group.MapPost("/{id:int}/screenshot", async (int id, AppDbContext db, ScreenshotQueue screenshots, ScreenshotService screenshotService, CloudinaryService cloudinary, CancellationToken ct) =>
        {
            var project = await db.Projects.FindAsync([id], ct);
            if (project is null) return Results.NotFound();

            var validation = new Validation()
                .Must(project.EffectiveDemoUrl() is not null, "demoUrl", "El proyecto no tiene link de demo.")
                .Must(screenshotService.IsConfigured && cloudinary.IsConfigured, "screenshot", "Las capturas no están configuradas (Playwright y Cloudinary).");
            if (!validation.IsValid) return validation.Problem();

            project.ImageLocked = false;
            project.ImageSourceUrl = null;
            project.ImageError = null;
            await db.SaveChangesAsync(ct);
            screenshots.Enqueue(project.Id);
            return Results.Accepted();
        });
    }

    private static async Task<Validation> ValidateAsync(ProjectUpdateRequest req, AppDbContext db, CancellationToken ct)
    {
        var validation = new Validation()
            .MaxLength("titleEs", req.TitleEs, 100)
            .MaxLength("titleEn", req.TitleEn, 100)
            .MaxLength("descriptionEs", req.DescriptionEs, 1000)
            .MaxLength("descriptionEn", req.DescriptionEn, 1000)
            .Url("demoUrl", req.DemoUrl)
            .Must(req.Technologies is null || (req.Technologies.Count <= 20 && req.Technologies.All(t => t.Length <= 40)),
                "technologies", "Máximo 20 tecnologías de 40 caracteres.");

        if (req.AssociationId is { } associationId)
            validation.Must(await db.Associations.AnyAsync(a => a.Id == associationId, ct), "associationId", "La asociación no existe.");
        return validation;
    }

    private static void Apply(Project project, ProjectUpdateRequest req)
    {
        project.IsVisible = req.IsVisible;
        project.IsFeatured = req.IsFeatured;
        project.SortOrder = req.SortOrder;
        project.TitleEs = Validation.Clean(req.TitleEs);
        project.TitleEn = Validation.Clean(req.TitleEn);
        project.DescriptionEs = Validation.Clean(req.DescriptionEs);
        project.DescriptionEn = Validation.Clean(req.DescriptionEn);
        project.DemoUrl = Validation.Clean(req.DemoUrl);
        project.Technologies = (req.Technologies ?? []).Select(t => t.Trim()).Where(t => t.Length > 0).Distinct().ToList();
        project.AssociationId = req.AssociationId;
        project.AssociationLocked = req.AssociationLocked;
    }

    private static AdminProjectDto ToDto(Project p, IConfiguration config) => new(
        p.Id, p.GitHubId, p.FullName, p.Name,
        ProjectPresenter.Title(p, english: false, config["Admin:GitHubLogin"]!),
        p.OwnerLogin, p.Relation, p.HtmlUrl, p.GitHubHomepage, p.GitHubDescription,
        p.PrimaryLanguage, p.Languages, p.Topics, p.Stars, p.Forks, p.IsFork, p.IsArchived,
        p.GitHubCreatedAt, p.GitHubPushedAt, p.RemovedFromGitHub, p.LastSyncedAt,
        p.IsVisible, p.IsFeatured, p.SortOrder, p.TitleEs, p.TitleEn, p.DescriptionEs, p.DescriptionEn,
        p.DemoUrl, p.EffectiveDemoUrl(), p.Technologies,
        p.ImageUrl, p.ImageLocked, p.ImageCapturedAt, p.ImageError, p.NeedsScreenshot(),
        p.Association is { } a ? ProjectPresenter.ToTag(a) : null, p.AssociationLocked);
}
