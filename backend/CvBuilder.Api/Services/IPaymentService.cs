using CvBuilder.Api.DTOs;

namespace CvBuilder.Api.Services;

public interface IPaymentService
{
    Task<InitiatePaymentResponse> InitiateCheckoutAsync(
        Guid userId,
        InitiatePaymentRequest request,
        string callbackUrl);

    Task<(bool Success, string Message)> ProcessCallbackAsync(string token);

    Task<PaymentStatusResponse?> GetPaymentStatusAsync(Guid userId);
}
