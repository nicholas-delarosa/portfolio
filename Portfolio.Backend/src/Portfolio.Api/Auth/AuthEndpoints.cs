using System.Security.Claims;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.Cookies;

namespace Portfolio.Api.Auth;

public static class AuthEndpoints
{
    public static void MapAuthEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/auth");

        group.MapGet("/login", async (string? returnUrl, IAuthenticationSchemeProvider schemes) =>
        {
            if (await schemes.GetSchemeAsync(AuthSetup.GitHubScheme) is null)
                return Results.Problem("El login con GitHub no está configurado (GitHubOAuth:ClientId / ClientSecret).", statusCode: 503);

            var props = new AuthenticationProperties { RedirectUri = IsLocalUrl(returnUrl) ? returnUrl : "/admin" };
            return Results.Challenge(props, [AuthSetup.GitHubScheme]);
        });

        group.MapPost("/logout", async (HttpContext ctx) =>
        {
            await ctx.SignOutAsync(CookieAuthenticationDefaults.AuthenticationScheme);
            return Results.NoContent();
        });

        group.MapGet("/me", (ClaimsPrincipal user, IConfiguration config) =>
        {
            var login = user.Identity?.Name;
            if (user.Identity?.IsAuthenticated != true || !AuthSetup.IsAdmin(login, config["Admin:GitHubLogin"]!))
                return Results.Ok(new MeResponse(false, null, null, null));

            return Results.Ok(new MeResponse(true, login, user.FindFirstValue(AuthSetup.NameClaim), user.FindFirstValue(AuthSetup.AvatarClaim)));
        });
    }

    // Evita redirecciones abiertas: solo rutas internas como "/admin"
    private static bool IsLocalUrl(string? url) =>
        !string.IsNullOrEmpty(url) && url[0] == '/' && (url.Length == 1 || (url[1] != '/' && url[1] != '\\'));

    private record MeResponse(bool IsAdmin, string? Login, string? Name, string? AvatarUrl);
}
