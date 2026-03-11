using System.IdentityModel.Tokens.Jwt;
using CvBuilder.Api.Data;
using CvBuilder.Api.Middleware;
using CvBuilder.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace CvBuilder.Api.Endpoints;

public static class AuthEndpoints
{
    public static void MapAuthEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/auth").WithTags("Auth");

        // Token doğrulama + User sync (upsert)
        // Frontend login sonrası bu endpoint'e istek atarak kullanıcıyı DB'ye sync eder
        group.MapPost("/verify-token", async (HttpContext context, AppDbContext db) =>
        {
            var userId = context.GetUserId();
            if (userId is null)
                return Results.Unauthorized();

            // JWT'den email ve full_name çıkar
            var email = context.User.FindFirst("email")?.Value
                ?? context.User.FindFirst(JwtRegisteredClaimNames.Email)?.Value
                ?? "";

            var fullName = context.User.FindFirst("full_name")?.Value
                ?? context.User.FindFirst("user_metadata.full_name")?.Value
                ?? "";

            // Users tablosunda var mı kontrol et, yoksa oluştur
            var user = await db.Users.FirstOrDefaultAsync(u => u.Id == userId.Value);

            if (user is null)
            {
                user = new User
                {
                    Id = userId.Value,
                    Email = email,
                    FullName = fullName,
                    Plan = PlanType.Free,
                    CreatedAt = DateTime.UtcNow,
                };
                db.Users.Add(user);
                await db.SaveChangesAsync();
            }
            else
            {
                // Email veya isim değişmişse güncelle
                var updated = false;
                if (!string.IsNullOrEmpty(email) && user.Email != email)
                {
                    user.Email = email;
                    updated = true;
                }
                if (!string.IsNullOrEmpty(fullName) && user.FullName != fullName)
                {
                    user.FullName = fullName;
                    updated = true;
                }
                if (updated) await db.SaveChangesAsync();
            }

            return Results.Ok(new
            {
                userId = user.Id,
                email = user.Email,
                fullName = user.FullName,
                plan = user.Plan.ToString().ToLower(),
            });
        })
        .RequireAuthorization();

        // Supabase webhook — yeni kullanıcı kaydında çağrılır
        // Supabase Dashboard > Database > Webhooks'dan ayarlanır
        group.MapPost("/webhook/user-created", async (
            HttpContext context,
            AppDbContext db,
            IConfiguration config) =>
        {
            // Basit webhook secret doğrulama
            var webhookSecret = config["Supabase:WebhookSecret"] ?? "";
            if (!string.IsNullOrEmpty(webhookSecret))
            {
                var authHeader = context.Request.Headers["x-webhook-secret"].ToString();
                if (authHeader != webhookSecret)
                    return Results.Unauthorized();
            }

            var payload = await context.Request.ReadFromJsonAsync<SupabaseWebhookPayload>();
            if (payload?.Record is null)
                return Results.BadRequest("Invalid payload");

            if (!Guid.TryParse(payload.Record.Id, out var id))
                return Results.BadRequest("Invalid user ID");

            var existingUser = await db.Users.FirstOrDefaultAsync(u => u.Id == id);

            if (existingUser is null)
            {
                var user = new User
                {
                    Id = id,
                    Email = payload.Record.Email ?? "",
                    FullName = payload.Record.RawUserMetaData?.FullName ?? "",
                    Plan = PlanType.Free,
                    CreatedAt = DateTime.UtcNow,
                };
                db.Users.Add(user);
                await db.SaveChangesAsync();
            }

            return Results.Ok();
        });
    }
}

// Supabase webhook payload modelleri
public record SupabaseWebhookPayload
{
    public string? Type { get; init; }
    public string? Table { get; init; }
    public string? Schema { get; init; }
    public SupabaseWebhookRecord? Record { get; init; }
}

public record SupabaseWebhookRecord
{
    public string Id { get; init; } = "";
    public string? Email { get; init; }
    public SupabaseUserMetaData? RawUserMetaData { get; init; }
}

public record SupabaseUserMetaData
{
    public string? FullName { get; init; }
}
