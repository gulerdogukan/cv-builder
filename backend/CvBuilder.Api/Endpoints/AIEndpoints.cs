using CvBuilder.Api.DTOs;
using CvBuilder.Api.Services;

namespace CvBuilder.Api.Endpoints;

public static class AIEndpoints
{
    public static void MapAIEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/ai")
            .WithTags("AI")
            .RequireAuthorization();

        group.MapPost("/enhance-text", async (EnhanceTextRequest request, IAIService aiService) =>
        {
            var enhanced = await aiService.EnhanceTextAsync(request.Text);
            return Results.Ok(new EnhanceTextResponse(enhanced));
        });

        group.MapPost("/ats-score", async (ATSScoreRequest request, IAIService aiService) =>
        {
            var (score, suggestions) = await aiService.CalculateATSScoreAsync(request.CvId);
            return Results.Ok(new ATSScoreResponse(score, suggestions));
        });

        group.MapPost("/suggest-skills", async (SuggestSkillsRequest request, IAIService aiService) =>
        {
            var skills = await aiService.SuggestSkillsAsync(request.Position);
            return Results.Ok(new SuggestSkillsResponse(skills));
        });
    }
}
