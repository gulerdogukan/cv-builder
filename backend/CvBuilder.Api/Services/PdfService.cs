using System.Text;
using System.Text.Json;

namespace CvBuilder.Api.Services;

/// <summary>
/// PDF Service client — Node.js Puppeteer servisine istek atar.
/// </summary>
public class PdfService : IPdfService
{
    private readonly HttpClient _httpClient;
    private readonly string _pdfServiceUrl;

    public PdfService(IConfiguration configuration)
    {
        _httpClient = new HttpClient();
        _pdfServiceUrl = configuration["PdfService:BaseUrl"] ?? "http://localhost:3001";
    }

    public async Task<string> GeneratePdfAsync(Guid cvId, string template, string cvDataJson)
    {
        var requestBody = new
        {
            cvId = cvId.ToString(),
            template,
            data = JsonSerializer.Deserialize<object>(cvDataJson),
        };

        var content = new StringContent(
            JsonSerializer.Serialize(requestBody),
            Encoding.UTF8,
            "application/json"
        );

        var response = await _httpClient.PostAsync($"{_pdfServiceUrl}/generate", content);
        response.EnsureSuccessStatusCode();

        var result = await response.Content.ReadAsStringAsync();
        return result; // PDF URL veya base64
    }
}
