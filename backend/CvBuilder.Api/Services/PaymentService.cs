namespace CvBuilder.Api.Services;

/// <summary>
/// Payment Service — Phase 6'da İyzico ile implement edilecek.
/// Şimdilik placeholder.
/// </summary>
public class PaymentService : IPaymentService
{
    public Task<string> InitiatePaymentAsync(Guid userId, string planType)
    {
        // TODO: Phase 6 — İyzico entegrasyonu
        return Task.FromResult("payment-token-placeholder");
    }

    public Task<bool> ProcessCallbackAsync(string token)
    {
        // TODO: Phase 6
        return Task.FromResult(true);
    }

    public Task<string> GetPaymentStatusAsync(Guid userId)
    {
        // TODO: Phase 6
        return Task.FromResult("free");
    }
}
