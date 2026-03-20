import { useCallback } from 'react';
import { useCVStore } from '@/stores/cvStore';
import api from '@/lib/api';
import type { CV, CVData, SectionType } from '@/types/cv.types';

export function useCV() {
  // Sadece state değerleri seç — stabil referanslar
  const cvList    = useCVStore((s) => s.cvList);
  const currentCV = useCVStore((s) => s.currentCV);
  const isLoading = useCVStore((s) => s.isLoading);
  const isSaving  = useCVStore((s) => s.isSaving);
  const lastSaved = useCVStore((s) => s.lastSaved);

  // Aksiyonlar: useCVStore.getState() ile erişilir → boş deps = stabil referans = döngü yok
  const fetchCVList = useCallback(async () => {
    const { setIsLoading, setCVList } = useCVStore.getState();
    setIsLoading(true);
    try {
      const response = await api.get<CV[]>('/api/cvs');
      setCVList(response.data);
    } catch {
      setCVList([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchCV = useCallback(async (id: string) => {
    const { setIsLoading, setCurrentCV } = useCVStore.getState();
    setIsLoading(true);
    try {
      const response = await api.get<CV>(`/api/cvs/${id}`);
      setCurrentCV(response.data);
      return response.data;
    } catch (err) {
      setCurrentCV(null);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const createCV = useCallback(async (title: string) => {
    const { setCVList, cvList: list } = useCVStore.getState();
    const response = await api.post<CV>('/api/cvs', { title });
    setCVList([...list, response.data]);
    return response.data;
  }, []);

  const saveCV = useCallback(async () => {
    const { currentCV: cv, setIsSaving, setLastSaved } = useCVStore.getState();
    if (!cv) return;
    setIsSaving(true);
    try {
      await api.put(`/api/cvs/${cv.id}`, cv);
      setLastSaved(new Date());
    } catch (err) {
      // Sessizce kaybolmak yerine logla — kullanıcı "otomatik kaydedildi" görmez
      console.error('[useCV] saveCV başarısız:', err);
      throw err;
    } finally {
      setIsSaving(false);
    }
  }, []);

  const deleteCV = useCallback(async (id: string) => {
    const { setCVList, cvList: list } = useCVStore.getState();
    await api.delete(`/api/cvs/${id}`);
    setCVList(list.filter((cv) => cv.id !== id));
  }, []);

  const duplicateCV = useCallback(async (id: string) => {
    const { setCVList, cvList: list } = useCVStore.getState();
    const response = await api.post<CV>(`/api/cvs/${id}/duplicate`);
    setCVList([...list, response.data]);
    return response.data;
  }, []);

  const hydrateCV = useCallback(async (id: string, data: CVData) => {
    const { setCurrentCV, setCVList, cvList: list } = useCVStore.getState();
    await api.put(`/api/cvs/${id}`, { data });
    const response = await api.get<CV>(`/api/cvs/${id}`);
    setCurrentCV(response.data);
    setCVList(list.map((cv) => (cv.id === id ? response.data : cv)));
    return response.data;
  }, []);

  const updateSection = useCallback(
    (sectionType: SectionType, data: CVData[SectionType]) => {
      useCVStore.getState().updateSection(sectionType, data);
    },
    []
  );

  const setTemplate = useCallback((template: import('@/types/cv.types').TemplateType) => {
    useCVStore.getState().setTemplate(template);
  }, []);

  const setAtsScore = useCallback((score: number) => {
    useCVStore.getState().setAtsScore(score);
  }, []);

  const updateCVTitle = useCallback(async (id: string, title: string) => {
    const { setTitle, setCVList, cvList: list } = useCVStore.getState();
    await api.put(`/api/cvs/${id}`, { title });
    setTitle(title);
    setCVList(list.map((cv) => (cv.id === id ? { ...cv, title } : cv)));
  }, []);

  const setAccentColor = useCallback((color: string | null) => {
    useCVStore.getState().setAccentColor(color);
  }, []);

  const setFontFamily = useCallback((font: string | null) => {
    useCVStore.getState().setFontFamily(font);
  }, []);

  const togglePublic = useCallback(() => {
    useCVStore.getState().togglePublic();
  }, []);

  return {
    cvList,
    currentCV,
    isLoading,
    isSaving,
    lastSaved,
    fetchCVList,
    fetchCV,
    createCV,
    saveCV,
    deleteCV,
    duplicateCV,
    hydrateCV,
    updateSection,
    setTemplate,
    setAtsScore,
    updateCVTitle,
    setAccentColor,
    setFontFamily,
    togglePublic,
  };
}
