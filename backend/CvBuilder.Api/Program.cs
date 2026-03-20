using CvBuilder.Api.Data;
using CvBuilder.Api.Endpoints;
using CvBuilder.Api.Middleware;
using CvBuilder.Api.Services;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;

var builder = WebApplication.CreateBuilder(args);

// Port ayarı: Docker içinde değilsek 5001 kullan (5000 çakışmasını önlemek için)
if (Environment.GetEnvironmentVariable("DOTNET_RUNNING_IN_CONTAINER") != "true")
{
    builder.WebHost.UseUrls("http://localhost:5001");
}

// === Services ===

// Database
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection")));

// Authentication — Supabase JWT (ES256, OIDC discovery ile otomatik key yönetimi)
var supabaseUrl = builder.Configuration["Supabase:Url"] ?? "";

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        // Supabase OIDC discovery endpoint — JWKS otomatik çekilir, ES256 public key kullanılır
        options.Authority = $"{supabaseUrl}/auth/v1";
        options.MetadataAddress = $"{supabaseUrl}/auth/v1/.well-known/openid-configuration";
        options.RequireHttpsMetadata = true; // Supabase HTTPS — production'da da güvenli
        // MapInboundClaims=false: "sub" → NameIdentifier otomatik dönüşümünü devre dışı bırakır
        // Bu sayede JWT claim'leri olduğu gibi kalır ve context.User.FindFirst("sub") çalışır
        options.MapInboundClaims = false;

        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuerSigningKey = true,   // JWKS'den gelen EC key ile doğrula
            ValidateIssuer = true,
            ValidIssuer = $"{supabaseUrl}/auth/v1",
            ValidateAudience = true,
            ValidAudience = "authenticated",
            ValidateLifetime = true,
            ClockSkew = TimeSpan.FromMinutes(5),
            NameClaimType = "sub",   // context.User.Identity.Name = sub claim değeri
            RoleClaimType = "role",  // context.User.IsInRole() = role claim değeri
            // IssuerSigningKey YOK — Authority üzerinden JWKS'den otomatik alınır
        };
    });

builder.Services.AddAuthorization();

// CORS — origins from config (supports multiple production domains)
var corsOrigins = builder.Configuration.GetSection("App:CorsOrigins").Get<string[]>()
    ?? new[] { "http://localhost:5173" };

builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
    {
        policy
            .WithOrigins(corsOrigins)
            .AllowAnyHeader()
            .AllowAnyMethod()
            .AllowCredentials();
    });
});

// Swagger
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(options =>
{
    options.SwaggerDoc("v1", new Microsoft.OpenApi.Models.OpenApiInfo
    {
        Title = "CV Builder API",
        Version = "v1",
        Description = "AI destekli CV oluşturma platformu API"
    });

    // JWT auth for Swagger UI
    options.AddSecurityDefinition("Bearer", new Microsoft.OpenApi.Models.OpenApiSecurityScheme
    {
        Name = "Authorization",
        Type = Microsoft.OpenApi.Models.SecuritySchemeType.Http,
        Scheme = "bearer",
        BearerFormat = "JWT",
        In = Microsoft.OpenApi.Models.ParameterLocation.Header,
    });

    options.AddSecurityRequirement(new Microsoft.OpenApi.Models.OpenApiSecurityRequirement
    {
        {
            new Microsoft.OpenApi.Models.OpenApiSecurityScheme
            {
                Reference = new Microsoft.OpenApi.Models.OpenApiReference
                {
                    Type = Microsoft.OpenApi.Models.ReferenceType.SecurityScheme,
                    Id = "Bearer"
                }
            },
            Array.Empty<string>()
        }
    });
});

// HTTP client factory (PdfService icin)
builder.Services.AddHttpClient("PdfService", client =>
{
    var pdfUrl = builder.Configuration["PdfService:BaseUrl"] ?? "http://localhost:3001";
    client.BaseAddress = new Uri(pdfUrl);
    client.Timeout = TimeSpan.FromSeconds(30);
});

// PDF health check istemcisi — PdfEndpoints /health endpoint'inde kullanılır.
// new HttpClient() socket exhaustion'ını önler (IHttpClientFactory bağlantı havuzu yönetir).
builder.Services.AddHttpClient("pdf-health", client =>
{
    client.Timeout = TimeSpan.FromSeconds(6); // 5s + 1s tolerans
});

// Google Gemini REST API istemcisi — AIService tarafından kullanılır
// Base URL sabit; model adı ve API key her istekte URL parametresi olarak gönderilir
builder.Services.AddHttpClient("Gemini", client =>
{
    client.BaseAddress = new Uri("https://generativelanguage.googleapis.com");
    client.Timeout = TimeSpan.FromSeconds(60); // AI yanıtı uzun sürebilir
    client.DefaultRequestHeaders.Add("Accept", "application/json");
});

