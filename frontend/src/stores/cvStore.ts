import { create } from 'zustand';
import type { CV, CVData, TemplateType, SectionType } from '@/types/cv.types';

interface CVStore {
  cvList: CV[];
  currentCV: CV | null;
  isLoading: boolean;
  isSaving: boolean;
  lastSaved: Date | null;
  setCVList: (cvList: CV[]) => void;
  setCurrentCV: (cv: CV | null) => void;
  setIsLoading: (isLoading: boolean) => void;
  updateSection: (sectionType: SectionType, data: CVData[SectionType]) => void;
  setTemplate: (template: TemplateType) => void;
  setIsSaving: (isSaving: boolean) => void;
  setLastSaved: (date: Date) => void;
  setAtsScore: (score: number) => void;
  setTitle: (title: string) => void;
  setAccentColor: (color: string | null) => void;
  setFontFamily: (font: string | null) => void;
  togglePublic: () => void;
}

export const useCVStore = create<CVStore>((set) => ({
  cvList: [],
  currentCV: null,
  isLoading: false,
  isSaving: false,
  lastSaved: null,

  setCVList: (cvList) => set({ cvList }),

  setCurrentCV: (cv) => set({ currentCV: cv }),

  setIsLoading: (isLoading) => set({ isLoading }),

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

  setAtsScore: (score) =>
    set((state) => {
      if (!state.currentCV) return state;
      return { currentCV: { ...state.currentCV, atsScore: score } };
    }),

  setTitle: (title) =>
    set((state) => {
      if (!state.currentCV) return state;
      return { currentCV: { ...state.currentCV, title } };
    }),
  
  setAccentColor: (color) =>
    set((state) => {
      if (!state.currentCV) return state;
      return { currentCV: { ...state.currentCV, accentColor: color } };
    }),

  setFontFamily: (font) =>
    set((state) => {
      if (!state.currentCV) return state;
      return { currentCV: { ...state.currentCV, fontFamily: font } };
    }),

  togglePublic: () =>
    set((state) => {
      if (!state.currentCV) return state;
      return { currentCV: { ...state.currentCV, isPublic: !state.currentCV.isPublic } };
    }),
}));
