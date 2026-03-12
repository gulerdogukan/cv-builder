using CvBuilder.Api.Data;
using CvBuilder.Api.DTOs;
using CvBuilder.Api.Models;
using CvBuilder.Api.Services;
using Microsoft.EntityFrameworkCore;

namespace CvBuilder.Api.Endpoints;

public static class AIEndpoints
{
    private const int FreePlanDailyLimit = 5;

    public static void MapAIEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/ai")
            .WithTags("AI")
            .RequireAuthorization();

        // POST /api/ai/enhance-text
        group.MapPost("/enhance-text", async (
            EnhanceTextRequest request,
            IAIService aiService,
            AppDbContext db,
            HttpContext ctx) =>
        {
            var userId = ctx.Items["UserId"] as string;
            if (string.IsNullOrEmpty(userId)) return Results.Unauthorized();

            var rateLimitResult = await CheckAndIncrementRateLimit(db, userId);
            if (!rateLimitResult.Allowed)
                return Results.Json(
                    new { error = "Günlük AI kullanım limitine ulaştınız.", remaining = 0, limitResetAt = rateLimitResult.ResetAt },
                    statusCode: 429);

            var enhanced = await aiService.EnhanceTextAsync(request.Text);
            return Results.Ok(new EnhanceTextResponse(enhanced)
            {
                RemainingRequests = rateLimitResult.Remaining
            });
        });

        // POST /api/ai/ats-score
        group.MapPost("/ats-score", async (
            ATSScoreRequest request,
            IAIService aiService,
            AppDbContext db,
            HttpContext ctx) =>
        {
            var userId = ctx.Items["UserId"] as string;
            if (string.IsNullOrEmpty(userId)) return Results.Unauthorized();

            var rateLimitResult = await CheckAndIncrementRateLimit(db, userId);
            if (!rateLimitResult.Allowed)
                return Results.Json(
                    new { error = "Günlük AI kullanım limitine ulaştınız.", remaining = 0, limitResetAt = rateLimitResult.ResetAt },
                    statusCode: 429);

            // CvDataJson varsa direkt kullan, yoksa CvId ile DB'den çek
            string cvDataJson = request.CvDataJson ?? "";
            if (string.IsNullOrEmpty(cvDataJson) && !string.IsNullOrEmpty(request.CvId))
            {
                var cv = await db.CVs
                    .Include(c => c.Sections)
                    .FirstOrDefaultAsync(c => c.Id.ToString() == request.CvId &&
                                              c.UserId.ToString() == userId);
                if (cv != null)
                {
                    // Sections → CVData JSON oluştur
                    var dataDict = cv.Sections.ToDictionary(
                        s => s.SectionType.ToString().ToLower(),
                        s => (object)(s.Content ?? "{}"));
                    cvDataJson = System.Text.Json.JsonSerializer.Serialize(dataDict);
                }
            }

            var (score, suggestions) = await aiService.CalculateATSScoreAsync(cvDataJson);

            // ATS skorunu CV kaydına yaz (fire-and-forget)
            if (!string.IsNullOrEmpty(request.CvId))
            {
                var cv = await db.CVs.FindAsync(Guid.Parse(request.CvId));
                if (cv != null)
                {
                    cv.AtsScore = score;
                    await db.SaveChangesAsync();
                }
            }

            return Results.Ok(new ATSScoreResponse(score, suggestions)
            {
                RemainingRequests = rateLimitResult.Remaining
            });
        });

        // POST /api/ai/suggest-skills
        group.MapPost("/suggest-skills", async (
            SuggestSkillsRequest request,
            IAIService aiService,
            AppDbContext db,
            HttpContext ctx) =>
        {
            var userId = ctx.Items["UserId"] as string;
            if (string.IsNullOrEmpty(userId)) return Results.Unauthorized();

            var rateLimitResult = await CheckAndIncrementRateLimit(db, userId);
            if (!rateLimitResult.Allowed)
                return Results.Json(
                    new { error = "Günlük AI kullanım limitine ulaştınız.", remaining = 0, limitResetAt = rateLimitResult.ResetAt },
                    statusCode: 429);

            var skills = await aiService.SuggestSkillsAsync(request.Position);
            return Results.Ok(new SuggestSkillsResponse(skills)
            {
                RemainingRequests = rateLimitResult.Remaining
            });
        });

        // GET /api/ai/rate-limit — mevcut limit durumunu sorgula
        group.MapGet("/rate-limit", async (AppDbContext db, HttpContext ctx) =>
        {
            var userId = ctx.Items["UserId"] as string;
            if (string.IsNullOrEmpty(userId)) return Results.Unauthorized();

            var user = await db.Users.FirstOrDefaultAsync(u => u.Id.ToString() == userId);
            if (user == null) return Results.NotFound();

            ResetIfNewDay(user);
            var isPaid = user.Plan == PlanType.Paid;
            var remaining = isPaid ? int.MaxValue : Math.Max(0, FreePlanDailyLimit - user.AiRequestsToday);

            return Results.Ok(new
            {
                isPaid,
                dailyLimit = isPaid ? (int?)null : FreePlanDailyLimit,
                used = user.AiRequestsToday,
                remaining = isPaid ? (int?)null : remaining,
                resetAt = user.AiRequestsResetAt.AddDays(1).ToString("O")
            });
        });
    }

    // ---- Rate Limit helpers ----

    private record RateLimitResult(bool Allowed, int Remaining, string ResetAt);

    private static async Task<RateLimitResult> CheckAndIncrementRateLimit(AppDbContext db, string userId)
    {
        var user = await db.Users.FirstOrDefaultAsync(u => u.Id.ToString() == userId);
        if (user == null) return new RateLimitResult(false, 0, "");

        // Ücretli kullanıcılara limit yok
        if (user.Plan == PlanType.Paid)
            return new RateLimitResult(true, int.MaxValue, "");

        ResetIfNewDay(user);

        if (user.AiRequestsToday >= FreePlanDailyLimit)
        {
            var resetAt = user.AiRequestsResetAt.AddDays(1).ToString("O");
            await db.SaveChangesAsync();
            return new RateLimitResult(false, 0, resetAt);
        }

        user.AiRequestsToday++;
        await db.SaveChangesAsync();

        var remaining = Math.Max(0, FreePlanDailyLimit - user.AiRequestsToday);
        return new RateLimitResult(true, remaining, user.AiRequestsResetAt.AddDays(1).ToString("O"));
    }

    private static void ResetIfNewDay(User user)
    {
        var today = DateTime.UtcNow.Date;
        if (user.AiRequestsResetAt.Date < today)
        {
            user.AiRequestsToday = 0;
            user.AiRequestsResetAt = today;
        }
    }
}
