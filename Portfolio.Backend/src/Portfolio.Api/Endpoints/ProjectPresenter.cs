using System.Globalization;
using Portfolio.Api.Entities;

namespace Portfolio.Api.Endpoints;

public record LanguageShare(string Name, string? Color, double Percent);
public record AssociationTag(int Id, string Name, string Slug, string Color, string? Url, string? LogoUrl);
public record ContributorTag(string Owner, string Color);

public record PublicProjectDto(
    int Id,
    string FullName,
    string Title,
    string? Description,
    string? ImageUrl,
    bool ImageIsPlaceholder,
    string? DemoUrl,
    string? RepoUrl,
    string? PrimaryLanguage,
    List<LanguageShare> Languages,
    List<string> Technologies,
    int Stars,
    int Forks,
    DateTimeOffset? CreatedAt,
    DateTimeOffset? LastActivityAt,
    bool IsFeatured,
    bool IsArchived,
    ProjectRelation Relation,
    AssociationTag? Association,
    ContributorTag? Contributor);

public static class ProjectPresenter
{
    public static PublicProjectDto ToPublic(Project p, bool english, string contributorColor, string adminLogin)
    {
        var image = p.ImageUrl ?? (p.GitHubId is not null ? $"https://opengraph.githubassets.com/1/{p.FullName}" : null);

        return new PublicProjectDto(
            p.Id,
            p.FullName,
            Title(p, english, adminLogin),
            Description(p, english),
            image,
            ImageIsPlaceholder: p.ImageUrl is null,
            p.EffectiveDemoUrl(),
            p.HtmlUrl,
            p.PrimaryLanguage,
            LanguageShares(p.Languages),
            p.Technologies.Count > 0 ? p.Technologies : p.Topics,
            p.Stars,
            p.Forks,
            p.GitHubCreatedAt ?? p.CreatedAt,
            p.GitHubPushedAt ?? p.UpdatedAt,
            p.IsFeatured,
            p.IsArchived,
            p.Relation,
            p.Association is { } a ? ToTag(a) : null,
            p.Relation == ProjectRelation.Contributor ? new ContributorTag(p.OwnerLogin, contributorColor) : null);
    }

    public static AssociationTag ToTag(Association a) => new(a.Id, a.Name, a.Slug, a.Color, a.WebsiteUrl, a.LogoUrl);

    public static string Title(Project p, bool english, string adminLogin)
    {
        var custom = english ? p.TitleEn ?? p.TitleEs : p.TitleEs ?? p.TitleEn;
        return string.IsNullOrWhiteSpace(custom) ? PrettifyName(p.Name, adminLogin) : custom;
    }

    // Descripción personalizada > descripción de GitHub > la del otro idioma
    public static string? Description(Project p, bool english) =>
        FirstNonEmpty(english ? p.DescriptionEn : p.DescriptionEs, p.GitHubDescription, english ? p.DescriptionEs : p.DescriptionEn);

    // "nicholas-delarosa-InfectionVet" -> "InfectionVet", "deltarune-final" -> "Deltarune Final"
    public static string PrettifyName(string name, string adminLogin)
    {
        var prefix = adminLogin + "-";
        if (name.StartsWith(prefix, StringComparison.OrdinalIgnoreCase) && name.Length > prefix.Length)
            name = name[prefix.Length..];

        var spaced = name.Replace('-', ' ').Replace('_', ' ').Trim();
        return spaced.Any(char.IsUpper) ? spaced : CultureInfo.InvariantCulture.TextInfo.ToTitleCase(spaced);
    }

    private static List<LanguageShare> LanguageShares(List<LanguageStat> languages)
    {
        var total = languages.Sum(l => l.Bytes);
        if (total == 0) return [];
        return languages
            .Select(l => new LanguageShare(l.Name, l.Color, Math.Round(l.Bytes * 100.0 / total, 1)))
            .Where(l => l.Percent >= 0.5)
            .ToList();
    }

    private static string? FirstNonEmpty(params string?[] values) =>
        values.FirstOrDefault(v => !string.IsNullOrWhiteSpace(v));
}
