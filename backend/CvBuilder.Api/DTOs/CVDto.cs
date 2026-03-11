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
public record EnhanceTextResponse(string EnhancedText);

public record ATSScoreRequest(string CvId);
public record ATSScoreResponse(int Score, List<string> Suggestions);

public record SuggestSkillsRequest(string Position);
public record SuggestSkillsResponse(List<string> Skills);
