using System.IdentityModel.Tokens.Jwt;

namespace CvBuilder.Api.Middleware;

/// <summary>
/// Supabase JWT token'ından user ID çıkarır ve HttpContext.Items'a ekler.
/// JWT doğrulaması .NET'in built-in JwtBearer middleware'i tarafından yapılır.
/// Bu middleware sadece user ID extraction için.
/// </summary>
public class AuthMiddleware
{
    private readonly RequestDelegate _next;

    public AuthMiddleware(RequestDelegate next)
    {
        _next = next;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        if (context.User.Identity?.IsAuthenticated == true)
        {
            var subClaim = context.User.FindFirst("sub")?.Value
                ?? context.User.FindFirst(JwtRegisteredClaimNames.Sub)?.Value;

            if (Guid.TryParse(subClaim, out var userId))
            {
                context.Items["UserId"] = userId;
            }
        }

        await _next(context);
    }
}

public static class AuthMiddlewareExtensions
{
    public static Guid? GetUserId(this HttpContext context)
    {
        return context.Items.TryGetValue("UserId", out var userId) ? userId as Guid? : null;
    }
}
