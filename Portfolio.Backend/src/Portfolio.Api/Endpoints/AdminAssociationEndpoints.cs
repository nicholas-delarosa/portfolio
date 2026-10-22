using Microsoft.EntityFrameworkCore;
using Portfolio.Api.Data;
using Portfolio.Api.Entities;
using Portfolio.Api.Sync;

namespace Portfolio.Api.Endpoints;

public record AssociationDto(
    int Id, string Name, string Slug, string? GitHubLogin, string Color,
    string? WebsiteUrl, string? LogoUrl, string? DescriptionEs, string? DescriptionEn, int ProjectCount);

public record AssociationRequest(
    string Name, string? GitHubLogin, string Color,
    string? WebsiteUrl, string? LogoUrl, string? DescriptionEs, string? DescriptionEn);

public static class AdminAssociationEndpoints
{
    public static void MapAdminAssociationEndpoints(this RouteGroupBuilder admin)
    {
        var group = admin.MapGroup("/associations");

        group.MapGet("/", async (AppDbContext db, CancellationToken ct) =>
            await db.Associations.AsNoTracking()
                .OrderBy(a => a.Name)
                .Select(a => new AssociationDto(a.Id, a.Name, a.Slug, a.GitHubLogin, a.Color,
                    a.WebsiteUrl, a.LogoUrl, a.DescriptionEs, a.DescriptionEn, a.Projects.Count))
                .ToListAsync(ct));

        group.MapPost("/", async (AssociationRequest req, AppDbContext db, CancellationToken ct) =>
        {
            var association = new Association { Name = "", Slug = "" };
            var validation = await ValidateAsync(req, null, db, ct);
            if (!validation.IsValid) return validation.Problem();

            Apply(association, req);
            db.Associations.Add(association);
            await db.SaveChangesAsync(ct);
            return Results.Created($"/api/admin/associations/{association.Id}", ToDto(association, 0));
        });

        group.MapPut("/{id:int}", async (int id, AssociationRequest req, AppDbContext db, CancellationToken ct) =>
        {
            var association = await db.Associations.FindAsync([id], ct);
            if (association is null) return Results.NotFound();

            var validation = await ValidateAsync(req, id, db, ct);
            if (!validation.IsValid) return validation.Problem();

            Apply(association, req);
            await db.SaveChangesAsync(ct);
            return Results.Ok(ToDto(association, await db.Projects.CountAsync(p => p.AssociationId == id, ct)));
        });

        // Los proyectos quedan sin asociación (no se borran)
        group.MapDelete("/{id:int}", async (int id, AppDbContext db, CancellationToken ct) =>
        {
            var deleted = await db.Associations.Where(a => a.Id == id).ExecuteDeleteAsync(ct);
            return deleted == 0 ? Results.NotFound() : Results.NoContent();
        });
    }

    private static async Task<Validation> ValidateAsync(AssociationRequest req, int? id, AppDbContext db, CancellationToken ct)
    {
        var validation = new Validation()
            .Required("name", req.Name)
            .MaxLength("name", req.Name, 80)
            .Color("color", req.Color)
            .Url("websiteUrl", req.WebsiteUrl)
            .Url("logoUrl", req.LogoUrl)
            .MaxLength("descriptionEs", req.DescriptionEs, 500)
            .MaxLength("descriptionEn", req.DescriptionEn, 500);

        var slug = GitHubSyncService.Slugify(req.Name ?? "");
        validation.Must(!await db.Associations.AnyAsync(a => a.Slug == slug && a.Id != id, ct), "name", "Ya existe una asociación con ese nombre.");

        var login = Validation.Clean(req.GitHubLogin);
        if (login is not null)
            validation.Must(!await db.Associations.AnyAsync(a => a.GitHubLogin != null && a.GitHubLogin.ToLower() == login.ToLower() && a.Id != id, ct),
                "gitHubLogin", "Otra asociación ya usa esa organización de GitHub.");
        return validation;
    }

    private static void Apply(Association a, AssociationRequest req)
    {
        a.Name = req.Name.Trim();
        a.Slug = GitHubSyncService.Slugify(req.Name);
        a.GitHubLogin = Validation.Clean(req.GitHubLogin);
        a.Color = req.Color.ToUpperInvariant();
        a.WebsiteUrl = Validation.Clean(req.WebsiteUrl);
        a.LogoUrl = Validation.Clean(req.LogoUrl);
        a.DescriptionEs = Validation.Clean(req.DescriptionEs);
        a.DescriptionEn = Validation.Clean(req.DescriptionEn);
    }

    private static AssociationDto ToDto(Association a, int projectCount) => new(
        a.Id, a.Name, a.Slug, a.GitHubLogin, a.Color, a.WebsiteUrl, a.LogoUrl, a.DescriptionEs, a.DescriptionEn, projectCount);
}
