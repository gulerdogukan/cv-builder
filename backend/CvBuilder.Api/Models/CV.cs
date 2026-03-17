using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace CvBuilder.Api.Models;

[Table("CVs")]
public class CV
{
    [Key]
    [DatabaseGenerated(DatabaseGeneratedOption.None)] // Guid is set client-side via Guid.NewGuid()
    public Guid Id { get; set; }

    [Required]
    public Guid UserId { get; set; }

    [MaxLength(255)]
    public string Title { get; set; } = "Yeni CV";

    [MaxLength(50)]
    public string Template { get; set; } = "modern";

    [MaxLength(10)]
    public string Language { get; set; } = "tr";

    public bool IsPublic { get; set; } = false;

    public int AtsScore { get; set; } = 0;

    [MaxLength(20)]
    public string? AccentColor { get; set; } = null;

    [MaxLength(50)]
    public string? FontFamily { get; set; } = null;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    /// Optimistic concurrency token — concurrent update çakışmalarını yakalar
    [Timestamp]
    public byte[]? RowVersion { get; set; }

    // Navigation
    [ForeignKey(nameof(UserId))]
    public User User { get; set; } = null!;

    public ICollection<CVSection> Sections { get; set; } = new List<CVSection>();
}
