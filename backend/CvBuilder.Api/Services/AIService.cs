namespace CvBuilder.Api.Services;

/// <summary>
/// AI Service — Phase 4'te Anthropic SDK ile implement edilecek.
/// Şimdilik placeholder.
/// </summary>
public class AIService : IAIService
{
    public Task<string> EnhanceTextAsync(string text)
    {
        // TODO: Phase 4 — Anthropic Claude API entegrasyonu
        return Task.FromResult($"[AI Enhanced] {text}");
    }

    public Task<(int Score, List<string> Suggestions)> CalculateATSScoreAsync(string cvDataJson)
    {
        // TODO: Phase 4
        return Task.FromResult((
            75,
            new List<string>
            {
                "Deneyim açıklamalarına daha fazla aksiyon fiili ekleyin",
                "Beceri bölümünüze teknik becerileri ekleyin",
                "Özet bölümünü daha detaylı yazın"
            }
        ));
    }

    public Task<List<string>> SuggestSkillsAsync(string position)
    {
        // TODO: Phase 4
        return Task.FromResult(new List<string>
        {
            "Problem Çözme", "İletişim", "Takım Çalışması", "Analitik Düşünce"
        });
    }
}
