namespace Portfolio.Api.Entities;

public interface ITimestamped
{
    DateTimeOffset CreatedAt { get; set; }
    DateTimeOffset UpdatedAt { get; set; }
}

public enum SkillCategory { Frontend, Backend, Database, DevOps, Tools }

public class Skill
{
    public int Id { get; set; }
    public required string Name { get; set; }
    public SkillCategory Category { get; set; }
    public int Level { get; set; } // 1 a 5
    public string? Icon { get; set; } // slug de devicon, ej. "csharp"
    public int SortOrder { get; set; }
}

public enum TimelineKind { Education, Work, Milestone }

// "Puntos de guardado" de la línea de tiempo
public class TimelineEntry
{
    public int Id { get; set; }
    public TimelineKind Kind { get; set; }
    public required string TitleEs { get; set; }
    public required string TitleEn { get; set; }
    public string? Organization { get; set; }
    public string? DescriptionEs { get; set; }
    public string? DescriptionEn { get; set; }
    public DateOnly StartDate { get; set; }
    public DateOnly? EndDate { get; set; }
    public string? Url { get; set; }
    public int SortOrder { get; set; }
}

public class ContactMessage
{
    public int Id { get; set; }
    public required string Name { get; set; }
    public required string Email { get; set; }
    public required string Message { get; set; }
    public string? Language { get; set; }
    public bool IsRead { get; set; }
    public bool EmailNotified { get; set; }
    public DateTimeOffset CreatedAt { get; set; }
}

public enum SyncTrigger { Manual, Scheduled }
public enum SyncStatus { Running, Succeeded, Failed }

public class SyncRun
{
    public int Id { get; set; }
    public SyncTrigger Trigger { get; set; }
    public SyncStatus Status { get; set; }
    public int Added { get; set; }
    public int Updated { get; set; }
    public string? Error { get; set; }
    public DateTimeOffset StartedAt { get; set; }
    public DateTimeOffset? FinishedAt { get; set; }
}
