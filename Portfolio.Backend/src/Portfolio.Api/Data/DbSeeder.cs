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

        await db.SaveChangesAsync();
    }
}
