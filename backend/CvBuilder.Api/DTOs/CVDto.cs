namespace CvBuilder.Api.DTOs;

public record CVListItemDto(
    Guid Id,
    string Title,
    string Template,
    string Language,
    int AtsScore,
    string? AccentColor,
    string? FontFamily,
    DateTime CreatedAt,
    DateTime UpdatedAt
);

public record CVDetailDto(
    Guid Id,
    Guid UserId,
    string Title,
    string Template,
    string Language,
    bool IsPublic,
    int AtsScore,
    string? AccentColor,
    string? FontFamily,
    Dictionary<string, object> Data,
    DateTime CreatedAt,
    DateTime UpdatedAt
);

public record CreateCVRequest(string Title);

public record UpdateCVRequest(
    string? Title,
    string? Template,
    string? Language,
    bool? IsPublic,
    string? AccentColor,
    string? FontFamily,
    Dictionary<string, object>? Data
);

public record EnhanceTextRequest(string Text);
public class EnhanceTextResponse
{
    public string EnhancedText { get; init; }
    public int? RemainingRequests { get; set; }
    public EnhanceTextResponse(string enhancedText) { EnhancedText = enhancedText; }
}

public record ATSScoreRequest(string? CvId, string? CvDataJson = null);
public class ATSScoreResponse
{
    public int Score { get; init; }
    public int ReadabilityScore { get; init; }
    public int KeywordDensityScore { get; init; }
    public int CompletenessScore { get; init; }
    public int ImpactScore { get; init; }
    public List<string> Suggestions { get; init; }
    public int? RemainingRequests { get; set; }
    
    public ATSScoreResponse(int score, int readability, int keyword, int completeness, int impact, List<string> suggestions) 
    { 
        Score = score; 
        ReadabilityScore = readability;
        KeywordDensityScore = keyword;
        CompletenessScore = completeness;
        ImpactScore = impact;
        Suggestions = suggestions; 
    }
}

public record SuggestSkillsRequest(string Position);
public class SuggestSkillsResponse
{
    public List<string> Skills { get; set; } = new();
    public int? RemainingRequests { get; set; }
    public SuggestSkillsResponse(List<string> skills) => Skills = skills;
}

public record GenerateSummaryRequest(string CvDataJson, string? TargetPosition = null, string? TargetDescription = null);
public class GenerateSummaryResponse
{
    public List<string> Drafts { get; set; } = new();
    public int? RemainingRequests { get; set; }
    public GenerateSummaryResponse(List<string> drafts) => Drafts = drafts;
}

public record LinkedInImportRequest(string ProfileText);
public class LinkedInImportResponse
{
    public string CvDataJson { get; set; } = string.Empty;
    public int? RemainingRequests { get; set; }
}

public record CoverLetterRequest(string CvDataJson, string JobDescription);
public class CoverLetterResponse
{
    public string CoverLetter { get; init; }
    public int? RemainingRequests { get; set; }
    public CoverLetterResponse(string coverLetter) => CoverLetter = coverLetter;
}

public record JobMatchRequest(string CvDataJson, string JobDescription);
public class JobMatchResponse
{
    public int MatchScore { get; init; }
    public List<string> MatchingSkills { get; init; } = new();
    public List<string> MissingSkills { get; init; } = new();
    public string Advice { get; init; } = string.Empty;
    public int? RemainingRequests { get; set; }
}

public record BulletizeRequest(string Description, string? JobTitle = null);
public class BulletizeResponse
{
    public string Bullets { get; set; } = string.Empty;
    public int? RemainingRequests { get; set; }
}
