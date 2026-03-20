import { useState, useCallback } from 'react';
import api from '@/lib/api';

interface EnhanceTextResponse {
  enhancedText: string;
  remainingRequests?: number;
}

interface ATSScoreResponse {
  score: number;
  readabilityScore: number;
  keywordDensityScore: number;
  completenessScore: number;
  impactScore: number;
  suggestions: string[];
  remainingRequests?: number;
}

// ATS sonucu türü — bileşenler tarafından kullanılabilir (remainingRequests olmadan)
export type ATSResult = Omit<ATSScoreResponse, 'remainingRequests'>;

interface SuggestSkillsResponse {
  skills: string[];
  remainingRequests?: number;
}

interface GenerateSummaryResponse {
  drafts: string[];
  remainingRequests?: number;
}

interface CoverLetterResponse {
  coverLetter: string;
  remainingRequests?: number;
}

interface JobMatchResponse {
  matchScore: number;
  matchingSkills: string[];
  missingSkills: string[];
  advice: string;
  remainingRequests?: number;
}

interface ImportCVResponse {
  success: boolean;
  data: string;
  remainingRequests?: number;
}

interface LinkedInImportResponse {
  cvDataJson: string;
  remainingRequests?: number;
}

interface BulletizeResponse {
  bullets: string;
  remainingRequests?: number;
}

interface RateLimitResponse {
  isPaid: boolean;
  dailyLimit: number | null;
  used: number;
  remaining: number | null;
  resetAt: string;
}

