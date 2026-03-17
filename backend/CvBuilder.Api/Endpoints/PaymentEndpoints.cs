using CvBuilder.Api.DTOs;
using CvBuilder.Api.Middleware;
using CvBuilder.Api.Services;

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

        // POST /api/payment/callback — İyzico webhook (auth gerekmez)
        group.MapPost("/callback", async (
            HttpContext ctx,
            IPaymentService paymentService) =>
        {
            // İyzico form-encoded POST gönderir
            var form   = await ctx.Request.ReadFormAsync();
            var token  = form["token"].ToString();
            var status = form["status"].ToString();

            if (string.IsNullOrEmpty(token))
                return Results.BadRequest(new { error = "Token eksik" });

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
        // /payment/result sayfası bu endpoint'i çağırarak sonucu öğrenir
        group.MapGet("/verify/{token}", async (
            string token,
            IPaymentService paymentService) =>
        {
            if (string.IsNullOrEmpty(token))
                return Results.BadRequest(new { error = "Token eksik" });

            var (success, message) = await paymentService.ProcessCallbackAsync(token);
            return Results.Ok(new { success, message });
        });
    }
}
