import { create } from 'zustand';
import type { CV, CVData, TemplateType, SectionType } from '@/types/cv.types';

interface CVStore {
  cvList: CV[];
  currentCV: CV | null;
  isSaving: boolean;
  lastSaved: Date | null;
  setCVList: (cvList: CV[]) => void;
  setCurrentCV: (cv: CV | null) => void;
  updateSection: (sectionType: SectionType, data: CVData[SectionType]) => void;
  setTemplate: (template: TemplateType) => void;
  setIsSaving: (isSaving: boolean) => void;
  setLastSaved: (date: Date) => void;
}

export const useCVStore = create<CVStore>((set) => ({
  cvList: [],
  currentCV: null,
  isSaving: false,
  lastSaved: null,

  setCVList: (cvList) => set({ cvList }),

  setCurrentCV: (cv) => set({ currentCV: cv }),

  updateSection: (sectionType, data) =>
    set((state) => {
      if (!state.currentCV) return state;
      return {
        currentCV: {
          ...state.currentCV,
          data: {
            ...state.currentCV.data,
            [sectionType]: data,
          },
          updatedAt: new Date().toISOString(),
        },
      };
    }),

  setTemplate: (template) =>
    set((state) => {
      if (!state.currentCV) return state;
      return {
        currentCV: { ...state.currentCV, template },
      };
    }),

  setIsSaving: (isSaving) => set({ isSaving }),

  setLastSaved: (date) => set({ lastSaved: date }),
}));
