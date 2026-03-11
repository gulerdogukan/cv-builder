using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace CvBuilder.Api.Models;

public enum PlanType
{
    Free,
    Paid
}

[Table("Users")]
public class User
{
    [Key]
    public Guid Id { get; set; }

    [Required]
    [MaxLength(255)]
    public string Email { get; set; } = string.Empty;

    [MaxLength(255)]
    public string FullName { get; set; } = string.Empty;

    public PlanType Plan { get; set; } = PlanType.Free;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Navigation
    public ICollection<CV> CVs { get; set; } = new List<CV>();
    public ICollection<Payment> Payments { get; set; } = new List<Payment>();
}
