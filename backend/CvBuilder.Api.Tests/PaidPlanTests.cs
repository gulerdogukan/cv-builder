using System.Net;
using System.Net.Http.Json;
using CvBuilder.Api.Data;
using CvBuilder.Api.Models;
using CvBuilder.Api.Tests.Infrastructure;
using Microsoft.Extensions.DependencyInjection;
using Xunit;

namespace CvBuilder.Api.Tests;

/// <summary>
/// Integration tests for PAID plans.
///
/// Both "Aylık Üyelik" (monthly, 49₺/ay) and "Sınırsız Üyelik" (one_time, 99₺)
/// share the same backend plan type: PlanType.Paid.
/// These tests validate common paid-tier behavior and plan-specific scenarios.
///
/// Verified behaviors:
///   ✓ CV CRUD works (same as free)
///   ✓ PDF export is allowed — returns file bytes
///   ✓ AI requests have no daily rate limit
///   ✓ Rate-limit endpoint shows isPaid=true with no daily cap
///   ✓ Payment status endpoint returns plan=paid
/// </summary>
public class PaidPlanTests : IClassFixture<CustomWebApplicationFactory>
{
    private readonly CustomWebApplicationFactory _factory;

    public PaidPlanTests(CustomWebApplicationFactory factory)
    {
        _factory = factory;
    }

    // ── CV endpoints ──────────────────────────────────────────────────────────

    [Fact]
    public async Task Paid_GetCVList_Returns200()
    {
        var userId = Guid.NewGuid();
        await _factory.SeedUserAsync(userId, PlanType.Paid);
        var client = _factory.CreateAuthenticatedClient(userId);

        var response = await client.GetAsync("/api/cvs");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
    }

    [Fact]
    public async Task Paid_CreateCV_Returns201()
    {
        var userId = Guid.NewGuid();
        await _factory.SeedUserAsync(userId, PlanType.Paid);
        var client = _factory.CreateAuthenticatedClient(userId);

        var response = await client.PostAsJsonAsync("/api/cvs", new { title = "Kıdemli Yazılım Mühendisi CV" });

        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
    }

    [Fact]
    public async Task Paid_DuplicateCV_Returns201()
    {
        var userId = Guid.NewGuid();
        await _factory.SeedUserAsync(userId, PlanType.Paid);
        var cvId   = await _factory.SeedCVAsync(userId, "Orijinal CV");
        var client = _factory.CreateAuthenticatedClient(userId);

        var response = await client.PostAsync($"/api/cvs/{cvId}/duplicate", null);

        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
    }

    // ── PDF export ────────────────────────────────────────────────────────────

    [Fact]
    public async Task Paid_PdfExport_Returns200_WithPdfContent()
    {
        var userId = Guid.NewGuid();
        await _factory.SeedUserAsync(userId, PlanType.Paid);
        var cvId   = await _factory.SeedCVAsync(userId, "Mühendis CV");
        var client = _factory.CreateAuthenticatedClient(userId);

        var response = await client.PostAsync($"/api/pdf/{cvId}/export", null);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        Assert.Equal("application/pdf", response.Content.Headers.ContentType?.MediaType);

        // Verify response contains valid PDF magic bytes (%PDF)
        var bytes = await response.Content.ReadAsByteArrayAsync();
        Assert.True(bytes.Length > 0);
        Assert.Equal(0x25, bytes[0]); // %
        Assert.Equal(0x50, bytes[1]); // P
        Assert.Equal(0x44, bytes[2]); // D
        Assert.Equal(0x46, bytes[3]); // F
    }

