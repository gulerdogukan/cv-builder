namespace CvBuilder.Api.Services;

public interface IPdfService
{
    Task<string> GeneratePdfAsync(Guid cvId, string template, string cvDataJson);
}
