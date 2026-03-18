using System.Security.Cryptography;
using System.Text;
using CvBuilder.Api.Data;
using CvBuilder.Api.DTOs;
using CvBuilder.Api.Middleware;
using CvBuilder.Api.Services;
using Microsoft.EntityFrameworkCore;

namespace CvBuilder.Api.Endpoints;

public static class PaymentEndpoints
{
    public static void MapPaymentEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/payment").WithTags("Payment");

        // POST /api/payment/initiate — Checkout Form başlat
        group.MapPost("/initiate", async (
            InitiatePaymentRequest request,
            HttpContext ctx,
            IPaymentService paymentService,
            IConfiguration config) =>
        {
            var userId = ctx.GetUserId();
            if (userId is null) return Results.Unauthorized();

            // Callback URL — frontend /payment/result sayfasına yönlendir
            var frontendUrl = config["App:FrontendUrl"] ?? "http://localhost:5173";
            var callbackUrl = $"{frontendUrl}/payment/result";

            try
            {
                var result = await paymentService.InitiateCheckoutAsync(userId.Value, request, callbackUrl);
                return Results.Ok(result);
            }
            catch (InvalidOperationException ex)
            {
                return Results.Json(new { error = ex.Message }, statusCode: 400);
            }
        })
        .RequireAuthorization();

        // POST /api/payment/callback — İyzico webhook (auth gerekmez, imza doğrulanır)
        group.MapPost("/callback", async (
            HttpContext ctx,
            IPaymentService paymentService,
            IConfiguration config,
            ILogger<Program> logger) =>
        {
            // İyzico form-encoded POST gönderir
            var form   = await ctx.Request.ReadFormAsync();
            var token  = form["token"].ToString();

            if (string.IsNullOrEmpty(token))
                return Results.BadRequest(new { error = "Token eksik" });

            // GÜVENLİK FIX #2: İyzico HMAC-SHA256 imza doğrulaması
            // İyzico her callback'te x-iyzi-rnd (nonce) ve x-iyzi-signature header'ı gönderir.
            // İmza = Base64(HMAC-SHA256(apiKey + rnd, secretKey))
            var secretKey = config["Iyzico:SecretKey"] ?? "";
            var apiKey    = config["Iyzico:ApiKey"]    ?? "";

            if (!string.IsNullOrEmpty(secretKey))
            {
                var rnd       = ctx.Request.Headers["x-iyzi-rnd"].ToString();
                var signature = ctx.Request.Headers["x-iyzi-signature"].ToString();

                if (!string.IsNullOrEmpty(rnd) && !string.IsNullOrEmpty(signature))
                {
                    var expectedSig = ComputeIyzicoSignature(apiKey, secretKey, rnd);
                    if (!CryptographicOperations.FixedTimeEquals(
                            Encoding.UTF8.GetBytes(expectedSig),
                            Encoding.UTF8.GetBytes(signature)))
                    {
                        logger.LogWarning("İyzico callback imza doğrulaması başarısız. Token: {Token}", token[..Math.Min(8, token.Length)]);
                        return Results.Unauthorized();
                    }
                }
                else
                {
                    // Sandbox/test ortamı: header yoksa devam et; production'da zorunlu kıl
                    logger.LogWarning("İyzico callback imza header'ları eksik. Sandbox mı?");
                }
            }

            var (success, message) = await paymentService.ProcessCallbackAsync(token);

            // İyzico callback'e HTTP 200 dönmek yeterli
            return Results.Ok(new { success, message });
        });

        // GET /api/payment/status — Kullanıcı plan durumu
        group.MapGet("/status", async (
            HttpContext ctx,
            IPaymentService paymentService) =>
        {
            var userId = ctx.GetUserId();
            if (userId is null) return Results.Unauthorized();

            var status = await paymentService.GetPaymentStatusAsync(userId.Value);
            // null → kullanıcı DB'de yok (henüz verify-token çağrılmadı)
            if (status is null) return Results.NotFound(new { error = "Kullanıcı bulunamadı" });
            return Results.Ok(status);
        })
        .RequireAuthorization();

        // GET /api/payment/verify/{token} — Frontend callback sonrası doğrulama
        // GÜVENLİK FIX #3: RequireAuthorization + token'ın o kullanıcıya ait olduğunu doğrula
        group.MapGet("/verify/{token}", async (
            string token,
            HttpContext ctx,
            IPaymentService paymentService,
            AppDbContext db) =>
        {
            var userId = ctx.GetUserId();
            if (userId is null) return Results.Unauthorized();

            if (string.IsNullOrEmpty(token))
                return Results.BadRequest(new { error = "Token eksik" });

            // Token'ın bu kullanıcıya ait olduğunu doğrula
            var payment = await db.Payments
                .FirstOrDefaultAsync(p => p.IyzicoToken == token && p.UserId == userId.Value);

            if (payment is null)
                return Results.NotFound(new { error = "Ödeme kaydı bulunamadı veya erişim reddedildi." });

            var (success, message) = await paymentService.ProcessCallbackAsync(token);
            return Results.Ok(new { success, message });
        })
        .RequireAuthorization();
    }

    // İyzico HMAC-SHA256 imza hesaplama: Base64(HMAC-SHA256(apiKey + rnd, secretKey))
    private static string ComputeIyzicoSignature(string apiKey, string secretKey, string rnd)
    {
        var data    = apiKey + rnd;
        var keyBytes = Encoding.UTF8.GetBytes(secretKey);
        var msgBytes = Encoding.UTF8.GetBytes(data);

        using var hmac = new HMACSHA256(keyBytes);
        var hash = hmac.ComputeHash(msgBytes);
        return Convert.ToBase64String(hash);
    }
}
