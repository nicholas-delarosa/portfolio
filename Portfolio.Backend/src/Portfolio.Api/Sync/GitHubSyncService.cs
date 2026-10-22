using System.Text.RegularExpressions;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using Portfolio.Api.Data;
using Portfolio.Api.Entities;
using Portfolio.Api.Media;

namespace Portfolio.Api.Sync;

public partial class GitHubSyncService(
    AppDbContext db,
    GitHubClient github,
    ScreenshotQueue screenshots,
    IConfiguration config,
    IOptions<GitHubSyncOptions> options,
    ILogger<GitHubSyncService> logger)
{
    // Colores para asociaciones creadas automáticamente (luego se cambian en el admin)
    private static readonly string[] Palette = ["#FF77C8", "#00C2FF", "#FFD400", "#7CFF6B", "#B388FF", "#FF8A3D"];

    public async Task<SyncRun> RunAsync(SyncTrigger trigger, CancellationToken ct)
    {
        var run = new SyncRun { Trigger = trigger, Status = SyncStatus.Running, StartedAt = DateTimeOffset.UtcNow };
        db.SyncRuns.Add(run);
        await db.SaveChangesAsync(ct);

        try
        {
            if (!github.IsConfigured)
                throw new InvalidOperationException("Falta el token de GitHub (GitHub:Token).");

            var found = await CollectAsync(ct);
            (run.Added, run.Updated) = await UpsertAsync(found, ct);
            run.Status = SyncStatus.Succeeded;
            logger.LogInformation("Sincronización con GitHub: {Added} nuevos, {Updated} actualizados", run.Added, run.Updated);
        }
        catch (Exception ex) when (ex is not OperationCanceledException)
        {
            logger.LogError(ex, "Falló la sincronización con GitHub");
            run.Status = SyncStatus.Failed;
            run.Error = ex.Message;
            db.ChangeTracker.Clear();
            db.Attach(run).State = EntityState.Modified;
        }

        run.FinishedAt = DateTimeOffset.UtcNow;
        await db.SaveChangesAsync(CancellationToken.None);
        return run;
    }

    private async Task<Dictionary<long, (GitHubRepo Repo, ProjectRelation Relation)>> CollectAsync(CancellationToken ct)
    {
        var login = config["Admin:GitHubLogin"]!;
        var prefix = login + "-";
        var found = new Dictionary<long, (GitHubRepo Repo, ProjectRelation Relation)>();

        // Si un repo aparece por varias vías gana la relación más fuerte (Owner > Organization > Contributor)
        void Add(IEnumerable<GitHubRepo> repos, Func<GitHubRepo, ProjectRelation> relationOf)
        {
            foreach (var repo in repos.Where(r => !r.IsPrivate))
            {
                var relation = relationOf(repo);
                if (!found.TryGetValue(repo.Id, out var current) || relation < current.Relation)
                    found[repo.Id] = (repo, relation);
            }
        }

        ProjectRelation Classify(GitHubRepo r) =>
            r.OwnerLogin.Equals(login, StringComparison.OrdinalIgnoreCase) ? ProjectRelation.Owner
            : r.OwnerIsOrganization && r.Name.StartsWith(prefix, StringComparison.OrdinalIgnoreCase) ? ProjectRelation.Organization
            : ProjectRelation.Contributor;

        Add(await github.GetOwnedReposAsync(login, ct), _ => ProjectRelation.Owner);

        foreach (var org in options.Value.Organizations)
        {
            var orgRepos = await github.GetOrganizationReposAsync(org, ct);
            Add(orgRepos.Where(r => r.Name.StartsWith(prefix, StringComparison.OrdinalIgnoreCase)), _ => ProjectRelation.Organization);
        }

        Add(await github.GetContributedReposAsync(login, ct), Classify);
        Add(await github.GetPullRequestReposAsync(login, ct), Classify);
        if (options.Value.IncludeCommitSearch)
            Add(await github.GetCommitAuthorReposAsync(login, ct), Classify);

        return found;
    }

    private async Task<(int Added, int Updated)> UpsertAsync(
        Dictionary<long, (GitHubRepo Repo, ProjectRelation Relation)> found, CancellationToken ct)
    {
        var now = DateTimeOffset.UtcNow;
        var projects = await db.Projects.Where(p => p.GitHubId != null).ToDictionaryAsync(p => p.GitHubId!.Value, ct);
        var associations = await db.Associations.ToListAsync(ct);
        int added = 0, updated = 0;

        foreach (var (repo, relation) in found.Values)
        {
            if (!projects.TryGetValue(repo.Id, out var project))
            {
                // Los proyectos nuevos llegan ocultos hasta que los apruebes en el admin
                project = new Project { GitHubId = repo.Id, FullName = repo.FullName, Name = repo.Name, OwnerLogin = repo.OwnerLogin, IsVisible = false };
                db.Projects.Add(project);
                projects[repo.Id] = project;
                added++;
            }
            else
            {
                updated++;
            }

            project.FullName = repo.FullName;
            project.Name = repo.Name;
            project.OwnerLogin = repo.OwnerLogin;
            project.Relation = relation;
            project.HtmlUrl = repo.Url;
            project.GitHubHomepage = string.IsNullOrWhiteSpace(repo.Homepage) ? null : repo.Homepage;
            project.GitHubDescription = repo.Description;
            project.PrimaryLanguage = repo.PrimaryLanguage;
            project.Languages = repo.Languages;
            project.Topics = repo.Topics;
            project.Stars = repo.Stars;
            project.Forks = repo.Forks;
            project.IsFork = repo.IsFork;
            project.IsArchived = repo.IsArchived;
            project.GitHubCreatedAt = repo.CreatedAt;
            project.GitHubPushedAt = repo.PushedAt;
            project.RemovedFromGitHub = false;
            project.LastSyncedAt = now;

            if (!project.AssociationLocked)
                project.Association = ResolveAssociation(repo, associations);
        }

        // Repos propios o de organización que ya no existen. Las contribuciones no se marcan:
        // GitHub solo lista las recientes y desaparecerían solas con el tiempo
        foreach (var project in projects.Values.Where(p =>
                     !found.ContainsKey(p.GitHubId!.Value) &&
                     p.Relation is ProjectRelation.Owner or ProjectRelation.Organization))
        {
            project.RemovedFromGitHub = true;
        }

        await db.SaveChangesAsync(ct);

        foreach (var project in projects.Values.Where(p => p.IsVisible && p.NeedsScreenshot()))
            screenshots.Enqueue(project.Id);

        return (added, updated);
    }

    private Association? ResolveAssociation(GitHubRepo repo, List<Association> associations)
    {
        var existing = associations.FirstOrDefault(a =>
            string.Equals(a.GitHubLogin, repo.OwnerLogin, StringComparison.OrdinalIgnoreCase));
        if (existing is not null || !repo.OwnerIsOrganization)
            return existing;

        var association = new Association
        {
            Name = repo.OwnerLogin.Replace('-', ' '),
            Slug = Slugify(repo.OwnerLogin),
            GitHubLogin = repo.OwnerLogin,
            Color = Palette[associations.Count % Palette.Length],
            WebsiteUrl = $"https://github.com/{repo.OwnerLogin}"
        };
        associations.Add(association);
        db.Associations.Add(association);
        logger.LogInformation("Nueva asociación detectada: {Org}", repo.OwnerLogin);
        return association;
    }

    public static string Slugify(string value) =>
        NonSlugChars().Replace(value.Trim().ToLowerInvariant(), "-").Trim('-');

    [GeneratedRegex("[^a-z0-9]+")]
    private static partial Regex NonSlugChars();
}
