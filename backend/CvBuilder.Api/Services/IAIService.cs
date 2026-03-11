namespace CvBuilder.Api.Services;

public interface IAIService
{
    Task<string> EnhanceTextAsync(string text);
    Task<(int Score, List<string> Suggestions)> CalculateATSScoreAsync(string cvDataJson);
    Task<List<string>> SuggestSkillsAsync(string position);
}