export function useAI() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isRateLimited, setIsRateLimited] = useState(false);
  const [remainingRequests, setRemainingRequests] = useState<number | null>(null);

  const handleError = (err: unknown): never => {
    if (err && typeof err === 'object' && 'response' in err) {
      const axiosErr = err as { response?: { status: number; data?: { error?: string } } };
      if (axiosErr.response?.status === 429) {
        const msg = axiosErr.response.data?.error ?? 'Günlük AI kullanım limitine ulaştınız.';
        setIsRateLimited(true);
        setError(msg);
        throw new Error(msg);
      }
    }
    const message = err instanceof Error ? err.message : 'AI isteği başarısız oldu';
    setError(message);
    throw new Error(message);
  };

  const enhanceText = useCallback(async (text: string): Promise<string> => {
    setIsLoading(true);
    setError(null);
    setIsRateLimited(false);
    try {
      const response = await api.post<EnhanceTextResponse>('/api/ai/enhance-text', { text });
      if (response.data.remainingRequests !== undefined) {
        setRemainingRequests(response.data.remainingRequests);
      }
      return response.data.enhancedText;
    } catch (err) {
      return handleError(err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const getATSScore = useCallback(async (cvId: string, cvDataJson?: string): Promise<Omit<ATSScoreResponse, 'remainingRequests'>> => {
    setIsLoading(true);
    setError(null);
    setIsRateLimited(false);
    try {
      const response = await api.post<ATSScoreResponse>('/api/ai/ats-score', { cvId, cvDataJson });
      if (response.data.remainingRequests !== undefined) {
        setRemainingRequests(response.data.remainingRequests);
      }
      return {
        score: response.data.score,
        readabilityScore: response.data.readabilityScore,
        keywordDensityScore: response.data.keywordDensityScore,
        completenessScore: response.data.completenessScore,
        impactScore: response.data.impactScore,
        suggestions: response.data.suggestions
      };
    } catch (err) {
      return handleError(err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const suggestSkills = useCallback(async (position: string): Promise<string[]> => {
    setIsLoading(true);
    setError(null);
    setIsRateLimited(false);
    try {
      const response = await api.post<SuggestSkillsResponse>('/api/ai/suggest-skills', { position });
      if (response.data.remainingRequests !== undefined) {
        setRemainingRequests(response.data.remainingRequests);
      }
      return response.data.skills;
    } catch (err) {
      return handleError(err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const generateSummary = useCallback(async (cvDataJson: string, targetPosition?: string, targetDescription?: string): Promise<string[]> => {
    setIsLoading(true);
    setError(null);
    setIsRateLimited(false);
    try {
      const response = await api.post<GenerateSummaryResponse>('/api/ai/generate-summary', { cvDataJson, targetPosition, targetDescription });
      if (response.data.remainingRequests !== undefined) {
        setRemainingRequests(response.data.remainingRequests);
      }
      return response.data.drafts;
    } catch (err) {
      return handleError(err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const importCVFromPdf = useCallback(async (file: File): Promise<string | null> => {
    setIsLoading(true);
    setError(null);
    setIsRateLimited(false);
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await api.post<ImportCVResponse>('/api/ai/import-cv', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      if (response.data.remainingRequests !== undefined) {
        setRemainingRequests(response.data.remainingRequests);
      }
      return response.data.data;
    } catch (err) {
      return handleError(err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const importLinkedIn = useCallback(async (profileText: string): Promise<string | null> => {
    setIsLoading(true);
    setError(null);
    setIsRateLimited(false);
    try {
      const response = await api.post<LinkedInImportResponse>('/api/ai/import-linkedin', { profileText });
      if (response.data.remainingRequests !== undefined) {
        setRemainingRequests(response.data.remainingRequests);
      }
      return response.data.cvDataJson;
    } catch (err) {
      return handleError(err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchRateLimit = useCallback(async (): Promise<RateLimitResponse | null> => {
    try {
      const response = await api.get<RateLimitResponse>('/api/ai/rate-limit');
      if (response.data.remaining !== null) {
        setRemainingRequests(response.data.remaining);
      }
      setIsRateLimited(!response.data.isPaid && (response.data.remaining ?? 1) <= 0);
      return response.data;
    } catch {
      return null;
    }
  }, []);

  const generateCoverLetter = useCallback(async (cvDataJson: string, jobDescription: string): Promise<string> => {
    setIsLoading(true);
    setError(null);
    setIsRateLimited(false);
    try {
      const response = await api.post<CoverLetterResponse>('/api/ai/cover-letter', { cvDataJson, jobDescription });
      if (response.data.remainingRequests !== undefined) {
        setRemainingRequests(response.data.remainingRequests);
      }
      return response.data.coverLetter;
    } catch (err) {
      return handleError(err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const matchJob = useCallback(async (cvDataJson: string, jobDescription: string): Promise<Omit<JobMatchResponse, 'remainingRequests'>> => {
    setIsLoading(true);
    setError(null);
    setIsRateLimited(false);
    try {
      const response = await api.post<JobMatchResponse>('/api/ai/match-job', { cvDataJson, jobDescription });
      if (response.data.remainingRequests !== undefined) {
        setRemainingRequests(response.data.remainingRequests);
      }
      return {
        matchScore: response.data.matchScore,
        matchingSkills: response.data.matchingSkills,
        missingSkills: response.data.missingSkills,
        advice: response.data.advice
      };
    } catch (err) {
      return handleError(err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const bulletizeDescription = useCallback(async (description: string, jobTitle?: string): Promise<string> => {
    setIsLoading(true);
    setError(null);
    setIsRateLimited(false);
    try {
      const response = await api.post<BulletizeResponse>('/api/ai/bulletize', { description, jobTitle });
      if (response.data.remainingRequests !== undefined) {
        setRemainingRequests(response.data.remainingRequests);
      }
      return response.data.bullets;
    } catch (err) {
      return handleError(err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    enhanceText,
    getATSScore,
    suggestSkills,
    generateSummary,
    importCVFromPdf,
    importLinkedIn,
    generateCoverLetter,
    matchJob,
    fetchRateLimit,
    bulletizeDescription,
    isLoading,
    error,
    isRateLimited,
    remainingRequests,
  };
}
