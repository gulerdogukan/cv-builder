namespace CvBuilder.Api.Services;

public interface IPaymentService
{
    Task<string> InitiatePaymentAsync(Guid userId, string planType);
    Task<bool> ProcessCallbackAsync(string token);
    Task<string> GetPaymentStatusAsync(Guid userId);
}
