using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace CvBuilder.Api.Models;

public enum SectionType
{
    Personal,
    Summary,
    Experience,
    Education,
    Skills,
    Languages,
    Certifications
}

[Table("CVData")]
public class CVSection
{
    [Key]
    public Guid Id { get; set; }

    [Required]
    public Guid CvId { get; set; }

    [Required]
    public SectionType SectionType { get; set; }

    [Column(TypeName = "jsonb")]
    public string Content { get; set; } = "{}";

    public int SortOrder { get; set; } = 0;

    // Navigation
    [ForeignKey(nameof(CvId))]
    public CV CV { get; set; } = null!;
}