    [Fact]
    public async Task Paid_PdfExport_NonExistentCV_Returns404()
    {
        var userId     = Guid.NewGuid();
        await _factory.SeedUserAsync(userId, PlanType.Paid);
        var randomCvId = Guid.NewGuid(); // not in DB
        var client     = _factory.CreateAuthenticatedClient(userId);

        var response = await client.PostAsync($"/api/pdf/{randomCvId}/export", null);

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    [Fact]
    public async Task Paid_PdfExport_OtherUsersCV_Returns404()
    {
        var userId      = Guid.NewGuid();
        var otherUserId = Guid.NewGuid();
        await _factory.SeedUserAsync(userId, PlanType.Paid);
        await _factory.SeedUserAsync(otherUserId, PlanType.Paid);
        var otherCvId   = await _factory.SeedCVAsync(otherUserId, "Başka Kullanıcının CV'si");
        var client      = _factory.CreateAuthenticatedClient(userId);

        // Paid user can export PDF, but not someone else's CV
        var response = await client.PostAsync($"/api/pdf/{otherCvId}/export", null);

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    // ── AI — no rate limiting ─────────────────────────────────────────────────

    [Fact]
    public async Task Paid_AIRequest_Returns200_Regardless_OfPreviousUsage()
    {
        var userId = Guid.NewGuid();
        // Simulate a user who has already made 100 AI requests (well above free limit)
        await _factory.SeedUserAsync(userId, PlanType.Paid, aiRequestsToday: 100);
        var client = _factory.CreateAuthenticatedClient(userId);

        var response = await client.PostAsJsonAsync("/api/ai/enhance-text", new
        {
            text = "Müşteri memnuniyetini artırdım"
        });

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
    }

    [Fact]
    public async Task Paid_AIRequests_NeverReturn429()
    {
        var userId = Guid.NewGuid();
        await _factory.SeedUserAsync(userId, PlanType.Paid, aiRequestsToday: 0);
        var client = _factory.CreateAuthenticatedClient(userId);

        // Make 10 consecutive AI requests — all should succeed for paid users
        for (int i = 0; i < 10; i++)
        {
            var response = await client.PostAsJsonAsync("/api/ai/enhance-text", new
            {
                text = $"Deneyim maddesi {i + 1}"
            });
            Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        }
    }

    [Fact]
    public async Task Paid_ATSScore_Returns200()
    {
        var userId = Guid.NewGuid();
        await _factory.SeedUserAsync(userId, PlanType.Paid);
        var cvId   = await _factory.SeedCVAsync(userId);
        var client = _factory.CreateAuthenticatedClient(userId);

        var response = await client.PostAsJsonAsync("/api/ai/ats-score", new
        {
            cvId       = cvId.ToString(),
            cvDataJson = """
            {
              "personal": {"fullName":"Ayşe Kaya","email":"ayse@example.com","phone":"+90 555 000 0000","location":"İstanbul"},
              "summary":  "5 yıl deneyimli backend geliştirici",
              "experience":[],
              "skills":   ["C#","Docker","Kubernetes"]
            }
            """
        });

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
    }

    // ── AI rate-limit endpoint ────────────────────────────────────────────────

    [Fact]
    public async Task Paid_RateLimitEndpoint_Shows_IsPaid_True_And_NoLimit()
    {
        var userId = Guid.NewGuid();
        await _factory.SeedUserAsync(userId, PlanType.Paid);
        var client = _factory.CreateAuthenticatedClient(userId);

        var response = await client.GetAsync("/api/ai/rate-limit");
        var body     = await response.Content.ReadFromJsonAsync<RateLimitResponse>();

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        Assert.NotNull(body);
        Assert.True(body.IsPaid);
        Assert.Null(body.DailyLimit);    // No cap for paid users
        Assert.Null(body.Remaining);     // No remaining count for paid users
    }

    // ── Payment status endpoint ───────────────────────────────────────────────

    [Fact]
    public async Task Paid_PaymentStatusEndpoint_Returns_PlanPaid()
    {
        var userId = Guid.NewGuid();
        await _factory.SeedUserAsync(userId, PlanType.Paid);
        var client = _factory.CreateAuthenticatedClient(userId);

        var response = await client.GetAsync("/api/payment/status");
        var body     = await response.Content.ReadFromJsonAsync<PaymentStatusResponse>();

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        Assert.NotNull(body);
        Assert.Equal("paid", body.Plan);
    }

    // ── Plan comparison (Paid vs Free on same endpoint) ───────────────────────

    [Fact]
    public async Task PaidVsFree_SameCVRoute_PdfExport_BehaviorDiffers()
    {
        var freeUserId = Guid.NewGuid();
        var paidUserId = Guid.NewGuid();
        await _factory.SeedUserAsync(freeUserId, PlanType.Free);
        await _factory.SeedUserAsync(paidUserId, PlanType.Paid);

        // Each user has their own CV
        var freeCvId = await _factory.SeedCVAsync(freeUserId, "Ücretsiz Kullanıcı CV");
        var paidCvId = await _factory.SeedCVAsync(paidUserId, "Ücretli Kullanıcı CV");

        var freeClient = _factory.CreateAuthenticatedClient(freeUserId);
        var paidClient = _factory.CreateAuthenticatedClient(paidUserId);

        var freeResponse = await freeClient.PostAsync($"/api/pdf/{freeCvId}/export", null);
        var paidResponse = await paidClient.PostAsync($"/api/pdf/{paidCvId}/export", null);

        Assert.Equal(HttpStatusCode.PaymentRequired, freeResponse.StatusCode); // 402
        Assert.Equal(HttpStatusCode.OK,              paidResponse.StatusCode); // 200
    }

    // ── Response DTOs ─────────────────────────────────────────────────────────
    private record RateLimitResponse(
        bool    IsPaid,
        int?    DailyLimit,
        int     Used,
        int?    Remaining,
        string  ResetAt);

    private record PaymentStatusResponse(
        string   Plan,
        string?  LastPaymentStatus,
        DateTime? PaidAt);
}
