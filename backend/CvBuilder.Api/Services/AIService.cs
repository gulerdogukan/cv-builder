using System.Text.Json;
using Anthropic.SDK;
using Anthropic.SDK.Messaging;

namespace CvBuilder.Api.Services;

public class AIService : IAIService
{
    private readonly AnthropicClient _client;
    private readonly ILogger<AIService> _logger;
    private const string Model = "claude-haiku-4-5-20251001";

    public AIService(IConfiguration config, ILogger<AIService> logger)
    {
        _logger = logger;
        var apiKey = config["Anthropic:ApiKey"] ?? "";
        _client = new AnthropicClient(apiKey);
    }

    public async Task<string> EnhanceTextAsync(string text)
    {
        if (string.IsNullOrWhiteSpace(text)) return text;

        try
        {
            var prompt = $"""
                Sen profesyonel bir CV yazarısın. Aşağıdaki metni ATS (Applicant Tracking System) uyumlu,
                güçlü aksiyon fiilleri kullanan, etkileyici ve özlü bir hale getir.

                Kurallar:
                - Türkçe yaz
                - Maksimum {Math.Min(text.Length + 200, 800)} karakter
                - Güçlü aksiyon fiilleriyle başla (Geliştirdim, Yönettim, Tasarladım, vb.)
                - Somut başarılar ve sayılar ekle (mümkünse)
                - Sadece geliştirilmiş metni döndür, açıklama yapma

                Metin:
                {text}
                """;

            var response = await _client.Messages.GetClaudeMessageAsync(new MessageParameters
            {
                Model = Model,
                MaxTokens = 500,
                Messages = new List<Message>
                {
                    new Message { Role = RoleType.User, Content = prompt }
                }
            });

            return response.Content.FirstOrDefault()?.ToString()?.Trim() ?? text;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "EnhanceText API hatası");
            return text;
        }
    }

    public async Task<(int Score, List<string> Suggestions)> CalculateATSScoreAsync(string cvDataJson)
    {
        if (string.IsNullOrWhiteSpace(cvDataJson))
            return (0, new List<string> { "CV verisi bulunamadı" });

        try
        {
            var prompt = $"""
                Sen bir ATS (Applicant Tracking System) uzmanısın. Aşağıdaki CV verisini analiz et
                ve 0-100 arası bir ATS uyumluluk skoru ver.

                Değerlendirme kriterleri:
                - Kişisel bilgiler eksiksizliği (email, telefon, konum) — 20 puan
                - Özet bölümü kalitesi ve anahtar kelimeler — 20 puan
                - Deneyim açıklamalarında aksiyon fiilleri ve metrikler — 25 puan
                - Beceri bölümü dolgunluğu (en az 5 beceri) — 15 puan
                - Eğitim bilgileri — 10 puan
                - Genel format ve dil tutarlılığı — 10 puan

                CV Verisi (JSON):
                {cvDataJson}

                SADECE şu JSON formatında cevap ver, başka hiçbir şey yazma:
                {{"score": <0-100 arası sayı>, "suggestions": ["öneri 1", "öneri 2", "öneri 3", "öneri 4"]}}
                """;

            var response = await _client.Messages.GetClaudeMessageAsync(new MessageParameters
            {
                Model = Model,
                MaxTokens = 400,
                Messages = new List<Message>
                {
                    new Message { Role = RoleType.User, Content = prompt }
                }
            });

            var raw = response.Content.FirstOrDefault()?.ToString()?.Trim() ?? "";

            // JSON ayrıştır
            var start = raw.IndexOf('{');
            var end = raw.LastIndexOf('}');
            if (start >= 0 && end > start)
            {
                raw = raw[start..(end + 1)];
                var parsed = JsonSerializer.Deserialize<AtsResult>(raw, new JsonSerializerOptions
                {
                    PropertyNameCaseInsensitive = true
                });
                if (parsed != null)
                    return (Math.Clamp(parsed.Score, 0, 100), parsed.Suggestions ?? new List<string>());
            }

            // Ayrıştırma başarısızsa fallback
            return FallbackAtsScore(cvDataJson);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "CalculateATSScore API hatası");
            return FallbackAtsScore(cvDataJson);
        }
    }

    public async Task<List<string>> SuggestSkillsAsync(string position)
    {
        if (string.IsNullOrWhiteSpace(position))
            return new List<string> { "Problem Çözme", "İletişim", "Takım Çalışması" };

        try
        {
            var prompt = $"""
                '{position}' pozisyonu için en önemli 8-10 teknik ve soft beceriyi listele.

                Kurallar:
                - Türkçe yaz
                - Her beceri 1-3 kelime olsun
                - Virgülle ayır, başka hiçbir şey yazma
                - ATS sistemlerinde aranabilecek anahtar kelimeler kullan

                Örnek format: Beceri 1, Beceri 2, Beceri 3
                """;

            var response = await _client.Messages.GetClaudeMessageAsync(new MessageParameters
            {
                Model = Model,
                MaxTokens = 200,
                Messages = new List<Message>
                {
                    new Message { Role = RoleType.User, Content = prompt }
                }
            });

            var raw = response.Content.FirstOrDefault()?.ToString()?.Trim() ?? "";
            var skills = raw.Split(',')
                .Select(s => s.Trim())
                .Where(s => !string.IsNullOrWhiteSpace(s) && s.Length < 50)
                .Take(10)
                .ToList();

            return skills.Count > 0 ? skills : DefaultSkills();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "SuggestSkills API hatası");
            return DefaultSkills();
        }
    }

    // ---- Fallback / Helpers ----

    private static (int Score, List<string> Suggestions) FallbackAtsScore(string cvDataJson)
    {
        int score = 20;
        var suggestions = new List<string>();

        try
        {
            var doc = JsonDocument.Parse(cvDataJson);
            var root = doc.RootElement;

            // Personal
            if (root.TryGetProperty("personal", out var personal))
            {
                if (HasValue(personal, "email")) score += 5;
                if (HasValue(personal, "phone")) score += 5;
                if (HasValue(personal, "location")) score += 5;
                else suggestions.Add("Konum bilgisi ekleyin");
            }

            // Summary
            if (root.TryGetProperty("summary", out var summary) && summary.GetString()?.Length > 50)
                score += 15;
            else
                suggestions.Add("Güçlü bir özet bölümü ekleyin (en az 50 karakter)");

            // Experience
            if (root.TryGetProperty("experience", out var exp) && exp.GetArrayLength() > 0)
            {
                score += 15;
                var hasDescriptions = exp.EnumerateArray()
                    .Any(e => HasValue(e, "description") && (e.GetProperty("description").GetString()?.Length ?? 0) > 30);
                if (hasDescriptions) score += 10;
                else suggestions.Add("Deneyim açıklamalarına aksiyon fiilleri ve metrikler ekleyin");
            }
            else
                suggestions.Add("En az bir deneyim girişi ekleyin");

            // Skills
            if (root.TryGetProperty("skills", out var skills))
            {
                var count = skills.GetArrayLength();
                if (count >= 5) score += 15;
                else if (count > 0) score += 7;
                else suggestions.Add("En az 5 beceri ekleyin");
            }

            // Education
            if (root.TryGetProperty("education", out var edu) && edu.GetArrayLength() > 0)
                score += 10;
            else
                suggestions.Add("Eğitim bilgilerini ekleyin");
        }
        catch { /* JSON parse hatası — temel skoru döndür */ }

        if (suggestions.Count == 0)
            suggestions.Add("CV'nizi daha da güçlendirmek için özet bölümünü genişletin");

        return (Math.Clamp(score, 0, 100), suggestions);
    }

    private static bool HasValue(JsonElement el, string prop) =>
        el.TryGetProperty(prop, out var val) &&
        val.ValueKind == JsonValueKind.String &&
        !string.IsNullOrWhiteSpace(val.GetString());

    private static List<string> DefaultSkills() => new()
    {
        "Problem Çözme", "İletişim", "Takım Çalışması", "Analitik Düşünce",
        "Zaman Yönetimi", "Proje Yönetimi"
    };

    private class AtsResult
    {
        public int Score { get; set; }
        public List<string>? Suggestions { get; set; }
    }
}
