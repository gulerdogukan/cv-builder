export interface PersonalInfo {
  fullName: string;
  email: string;
  phone: string;
  location: string;
  linkedin?: string;
  github?: string;
  website?: string;
  photo?: string;
}

export interface Experience {
  id: string;
  company: string;
  position: string;
  startDate: string;
  endDate?: string;
  isCurrent: boolean;
  description: string;
  location?: string;
}

export interface Education {
  id: string;
  school: string;
  degree: string;
  field: string;
  startDate: string;
  endDate?: string;
  gpa?: number;
  description?: string;
}

export type SkillLevel = 'beginner' | 'intermediate' | 'advanced' | 'expert';

export interface Skill {
  id: string;
  name: string;
  level: SkillLevel;
}

export type LanguageLevel = 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2' | 'native';

export interface Language {
  id: string;
  name: string;
  level: LanguageLevel;
}

export interface Certification {
  id: string;
  name: string;
  issuer: string;
  date: string;
  url?: string;
}

export interface CVData {
  personal: PersonalInfo;
  summary: string;
  experience: Experience[];
  education: Education[];
  skills: Skill[];
  languages: Language[];
  certifications: Certification[];
}

export type TemplateType = 'modern' | 'classic' | 'minimal';

export type CVLanguage = 'tr' | 'en';

export interface CV {
  id: string;
  userId: string;
  title: string;
  template: TemplateType;
  language: CVLanguage;
  isPublic: boolean;
  atsScore: number;
  data: CVData;
  createdAt: string;
  updatedAt: string;
}

export type SectionType = 'personal' | 'summary' | 'experience' | 'education' | 'skills' | 'languages' | 'certifications';
