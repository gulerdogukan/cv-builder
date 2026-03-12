import { useState, useCallback } from 'react';
import api from '@/lib/api';

interface EnhanceTextResponse {
  enhancedText: string;
  remainingRequests?: number;
}

interface ATSScoreResponse {
  score: number;
  suggestions: string[];
  remainingRequests?: number;
}

interface SuggestSkillsResponse {
  skills: string[];
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

  const getATSScore = useCallback(async (cvId: string, cvDataJson?: string): Promise<ATSScoreResponse> => {
    setIsLoading(true);
    setError(null);
    setIsRateLimited(false);
    try {
      const response = await api.post<ATSScoreResponse>('/api/ai/ats-score', { cvId, cvDataJson });
      if (response.data.remainingRequests !== undefined) {
        setRemainingRequests(response.data.remainingRequests);
      }
      return response.data;
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

  return {
    enhanceText,
    getATSScore,
    suggestSkills,
    fetchRateLimit,
    isLoading,
    error,
    isRateLimited,
    remainingRequests,
  };
}
