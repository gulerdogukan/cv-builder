using CvBuilder.Api.Data;
using CvBuilder.Api.DTOs;
using CvBuilder.Api.Models;
using CvBuilder.Api.Services;
using Microsoft.EntityFrameworkCore;

namespace CvBuilder.Api.Tests.Infrastructure;

/// <summary>
/// Mock AI service — returns deterministic results without calling Anthropic API.
/// </summary>
public class MockAIService : IAIService
{
    public Task<string> EnhanceTextAsync(string text)
        => Task.FromResult($"[ENHANCED] {text}");

    public Task<(int Score, int Readability, int Keyword, int Completeness, int Impact, List<string> Suggestions)> CalculateATSScoreAsync(string cvDataJson)
        => Task.FromResult((78, 80, 75, 90, 70, new List<string> { "Add measurable achievements", "Include relevant keywords" }));

    public Task<List<string>> SuggestSkillsAsync(string position)
        => Task.FromResult(new List<string> { "C#", "SQL", "Docker" });

    public Task<List<string>> GenerateSummaryAsync(string cvDataJson, string? targetPosition = null, string? targetDescription = null)
        => Task.FromResult(new List<string> { "Summary 1", "Summary 2", "Summary 3" });

    public Task<string> ParsePdfToCvDataAsync(string rawText)
        => Task.FromResult("{}");

    public Task<string> ImportLinkedInAsync(string profileText)
        => Task.FromResult("{}");

    public Task<string> GenerateCoverLetterAsync(string cvDataJson, string jobDescription)
        => Task.FromResult("Mock Cover Letter content.");

    public Task<(int MatchScore, List<string> MatchingSkills, List<string> MissingSkills, string Advice)> MatchJobAsync(string cvDataJson, string jobDescription)
        => Task.FromResult((85, new List<string> { "C#", "SQL" }, new List<string> { "Docker" }, "Mock advice."));

    public Task<string> BulletizeDescriptionAsync(string description, string? jobTitle = null)
        => Task.FromResult("• Item 1\n• Item 2");
}

/// <summary>
/// Mock PDF service — returns fake PDF bytes without calling the pdf-service microservice.
/// </summary>
public class MockPdfService : IPdfService
{
    // Real PDF magic bytes header: %PDF-1.4
    public Task<byte[]> GeneratePdfAsync(string template, string cvDataJson)
        => Task.FromResult(new byte[] { 0x25, 0x50, 0x44, 0x46, 0x2D, 0x31, 0x2E, 0x34 });
}

/// <summary>
/// Mock Payment service — prevents HTTP calls to Iyzico.
/// - InitiateCheckoutAsync: returns a deterministic mock checkout form (no Iyzico call)
/// - ProcessCallbackAsync: always succeeds (no Iyzico verification)
/// - GetPaymentStatusAsync: reads from the in-memory test DB (real behavior preserved)
/// </summary>
public class MockPaymentService : IPaymentService
{
    private readonly AppDbContext _db;

    public MockPaymentService(AppDbContext db)
    {
        _db = db;
    }

    public Task<InitiatePaymentResponse> InitiateCheckoutAsync(
        Guid userId, InitiatePaymentRequest request, string callbackUrl)
        => Task.FromResult(new InitiatePaymentResponse(
            Token: $"mock-token-{Guid.NewGuid()}",
            CheckoutFormContent: "<div id=\"iyzipay-checkout-form\">Mock checkout form</div>"));

    public Task<(bool Success, string Message)> ProcessCallbackAsync(string iyzicoToken)
        => Task.FromResult((true, "Mock payment processed successfully"));

    // Reads the user's plan directly from the test database.
    // This matches the real implementation so plan-status tests work correctly.
    public async Task<PaymentStatusResponse?> GetPaymentStatusAsync(Guid userId)
    {
        var user = await _db.Users.FindAsync(userId);
        if (user == null) return null;

        return new PaymentStatusResponse(
            Plan:              user.Plan == PlanType.Paid ? "paid" : "free",
            LastPaymentStatus: null,
            PaidAt:            null);
    }
}
