using CvBuilder.Api.Data;
using CvBuilder.Api.DTOs;
using CvBuilder.Api.Middleware;
using CvBuilder.Api.Models;
using CvBuilder.Api.Services;
using Microsoft.EntityFrameworkCore;
using UglyToad.PdfPig;

namespace CvBuilder.Api.Endpoints;

public static class AIEndpoints
{
    private const int FreePlanDailyLimit = 3;

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
            var userId = ctx.GetUserId();
            if (userId is null) return Results.Unauthorized();

            var rateLimitResult = await CheckAndIncrementRateLimit(db, userId.Value);
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
            var userId = ctx.GetUserId();
            if (userId is null) return Results.Unauthorized();

            var rateLimitResult = await CheckAndIncrementRateLimit(db, userId.Value);
            if (!rateLimitResult.Allowed)
                return Results.Json(
                    new { error = "Günlük AI kullanım limitine ulaştınız.", remaining = 0, limitResetAt = rateLimitResult.ResetAt },
                    statusCode: 429);

            // CV ID varsa veriyi ve güncelleme için nesneyi tek seferde çek
            CV? cv = null;
            if (Guid.TryParse(request.CvId, out var cvGuid))
            {
                cv = await db.CVs
                    .Include(c => c.Sections)
                    .FirstOrDefaultAsync(c => c.Id == cvGuid && c.UserId == userId.Value);
            }

            // CvDataJson yoksa DB'den gelen CV içeriğinden oluştur
            string cvDataJson = request.CvDataJson ?? "";
            if (string.IsNullOrEmpty(cvDataJson) && cv != null)
            {
                var dataDict = cv.Sections.ToDictionary(
                    s => s.SectionType.ToString().ToLower(),
                    s => (object)(s.Content ?? "{}"));
                cvDataJson = System.Text.Json.JsonSerializer.Serialize(dataDict);
            }

            var (score, readability, keyword, completeness, impact, suggestions) = await aiService.CalculateATSScoreAsync(cvDataJson);

            // ATS skorunu çekilen nesne üzerinden güncelle (tekrar sorgu yapmadan)
            if (cv != null)
            {
                cv.AtsScore = score;
                await db.SaveChangesAsync();
            }

            return Results.Ok(new ATSScoreResponse(score, readability, keyword, completeness, impact, suggestions)
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
            var userId = ctx.GetUserId();
            if (userId is null) return Results.Unauthorized();

            var rateLimitResult = await CheckAndIncrementRateLimit(db, userId.Value);
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

        // POST /api/ai/generate-summary
        group.MapPost("/generate-summary", async (
            GenerateSummaryRequest request,
            IAIService aiService,
            AppDbContext db,
            HttpContext ctx) =>
        {
            var userId = ctx.GetUserId();
            if (userId is null) return Results.Unauthorized();

            var rateLimitResult = await CheckAndIncrementRateLimit(db, userId.Value);
            if (!rateLimitResult.Allowed)
                return Results.Json(
                    new { error = "Günlük AI kullanım limitine ulaştınız.", remaining = 0, limitResetAt = rateLimitResult.ResetAt },
                    statusCode: 429);

            var drafts = await aiService.GenerateSummaryAsync(request.CvDataJson, request.TargetPosition, request.TargetDescription);
            return Results.Ok(new GenerateSummaryResponse(drafts)
            {
                RemainingRequests = rateLimitResult.Remaining
            });
        });

        // POST /api/ai/import-linkedin
        group.MapPost("/import-linkedin", async (
            LinkedInImportRequest request,
            IAIService aiService,
            AppDbContext db,
            HttpContext ctx,
            ILoggerFactory loggerFactory) =>
        {
            var logger = loggerFactory.CreateLogger("AIEndpoints");
            var userId = ctx.GetUserId();
            if (userId is null) return Results.Unauthorized();

            if (string.IsNullOrWhiteSpace(request.ProfileText))
                return Results.BadRequest(new { error = "LinkedIn profil metni boş olamaz." });

            var rateLimitResult = await CheckAndIncrementRateLimit(db, userId.Value);
            if (!rateLimitResult.Allowed)
                return Results.Json(
                    new { error = "Günlük AI kullanım limitine ulaştınız.", remaining = 0, limitResetAt = rateLimitResult.ResetAt },
                    statusCode: 429);

            try
            {
                var cvDataJson = await aiService.ImportLinkedInAsync(request.ProfileText);
                return Results.Ok(new LinkedInImportResponse { CvDataJson = cvDataJson, RemainingRequests = rateLimitResult.Remaining });
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "LinkedIn import hatası (User: {UserId})", userId);
                return Results.Problem("LinkedIn profili işlenirken bir hata oluştu.");
            }
        });

