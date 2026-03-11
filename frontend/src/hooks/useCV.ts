import { useCallback } from 'react';
import { useCVStore } from '@/stores/cvStore';
import api from '@/lib/api';
import type { CV, CVData, SectionType } from '@/types/cv.types';

export function useCV() {
  const store = useCVStore();

  const fetchCVList = useCallback(async () => {
    const response = await api.get<CV[]>('/api/cvs');
    store.setCVList(response.data);
  }, [store]);

  const fetchCV = useCallback(async (id: string) => {
    const response = await api.get<CV>(`/api/cvs/${id}`);
    store.setCurrentCV(response.data);
    return response.data;
  }, [store]);

  const createCV = useCallback(async (title: string) => {
    const response = await api.post<CV>('/api/cvs', { title });
    store.setCVList([...store.cvList, response.data]);
    return response.data;
  }, [store]);

  const saveCV = useCallback(async () => {
    if (!store.currentCV) return;
    store.setIsSaving(true);
    try {
      await api.put(`/api/cvs/${store.currentCV.id}`, store.currentCV);
      store.setLastSaved(new Date());
    } finally {
      store.setIsSaving(false);
    }
  }, [store]);

  const deleteCV = useCallback(async (id: string) => {
    await api.delete(`/api/cvs/${id}`);
    store.setCVList(store.cvList.filter((cv) => cv.id !== id));
  }, [store]);

  const duplicateCV = useCallback(async (id: string) => {
    const response = await api.post<CV>(`/api/cvs/${id}/duplicate`);
    store.setCVList([...store.cvList, response.data]);
    return response.data;
  }, [store]);

  const updateSection = useCallback(
    (sectionType: SectionType, data: CVData[SectionType]) => {
      store.updateSection(sectionType, data);
    },
    [store]
  );

  return {
    ...store,
    fetchCVList,
    fetchCV,
    createCV,
    saveCV,
    deleteCV,
    duplicateCV,
    updateSection,
  };
}
