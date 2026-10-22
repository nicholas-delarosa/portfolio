using System.Text.Json;
using Microsoft.AspNetCore.DataProtection.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using Portfolio.Api.Entities;

namespace Portfolio.Api.Data;

public class AppDbContext(DbContextOptions<AppDbContext> options) : DbContext(options), IDataProtectionKeyContext
{
    public DbSet<Project> Projects => Set<Project>();
    public DbSet<Association> Associations => Set<Association>();
    public DbSet<SiteProfile> SiteProfiles => Set<SiteProfile>();
    public DbSet<Skill> Skills => Set<Skill>();
    public DbSet<TimelineEntry> TimelineEntries => Set<TimelineEntry>();
    public DbSet<ContactMessage> ContactMessages => Set<ContactMessage>();
    public DbSet<SyncRun> SyncRuns => Set<SyncRun>();

    // Llaves de cifrado de las cookies, guardadas en la BD para que la sesión sobreviva a reinicios del contenedor
    public DbSet<DataProtectionKey> DataProtectionKeys => Set<DataProtectionKey>();

    protected override void OnModelCreating(ModelBuilder b)
    {
        b.Entity<Project>(e =>
        {
            e.HasIndex(p => p.GitHubId).IsUnique();
            e.HasIndex(p => p.FullName).IsUnique();
            e.Property(p => p.Relation).HasConversion<string>().HasMaxLength(20);
            e.OwnsMany(p => p.Languages, l => l.ToJson());
            e.HasOne(p => p.Association)
                .WithMany(a => a.Projects)
                .HasForeignKey(p => p.AssociationId)
                .OnDelete(DeleteBehavior.SetNull);
        });

        b.Entity<Association>(e =>
        {
            e.HasIndex(a => a.Slug).IsUnique();
            e.HasIndex(a => a.GitHubLogin).IsUnique();
            e.Property(a => a.Color).HasMaxLength(9);
        });

        b.Entity<SiteProfile>(e =>
        {
            e.Property(p => p.Id).ValueGeneratedNever();
            e.Property(p => p.ContributorTagColor).HasMaxLength(9);
            e.OwnsMany(p => p.SpokenLanguages, l => l.ToJson());
        });

        b.Entity<Skill>().Property(s => s.Category).HasConversion<string>().HasMaxLength(20);
        b.Entity<TimelineEntry>().Property(t => t.Kind).HasConversion<string>().HasMaxLength(20);
        b.Entity<ContactMessage>().HasIndex(m => m.CreatedAt);
        b.Entity<SyncRun>(e =>
        {
            e.Property(r => r.Trigger).HasConversion<string>().HasMaxLength(20);
            e.Property(r => r.Status).HasConversion<string>().HasMaxLength(20);
            e.HasIndex(r => r.StartedAt);
        });

        // snake_case convierte "GitHubLogin" en "git_hub_login"; mejor "github_login"
        foreach (var property in b.Model.GetEntityTypes().SelectMany(t => t.GetProperties()))
        {
            if (property.Name.StartsWith("GitHub"))
                property.SetColumnName("github_" + JsonNamingPolicy.SnakeCaseLower.ConvertName(property.Name["GitHub".Length..]));
        }
    }

    public override Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        var now = DateTimeOffset.UtcNow;
        foreach (var entry in ChangeTracker.Entries<ITimestamped>())
        {
            if (entry.State == EntityState.Added) entry.Entity.CreatedAt = now;
            if (entry.State is EntityState.Added or EntityState.Modified) entry.Entity.UpdatedAt = now;
        }
        return base.SaveChangesAsync(cancellationToken);
    }
}
