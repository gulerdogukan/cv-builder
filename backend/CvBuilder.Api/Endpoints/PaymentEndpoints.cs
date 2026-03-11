using CvBuilder.Api.Middleware;
using CvBuilder.Api.Services;

namespace CvBuilder.Api.Endpoints;

public static class PaymentEndpoints
{
    public static void MapPaymentEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/payment").WithTags("Payment");

        group.MapPost("/initiate", async (HttpContext context, IPaymentService paymentService) =>
        {
            var userId = context.GetUserId();
            if (userId is null) return Results.Unauthorized();

            var token = await paymentService.InitiatePaymentAsync(userId.Value, "one_time");
            return Results.Ok(new { token });
        })
        .RequireAuthorization();

        group.MapPost("/callback", async (HttpContext context, IPaymentService paymentService) =>
        {
            // İyzico webhook — auth gerektirmez
            var form = await context.Request.ReadFormAsync();
            var token = form["token"].ToString();
            var success = await paymentService.ProcessCallbackAsync(token);
            return success ? Results.Ok() : Results.BadRequest();
        });

        group.MapGet("/status", async (HttpContext context, IPaymentService paymentService) =>
        {
            var userId = context.GetUserId();
            if (userId is null) return Results.Unauthorized();

            var status = await paymentService.GetPaymentStatusAsync(userId.Value);
            return Results.Ok(new { status });
        })
        .RequireAuthorization();
    }
}
