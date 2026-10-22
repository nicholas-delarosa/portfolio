namespace Portfolio.Api.Sync;

public class GitHubOptions
{
    public const string Section = "GitHub";

    // Token personal de solo lectura (github.com/settings/personal-access-tokens)
    public string? Token { get; set; }
}

public class GitHubSyncOptions
{
    public const string Section = "GitHubSync";

    // Organizaciones donde buscar repos "<tu-usuario>-*"
    public List<string> Organizations { get; set; } = [];
    public double IntervalHours { get; set; } = 6;
    public double InitialDelaySeconds { get; set; } = 30;
    public bool IncludeCommitSearch { get; set; } = true;
}
