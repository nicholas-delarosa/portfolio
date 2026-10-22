namespace Portfolio.Api.Entities;

public enum ProjectRelation
{
    Owner,        // Repo en nicholas-delarosa
    Organization, // Repo nicholas-delarosa-* dentro de una organización (ej. Esthercita-Factory)
    Contributor,  // Repo ajeno donde contribuí ("Trabajé en X")
    Manual        // Agregado a mano desde el admin
}

public class Project : ITimestamped
{
    public int Id { get; set; }

    // ---- Datos que vienen de GitHub (la sincronización los sobrescribe) ----
    public long? GitHubId { get; set; }
    public required string FullName { get; set; }
    public required string Name { get; set; }
    public required string OwnerLogin { get; set; }
    public ProjectRelation Relation { get; set; }
    public string? HtmlUrl { get; set; }
    public string? GitHubHomepage { get; set; }
    public string? GitHubDescription { get; set; }
    public string? PrimaryLanguage { get; set; }
    public List<LanguageStat> Languages { get; set; } = [];
    public List<string> Topics { get; set; } = [];
    public int Stars { get; set; }
    public int Forks { get; set; }
    public bool IsFork { get; set; }
    public bool IsArchived { get; set; }
    public DateTimeOffset? GitHubCreatedAt { get; set; }
    public DateTimeOffset? GitHubPushedAt { get; set; }
    public bool RemovedFromGitHub { get; set; }
    public DateTimeOffset? LastSyncedAt { get; set; }

    // ---- Personalización desde el admin (la sincronización no la toca) ----
    public bool IsVisible { get; set; }
    public bool IsFeatured { get; set; }
    public int SortOrder { get; set; }
    public string? TitleEs { get; set; }
    public string? TitleEn { get; set; }
    public string? DescriptionEs { get; set; }
    public string? DescriptionEn { get; set; }
    public string? DemoUrl { get; set; }
    public List<string> Technologies { get; set; } = [];

    public string? ImageUrl { get; set; }
    public string? ImagePublicId { get; set; }
    public bool ImageLocked { get; set; } // true = imagen subida a mano, no se reemplaza por la captura automática

    public int? AssociationId { get; set; }
    public Association? Association { get; set; }
    public bool AssociationLocked { get; set; } // true = asociación puesta a mano, la sincronización no la cambia

    public DateTimeOffset CreatedAt { get; set; }
    public DateTimeOffset UpdatedAt { get; set; }
}

public class LanguageStat
{
    public required string Name { get; set; }
    public long Bytes { get; set; }
}
