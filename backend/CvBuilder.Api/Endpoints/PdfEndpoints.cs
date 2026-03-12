using CvBuilder.Api.Data;
using CvBuilder.Api.Middleware;
using CvBuilder.Api.Models;
using CvBuilder.Api.Services;
using Microsoft.EntityFrameworkCore;

namespace CvBuilder.Api.Endpoints;

public static class PdfEndpoints
{
    public static void MapPdfEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/pdf")
            .WithTags("PDF")
            .RequireAuthorization();

        // POST /api/pdf/{cvId}/export
        // Plan-gated: sadece Paid kullanıcılar PDF indirebilir
        group.MapPost("/{cvId:guid}/export", async (
            Guid cvId,
            AppDbContext db,
            IPdfService pdfService,
            HttpContext ctx) =>
        {
            var userId = ctx.GetUserId();
            if (userId is null) return Results.Unauthorized();

            // Kullanıcı planı kontrol et
            var user = await db.Users.FirstOrDefaultAsync(u => u.Id == userId.Value);
            if (user == null) return Results.Unauthorized();

            if (user.Plan != PlanType.Paid)
            {
                return Results.Json(
                    new { error = "PDF indirme özelliği sadece Premium kullanıcılara açıktır.", code = "UPGRADE_REQUIRED" },
                    statusCode: 402);
            }

            // CV + sections getir
            var cv = await db.CVs
                .Include(c => c.Sections)
                .FirstOrDefaultAsync(c => c.Id == cvId && c.UserId == userId.Value);

            if (cv == null) return Results.NotFound();

            // Sections → CVData JSON oluştur
            var dataDict = cv.Sections
                .OrderBy(s => s.SortOrder)
                .ToDictionary(
                    s => s.SectionType.ToString().ToLower(),
                    s => (object)(s.Content ?? "{}"));

            var cvDataJson = System.Text.Json.JsonSerializer.Serialize(dataDict);

            // PDF oluştur
            byte[] pdfBytes;
            try
            {
                pdfBytes = await pdfService.GeneratePdfAsync(cv.Template, cvDataJson);
            }
            catch (InvalidOperationException ex)
            {
                return Results.Json(new { error = ex.Message }, statusCode: 503);
            }

            // Dosya adı: "cv-title-date.pdf"
            var safeName = System.Text.RegularExpressions.Regex
                .Replace(cv.Title, @"[^\w\s-]", "")
                .Trim()
                .Replace(' ', '-')
                .ToLower();
            var fileName = $"cv-{safeName}-{DateTime.UtcNow:yyyyMMdd}.pdf";

            return Results.File(pdfBytes, "application/pdf", fileName);
        });

        // GET /api/pdf/health — PDF servisi durumu
        group.MapGet("/health", async (IPdfService _, IConfiguration config) =>
        {
            var pdfUrl = config["PdfService:BaseUrl"] ?? "http://localhost:3001";
            try
            {
                using var http = new HttpClient { Timeout = TimeSpan.FromSeconds(5) };
                var resp = await http.GetAsync($"{pdfUrl}/health");
                return Results.Ok(new { pdfServiceStatus = resp.IsSuccessStatusCode ? "OK" : "ERROR" });
            }
            catch
            {
                return Results.Ok(new { pdfServiceStatus = "UNREACHABLE" });
            }
        });
    }
}
