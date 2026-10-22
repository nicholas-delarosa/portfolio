using Microsoft.EntityFrameworkCore;
using Portfolio.Api.Data;
using Portfolio.Api.Media;
using Portfolio.Api.Sync;

namespace Portfolio.Api.Endpoints;

public static class AdminSyncEndpoints
{
    public static void MapAdminSyncEndpoints(this RouteGroupBuilder admin)
    {
        var group = admin.MapGroup("/sync");

        group.MapGet("/", async (AppDbContext db, SyncRunner runner, GitHubClient github,
            ScreenshotService screenshots, CloudinaryService cloudinary, CancellationToken ct) => new
        {
            runner.IsRunning,
            // Para que el admin muestre qué falta configurar
            GitHubConfigured = github.IsConfigured,
            ScreenshotsConfigured = screenshots.IsConfigured,
            CloudinaryConfigured = cloudinary.IsConfigured,
            Runs = await db.SyncRuns.AsNoTracking().OrderByDescending(r => r.StartedAt).Take(15).ToListAsync(ct)
        });

        group.MapPost("/", (SyncRunner runner) =>
            runner.TryStartManual()
                ? Results.Accepted()
                : Results.Problem("Ya hay una sincronización en curso.", statusCode: 409));
    }
}
