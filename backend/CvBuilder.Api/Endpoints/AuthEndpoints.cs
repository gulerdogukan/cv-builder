using CvBuilder.Api.Middleware;

namespace CvBuilder.Api.Endpoints;

public static class AuthEndpoints
{
    public static void MapAuthEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/auth").WithTags("Auth");

        group.MapPost("/verify-token", (HttpContext context) =>
        {
            var userId = context.GetUserId();
            if (userId is null)
                return Results.Unauthorized();

            return Results.Ok(new { userId, message = "Token geçerli" });
        })
        .RequireAuthorization();
    }
}
