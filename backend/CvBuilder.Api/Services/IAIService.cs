namespace CvBuilder.Api.Services;

public interface IAIService
{
    Task<string> EnhanceTextAsync(string text);
    Task<(int Score, int Readability, int Keyword, int Completeness, int Impact, List<string> Suggestions)> CalculateATSScoreAsync(string cvDataJson);
    Task<List<string>> SuggestSkillsAsync(string position);
    Task<List<string>> GenerateSummaryAsync(string cvDataJson, string? targetPosition = null, string? targetDescription = null);
    Task<string> ParsePdfToCvDataAsync(string rawText);
    Task<string> ImportLinkedInAsync(string profileText);
    Task<string> GenerateCoverLetterAsync(string cvDataJson, string jobDescription);
    Task<(int MatchScore, List<string> MatchingSkills, List<string> MissingSkills, string Advice)> MatchJobAsync(string cvDataJson, string jobDescription);
    Task<string> BulletizeDescriptionAsync(string description, string? jobTitle = null);
}
