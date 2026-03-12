using System.Text;
using System.Text.Json;

namespace CvBuilder.Api.Services;

public class PdfService : IPdfService
{
    private readonly IHttpClientFactory _httpClientFactory;
    private readonly string _pdfServiceUrl;
    private readonly ILogger<PdfService> _logger;

    public PdfService(IHttpClientFactory httpClientFactory, IConfiguration configuration, ILogger<PdfService> logger)
    {
        _httpClientFactory = httpClientFactory;
        _pdfServiceUrl = configuration["PdfService:BaseUrl"] ?? "http://localhost:3001";
        _logger = logger;
    }

    public async Task<byte[]> GeneratePdfAsync(string template, string cvDataJson)
    {
        var client = _httpClientFactory.CreateClient("PdfService");

        object? cvData;
        try { cvData = JsonSerializer.Deserialize<object>(cvDataJson); }
        catch { cvData = new { }; }

        var requestBody = JsonSerializer.Serialize(new
        {
            template = template.ToLower(),
            data = cvData,
        });

        var content = new StringContent(requestBody, Encoding.UTF8, "application/json");

        HttpResponseMessage response;
        try
        {
            response = await client.PostAsync($"{_pdfServiceUrl}/generate", content);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "PDF servisi ulasilamiyor: {Url}", _pdfServiceUrl);
            throw new InvalidOperationException("PDF servisi su anda kullanilamiyor.");
        }

        if (!response.IsSuccessStatusCode)
        {
            var errorBody = await response.Content.ReadAsStringAsync();
            _logger.LogError("PDF servisi hata: {Status} — {Body}", response.StatusCode, errorBody);
            throw new InvalidOperationException("PDF olusturulamadi.");
        }

        var resultJson = await response.Content.ReadAsStringAsync();
        using var doc = JsonDocument.Parse(resultJson);

        if (!doc.RootElement.TryGetProperty("pdf", out var pdfProp))
            throw new InvalidOperationException("PDF servisi beklenmedik yanit dondurudu.");

        var base64 = pdfProp.GetString() ?? throw new InvalidOperationException("PDF verisi bos.");
        return Convert.FromBase64String(base64);
    }
}
