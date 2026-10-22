namespace Portfolio.Api.Entities;

public class Association : ITimestamped
{
    public int Id { get; set; }
    public required string Name { get; set; }
    public required string Slug { get; set; }
    public string? GitHubLogin { get; set; } // Si coincide con el dueño del repo, se asigna sola
    public string Color { get; set; } = "#FFFF00";
    public string? WebsiteUrl { get; set; }
    public string? LogoUrl { get; set; }
    public string? DescriptionEs { get; set; }
    public string? DescriptionEn { get; set; }

    public List<Project> Projects { get; set; } = [];

    public DateTimeOffset CreatedAt { get; set; }
    public DateTimeOffset UpdatedAt { get; set; }
}
