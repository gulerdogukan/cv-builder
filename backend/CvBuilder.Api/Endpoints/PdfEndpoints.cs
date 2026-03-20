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
            // Content is stored as a JSON string in the DB (jsonb column mapped to string).
            // We must deserialize each section's Content into a JsonElement before re-serializing,
            // otherwise the PDF service receives escaped strings instead of nested objects.
            var dataDict = new Dictionary<string, System.Text.Json.JsonElement>();
            foreach (var section in cv.Sections.OrderBy(s => s.SortOrder))
            {
                var key = section.SectionType.ToString().ToLower();
                try
                {
                    var element = System.Text.Json.JsonSerializer.Deserialize<System.Text.Json.JsonElement>(
                        section.Content ?? "{}");
                    dataDict[key] = element;
                }
                catch
                {
                    // Fallback to empty object if content is malformed
                    dataDict[key] = System.Text.Json.JsonSerializer.Deserialize<System.Text.Json.JsonElement>("{}");
                }
            }

            var cvDataJson = System.Text.Json.JsonSerializer.Serialize(dataDict);

            // PDF servisinin desteklediği template adlarına map et
            // (frontend farklı template isimleri kullanıyor olabilir)
            var pdfTemplate = cv.Template?.ToLower() switch
            {
                "classic"          => "classic",
                "minimal"          => "minimal",
                "minimalist"       => "minimal",
                "modernist"        => "modern",
                "executive"        => "classic",
                "creative-canvas"  => "creative-canvas",
                "creative_canvas"  => "creative-canvas",
                "creativecanvas"   => "creative-canvas",
                "startup"          => "startup",
                _                  => "modern",
            };

            // PDF oluştur
            byte[] pdfBytes;
            try
            {
                pdfBytes = await pdfService.GeneratePdfAsync(pdfTemplate, cvDataJson);
            }
            catch (Exception ex)
            {
                // InvalidOperationException = bilinen PDF servis hatası
                // Diğer exception'lar (JsonException, HttpRequestException, vb.) → 503
                return Results.Json(new { error = ex.Message, code = "PDF_ERROR" }, statusCode: 503);
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
        // IHttpClientFactory kullan — new HttpClient() socket exhaustion'ı önler
        group.MapGet("/health", async (
            IPdfService _,
            IConfiguration config,
            IHttpClientFactory httpClientFactory) =>
        {
            var pdfUrl = config["PdfService:BaseUrl"] ?? "http://localhost:3001";
            try
            {
                var http = httpClientFactory.CreateClient("pdf-health");
                using var cts  = new CancellationTokenSource(TimeSpan.FromSeconds(5));
                var resp = await http.GetAsync($"{pdfUrl}/health", cts.Token);
                return Results.Ok(new { pdfServiceStatus = resp.IsSuccessStatusCode ? "OK" : "ERROR" });
            }
            catch
            {
                return Results.Ok(new { pdfServiceStatus = "UNREACHABLE" });
            }
        });
    }
}
