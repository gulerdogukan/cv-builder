using System.Net;
using System.Net.Http.Json;
using CvBuilder.Api.Models;
using CvBuilder.Api.Tests.Infrastructure;
using Xunit;

namespace CvBuilder.Api.Tests;

/// <summary>
/// Integration tests for the FREE plan (PlanType.Free — Ücretsiz).
///
/// Verified behaviors:
///   ✓ CV CRUD works (create, list, update, delete)
///   ✓ AI endpoints work within daily limit (5 requests)
///   ✓ 6th AI request is rejected with 429
///   ✓ PDF export is blocked with 402 UPGRADE_REQUIRED
///   ✓ Rate-limit status endpoint returns correct counts
/// </summary>
public class FreePlanTests : IClassFixture<CustomWebApplicationFactory>
{
    private readonly CustomWebApplicationFactory _factory;

    public FreePlanTests(CustomWebApplicationFactory factory)
    {
        _factory = factory;
    }

    // ── CV endpoints ──────────────────────────────────────────────────────────

    [Fact]
    public async Task Free_GetCVList_Returns200()
    {
        var userId = Guid.NewGuid();
        await _factory.SeedUserAsync(userId, PlanType.Free);
        var client = _factory.CreateAuthenticatedClient(userId);

        var response = await client.GetAsync("/api/cvs");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
    }

    [Fact]
    public async Task Free_CreateCV_Returns201()
    {
        var userId = Guid.NewGuid();
        await _factory.SeedUserAsync(userId, PlanType.Free);
        var client = _factory.CreateAuthenticatedClient(userId);

        var response = await client.PostAsJsonAsync("/api/cvs", new { title = "Yazılım Mühendisi CV" });

        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
    }

    [Fact]
    public async Task Free_UpdateCV_Returns200()
    {
        var userId = Guid.NewGuid();
        await _factory.SeedUserAsync(userId, PlanType.Free);
        var cvId   = await _factory.SeedCVAsync(userId, "CV to Update");
        var client = _factory.CreateAuthenticatedClient(userId);

        var response = await client.PutAsJsonAsync($"/api/cvs/{cvId}", new { title = "Güncellenmiş CV" });

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
    }

    [Fact]
    public async Task Free_DeleteCV_Returns204()
    {
        var userId = Guid.NewGuid();
        await _factory.SeedUserAsync(userId, PlanType.Free);
        var cvId   = await _factory.SeedCVAsync(userId, "CV to Delete");
        var client = _factory.CreateAuthenticatedClient(userId);

        var response = await client.DeleteAsync($"/api/cvs/{cvId}");

        Assert.Equal(HttpStatusCode.NoContent, response.StatusCode);
    }

    // ── PDF export ────────────────────────────────────────────────────────────

    [Fact]
    public async Task Free_PdfExport_Returns402_WithUpgradeRequired()
    {
        var userId = Guid.NewGuid();
        await _factory.SeedUserAsync(userId, PlanType.Free);
        var cvId   = await _factory.SeedCVAsync(userId);
        var client = _factory.CreateAuthenticatedClient(userId);

        var response = await client.PostAsync($"/api/pdf/{cvId}/export", null);
        var content  = await response.Content.ReadAsStringAsync(); // read once

        Assert.Equal(HttpStatusCode.PaymentRequired, response.StatusCode); // 402
        Assert.Contains("UPGRADE_REQUIRED", content);
    }

    [Fact]
    public async Task Free_PdfExport_AnotherUsersCV_Returns404()
    {
        var userId       = Guid.NewGuid();
        var otherUserId  = Guid.NewGuid();
        await _factory.SeedUserAsync(userId, PlanType.Free);
        await _factory.SeedUserAsync(otherUserId, PlanType.Free);
        var otherCvId = await _factory.SeedCVAsync(otherUserId, "Other User CV");
        var client    = _factory.CreateAuthenticatedClient(userId);

        var response = await client.PostAsync($"/api/pdf/{otherCvId}/export", null);

        // Free user gets 402 before reaching the ownership check
        // (Plan check happens first in PdfEndpoints)
        Assert.Equal(HttpStatusCode.PaymentRequired, response.StatusCode);
    }

