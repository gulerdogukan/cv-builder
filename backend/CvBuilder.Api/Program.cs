using CvBuilder.Api.Data;
using CvBuilder.Api.Endpoints;
using CvBuilder.Api.Middleware;
using CvBuilder.Api.Services;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;

var builder = WebApplication.CreateBuilder(args);

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

// Application Services
builder.Services.AddScoped<ICVService, CVService>();
builder.Services.AddScoped<IAIService, AIService>();
builder.Services.AddScoped<IPaymentService, PaymentService>();
builder.Services.AddScoped<IPdfService, PdfService>();

// === App ===

var app = builder.Build();

// Middleware
app.UseMiddleware<ErrorHandlingMiddleware>();

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

// Health check
app.MapGet("/health", () => Results.Ok(new { status = "OK", timestamp = DateTime.UtcNow }));

// DB initialization — runs in all environments (dev + production)
// EnsureCreated() is idempotent: creates tables only if they don't exist.
// ExecuteSqlRawAsync calls use IF NOT EXISTS so they are safe to re-run on every startup.
{
    using var scope = app.Services.CreateScope();
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    var logger = scope.ServiceProvider.GetRequiredService<ILogger<Program>>();

    try
    {
        // Tabloları oluştur (EF Core migration dosyası olmadan da çalışır)
        await db.Database.EnsureCreatedAsync();

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