// IHttpContextAccessor — PaymentService'in gerçek kullanıcı IP'si alması için gerekli (Fix #7)
builder.Services.AddHttpContextAccessor();

// Application Services
builder.Services.AddScoped<ICVService, CVService>();
builder.Services.AddScoped<IAIService, AIService>();
builder.Services.AddScoped<IPaymentService, PaymentService>();
builder.Services.AddScoped<IPdfService, PdfService>();

// === App ===

var app = builder.Build();

// ── Gemini config startup diagnostics ────────────────────────────────────────
var startupLogger = app.Services.GetRequiredService<ILogger<Program>>();
var geminiKey   = app.Configuration["Gemini:ApiKey"] ?? "";
var flashModel  = app.Configuration["Gemini:FlashModel"] ?? "gemini-2.0-flash";
var liteModel   = app.Configuration["Gemini:LiteModel"] ?? "gemini-2.0-flash-lite";
var environment = app.Environment.EnvironmentName;

startupLogger.LogInformation("=== Gemini Config Diagnostics ===");
startupLogger.LogInformation("Environment      : {Env}", environment);
startupLogger.LogInformation("FlashModel       : {Model}", flashModel);
startupLogger.LogInformation("LiteModel        : {Model}", liteModel);

if (string.IsNullOrWhiteSpace(geminiKey))
{
    startupLogger.LogCritical(
        "GEMINI API KEY BULUNAMADI! " +
        "appsettings.Development.json veya docker-compose env 'Gemini__ApiKey' kontrol et. " +
        "Tüm AI endpoint'leri fallback değer döndürecek.");
}
else
{
    var keyPreview = geminiKey.Length >= 8
        ? $"{geminiKey[..8]}... ({geminiKey.Length} karakter)"
        : "(çok kısa — geçersiz olabilir)";
    startupLogger.LogInformation("Gemini:ApiKey    : {KeyPreview}", keyPreview);

    if (geminiKey.Length < 30)
        startupLogger.LogWarning(
            "Gemini:ApiKey çok kısa ({Len} karakter). Google API key'leri genellikle 39 karakterdir.",
            geminiKey.Length);
}
startupLogger.LogInformation("=================================");
// ─────────────────────────────────────────────────────────────────────────────

// Middleware
app.UseMiddleware<ErrorHandlingMiddleware>();

// HTTPS redirect — production'da platform (Railway/nginx) zaten TLS terminate eder,
// bu sadece uygulama katmanında ek güvence sağlar (isteğe bağlı olarak etkin)
if (!app.Environment.IsDevelopment())
{
    app.UseHsts();
}

// Security headers — API yanıtlarına eklenir (nginx de ekliyor, çift koruma)
app.Use(async (context, next) =>
{
    context.Response.Headers["X-Content-Type-Options"] = "nosniff";
    context.Response.Headers["X-Frame-Options"]        = "DENY";
    context.Response.Headers["Referrer-Policy"]        = "strict-origin-when-cross-origin";
    context.Response.Headers["Permissions-Policy"]     = "camera=(), microphone=(), geolocation=()";
    // Swagger UI development'ta ihtiyaç duyar, production'da zaten kapalı
    if (!app.Environment.IsDevelopment())
    {
        context.Response.Headers["Content-Security-Policy"] =
            "default-src 'none'; frame-ancestors 'none'";
    }
    await next();
});

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI(options =>
    {
        options.SwaggerEndpoint("/swagger/v1/swagger.json", "CV Builder API v1");
    });
}

app.UseCors();
app.UseAuthentication();
app.UseAuthorization();
app.UseMiddleware<AuthMiddleware>();

// Endpoints
app.MapAuthEndpoints();
app.MapCVEndpoints();
app.MapAIEndpoints();
app.MapPaymentEndpoints();
app.MapPdfEndpoints();

// Anonymous: public CV share
app.MapGet("/api/public/cv/{id:guid}", async (Guid id, ICVService cvService) =>
{
    var cv = await cvService.GetPublicCVAsync(id);
    return cv is null ? Results.NotFound() : Results.Ok(cv);
});

// Lightweight liveness probe for Railway healthcheck (no dependencies)
app.MapGet("/ping", () => Results.Ok(new { status = "ok", time = DateTime.UtcNow }))
   .AllowAnonymous();

