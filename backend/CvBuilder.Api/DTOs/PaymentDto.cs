namespace CvBuilder.Api.DTOs;

public record InitiatePaymentRequest(
    string PlanType,    // "one_time" | "monthly"
    string FullName,
    string Email,
    string? PhoneNumber = null
);

public record InitiatePaymentResponse(
    string Token,
    string CheckoutFormContent,  // İyzico HTML embed kodu
    string? PaymentPageUrl = null // Alternatif: tam sayfa yönlendirme
);

public record PaymentStatusResponse(
    string Plan,        // "free" | "paid"
    string? LastPaymentStatus = null,
    DateTime? PaidAt = null
);
