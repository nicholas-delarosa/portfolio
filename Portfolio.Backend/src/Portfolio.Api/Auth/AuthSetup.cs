using AspNet.Security.OAuth.GitHub;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.Cookies;

namespace Portfolio.Api.Auth;

public static class AuthSetup
{
    public const string AdminPolicy = "Admin";
    public const string AvatarClaim = "urn:github:avatar";
    public const string NameClaim = "urn:github:name";

    public static IServiceCollection AddAdminAuth(this IServiceCollection services, IConfiguration config)
    {
        var adminLogin = config["Admin:GitHubLogin"]
            ?? throw new InvalidOperationException("Falta Admin:GitHubLogin en la configuración.");

        var auth = services
            .AddAuthentication(CookieAuthenticationDefaults.AuthenticationScheme)
            .AddCookie(o =>
            {
                o.Cookie.Name = "portfolio.admin";
                o.Cookie.HttpOnly = true;
                // Strict: el navegador nunca manda la cookie desde otro sitio (protege contra CSRF)
                o.Cookie.SameSite = SameSiteMode.Strict;
                o.Cookie.SecurePolicy = CookieSecurePolicy.SameAsRequest;
                o.ExpireTimeSpan = TimeSpan.FromDays(7);
                o.SlidingExpiration = true;
                // Es una API: responder 401/403 en vez de redirigir a una página de login
                o.Events.OnRedirectToLogin = ctx => { ctx.Response.StatusCode = 401; return Task.CompletedTask; };
                o.Events.OnRedirectToAccessDenied = ctx => { ctx.Response.StatusCode = 403; return Task.CompletedTask; };
            });

        // Si no hay credenciales de OAuth no se registra GitHub (el resto de la API sigue funcionando)
        var clientId = config["GitHubOAuth:ClientId"];
        var clientSecret = config["GitHubOAuth:ClientSecret"];
        if (!string.IsNullOrWhiteSpace(clientId) && !string.IsNullOrWhiteSpace(clientSecret))
        {
            auth.AddGitHub(o =>
            {
                o.ClientId = clientId;
                o.ClientSecret = clientSecret;
                o.CallbackPath = "/api/auth/signin-github";
                o.ClaimActions.MapJsonKey(AvatarClaim, "avatar_url");
                o.Events.OnTicketReceived = ctx =>
                {
                    // Solo el dueño del portafolio puede entrar al admin
                    if (!IsAdmin(ctx.Principal?.Identity?.Name, adminLogin))
                    {
                        ctx.Response.Redirect("/admin/login?error=denied");
                        ctx.HandleResponse();
                    }
                    return Task.CompletedTask;
                };
                o.Events.OnRemoteFailure = ctx =>
                {
                    ctx.Response.Redirect("/admin/login?error=failed");
                    ctx.HandleResponse();
                    return Task.CompletedTask;
                };
            });
        }

        services.AddAuthorizationBuilder()
            .AddPolicy(AdminPolicy, p => p
                .RequireAuthenticatedUser()
                .RequireAssertion(c => IsAdmin(c.User.Identity?.Name, adminLogin)));

        return services;
    }

    public static bool IsAdmin(string? login, string adminLogin) =>
        login is not null && string.Equals(login, adminLogin, StringComparison.OrdinalIgnoreCase);

    public const string GitHubScheme = GitHubAuthenticationDefaults.AuthenticationScheme;
}
