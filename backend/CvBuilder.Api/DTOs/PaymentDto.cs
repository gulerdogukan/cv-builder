using System.ComponentModel.DataAnnotations;

namespace CvBuilder.Api.DTOs;

public record InitiatePaymentRequest(
    [Required] string PlanType,    // "one_time" | "monthly"
    [Required][MaxLength(255)] string FullName,
    [Required][EmailAddress][MaxLength(255)] string Email,
    [Phone][MaxLength(20)] string? PhoneNumber = null
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
