using System.Text.Json;
using CvBuilder.Api.Data;
using CvBuilder.Api.DTOs;
using CvBuilder.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace CvBuilder.Api.Services;

public class CVService : ICVService
{
    private readonly AppDbContext _db;

    public CVService(AppDbContext db)
    {
        _db = db;
    }

    public async Task<List<CVListItemDto>> GetUserCVsAsync(Guid userId)
    {
        return await _db.CVs
            .Where(c => c.UserId == userId)
            .OrderByDescending(c => c.UpdatedAt)
            .Select(c => new CVListItemDto(
                c.Id, c.Title, c.Template, c.Language, c.AtsScore, c.CreatedAt, c.UpdatedAt
            ))
            .ToListAsync();
    }

    public async Task<CVDetailDto?> GetCVByIdAsync(Guid cvId, Guid userId)
    {
        var cv = await _db.CVs
            .Include(c => c.Sections)
            .FirstOrDefaultAsync(c => c.Id == cvId && c.UserId == userId);

        if (cv is null) return null;

        return MapToDetailDto(cv);
    }

    public async Task<CVDetailDto> CreateCVAsync(Guid userId, CreateCVRequest request)
    {
        var cv = new CV
        {
            Id = Guid.NewGuid(),
            UserId = userId,
            Title = request.Title,
            Template = "modern",
            Language = "tr",
        };

        // Varsayılan boş section'lar oluştur
        var defaultSections = new[]
        {
            (SectionType.Personal, 0, JsonSerializer.Serialize(new { fullName = "", email = "", phone = "", location = "" })),
            (SectionType.Summary, 1, "\"\""),
            (SectionType.Experience, 2, "[]"),
            (SectionType.Education, 3, "[]"),
            (SectionType.Skills, 4, "[]"),
            (SectionType.Languages, 5, "[]"),
            (SectionType.Certifications, 6, "[]"),
        };

        foreach (var (sectionType, sortOrder, content) in defaultSections)
        {
            cv.Sections.Add(new CVSection
            {
                Id = Guid.NewGuid(),
                CvId = cv.Id,
                SectionType = sectionType,
                Content = content,
                SortOrder = sortOrder,
            });
        }

        _db.CVs.Add(cv);
        await _db.SaveChangesAsync();

        return MapToDetailDto(cv);
    }

    public async Task<CVDetailDto?> UpdateCVAsync(Guid cvId, Guid userId, UpdateCVRequest request)
    {
        var cv = await _db.CVs
            .Include(c => c.Sections)
            .FirstOrDefaultAsync(c => c.Id == cvId && c.UserId == userId);

        if (cv is null) return null;

        if (request.Title is not null) cv.Title = request.Title;
        if (request.Template is not null) cv.Template = request.Template;
        if (request.Language is not null) cv.Language = request.Language;
        if (request.IsPublic.HasValue) cv.IsPublic = request.IsPublic.Value;

        if (request.Data is not null)
        {
            foreach (var (key, value) in request.Data)
            {
                if (Enum.TryParse<SectionType>(key, true, out var sectionType))
                {
                    var section = cv.Sections.FirstOrDefault(s => s.SectionType == sectionType);
                    var jsonContent = JsonSerializer.Serialize(value);

                    if (section is not null)
                    {
                        section.Content = jsonContent;
                    }
                    else
                    {
                        cv.Sections.Add(new CVSection
                        {
                            Id = Guid.NewGuid(),
                            CvId = cv.Id,
                            SectionType = sectionType,
                            Content = jsonContent,
                        });
                    }
                }
            }
        }

        cv.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();

        return MapToDetailDto(cv);
    }

    public async Task<bool> DeleteCVAsync(Guid cvId, Guid userId)
    {
        var cv = await _db.CVs.FirstOrDefaultAsync(c => c.Id == cvId && c.UserId == userId);
        if (cv is null) return false;

        _db.CVs.Remove(cv);
        await _db.SaveChangesAsync();
        return true;
    }

    public async Task<CVDetailDto?> DuplicateCVAsync(Guid cvId, Guid userId)
    {
        var cv = await _db.CVs
            .Include(c => c.Sections)
            .FirstOrDefaultAsync(c => c.Id == cvId && c.UserId == userId);

        if (cv is null) return null;

        var newCv = new CV
        {
            Id = Guid.NewGuid(),
            UserId = userId,
            Title = $"{cv.Title} (Kopya)",
            Template = cv.Template,
            Language = cv.Language,
        };

        foreach (var section in cv.Sections)
        {
            newCv.Sections.Add(new CVSection
            {
                Id = Guid.NewGuid(),
                CvId = newCv.Id,
                SectionType = section.SectionType,
                Content = section.Content,
                SortOrder = section.SortOrder,
            });
        }

        _db.CVs.Add(newCv);
        await _db.SaveChangesAsync();

        return MapToDetailDto(newCv);
    }

    private static CVDetailDto MapToDetailDto(CV cv)
    {
        var data = new Dictionary<string, object>();
        foreach (var section in cv.Sections.OrderBy(s => s.SortOrder))
        {
            var key = section.SectionType.ToString().ToLowerInvariant();
            try
            {
                var parsed = JsonSerializer.Deserialize<object>(section.Content);
                if (parsed is not null) data[key] = parsed;
            }
            catch
            {
                data[key] = section.Content;
            }
        }

        return new CVDetailDto(
            cv.Id, cv.UserId, cv.Title, cv.Template, cv.Language,
            cv.IsPublic, cv.AtsScore, data, cv.CreatedAt, cv.UpdatedAt
        );
    }
}