// Health check — DB bağlantısı + Gemini key varlığı + servis versiyonu
// Always returns 200 so Railway considers the service alive; degraded status in body.
app.MapGet("/health", async (AppDbContext db, IConfiguration config) =>
{
    var checks = new Dictionary<string, object>();
    var healthy = true;

    // DB bağlantı kontrolü
    try
    {
        await db.Database.ExecuteSqlRawAsync("SELECT 1");
        checks["database"] = "ok";
    }
    catch (Exception ex)
    {
        checks["database"] = $"error: {ex.Message[..Math.Min(80, ex.Message.Length)]}";
        healthy = false;
    }

    // Gemini API key varlığı (değeri değil)
    var geminiKey = config["Gemini:ApiKey"] ?? "";
    checks["gemini"] = !string.IsNullOrWhiteSpace(geminiKey) ? "configured" : "missing";
    if (string.IsNullOrWhiteSpace(geminiKey)) healthy = false;

    // Supabase URL varlığı
    var supabaseUrl = config["Supabase:Url"] ?? "";
    checks["supabase"] = !string.IsNullOrWhiteSpace(supabaseUrl) ? "configured" : "missing";
    if (string.IsNullOrWhiteSpace(supabaseUrl)) healthy = false;

    var result = new
    {
        status    = healthy ? "healthy" : "degraded",
        timestamp = DateTime.UtcNow,
        version   = "1.0.0",
        checks
    };

    // Always 200 — Railway liveness uses /ping; /health is for observability
    return Results.Ok(result);
}).AllowAnonymous();

// DB initialization — runs in all environments (dev + production)
// ÖNEMLI: Bu proje formal EF Core migration dosyaları içermiyor.
// EnsureCreatedAsync() schema'yı oluşturur ama __EFMigrationsHistory takip etmez.
// İleride `dotnet ef migrations add InitialCreate` eklendiğinde:
//   1. EnsureCreatedAsync() çağrısını kaldır
//   2. Sadece MigrateAsync() kullan
//   3. Mevcut production DB'de __EFMigrationsHistory manuel oluşturulmalı
// ExecuteSqlRawAsync çağrıları IF NOT EXISTS kullandığından her başlatmada güvenli tekrar çalışır.
{
    using var scope = app.Services.CreateScope();
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    var logger = scope.ServiceProvider.GetRequiredService<ILogger<Program>>();

    try
    {
        // Formal migration dosyaları var mı kontrol et
        var pendingMigrations = (await db.Database.GetPendingMigrationsAsync()).ToList();
        var appliedMigrations  = (await db.Database.GetAppliedMigrationsAsync()).ToList();

        if (pendingMigrations.Count > 0)
        {
            // Formal migration'lar var ve bekliyor — MigrateAsync uygula
            logger.LogInformation(
                "Bekleyen {Count} migration bulundu — MigrateAsync() uygulanıyor: {Names}",
                pendingMigrations.Count,
                string.Join(", ", pendingMigrations));
            await db.Database.MigrateAsync();
        }
        else if (appliedMigrations.Count > 0)
        {
            // Migration'lar zaten uygulanmış — schema güncel
            logger.LogInformation(
                "Schema güncel — {Count} migration zaten uygulanmış.",
                appliedMigrations.Count);
        }
        else
        {
            // Hiç formal migration yok — EnsureCreatedAsync ile schema oluştur
            // UYARI: Bu yol migration history tutmaz; ileride migrations eklenince
            //        production'da manuel müdahale gerekir.
            if (app.Environment.IsProduction())
                logger.LogWarning(
                    "Production'da formal EF migration bulunamadı. " +
                    "EnsureCreatedAsync() kullanılıyor. " +
                    "Migration eklendiğinde bu yolu MigrateAsync() ile değiştirin.");
            else
                logger.LogInformation("Formal migration yok — EnsureCreatedAsync() kullanılıyor.");

            await db.Database.EnsureCreatedAsync();
        }

        // AI rate limit kolonlarını ekle (ALTER TABLE IF NOT EXISTS — idempotent)
        await db.Database.ExecuteSqlRawAsync("""
            ALTER TABLE "Users"
              ADD COLUMN IF NOT EXISTS "AiRequestsToday" integer NOT NULL DEFAULT 0,
              ADD COLUMN IF NOT EXISTS "AiRequestsResetAt" timestamp with time zone NOT NULL DEFAULT now();
            """);

        // Payment.IyzicoToken index (callback lookup için)
        await db.Database.ExecuteSqlRawAsync("""
            CREATE INDEX IF NOT EXISTS "IX_Payments_IyzicoToken"
              ON "Payments" ("IyzicoToken")
              WHERE "IyzicoToken" IS NOT NULL;
            """);

        // AccentColor + FontFamily columns (Phase 4)
        await db.Database.ExecuteSqlRawAsync("""
            ALTER TABLE "CVs"
              ADD COLUMN IF NOT EXISTS "AccentColor" varchar(20) NULL,
              ADD COLUMN IF NOT EXISTS "FontFamily" varchar(50) NULL;
            """);
    }
    catch (Exception ex)
    {
        logger.LogError(ex, "DB initialization failed on startup");
        // Non-fatal: app continues, but some features may not work until DB is available
    }
}

app.Run();

// Required for WebApplicationFactory in integration tests
public partial class Program { }
