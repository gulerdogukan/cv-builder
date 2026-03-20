using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace CvBuilder.Api.Models;

public enum PaymentStatus
{
    Pending,
    Success,
    Failed
}

public enum PaymentPlanType
{
    OneTime,    // legacy — artık kullanılmıyor, eski kayıtlar için korunuyor
    Monthly,
    ThreeMonths,
    Lifetime
}

[Table("Payments")]
public class Payment
{
    [Key]
    public Guid Id { get; set; }

    [Required]
    public Guid UserId { get; set; }

    [MaxLength(255)]
    public string? IyzicoToken { get; set; }

    [Column(TypeName = "decimal(10,2)")]
    public decimal Amount { get; set; }

    [MaxLength(3)]
    public string Currency { get; set; } = "TRY";

    public PaymentStatus Status { get; set; } = PaymentStatus.Pending;

    public PaymentPlanType PlanType { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Navigation
    [ForeignKey(nameof(UserId))]
    public User User { get; set; } = null!;
}
