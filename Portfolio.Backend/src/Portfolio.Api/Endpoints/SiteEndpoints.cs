using System.Net.Mail;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.EntityFrameworkCore;
using Portfolio.Api.Data;
using Portfolio.Api.Entities;

namespace Portfolio.Api.Endpoints;

public record SpokenLanguageDto(string Name, string Level);
public record SkillDto(string Name, SkillCategory Category, int Level, string? Icon);
public record TimelineDto(TimelineKind Kind, string Title, string? Organization, string? Description, DateOnly StartDate, DateOnly? EndDate, string? Url);
public record GitHubLanguageDto(string Name, string? Color, int Repos, double Percent);
public record SiteStatsDto(int Projects, int Associations, int Contributions, int Languages);
public record FeaturedProjectDto(int Id, string Title, string? Description, string? ImageUrl);

public record ProfileDto(
    string DisplayName,
    int Level,
    string? Role,
    string? Bio,
    string? Dialog,
    string? Location,
    string? Email,
    string? LinkedInUrl,
    string? WhatsApp,
    string? GitHubUrl,
    string? PhotoUrl,
    string? CvUrl,
    string? CvOtherLanguageUrl,
    bool AvailableForWork,
    string? Availability,
    List<SpokenLanguageDto> SpokenLanguages);

public record SiteDto(
    ProfileDto Profile,
    List<SkillDto> Skills,
    List<TimelineDto> Timeline,
    List<GitHubLanguageDto> GitHubLanguages,
    SiteStatsDto Stats,
    FeaturedProjectDto? Featured);

public record ContactRequest(string? Name, string? Email, string? Message, string? Language, string? Website);

public static class SiteEndpoints
{
    public const string ContactRateLimit = "contact";

    public static void MapSiteEndpoints(this IEndpointRouteBuilder app)
    {
        // Todo lo que necesitan Inicio, Información y Contacto en una sola llamada
        app.MapGet("/api/site", async (string? lang, AppDbContext db, IConfiguration config, CancellationToken ct) =>
        {
            var en = string.Equals(lang, "en", StringComparison.OrdinalIgnoreCase);
            var p = await db.SiteProfiles.AsNoTracking().FirstAsync(x => x.Id == SiteProfile.SingletonId, ct);

            var profile = new ProfileDto(
                p.DisplayName, p.Level,
                Pick(en, p.RoleEn, p.RoleEs), Pick(en, p.BioEn, p.BioEs), Pick(en, p.DialogEn, p.DialogEs),
                Pick(en, p.LocationEn, p.LocationEs),
                p.Email, p.LinkedInUrl, p.WhatsApp,
                p.GitHubLogin is null ? null : $"https://github.com/{p.GitHubLogin}",
                p.PhotoUrl,
                CvUrl: Pick(en, p.CvEnUrl, p.CvEsUrl),
                CvOtherLanguageUrl: en ? p.CvEsUrl : p.CvEnUrl,
                p.AvailableForWork, Pick(en, p.AvailabilityEn, p.AvailabilityEs),
                p.SpokenLanguages.Select(l => new SpokenLanguageDto(en ? l.NameEn : l.NameEs, l.Level)).ToList());

            var skills = await db.Skills.AsNoTracking()
                .OrderBy(s => s.Category).ThenBy(s => s.SortOrder).ThenBy(s => s.Name)
                .Select(s => new SkillDto(s.Name, s.Category, s.Level, s.Icon))
                .ToListAsync(ct);

            var timeline = (await db.TimelineEntries.AsNoTracking()
                    .OrderByDescending(t => t.StartDate).ThenBy(t => t.SortOrder)
                    .ToListAsync(ct))
                .Select(t => new TimelineDto(t.Kind, Pick(en, t.TitleEn, t.TitleEs)!, t.Organization,
                    Pick(en, t.DescriptionEn, t.DescriptionEs), t.StartDate, t.EndDate, t.Url))
                .ToList();

            // Estadísticas reales de GitHub: todo el código sincronizado, no solo lo visible
            var synced = await db.Projects.AsNoTracking()
                .Where(x => x.GitHubId != null && !x.RemovedFromGitHub && !x.IsFork)
                .Select(x => x.Languages)
                .ToListAsync(ct);
            var totalBytes = synced.SelectMany(l => l).Sum(l => (double)l.Bytes);
            var githubLanguages = synced.SelectMany(l => l)
                .GroupBy(l => l.Name)
                .Select(g => new GitHubLanguageDto(g.Key, g.First().Color, g.Count(),
                    totalBytes == 0 ? 0 : Math.Round(g.Sum(l => l.Bytes) * 100 / totalBytes, 1)))
                .OrderByDescending(l => l.Percent)
                .Take(8)
                .ToList();

            var visible = db.Projects.Where(x => x.IsVisible && !x.RemovedFromGitHub);
            var stats = new SiteStatsDto(
                Projects: await visible.CountAsync(ct),
                Associations: await visible.Where(x => x.AssociationId != null).Select(x => x.AssociationId).Distinct().CountAsync(ct),
                Contributions: await visible.CountAsync(x => x.Relation == ProjectRelation.Contributor, ct),
                Languages: githubLanguages.Count);

            var featuredProject = await visible.AsNoTracking()
                .Where(x => x.IsFeatured)
                .OrderBy(x => x.SortOrder)
                .FirstOrDefaultAsync(ct);
            var adminLogin = config["Admin:GitHubLogin"]!;
            var featured = featuredProject is null ? null : new FeaturedProjectDto(
                featuredProject.Id,
                ProjectPresenter.Title(featuredProject, en, adminLogin),
                ProjectPresenter.Description(featuredProject, en),
                featuredProject.ImageUrl ?? (featuredProject.GitHubId is not null
                    ? $"https://opengraph.githubassets.com/1/{featuredProject.FullName}" : null));

            return new SiteDto(profile, skills, timeline, githubLanguages, stats, featured);
        });

        app.MapPost("/api/contact", async (ContactRequest req, AppDbContext db, ILogger<ContactRequest> logger, CancellationToken ct) =>
        {
            // Campo trampa: invisible para personas, los bots lo llenan. Se responde "ok" para no darles pistas
            if (!string.IsNullOrEmpty(req.Website))
                return Results.Accepted();

            var validation = new Validation()
                .Required("name", req.Name).MaxLength("name", req.Name, 100)
                .Required("email", req.Email).MaxLength("email", req.Email, 200)
                .Must(string.IsNullOrWhiteSpace(req.Email) || MailAddress.TryCreate(req.Email.Trim(), out _), "email", "El correo no es válido.")
                .Required("message", req.Message).MaxLength("message", req.Message, 3000);
            if (!validation.IsValid) return validation.Problem();

            db.ContactMessages.Add(new ContactMessage
            {
                Name = req.Name!.Trim(),
                Email = req.Email!.Trim(),
                Message = req.Message!.Trim(),
                Language = req.Language is "en" ? "en" : "es",
                CreatedAt = DateTimeOffset.UtcNow
            });
            await db.SaveChangesAsync(ct);
            logger.LogInformation("Nuevo mensaje de contacto de {Email}", req.Email);
            return Results.Accepted();
        }).RequireRateLimiting(ContactRateLimit);
    }

    private static string? Pick(bool english, string? en, string? es) =>
        english ? (string.IsNullOrWhiteSpace(en) ? es : en) : (string.IsNullOrWhiteSpace(es) ? en : es);
}
