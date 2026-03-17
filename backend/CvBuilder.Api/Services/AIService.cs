using System.Text.Json;
using Anthropic.SDK;
using Anthropic.SDK.Messaging;
using System.Linq;

namespace CvBuilder.Api.Services;

public class AIService : IAIService
{
    private readonly AnthropicClient _client;
    private readonly ILogger<AIService> _logger;
    private readonly IConfiguration _config;
    private const string Model = "claude-haiku-4-5-20251001";

    public AIService(IConfiguration config, ILogger<AIService> logger)
    {
        _logger = logger;
        _config = config;
        var apiKey = config["Anthropic:ApiKey"] ?? "";
        _client = new AnthropicClient(apiKey);
    }

    private int MaxSkills => int.TryParse(_config["AI:MaxSkillSuggestions"], out var n) ? n : 10;

    public async Task<string> EnhanceTextAsync(string text)
    {
        if (string.IsNullOrWhiteSpace(text)) return text;

        try
        {
            var maxLen = Math.Min(text.Length + 200, 800);
            var prompt = $"""
                Sen profesyonel bir CV yazarısın. Aşağıdaki metni ATS (Applicant Tracking System) uyumlu,
                güçlü aksiyon fiilleri kullanan, etkileyici ve özlü bir hale getir.

                Kurallar:
                - Türkçe yaz
                - Maksimum {maxLen} karakter
                - Güçlü aksiyon fiilleriyle başla (Geliştirdim, Yönettim, Tasarladım, vb.)
                - Somut başarılar ve sayılar ekle (mümkünse)
                - Sadece geliştirilmiş metni döndür, açıklama yapma

                Metin:
                {text}
                """;

            var response = await _client.Messages.GetClaudeMessageAsync(new MessageParameters
            {
                Model     = Model,
                MaxTokens = 500,
                Messages  = new List<Message> { new() { Role = RoleType.User, Content = new List<ContentBase> { new TextContent { Text = prompt } } } }
            });

            var result = response?.Content?.FirstOrDefault()?.ToString()?.Trim();
            return string.IsNullOrEmpty(result) ? text : result;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "EnhanceText API hatası");
            return text;
        }
    }

    public async Task<(int Score, int Readability, int Keyword, int Completeness, int Impact, List<string> Suggestions)> CalculateATSScoreAsync(string cvDataJson)
    {
        if (string.IsNullOrWhiteSpace(cvDataJson))
            return (0, 0, 0, 0, 0, new List<string> { "CV verisi bulunamadı" });

        try
        {
            var prompt = $$"""
                Sen bir ATS (Applicant Tracking System) uzmanısın. Aşağıdaki CV verisini analiz et
                ve toplam bir ATS skoru (0-100) ile birlikte detaylı alt metrikleri (Okunabilirlik, Anahtar Kelime, Doluluk, Etki) puanla.

                Değerlendirme kriterleri:
                - Okunabilirlik (readability): Format, dil tutarlılığı, metin uzunluklarının dengesi (0-100)
                - Anahtar Kelime Yoğunluğu (keyword): Yetenekler ve deneyimlerin teknolojik/sektörel kelime zenginliği (0-100)
                - Doluluk Oranı (completeness): Kişisel bilgiler, eğitim ve iletişim bilgileri eksiksizliği (0-100)
                - Etki Skoru (impact): Deneyim açıklamalarındaki aksiyon fiilleri, sayılar ve başarı metrikleri (0-100)

                Toplam Skor, bu 4 alt skorun ağırlıklı ortalaması olsun.

                CV Verisi (JSON):
                {{cvDataJson}}

                SADECE şu JSON formatında cevap ver, başka hiçbir şey yazma:
                {
                    "score": 85,
                    "readability": 90,
                    "keyword": 80,
                    "completeness": 95,
                    "impact": 75,
                    "suggestions": ["öneri 1", "öneri 2", "öneri 3"]
                }
                """;

            var response = await _client.Messages.GetClaudeMessageAsync(new MessageParameters
            {
                Model     = Model,
                MaxTokens = 500,
                Messages  = new List<Message> { new() { Role = RoleType.User, Content = new List<ContentBase> { new TextContent { Text = prompt } } } }
            });

            var raw = response?.Content?.FirstOrDefault()?.ToString()?.Trim() ?? "";
            if (string.IsNullOrEmpty(raw)) return FallbackAtsScore(cvDataJson);

            var start = raw.IndexOf('{');
            var end   = raw.LastIndexOf('}');
            if (start >= 0 && end > start)
            {
                var jsonSlice = raw[start..(end + 1)];
                try
                {
                    var parsed = JsonSerializer.Deserialize<AtsResult>(jsonSlice,
                        new JsonSerializerOptions { PropertyNameCaseInsensitive = true });
                    if (parsed != null)
                        return (
                            Math.Clamp(parsed.Score, 0, 100),
                            Math.Clamp(parsed.Readability, 0, 100),
                            Math.Clamp(parsed.Keyword, 0, 100),
                            Math.Clamp(parsed.Completeness, 0, 100),
                            Math.Clamp(parsed.Impact, 0, 100),
                            parsed.Suggestions ?? new List<string>()
                        );
                }
                catch (JsonException je)
                {
                    _logger.LogWarning(je, "ATS JSON parse başarısız, fallback kullanılıyor");
                }
            }

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
            return DefaultSkills();

        try
        {
            var prompt = $"""
                '{position}' pozisyonu için en önemli {MaxSkills} teknik ve soft beceriyi listele.

                Kurallar:
                - Türkçe yaz
                - Her beceri 1-3 kelime olsun
                - Virgülle ayır, başka hiçbir şey yazma
                - ATS sistemlerinde aranabilecek anahtar kelimeler kullan

                Örnek format: Beceri 1, Beceri 2, Beceri 3
                """;

            var response = await _client.Messages.GetClaudeMessageAsync(new MessageParameters
            {
                Model     = Model,
                MaxTokens = 200,
                Messages  = new List<Message> { new() { Role = RoleType.User, Content = new List<ContentBase> { new TextContent { Text = prompt } } } }
            });

            var raw = response?.Content?.FirstOrDefault()?.ToString()?.Trim() ?? "";
            if (string.IsNullOrEmpty(raw)) return DefaultSkills();

            var skills = raw.Split(',')
                .Select(s => s.Trim())
                .Where(s => !string.IsNullOrWhiteSpace(s) && s.Length < 50)
                .Take(MaxSkills)
                .ToList();

            return skills.Any() ? skills : DefaultSkills();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "SuggestSkills API hatası");
            return DefaultSkills();
        }
    }

    public async Task<List<string>> GenerateSummaryAsync(string cvDataJson, string? targetPosition = null, string? targetDescription = null)
    {
        if (string.IsNullOrWhiteSpace(cvDataJson))
            return new List<string> { "Lütfen önce kişisel bilgilerinizi, eğitiminizi ve deneyimlerinizi doldurun." };

        try
        {
            var positionContext = !string.IsNullOrWhiteSpace(targetPosition)
                ? $"\nÖNEMLİ: Aday bu özeti '{targetPosition}' pozisyonu için kullanacaktır. Tüm taslaklar bu role yönelik anahtar kelimeler ve vurgular içermelidir.{(!string.IsNullOrWhiteSpace(targetDescription) ? $" Hedef İlan: {targetDescription[..Math.Min(targetDescription.Length, 300)]}" : "")}"
                : "";

            var prompt = $$"""
                Sen profesyonel bir CV yazarısın. Aşağıdaki CV verisini analiz et
                ve adayın profiline uygun 3 FARKLI tonda özet (summary) taslağı oluştur.
                
                Tonlar (her biri Türkçe, 3-4 cümle, etkileyici ve profesyonel):
                1. Kurumsal & Resmi (Geleneksel şirketler için)
                2. Yaratıcı & Dinamik (Startup, ajans veya modern şirketler için)
                3. Teknik & Lider (Uzmanlık ve yöneticiliğe odaklı)
                {{positionContext}}

                CV Verisi (JSON):
                {{cvDataJson}}

                SADECE 3 öğelik bir JSON dizisi (string array) döndür. 
                Örnek format:
                [
                  "Özet 1...",
                  "Özet 2...",
                  "Özet 3..."
                ]
                Başka hiçbir açıklama, başlık veya markdown biçimlendirmesi (```json) ekleme. Sadece diziyi ver.
                """;

            var response = await _client.Messages.GetClaudeMessageAsync(new MessageParameters
            {
                Model     = Model,
                MaxTokens = 800,
                Messages  = new List<Message> { new() { Role = RoleType.User, Content = new List<ContentBase> { new TextContent { Text = prompt } } } }
            });

            var raw = response?.Content?.FirstOrDefault()?.ToString()?.Trim() ?? "";
            
            try 
            {
                var start = raw.IndexOf('[');
                var end   = raw.LastIndexOf(']');
                if (start >= 0 && end > start)
                {
                    var jsonSlice = raw[start..(end + 1)];
                    var parsed = JsonSerializer.Deserialize<List<string>>(jsonSlice);
                    if (parsed != null && parsed.Any())
                        return parsed;
                }
            }
            catch (JsonException je)
            {
                _logger.LogWarning(je, "GenerateSummary JSON parse başarısız");
            }

            return new List<string> { 
                "Verilerinize dayanarak güçlü bir özet oluşturulamadı. Lütfen deneyim ve eğitim bilgilerinizi kontrol edin." 
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "GenerateSummary API hatası");
            return new List<string> { "Özet oluşturulurken AI servisinde bir hata oluştu." };
        }
    }

    public async Task<string> ParsePdfToCvDataAsync(string rawText)
    {
        if (string.IsNullOrWhiteSpace(rawText))
            throw new ArgumentException("PDF metni boş olamaz.");

        try
        {
            var prompt = $$"""
                Sen bir akıllı CV veri çıkarma asistanısın.
                Sana ham PDF metni verilecek. Senin görevin bu metindeki yetenekleri, deneyimleri, eğitimi ve kişisel bilgileri bulup, 
                TAM OLARAK aşağıdaki JSON şablonuna oturtmaktır.
                Eksik veya bulunamayan veriler için boş string "" veya boş dizi [] bırak.
                "id" alanları oluşturma, sadece içeriği çıkar. Alan isimlerini ve yapıyı kesinlikle değiştirme.
                SADECE GEÇERLİ BİR JSON nesnesi dön, markdown (```json) kullanma, başka cümle ekleme.

                Örnek Şablon:
                {
                  "personal": {
                    "fullName": "",
                    "email": "",
                    "phone": "",
                    "location": "",
                    "linkedin": "",
                    "github": "",
                    "website": "",
                    "profession": ""
                  },
                  "summary": "",
                  "experience": [
                    { "company": "", "position": "", "startDate": "YYYY-MM", "endDate": "YYYY-MM", "isCurrent": false, "description": "", "location": "" }
                  ],
                  "education": [
                    { "school": "", "degree": "", "field": "", "startDate": "YYYY-MM", "endDate": "YYYY-MM", "isCurrent": false, "grade": "", "location": "" }
                  ],
                  "skills": [
                    { "name": "", "level": "intermediate" }
                  ],
                  "languages": [
                    { "name": "", "level": "professional" }
                  ],
                  "certifications": [
                    { "name": "", "issuer": "", "date": "YYYY-MM", "url": "" }
                  ]
                }

                (Tarihler YYYY-MM formatına benzemiyorsa null veya sadece YYYY olarak çevir)
                
                İŞTE PDF METNİ:
                {{rawText}}
                """;

            var response = await _client.Messages.GetClaudeMessageAsync(new MessageParameters
            {
                Model     = Model,
                MaxTokens = 2500,
                Messages  = new List<Message> { new() { Role = RoleType.User, Content = new List<ContentBase> { new TextContent { Text = prompt } } } }
            });

            var raw = response?.Content?.FirstOrDefault()?.ToString()?.Trim() ?? "";

            // Temel JSON düzeltmesi (Markdown parse etme)
            var start = raw.IndexOf('{');
            var end   = raw.LastIndexOf('}');
            if (start >= 0 && end > start)
            {
                return raw[start..(end + 1)]; // Sadece JSON kısmını dön
            }

            return raw;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "ParsePdfToCvData AI hatası");
            throw;
        }
    }

    public async Task<string> ImportLinkedInAsync(string profileText)
    {
        if (string.IsNullOrWhiteSpace(profileText))
            throw new ArgumentException("LinkedIn metin içeriği boş olamaz.");

        try
        {
            var prompt = $$"""
                Sen bir aklıllı CV veri çıkarma asistanısın.
                LinkedIn profil sayfasından kopyalanmış düz metin verilecek.
                Görevin bu metindeki kişisel bilgileri, deneyimleri, eğitimi, yetenekleri ve dilleri
                TAM OLARAK aşağıdaki JSON şablonuna oturtmaktır.
                Eksik veya bulunamayan veriler için boş string "" veya boş dizi [] bırak.
                SADECE GEÇERLİ BİR JSON nesnesi dön, markdown (```json) kullanma.

                JSON şablonu:
                {
                  "personal": {
                    "fullName": "",
                    "email": "",
                    "phone": "",
                    "location": "",
                    "linkedin": "",
                    "github": "",
                    "website": "",
                    "profession": ""
                  },
                  "summary": "",
                  "experience": [
                    { "company": "", "position": "", "startDate": "YYYY-MM", "endDate": "YYYY-MM", "isCurrent": false, "description": "", "location": "" }
                  ],
                  "education": [
                    { "school": "", "degree": "", "field": "", "startDate": "YYYY-MM", "endDate": "YYYY-MM", "isCurrent": false, "grade": "", "location": "" }
                  ],
                  "skills": [
                    { "name": "", "level": "intermediate" }
                  ],
                  "languages": [
                    { "name": "", "level": "professional" }
                  ],
                  "certifications": [
                    { "name": "", "issuer": "", "date": "YYYY-MM", "url": "" }
                  ]
                }

                LinkedIn Profil Metni:
                {{profileText}}
                """;

            var response = await _client.Messages.GetClaudeMessageAsync(new MessageParameters
            {
                Model     = Model,
                MaxTokens = 2500,
                Messages  = new List<Message> { new() { Role = RoleType.User, Content = new List<ContentBase> { new TextContent { Text = prompt } } } }
            });

            var raw = response?.Content?.FirstOrDefault()?.ToString()?.Trim() ?? "";

            var start = raw.IndexOf('{');
            var end   = raw.LastIndexOf('}');
            if (start >= 0 && end > start)
                return raw[start..(end + 1)];

            return raw;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "ImportLinkedIn AI hatası");
            throw;
        }
    }

    public async Task<string> GenerateCoverLetterAsync(string cvDataJson, string jobDescription)
    {
        if (string.IsNullOrWhiteSpace(cvDataJson) || string.IsNullOrWhiteSpace(jobDescription))
            throw new ArgumentException("CV verisi ve İş İlanı boş olamaz.");

        try
        {
            var prompt = $$"""
                Sen profesyonel bir Kariyer Danışmanı ve İnsan Kaynakları Uzmanısın.
                Sana bir adayın CV verileri (JSON formatında) ve başvurduğu İş İlanı detayları veriliyor.
                Görevin, adayın deneyimlerini ve yeteneklerini bu iş ilanıyla en iyi şekilde eşleştirerek,
                etkileyici, profesyonel ama aynı zamanda samimi bir Ön Yazı (Cover Letter) oluşturmaktır.
                
                CV Verisi:
                {{cvDataJson}}
                
                İş İlanı:
                {{jobDescription}}
                
                Lütfen oluşturacağın ön yazıyı doğrudan metin olarak dön, başına veya sonuna başka açıklamalar ekleme.
                """;

            var response = await _client.Messages.GetClaudeMessageAsync(new MessageParameters
            {
                Model     = Model,
                MaxTokens = 1500,
                Messages  = new List<Message> { new() { Role = RoleType.User, Content = new List<ContentBase> { new TextContent { Text = prompt } } } }
            });

            return response?.Content?.FirstOrDefault()?.ToString()?.Trim() ?? "Ön yazı oluşturulamadı.";
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "GenerateCoverLetter API hatası");
            return "Ön yazı oluşturulurken AI servisinde bir hata oluştu.";
        }
    }

    public async Task<(int MatchScore, List<string> MatchingSkills, List<string> MissingSkills, string Advice)> MatchJobAsync(string cvDataJson, string jobDescription)
    {
        if (string.IsNullOrWhiteSpace(cvDataJson) || string.IsNullOrWhiteSpace(jobDescription))
            throw new ArgumentException("CV verisi ve İş İlanı boş olamaz.");

        try
        {
            var prompt = $$"""
                Sen kıdemli bir İşe Alım (Recruitment) ve Yetenek Doğrulama Uzmanısın.
                Sana bir adayın CV verisi (JSON formatında) ve başvurduğu İş İlanı veriliyor.
                Görevin adayın CV'sini ilana göre analiz edip, eşleşen yetenekleri, eksik olan (ama ilanda istenen) yetenekleri,
                0'dan 100'e kadar bir eşleşme skoru ve genel bir tavsiye metni oluşturmaktır.

                LÜTFEN SADECE AŞAĞIDAKİ JSON FORMATINDA YANIT VER. JSON dışı hiçbir metin veya markdown bloğu kullanma:
                {
                    "matchScore": 85,
                    "matchingSkills": ["React", "TypeScript", "C#"],
                    "missingSkills": ["Docker", "Kubernetes"],
                    "advice": "Adayın frontend tecrübesi güçlü ancak ilan için gerekli bulut teknolojilerinde (Docker/K8s) eksiklikler var. Bu konularda sertifika eklenmesi önerilir."
                }
                
                CV Verisi:
                {{cvDataJson}}
                
                İş İlanı:
                {{jobDescription}}
                """;

            var response = await _client.Messages.GetClaudeMessageAsync(new MessageParameters
            {
                Model     = Model,
                MaxTokens = 1000,
                Messages  = new List<Message> { new() { Role = RoleType.User, Content = new List<ContentBase> { new TextContent { Text = prompt } } } }
            });

            var raw = response?.Content?.FirstOrDefault()?.ToString()?.Trim() ?? "";
            
            try 
            {
                var start = raw.IndexOf('{');
                var end   = raw.LastIndexOf('}');
                if (start >= 0 && end > start)
                {
                    var jsonSlice = raw[start..(end + 1)];
                    var result = JsonSerializer.Deserialize<JsonElement>(jsonSlice);
                    
                    var score = result.TryGetProperty("matchScore", out var s) ? s.GetInt32() : 0;
                    var advice = result.TryGetProperty("advice", out var a) ? a.GetString() ?? "" : "";
                    
                    var matching = new List<string>();
                    if (result.TryGetProperty("matchingSkills", out var mMatch) && mMatch.ValueKind == JsonValueKind.Array)
                        matching = mMatch.EnumerateArray().Select(x => x.GetString() ?? "").Where(x => !string.IsNullOrEmpty(x)).ToList();
                        
                    var missing = new List<string>();
                    if (result.TryGetProperty("missingSkills", out var mMiss) && mMiss.ValueKind == JsonValueKind.Array)
                        missing = mMiss.EnumerateArray().Select(x => x.GetString() ?? "").Where(x => !string.IsNullOrEmpty(x)).ToList();

                    return (score, matching, missing, advice);
                }
            }
            catch (JsonException je)
            {
                _logger.LogWarning(je, "MatchJob JSON parse başarısız");
            }

            return (0, new List<string>(), new List<string>(), "Analiz yapılamadı veya API geçersiz format döndürdü.");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "MatchJob API hatası");
            return (0, new List<string>(), new List<string>(), "İş ilanı analizi sırasında bir hata oluştu.");
        }
    }

    public async Task<string> BulletizeDescriptionAsync(string description, string? jobTitle = null)
    {
        if (string.IsNullOrWhiteSpace(description))
            return description;

        try
        {
            var roleCtx = string.IsNullOrWhiteSpace(jobTitle) ? "" : $" (Pozisyon: {jobTitle})";
            var prompt = $$$"""
                Sen profesyonel bir CV yazarısın.
                Aşağıdaki iş deneyimi açıklamasını{{{roleCtx}}} oku ve 3-5 madde halinde yeniden yaz.
                Her madde güçlü bir aksiyon fiiliyle başlamalı (örn: "Geliştirdim", "Tasarladım", "Yönettim", "Azalttım", "Artırdım").
                Mümkünse ölçülebilir sonuçlar ekle (%, rakam, süre).
                Türkçe yaz. Her maddeyi "• " ile başlat.
                SADECE madde listesini döndür, başka bir şey ekleme.

                Açıklama:
                {{{description}}}
                """;

            var response = await _client.Messages.GetClaudeMessageAsync(new MessageParameters
            {
                Model     = Model,
                MaxTokens = 500,
                Messages  = new List<Message> { new() { Role = RoleType.User, Content = new List<ContentBase> { new TextContent { Text = prompt } } } }
            });

            var raw = response?.Content?.FirstOrDefault()?.ToString()?.Trim() ?? "";
            return string.IsNullOrWhiteSpace(raw) ? description : raw;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "BulletizeDescription API hatası");
            return description;
        }
    }

    // ── Fallback / Helpers ────────────────────────────────────────────────────

    private static (int Score, int Readability, int Keyword, int Completeness, int Impact, List<string> Suggestions) FallbackAtsScore(string cvDataJson)
    {
        // Tüm metrikler için 20 puanlık bir taban skor ile başlıyoruz (CV varlığı için).
        // Bu yaklaşım, asimetriyi giderir ve mantıklı bir başlangıç noktası sağlar.
        int comp  = 20; // Doluluk
        int kWord = 20; // Anahtar Kelime
        int imp   = 20; // Etki
        int read  = 20; // Okunabilirlik

        var suggestions = new List<string>();

        try
        {
            var doc  = JsonDocument.Parse(cvDataJson);
            var root = doc.RootElement;

            // 1. Doluluk (Completeness) Analizi
            if (root.TryGetProperty("personal", out var personal))
            {
                if (HasValue(personal, "email"))    comp += 15;
                if (HasValue(personal, "phone"))    comp += 15;
                if (HasValue(personal, "location")) { comp += 15; read += 10; }
                else suggestions.Add("Konum bilgisi ekleyin");
            }

            // 2. Özet ve Anahtar Kelime Analizi
            if (root.TryGetProperty("summary", out var summary) && (summary.GetString()?.Length ?? 0) > 50)
            {
                kWord += 20;
                read  += 20;
                imp   += 10;
            }
            else
            {
                suggestions.Add("Güçlü bir özet bölümü ekleyin (en az 50 karakter)");
            }

            // 3. Deneyim ve Etki Analizi
            if (root.TryGetProperty("experience", out var exp) && exp.GetArrayLength() > 0)
            {
                comp += 15;
                read += 20;
                var hasDesc = exp.EnumerateArray()
                    .Any(e => HasValue(e, "description") && (e.GetProperty("description").GetString()?.Length ?? 0) > 30);
                
                if (hasDesc) 
                {
                    imp   += 40;
                    kWord += 20;
                }
                else 
                {
                    suggestions.Add("Deneyim açıklamalarına aksiyon fiilleri ve metrikler ekleyin");
                }
            }
            else
            {
                suggestions.Add("En az bir deneyim girişi ekleyin");
            }

            // 4. Yetenekler Analizi
            if (root.TryGetProperty("skills", out var skillsEl))
            {
                var count = skillsEl.GetArrayLength();
                if (count >= 5)      { kWord += 40; comp += 10; }
                else if (count > 0)  { kWord += 20; comp += 5;  }
                else                 suggestions.Add("En az 5 beceri ekleyin");
            }

            // 5. Eğitim Analizi
            if (root.TryGetProperty("education", out var edu) && edu.GetArrayLength() > 0)
            {
                comp += 15;
                read += 20;
                imp  += 10;
            }
            else
            {
                suggestions.Add("Eğitim bilgilerini ekleyin");
            }
        }
        catch { /* JSON parse hatası durumunda taban skorlar döner */ }

        if (suggestions.Count == 0)
            suggestions.Add("CV'nizi daha da güçlendirmek için özet bölümünü genişletin");

        // Toplam skor, tüm metriklerin ortalamasıdır.
        int score = (comp + kWord + imp + read) / 4;

        return (
            Math.Clamp(score, 0, 100), 
            Math.Clamp(read, 0, 100), 
            Math.Clamp(kWord, 0, 100), 
            Math.Clamp(comp, 0, 100), 
            Math.Clamp(imp, 0, 100), 
            suggestions
        );
    }

    private static bool HasValue(JsonElement el, string prop) =>
        el.TryGetProperty(prop, out var val) &&
        val.ValueKind == JsonValueKind.String &&
        !string.IsNullOrWhiteSpace(val.GetString());

    private static List<string> DefaultSkills() => new()
    {
        "Problem Çözme", "İletişim", "Takım Çalışması",
        "Analitik Düşünce", "Zaman Yönetimi", "Proje Yönetimi"
    };

    private class AtsResult
    {
        public int Score { get; set; }
        public int Readability { get; set; }
        public int Keyword { get; set; }
        public int Completeness { get; set; }
        public int Impact { get; set; }
        public List<string>? Suggestions { get; set; }
    }
}
