using Microsoft.EntityFrameworkCore;
using Portfolio.Api.Data;
using Portfolio.Api.Entities;

namespace Portfolio.Api.Endpoints;

public static class PublicEndpoints
{
    public static void MapPublicEndpoints(this IEndpointRouteBuilder app)
    {
        app.MapGet("/api/projects", async (string? lang, AppDbContext db, IConfiguration config, CancellationToken ct) =>
        {
            var english = string.Equals(lang, "en", StringComparison.OrdinalIgnoreCase);
            var contributorColor = await db.SiteProfiles
                .Where(p => p.Id == SiteProfile.SingletonId)
                .Select(p => p.ContributorTagColor)
                .FirstOrDefaultAsync(ct) ?? "#00C2FF";

            var projects = await db.Projects
                .AsNoTracking()
                .Include(p => p.Association)
                .Where(p => p.IsVisible && !p.RemovedFromGitHub)
                .OrderByDescending(p => p.IsFeatured)
                .ThenBy(p => p.SortOrder)
                .ThenByDescending(p => p.GitHubPushedAt ?? p.CreatedAt)
                .ToListAsync(ct);

            var adminLogin = config["Admin:GitHubLogin"]!;
            return projects.Select(p => ProjectPresenter.ToPublic(p, english, contributorColor, adminLogin));
        });
    }
}
