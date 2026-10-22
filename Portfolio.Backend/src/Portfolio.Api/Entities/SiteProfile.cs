namespace Portfolio.Api.Entities;

// Una sola fila (Id = 1) con todo lo editable de INFORMACIÓN y CONTACTOS
public class SiteProfile : ITimestamped
{
    public const int SingletonId = 1;

    public int Id { get; set; } = SingletonId;
    public required string DisplayName { get; set; }
    public int Level { get; set; } = 1;
    public string? RoleEs { get; set; }
    public string? RoleEn { get; set; }
    public string? BioEs { get; set; }
    public string? BioEn { get; set; }
    public string? DialogEs { get; set; } // Texto de la caja de diálogo ("* Nicholas está ...")
    public string? DialogEn { get; set; }
    public string? LocationEs { get; set; }
    public string? LocationEn { get; set; }

    public string? Email { get; set; }
    public string? LinkedInUrl { get; set; }
    public string? WhatsApp { get; set; }
    public string? GitHubLogin { get; set; }

    public string? PhotoUrl { get; set; }
    public string? PhotoPublicId { get; set; }
    public string? CvEsUrl { get; set; }
    public string? CvEsPublicId { get; set; }
    public string? CvEnUrl { get; set; }
    public string? CvEnPublicId { get; set; }

    public bool AvailableForWork { get; set; } = true;
    public string? AvailabilityEs { get; set; }
    public string? AvailabilityEn { get; set; }

    public string ContributorTagColor { get; set; } = "#00C2FF";
    public List<SpokenLanguage> SpokenLanguages { get; set; } = [];

    public DateTimeOffset CreatedAt { get; set; }
    public DateTimeOffset UpdatedAt { get; set; }
}

public class SpokenLanguage
{
    public required string NameEs { get; set; }
    public required string NameEn { get; set; }
    public required string Level { get; set; }
}