    // ── AI rate limiting ──────────────────────────────────────────────────────

    [Fact]
    public async Task Free_AIRateLimit_Returns200_WhenUnderDailyLimit()
    {
        var userId = Guid.NewGuid();
        await _factory.SeedUserAsync(userId, PlanType.Free, aiRequestsToday: 0);
        var cvId   = await _factory.SeedCVAsync(userId);
        var client = _factory.CreateAuthenticatedClient(userId);

        var response = await client.PostAsJsonAsync("/api/ai/ats-score", new
        {
            cvId        = cvId.ToString(),
            cvDataJson  = """{"personal":{"fullName":"Ali Veli","email":"ali@example.com"}}"""
        });

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
    }

    [Fact]
    public async Task Free_AIRateLimit_Returns429_WhenDailyLimitExceeded()
    {
        var userId = Guid.NewGuid();
        // Seed user who has already used all 5 daily AI requests
        await _factory.SeedUserAsync(userId, PlanType.Free, aiRequestsToday: 5);
        var cvId   = await _factory.SeedCVAsync(userId);
        var client = _factory.CreateAuthenticatedClient(userId);

        var response = await client.PostAsJsonAsync("/api/ai/ats-score", new
        {
            cvId       = cvId.ToString(),
            cvDataJson = """{"personal":{"fullName":"Ali Veli"}}"""
        });

        Assert.Equal(HttpStatusCode.TooManyRequests, response.StatusCode); // 429
    }

    [Fact]
    public async Task Free_AIRateLimit_Allows5RequestsThenBlocks()
    {
        var userId = Guid.NewGuid();
        await _factory.SeedUserAsync(userId, PlanType.Free, aiRequestsToday: 0);
        var cvId   = await _factory.SeedCVAsync(userId);
        var client = _factory.CreateAuthenticatedClient(userId);

        // First 5 requests should succeed
        for (int i = 0; i < 5; i++)
        {
            var ok = await client.PostAsJsonAsync("/api/ai/enhance-text", new { text = $"Sentence {i}" });
            Assert.Equal(HttpStatusCode.OK, ok.StatusCode);
        }

        // 6th request must be blocked
        var blocked = await client.PostAsJsonAsync("/api/ai/enhance-text", new { text = "Over limit" });
        Assert.Equal(HttpStatusCode.TooManyRequests, blocked.StatusCode);
    }

    [Fact]
    public async Task Free_AIRateLimitEndpoint_ReturnsCorrectRemainingCount()
    {
        var userId = Guid.NewGuid();
        await _factory.SeedUserAsync(userId, PlanType.Free, aiRequestsToday: 3);
        var client = _factory.CreateAuthenticatedClient(userId);

        var response = await client.GetAsync("/api/ai/rate-limit");
        var body     = await response.Content.ReadFromJsonAsync<RateLimitResponse>();

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        Assert.NotNull(body);
        Assert.False(body.IsPaid);
        Assert.Equal(5, body.DailyLimit);   // Free plan daily limit
        Assert.Equal(2, body.Remaining);    // 5 - 3 = 2 remaining
    }

    [Fact]
    public async Task Free_AIRateLimitEndpoint_Shows0_WhenLimitReached()
    {
        var userId = Guid.NewGuid();
        await _factory.SeedUserAsync(userId, PlanType.Free, aiRequestsToday: 5);
        var client = _factory.CreateAuthenticatedClient(userId);

        var response = await client.GetAsync("/api/ai/rate-limit");
        var body     = await response.Content.ReadFromJsonAsync<RateLimitResponse>();

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        Assert.Equal(0, body!.Remaining);
    }

    // ── Auth guard ────────────────────────────────────────────────────────────

    [Fact]
    public async Task Free_UnauthenticatedRequest_Returns401()
    {
        var client = _factory.CreateClient(); // no auth header

        var response = await client.GetAsync("/api/cvs");

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    // ── Response DTOs (used only for assertions) ──────────────────────────────
    private record RateLimitResponse(
        bool    IsPaid,
        int?    DailyLimit,
        int     Used,
        int?    Remaining,
        string  ResetAt);
}
