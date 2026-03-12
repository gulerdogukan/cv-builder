namespace CvBuilder.Api.Services;

public interface IPdfService
{
    /// <summary>
    /// PDF oluştur ve base64 string döndür.
    /// </summary>
    Task<byte[]> GeneratePdfAsync(string template, string cvDataJson);
}
