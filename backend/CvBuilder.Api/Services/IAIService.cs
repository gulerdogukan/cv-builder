namespace CvBuilder.Api.Services;

public interface IAIService
{
    Task<string> EnhanceTextAsync(string text, string language = "tr");
    Task<(int Score, int Readability, int Keyword, int Completeness, int Impact, List<string> Suggestions)> CalculateATSScoreAsync(string cvDataJson);
    Task<List<string>> SuggestSkillsAsync(string position, string language = "tr");
    Task<List<string>> GenerateSummaryAsync(string cvDataJson, string? targetPosition = null, string? targetDescription = null, string language = "tr");
    Task<string> ParsePdfToCvDataAsync(string rawText);
    Task<string> ImportLinkedInAsync(string profileText);
    Task<string> GenerateCoverLetterAsync(string cvDataJson, string jobDescription, string language = "tr");
    Task<(int MatchScore, List<string> MatchingSkills, List<string> MissingSkills, string Advice)> MatchJobAsync(string cvDataJson, string jobDescription);
    Task<string> BulletizeDescriptionAsync(string description, string? jobTitle = null, string language = "tr");
}
