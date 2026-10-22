using System.Security.Claims;
using System.Text.Json.Serialization;
using Microsoft.AspNetCore.DataProtection;
using Microsoft.AspNetCore.HttpOverrides;
using Microsoft.EntityFrameworkCore;
using Portfolio.Api.Auth;
using Portfolio.Api.Data;
using Portfolio.Api.Endpoints;
using Portfolio.Api.Media;
using Portfolio.Api.Sync;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddDbContext<AppDbContext>(o => o
    .UseNpgsql(builder.Configuration.GetConnectionString("Default"), npgsql => npgsql.EnableRetryOnFailure())
    .UseSnakeCaseNamingConvention());

builder.Services.AddDataProtection()
    .SetApplicationName("portfolio")
    .PersistKeysToDbContext<AppDbContext>();

// La API vive detrás de Caddy: confiar en sus encabezados para saber que la petición original fue HTTPS
builder.Services.Configure<ForwardedHeadersOptions>(o =>
{
    o.ForwardedHeaders = ForwardedHeaders.XForwardedFor | ForwardedHeaders.XForwardedProto;
    o.KnownIPNetworks.Clear();
    o.KnownProxies.Clear();
});

builder.Services.ConfigureHttpJsonOptions(o => o.SerializerOptions.Converters.Add(new JsonStringEnumConverter()));
builder.Services.AddProblemDetails();
builder.Services.AddAdminAuth(builder.Configuration);

// Sincronización con GitHub
builder.Services.Configure<GitHubOptions>(builder.Configuration.GetSection(GitHubOptions.Section));
builder.Services.Configure<GitHubSyncOptions>(builder.Configuration.GetSection(GitHubSyncOptions.Section));
builder.Services.AddHttpClient<GitHubClient>(http => GitHubClient.Configure(http, builder.Configuration["GitHub:Token"]));
builder.Services.AddScoped<GitHubSyncService>();
builder.Services.AddSingleton<SyncRunner>();
builder.Services.AddHostedService(sp => sp.GetRequiredService<SyncRunner>());

// Imágenes: capturas automáticas con Playwright + Cloudinary
builder.Services.Configure<CloudinaryOptions>(builder.Configuration.GetSection(CloudinaryOptions.Section));
builder.Services.Configure<ScreenshotOptions>(builder.Configuration.GetSection(ScreenshotOptions.Section));
builder.Services.AddSingleton<CloudinaryService>();
builder.Services.AddSingleton<ScreenshotService>();
builder.Services.AddSingleton<ScreenshotQueue>();
builder.Services.AddHostedService<ScreenshotWorker>();

var app = builder.Build();

app.UseForwardedHeaders();
app.UseExceptionHandler();
app.UseAuthentication();
app.UseAuthorization();

app.MapGet("/api/health", async (AppDbContext db) =>
    await db.Database.CanConnectAsync()
        ? Results.Ok(new { status = "ok" })
        : Results.Problem("No hay conexión con la base de datos.", statusCode: 503));

app.MapAuthEndpoints();
app.MapPublicEndpoints();

var admin = app.MapGroup("/api/admin").RequireAuthorization(AuthSetup.AdminPolicy);
admin.MapGet("/ping", (ClaimsPrincipal user) => new { message = $"* {user.Identity!.Name} está lleno de determinación." });
admin.MapAdminProjectEndpoints();
admin.MapAdminAssociationEndpoints();
admin.MapAdminSyncEndpoints();

await app.MigrateAndSeedAsync();
app.Run();
