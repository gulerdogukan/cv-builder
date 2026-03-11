using CvBuilder.Api.DTOs;

namespace CvBuilder.Api.Services;

public interface ICVService
{
    Task<List<CVListItemDto>> GetUserCVsAsync(Guid userId);
    Task<CVDetailDto?> GetCVByIdAsync(Guid cvId, Guid userId);
    Task<CVDetailDto> CreateCVAsync(Guid userId, CreateCVRequest request);
    Task<CVDetailDto?> UpdateCVAsync(Guid cvId, Guid userId, UpdateCVRequest request);
    Task<bool> DeleteCVAsync(Guid cvId, Guid userId);
    Task<CVDetailDto?> DuplicateCVAsync(Guid cvId, Guid userId);
}
