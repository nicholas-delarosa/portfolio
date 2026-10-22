using Microsoft.EntityFrameworkCore;
using Portfolio.Api.Entities;

namespace Portfolio.Api.Data;

public static class DbSeeder
{
    public static async Task MigrateAndSeedAsync(this WebApplication app)
    {
        await using var scope = app.Services.CreateAsyncScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        await db.Database.MigrateAsync();

        // Solo se crea la primera vez; después todo se edita desde el admin
        if (!await db.SiteProfiles.AnyAsync())
        {
            db.SiteProfiles.Add(new SiteProfile
            {
                DisplayName = "Nicholas De la Rosa",
                Level = 1,
                RoleEs = "Desarrollador de Software",
                RoleEn = "Software Developer",
                BioEs = "Desarrollador de software de Colombia. Trabajo con C#/.NET, Python y React, y disfruto construir aplicaciones que se vean y se sientan bien. Busco un equipo donde seguir creciendo y aportar desde el primer día.",
                BioEn = "Software developer from Colombia. I work with C#/.NET, Python and React, and I enjoy building apps that look and feel great. I'm looking for a team where I can keep growing and contribute from day one.",
                DialogEs = "* Nicholas está lleno de determinación.",
                DialogEn = "* Nicholas is filled with determination.",
                LocationEs = "Colombia",
                LocationEn = "Colombia",
                Email = "nicholasandresdelarosarivera@hotmail.com",
                LinkedInUrl = "https://www.linkedin.com/in/nicholas-andres-de-la-rosa-rivera-2820a6360",
                WhatsApp = "+573044283435",
                GitHubLogin = app.Configuration["Admin:GitHubLogin"],
                AvailableForWork = true,
                AvailabilityEs = "Disponible para trabajar",
                AvailabilityEn = "Open to work",
                SpokenLanguages =
                [
                    new() { NameEs = "Español", NameEn = "Spanish", Level = "Nativo / Native" },
                    new() { NameEs = "Inglés", NameEn = "English", Level = "C1+" }
                ]
            });
        }

        if (!await db.Associations.AnyAsync())
        {
            db.Associations.Add(new Association
            {
                Name = "Esthercita Factory",
                Slug = "esthercita-factory",
                GitHubLogin = "Esthercita-Factory",
                Color = "#FF77C8",
                WebsiteUrl = "https://github.com/Esthercita-Factory"
            });
        }

        // Borrador sacado de los repos de GitHub; los niveles se ajustan en el admin
        if (!await db.Skills.AnyAsync())
        {
            (string Name, SkillCategory Category, int Level, string Icon)[] skills =
            [
                ("HTML", SkillCategory.Frontend, 5, "html5"),
                ("CSS / SCSS", SkillCategory.Frontend, 4, "css3"),
                ("JavaScript", SkillCategory.Frontend, 4, "javascript"),
                ("TypeScript", SkillCategory.Frontend, 3, "typescript"),
                ("React", SkillCategory.Frontend, 3, "react"),
                ("Angular", SkillCategory.Frontend, 2, "angular"),
                ("C#", SkillCategory.Backend, 4, "csharp"),
                (".NET", SkillCategory.Backend, 4, "dotnetcore"),
                ("Python", SkillCategory.Backend, 3, "python"),
                ("PostgreSQL", SkillCategory.Database, 3, "postgresql"),
                ("Docker", SkillCategory.DevOps, 3, "docker"),
                ("Git / GitHub", SkillCategory.Tools, 4, "git")
            ];
            db.Skills.AddRange(skills.Select((s, i) => new Skill
            {
                Name = s.Name, Category = s.Category, Level = s.Level, Icon = s.Icon, SortOrder = i
            }));
        }

        if (!await db.TimelineEntries.AnyAsync())
        {
            db.TimelineEntries.AddRange(
                new TimelineEntry
                {
                    Kind = TimelineKind.Education,
                    TitleEs = "Desarrollo Web",
                    TitleEn = "Web Development",
                    Organization = "CoderHouse",
                    DescriptionEs = "HTML, CSS, SASS y JavaScript. Proyecto final: Deltarune Fan Page.",
                    DescriptionEn = "HTML, CSS, SASS and JavaScript. Final project: Deltarune Fan Page.",
                    StartDate = new DateOnly(2025, 3, 1),
                    EndDate = new DateOnly(2025, 5, 31)
                },
                new TimelineEntry
                {
                    Kind = TimelineKind.Education,
                    TitleEs = "React JS",
                    TitleEn = "React JS",
                    Organization = "CoderHouse",
                    DescriptionEs = "Componentes, props, hooks y enrutamiento. Proyecto final: tienda online en React.",
                    DescriptionEn = "Components, props, hooks and routing. Final project: an online store built with React.",
                    StartDate = new DateOnly(2025, 6, 1),
                    EndDate = new DateOnly(2025, 9, 30)
                },
                new TimelineEntry
                {
                    Kind = TimelineKind.Education,
                    TitleEs = "Formación en Desarrollo de Software",
                    TitleEn = "Software Development Program",
                    Organization = "Riwi",
                    DescriptionEs = "Python, bases de datos, C# y .NET, Angular y trabajo en equipo con metodologías ágiles.",
                    DescriptionEn = "Python, databases, C# and .NET, Angular and agile teamwork.",
                    StartDate = new DateOnly(2026, 3, 1)
                },
                new TimelineEntry
                {
                    Kind = TimelineKind.Milestone,
                    TitleEs = "Primer sistema full-stack: InfectionSolutions",
                    TitleEn = "First full-stack system: InfectionSolutions",
                    Organization = "Esthercita Factory",
                    DescriptionEs = "API en C# / .NET con cliente en TypeScript, desplegado con Docker.",
                    DescriptionEn = "C# / .NET API with a TypeScript client, deployed with Docker.",
                    StartDate = new DateOnly(2026, 10, 8)
                });
        }

        await db.SaveChangesAsync();
    }
}
