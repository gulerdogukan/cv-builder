using System.IdentityModel.Tokens.Jwt;
using System.Security.Cryptography;
using System.Text;
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

        // POST /api/auth/verify-token — token doğrula + DB upsert
        group.MapPost("/verify-token", async (HttpContext context, AppDbContext db) =>
        {
            var userId = context.GetUserId();
            if (userId is null) return Results.Unauthorized();

            var email = context.User.FindFirst("email")?.Value
                ?? context.User.FindFirst(JwtRegisteredClaimNames.Email)?.Value
                ?? "";

            var fullName = context.User.FindFirst("full_name")?.Value
                ?? context.User.FindFirst("user_metadata.full_name")?.Value
                ?? "";

            // Race-safe upsert: önce bul, yoksa ekle
            var user = await db.Users.FirstOrDefaultAsync(u => u.Id == userId.Value);

            if (user is null)
            {
                user = new User
                {
                    Id        = userId.Value,
                    Email     = email,
                    FullName  = fullName,
                    Plan      = PlanType.Free,
                    CreatedAt = DateTime.UtcNow,
                };
                db.Users.Add(user);
                try
                {
                    await db.SaveChangesAsync();
                }
                catch (DbUpdateException)
                {
                    // Eş zamanlı iki istek aynı anda Insert yapmış olabilir — yeniden çek
                    db.ChangeTracker.Clear();
                    user = await db.Users.FirstAsync(u => u.Id == userId.Value);
                }
            }
            else
            {
                var updated = false;
                if (!string.IsNullOrEmpty(email) && user.Email != email)     { user.Email = email; updated = true; }
                if (!string.IsNullOrEmpty(fullName) && user.FullName != fullName) { user.FullName = fullName; updated = true; }
                if (updated) await db.SaveChangesAsync();
            }

            return Results.Ok(new
            {
                userId   = user.Id,
                email    = user.Email,
                fullName = user.FullName,
                plan     = user.Plan.ToString().ToLower(),
            });
        })
        .RequireAuthorization();

        // POST /api/auth/webhook/user-created — Supabase webhook
        group.MapPost("/webhook/user-created", async (
            HttpContext context,
            AppDbContext db,
            IConfiguration config) =>
        {
            // Secret zorunlu — boş bırakılırsa endpoint 503 döner (yanlış config uyarısı)
            var webhookSecret = config["Supabase:WebhookSecret"] ?? "";
            if (string.IsNullOrEmpty(webhookSecret))
            {
                // Secret konfigüre edilmemiş — güvenlik riski, isteği reddet
                return Results.Problem(
                    detail: "Supabase:WebhookSecret konfigüre edilmemiş.",
                    statusCode: 503);
            }

            var authHeader = context.Request.Headers["x-webhook-secret"].ToString();

            // GÜVENLİK FIX #4: Timing attack'a karşı sabit zamanlı karşılaştırma.
            // Düz "!=" kullanımı, string uzunluğuna göre değişen yanıt süresinden
            // secretKey bilgisini sızdırabilir (timing side-channel attack).
            // Her iki dizi aynı uzunluğa pad edilmeli — farklı boyutlu diziler
            // FixedTimeEquals'ı anında false döndürür (timing bilgisi sızdırır).
            var maxLen     = Math.Max(authHeader.Length, webhookSecret.Length);
            var headerBytes = Encoding.UTF8.GetBytes(authHeader.PadRight(maxLen));
            var secretBytes = Encoding.UTF8.GetBytes(webhookSecret.PadRight(maxLen));
            if (!CryptographicOperations.FixedTimeEquals(headerBytes, secretBytes))
                return Results.Unauthorized();

            var payload = await context.Request.ReadFromJsonAsync<SupabaseWebhookPayload>();
            if (payload?.Record is null)
                return Results.BadRequest("Geçersiz payload");

            if (!Guid.TryParse(payload.Record.Id, out var id))
                return Results.BadRequest("Geçersiz kullanıcı ID");

            // Race-safe upsert
            var existingUser = await db.Users.FirstOrDefaultAsync(u => u.Id == id);
            if (existingUser is null)
            {
                db.Users.Add(new User
                {
                    Id        = id,
                    Email     = payload.Record.Email ?? "",
                    FullName  = payload.Record.RawUserMetaData?.FullName ?? "",
                    Plan      = PlanType.Free,
                    CreatedAt = DateTime.UtcNow,
                });
                try
                {
                    await db.SaveChangesAsync();
                }
                catch (DbUpdateException)
                {
                    // Duplicate — zaten oluşturulmuş, sorun değil
                    db.ChangeTracker.Clear();
                }
            }

            return Results.Ok();
        });
    }
}

public record SupabaseWebhookPayload
{
    public string? Type   { get; init; }
    public string? Table  { get; init; }
    public string? Schema { get; init; }
    public SupabaseWebhookRecord? Record { get; init; }
}

public record SupabaseWebhookRecord
{
    public string  Id                { get; init; } = "";
    public string? Email             { get; init; }
    public SupabaseUserMetaData? RawUserMetaData { get; init; }
}

public record SupabaseUserMetaData
{
    public string? FullName { get; init; }
}
