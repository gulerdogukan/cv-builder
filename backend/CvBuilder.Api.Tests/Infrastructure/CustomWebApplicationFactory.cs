using CvBuilder.Api.Data;
using CvBuilder.Api.Models;
using CvBuilder.Api.Services;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.AspNetCore.TestHost;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Xunit;

namespace CvBuilder.Api.Tests.Infrastructure;

/// <summary>
/// WebApplicationFactory that:
///   1. Replaces PostgreSQL with EF Core InMemory database
///   2. Replaces Supabase JWT auth with TestAuthHandler (X-Test-UserId header)
///   3. Replaces external services (AI, PDF, Payment) with mock implementations
/// </summary>
public class CustomWebApplicationFactory : WebApplicationFactory<Program>, IAsyncLifetime
{
    // Unique DB name per factory instance so parallel test classes don't share state
    private readonly string _dbName = $"TestDb_{Guid.NewGuid()}";

    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.UseEnvironment("Test");

        // ConfigureTestServices runs AFTER the app's ConfigureServices,
        // so our overrides take precedence.
        builder.ConfigureTestServices(services =>
        {
            // ── Replace Database ──────────────────────────────────────────────
            var dbDescriptors = services
                .Where(d => d.ServiceType == typeof(DbContextOptions<AppDbContext>))
                .ToList();
            foreach (var d in dbDescriptors) services.Remove(d);

            services.AddDbContext<AppDbContext>(opts =>
                opts.UseInMemoryDatabase(_dbName));

            // ── Replace Authentication (JWT Bearer → Test handler) ────────────
            // Calling AddAuthentication again in ConfigureTestServices overrides
            // the default scheme set in Program.cs (last Configure action wins).
            services.AddAuthentication(options =>
            {
                options.DefaultAuthenticateScheme = TestAuthHandler.SchemeName;
                options.DefaultChallengeScheme    = TestAuthHandler.SchemeName;
            })
            .AddScheme<AuthenticationSchemeOptions, TestAuthHandler>(
                TestAuthHandler.SchemeName, _ => { });

            // ── Replace external services with mocks ──────────────────────────
            Replace<IAIService,      MockAIService>(services);
            Replace<IPdfService,     MockPdfService>(services);
            Replace<IPaymentService, MockPaymentService>(services);
        });
    }

    // ── IAsyncLifetime ────────────────────────────────────────────────────────

    public Task InitializeAsync() => Task.CompletedTask;

    public new async Task DisposeAsync()
    {
        await base.DisposeAsync();
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    /// <summary>Creates an HttpClient with X-Test-UserId header pre-set.</summary>
    public HttpClient CreateAuthenticatedClient(Guid userId)
    {
        var client = CreateClient(new WebApplicationFactoryClientOptions
        {
            AllowAutoRedirect = false
        });
        client.DefaultRequestHeaders.Add(TestAuthHandler.UserIdHeader, userId.ToString());
        return client;
    }

    /// <summary>
    /// Seeds a user in the in-memory database.
    /// Call this in test setup before making requests.
    /// </summary>
    public async Task<User> SeedUserAsync(
        Guid userId,
        PlanType plan = PlanType.Free,
        int aiRequestsToday = 0)
    {
        using var scope = Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();

        var user = new User
        {
            Id               = userId,
            Email            = $"test-{userId}@example.com",
            FullName         = "Test User",
            Plan             = plan,
            AiRequestsToday  = aiRequestsToday,
            AiRequestsResetAt = DateTime.UtcNow.Date,
            CreatedAt        = DateTime.UtcNow,
        };

        db.Users.Add(user);
        await db.SaveChangesAsync();
        return user;
    }

    /// <summary>Creates a CV for the given user and returns its Id.</summary>
    public async Task<Guid> SeedCVAsync(Guid userId, string title = "Test CV")
    {
        using var scope = Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();

        var cv = new CV
        {
            Id       = Guid.NewGuid(),
            UserId   = userId,
            Title    = title,
            Template = "modern",
            Language = "tr",
        };

        cv.Sections.Add(new CVSection
        {
            Id          = Guid.NewGuid(),
            CvId        = cv.Id,
            SectionType = SectionType.Personal,
            Content     = """{"fullName":"Test User","email":"test@example.com","phone":"","location":""}""",
            SortOrder   = 0,
        });

        db.CVs.Add(cv);
        await db.SaveChangesAsync();
        return cv.Id;
    }

    // ── Private helpers ───────────────────────────────────────────────────────

    private static void Replace<TService, TImplementation>(IServiceCollection services)
        where TService : class
        where TImplementation : class, TService
    {
        var existing = services.SingleOrDefault(d => d.ServiceType == typeof(TService));
        if (existing != null) services.Remove(existing);
        services.AddScoped<TService, TImplementation>();
    }
}
