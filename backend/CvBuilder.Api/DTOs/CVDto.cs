namespace CvBuilder.Api.DTOs;

public record CVListItemDto(
    Guid Id,
    string Title,
    string Template,
    string Language,
    int AtsScore,
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
    public List<string> Suggestions { get; init; }
    public int? RemainingRequests { get; set; }
    public ATSScoreResponse(int score, List<string> suggestions) { Score = score; Suggestions = suggestions; }
}

public record SuggestSkillsRequest(string Position);
public class SuggestSkillsResponse
{
    public List<string> Skills { get; init; }
    public int? RemainingRequests { get; set; }
    public SuggestSkillsResponse(List<string> skills) { Skills = skills; }
}
