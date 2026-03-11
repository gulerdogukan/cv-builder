using CvBuilder.Api.DTOs;
using CvBuilder.Api.Middleware;
using CvBuilder.Api.Services;

namespace CvBuilder.Api.Endpoints;

public static class CVEndpoints
{
    public static void MapCVEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/cvs")
            .WithTags("CV")
            .RequireAuthorization();

        // GET /api/cvs — Kullanıcının CV listesi
        group.MapGet("/", async (HttpContext context, ICVService cvService) =>
        {
            var userId = context.GetUserId();
            if (userId is null) return Results.Unauthorized();

            var cvList = await cvService.GetUserCVsAsync(userId.Value);
            return Results.Ok(cvList);
        });

        // GET /api/cvs/{id} — CV detay
        group.MapGet("/{id:guid}", async (Guid id, HttpContext context, ICVService cvService) =>
        {
            var userId = context.GetUserId();
            if (userId is null) return Results.Unauthorized();

            var cv = await cvService.GetCVByIdAsync(id, userId.Value);
            return cv is null ? Results.NotFound() : Results.Ok(cv);
        });

        // POST /api/cvs — Yeni CV oluştur
        group.MapPost("/", async (CreateCVRequest request, HttpContext context, ICVService cvService) =>
        {
            var userId = context.GetUserId();
            if (userId is null) return Results.Unauthorized();

            var cv = await cvService.CreateCVAsync(userId.Value, request);
            return Results.Created($"/api/cvs/{cv.Id}", cv);
        });

        // PUT /api/cvs/{id} — CV güncelle
        group.MapPut("/{id:guid}", async (Guid id, UpdateCVRequest request, HttpContext context, ICVService cvService) =>
        {
            var userId = context.GetUserId();
            if (userId is null) return Results.Unauthorized();

            var cv = await cvService.UpdateCVAsync(id, userId.Value, request);
            return cv is null ? Results.NotFound() : Results.Ok(cv);
        });

        // DELETE /api/cvs/{id} — CV sil
        group.MapDelete("/{id:guid}", async (Guid id, HttpContext context, ICVService cvService) =>
        {
            var userId = context.GetUserId();
            if (userId is null) return Results.Unauthorized();

            var deleted = await cvService.DeleteCVAsync(id, userId.Value);
            return deleted ? Results.NoContent() : Results.NotFound();
        });

        // POST /api/cvs/{id}/duplicate — CV kopyala
        group.MapPost("/{id:guid}/duplicate", async (Guid id, HttpContext context, ICVService cvService) =>
        {
            var userId = context.GetUserId();
            if (userId is null) return Results.Unauthorized();

            var cv = await cvService.DuplicateCVAsync(id, userId.Value);
            return cv is null ? Results.NotFound() : Results.Created($"/api/cvs/{cv.Id}", cv);
        });
    }
}
