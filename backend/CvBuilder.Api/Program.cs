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

// Authentication — Supabase JWT
var supabaseUrl = builder.Configuration["Supabase:Url"] ?? "";
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.Authority = $"{supabaseUrl}/auth/v1";
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuerSigningKey = true,
            ValidateIssuer = true,
            ValidIssuer = $"{supabaseUrl}/auth/v1",
            ValidateAudience = true,
            ValidAudience = "authenticated",
            ValidateLifetime = true,
        };
        // Development: token doğrulama gevşet
        if (builder.Environment.IsDevelopment())
        {
            options.RequireHttpsMetadata = false;
            options.TokenValidationParameters.ValidateIssuerSigningKey = false;
            options.TokenValidationParameters.ValidateIssuer = false;
            options.TokenValidationParameters.SignatureValidator = (token, _) =>
                new JwtSecurityToken(token);
        }
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

// Health check
app.MapGet("/health", () => Results.Ok(new { status = "OK", timestamp = DateTime.UtcNow }));

// Auto-migrate in development
if (app.Environment.IsDevelopment())
{
    using var scope = app.Services.CreateScope();
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    await db.Database.MigrateAsync();
}

app.Run();