        // POST /api/ai/import-cv
        group.MapPost("/import-cv", async (
            IFormFile file,
            IAIService aiService,
            AppDbContext db,
            HttpContext ctx,
            ILoggerFactory loggerFactory) =>
        {
            var logger = loggerFactory.CreateLogger("AIEndpoints");
            var userId = ctx.GetUserId();
            if (userId is null) return Results.Unauthorized();

            if (file == null || file.Length == 0)
                return Results.BadRequest(new { error = "Geçerli bir dosya yüklenmedi." });

            // Content-Type başlığı istemci tarafından manipüle edilebilir — magic bytes ile doğrula
            if (!await IsValidPdfAsync(file))
                return Results.BadRequest(new { error = "Sadece PDF formatı desteklenmektedir." });

            const long MaxFileSize = 10 * 1024 * 1024; // 10MB limit
            if (file.Length > MaxFileSize)
                return Results.BadRequest(new { error = "Dosya boyutu 10MB'dan büyük olamaz." });

            var rateLimitResult = await CheckAndIncrementRateLimit(db, userId.Value);
            if (!rateLimitResult.Allowed)
                return Results.Json(
                    new { error = "Günlük AI kullanım limitine ulaştınız.", remaining = 0, limitResetAt = rateLimitResult.ResetAt },
                    statusCode: 429);

                try
                {
                    var sb = new System.Text.StringBuilder();
                    using (var stream = file.OpenReadStream())
                    using (var document = PdfDocument.Open(stream))
                    {
                        foreach (var page in document.GetPages())
                        {
                            sb.AppendLine(page.Text);
                        }
                    }

                    var rawText = sb.ToString();
                    var parsedJsonResult = await aiService.ParsePdfToCvDataAsync(rawText);

                return Results.Ok(new 
                { 
                    success = true, 
                    data = parsedJsonResult,
                    remainingRequests = rateLimitResult.Remaining 
                });
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "PDF import hatası (User: {UserId})", userId);
                return Results.Problem(detail: ex.Message, title: "PDF okuma veya AI dönüştürme hatası");
            }
        }).DisableAntiforgery();

        // POST /api/ai/cover-letter
        group.MapPost("/cover-letter", async (
            CoverLetterRequest request,
            IAIService aiService,
            AppDbContext db,
            HttpContext ctx) =>
        {
            var userId = ctx.GetUserId();
            if (userId is null) return Results.Unauthorized();

            var rateLimitResult = await CheckAndIncrementRateLimit(db, userId.Value);
            if (!rateLimitResult.Allowed)
                return Results.Json(
                    new { error = "Günlük AI kullanım limitine ulaştınız.", remaining = 0, limitResetAt = rateLimitResult.ResetAt },
                    statusCode: 429);

            var letter = await aiService.GenerateCoverLetterAsync(request.CvDataJson, request.JobDescription);
            return Results.Ok(new CoverLetterResponse(letter)
            {
                RemainingRequests = rateLimitResult.Remaining
            });
        });

        // POST /api/ai/match-job
        group.MapPost("/match-job", async (
            JobMatchRequest request,
            IAIService aiService,
            AppDbContext db,
            HttpContext ctx) =>
        {
            var userId = ctx.GetUserId();
            if (userId is null) return Results.Unauthorized();

            // Sadece Premium kullanıcılar Match Job yapabilir (Opsiyonel: Veya rate limit azaltılabilir)
            var rateLimitResult = await CheckAndIncrementRateLimit(db, userId.Value);
            if (!rateLimitResult.Allowed)
                return Results.Json(
                    new { error = "Günlük AI kullanım limitine ulaştınız.", remaining = 0, limitResetAt = rateLimitResult.ResetAt },
                    statusCode: 429);

            var result = await aiService.MatchJobAsync(request.CvDataJson, request.JobDescription);
            
            return Results.Ok(new JobMatchResponse
            {
                MatchScore = result.MatchScore,
                MatchingSkills = result.MatchingSkills,
                MissingSkills = result.MissingSkills,
                Advice = result.Advice,
                RemainingRequests = rateLimitResult.Remaining
            });
        });

        // GET /api/ai/rate-limit — mevcut limit durumunu sorgula
        group.MapGet("/rate-limit", async (AppDbContext db, HttpContext ctx) =>
        {
            var userId = ctx.GetUserId();
            if (userId is null) return Results.Unauthorized();

            var user = await db.Users.FirstOrDefaultAsync(u => u.Id == userId.Value);
            if (user == null) return Results.NotFound();

            if (ResetIfNewDay(user)) await db.SaveChangesAsync();
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

        // POST /api/ai/bulletize
        group.MapPost("/bulletize", async (
            BulletizeRequest request,
            IAIService aiService,
            AppDbContext db,
            HttpContext ctx) =>
        {
            var userId = ctx.GetUserId();
            if (userId is null) return Results.Unauthorized();

            if (string.IsNullOrWhiteSpace(request.Description))
                return Results.BadRequest(new { error = "Açıklama boş olamaz." });

            var rateLimitResult = await CheckAndIncrementRateLimit(db, userId.Value);
            if (!rateLimitResult.Allowed)
                return Results.Json(
                    new { error = "Günlük AI kullanım limitine ulaştınız.", remaining = 0, limitResetAt = rateLimitResult.ResetAt },
                    statusCode: 429);

            var bullets = await aiService.BulletizeDescriptionAsync(request.Description, request.JobTitle);
            return Results.Ok(new BulletizeResponse { Bullets = bullets, RemainingRequests = rateLimitResult.Remaining });
        });
    }

    // ---- Rate Limit helpers ----

    /// <summary>
    /// Gün değişmişse kullanıcının günlük AI istek sayacını sıfırlar.
    /// Gerçek DB kayıt çağrısı caller'a bırakılır (SaveChangesAsync).
    /// </summary>
    private static bool ResetIfNewDay(User user)
    {
        var today      = DateTime.UtcNow.Date;
        var resetAtUtc = DateTime.SpecifyKind(user.AiRequestsResetAt, DateTimeKind.Utc);
        if (resetAtUtc.Date < today)
        {
            user.AiRequestsToday   = 0;
            user.AiRequestsResetAt = DateTime.SpecifyKind(today, DateTimeKind.Utc);
            return true;
        }
        return false;
    }

    private record RateLimitResult(bool Allowed, int Remaining, string ResetAt);

    private static async Task<RateLimitResult> CheckAndIncrementRateLimit(AppDbContext db, Guid userId)
    {
        var user = await db.Users.FirstOrDefaultAsync(u => u.Id == userId);
        if (user == null) return new RateLimitResult(false, 0, "");

        // Ücretli kullanıcılara limit yok
        if (user.Plan == PlanType.Paid)
            return new RateLimitResult(true, int.MaxValue, "");

        var today      = DateTime.UtcNow.Date;
        var resetAtUtc = DateTime.SpecifyKind(user.AiRequestsResetAt, DateTimeKind.Utc);

        // Gün değişmişse önce sıfırla (idempotent — tekrar çalışsa da sorun yok)
        if (resetAtUtc.Date < today)
        {
            await db.Database.ExecuteSqlRawAsync("""
                UPDATE "Users"
                SET "AiRequestsToday" = 0,
                    "AiRequestsResetAt" = {0}
                WHERE "Id" = {1}
                """,
                DateTime.SpecifyKind(today, DateTimeKind.Utc),
                userId);

            // Güncel değerleri DB'den tekrar çek
            db.ChangeTracker.Clear();
            user = await db.Users.FirstOrDefaultAsync(u => u.Id == userId);
            if (user == null) return new RateLimitResult(false, 0, "");
        }

        if (user.AiRequestsToday >= FreePlanDailyLimit)
        {
            var resetAt = DateTime.SpecifyKind(user.AiRequestsResetAt, DateTimeKind.Utc).AddDays(1).ToString("O");
            return new RateLimitResult(false, 0, resetAt);
        }

        // GÜVENLİK FIX #5: Race condition'a karşı atomic SQL UPDATE.
        // "read-then-write" yerine tek sorguda hem koşul kontrol hem artırım yapılır.
        // Eş zamanlı N istek gelse bile limit aşılamaz.
        var affected = await db.Database.ExecuteSqlRawAsync("""
            UPDATE "Users"
            SET "AiRequestsToday" = "AiRequestsToday" + 1
            WHERE "Id" = {0}
              AND "AiRequestsToday" < {1}
            """,
            userId,
            FreePlanDailyLimit);

        if (affected == 0)
        {
            // Başka bir istek yarışı kazandı ve limiti doldurdu
            var resetAt = DateTime.SpecifyKind(user.AiRequestsResetAt, DateTimeKind.Utc).AddDays(1).ToString("O");
            return new RateLimitResult(false, 0, resetAt);
        }

        // Artırım başarılı — yeni değeri hesapla
        var newCount  = user.AiRequestsToday + 1;
        var remaining = Math.Max(0, FreePlanDailyLimit - newCount);
        return new RateLimitResult(true, remaining, DateTime.SpecifyKind(user.AiRequestsResetAt, DateTimeKind.Utc).AddDays(1).ToString("O"));
    }

    /// <summary>
    /// PDF magic bytes doğrulaması — Content-Type başlığına güvenmez.
    /// Gerçek PDF dosyaları "%PDF-" (0x25 0x50 0x44 0x46 0x2D) ile başlar.
    /// </summary>
    private static async Task<bool> IsValidPdfAsync(IFormFile file)
    {
        // Content-Type kontrolü (ilk süzgeç)
        if (!string.Equals(file.ContentType, "application/pdf", StringComparison.OrdinalIgnoreCase) &&
            !string.Equals(file.ContentType, "application/octet-stream", StringComparison.OrdinalIgnoreCase))
            return false;

        // Magic bytes kontrolü: %PDF-
        var signature = new byte[5];
        await using var stream = file.OpenReadStream();
        var read = await stream.ReadAsync(signature.AsMemory(0, 5));
        if (read < 5) return false;

        // %PDF- = 0x25 0x50 0x44 0x46 0x2D
        return signature[0] == 0x25 &&
               signature[1] == 0x50 &&
               signature[2] == 0x44 &&
               signature[3] == 0x46 &&
               signature[4] == 0x2D;
    }
}
