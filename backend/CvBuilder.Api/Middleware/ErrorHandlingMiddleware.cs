using System.Net;
using System.Text.Json;

namespace CvBuilder.Api.Middleware;

public class ErrorHandlingMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<ErrorHandlingMiddleware> _logger;

    public ErrorHandlingMiddleware(RequestDelegate next, ILogger<ErrorHandlingMiddleware> logger)
    {
        _next = next;
        _logger = logger;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await _next(context);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex,
                "Unhandled exception on {Method} {Path}: {Message}",
                context.Request.Method,
                context.Request.Path,
                ex.Message);

            // Don't overwrite a response that has already started streaming
            if (context.Response.HasStarted) return;

            context.Response.StatusCode = (int)HttpStatusCode.InternalServerError;
            context.Response.ContentType = "application/json";

            try
            {
                var isDev = context.RequestServices.GetRequiredService<IHostEnvironment>().IsDevelopment();
                var response = new
                {
                    error = "Bir hata oluştu. Lütfen daha sonra tekrar deneyin.",
                    details = isDev ? ex.Message : null
                };
                await context.Response.WriteAsync(JsonSerializer.Serialize(response));
            }
            catch
            {
                // JSON serialization da başarısız olursa minimal plain-text fallback
                await context.Response.WriteAsync("{\"error\":\"Internal server error\"}");
            }
        }
    }
}
