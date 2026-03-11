import { useState, useCallback } from 'react';
import api from '@/lib/api';

interface EnhanceTextResponse {
  enhancedText: string;
}

interface ATSScoreResponse {
  score: number;
  suggestions: string[];
}

interface SuggestSkillsResponse {
  skills: string[];
}

export function useAI() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const enhanceText = useCallback(async (text: string): Promise<string> => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await api.post<EnhanceTextResponse>('/api/ai/enhance-text', { text });
      return response.data.enhancedText;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'AI isteği başarısız oldu';
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const getATSScore = useCallback(async (cvId: string): Promise<ATSScoreResponse> => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await api.post<ATSScoreResponse>('/api/ai/ats-score', { cvId });
      return response.data;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'ATS skoru hesaplanamadı';
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const suggestSkills = useCallback(async (position: string): Promise<string[]> => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await api.post<SuggestSkillsResponse>('/api/ai/suggest-skills', { position });
      return response.data.skills;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Beceri önerileri alınamadı';
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { enhanceText, getATSScore, suggestSkills, isLoading, error };
}
