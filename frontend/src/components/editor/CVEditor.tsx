import { useEffect, useRef, useState } from 'react';
import type { CVData, SectionType, TemplateType } from '@/types/cv.types';
import { useCV } from '@/hooks/useCV';
import { debounce } from '@/lib/utils';
import PersonalInfo from './sections/PersonalInfo';
import Summary from './sections/Summary';
import Experience from './sections/Experience';
import Education from './sections/Education';
import Skills from './sections/Skills';
import Languages from './sections/Languages';
import Certifications from './sections/Certifications';
import AIAssistButton from './AIAssistButton';
import { TEMPLATE_INFO } from '@/components/preview/CVPreview';

type TabKey = SectionType;

const TABS: { key: TabKey; label: string; icon: string }[] = [
  { key: 'personal', label: 'Kişisel', icon: '👤' },
  { key: 'summary', label: 'Özet', icon: '📝' },
  { key: 'experience', label: 'Deneyim', icon: '💼' },
  { key: 'education', label: 'Eğitim', icon: '🎓' },
  { key: 'skills', label: 'Beceriler', icon: '⚡' },
  { key: 'languages', label: 'Diller', icon: '🌐' },
  { key: 'certifications', label: 'Sertifikalar', icon: '🏆' },
];

interface Props {
  onTemplateChange: (template: TemplateType) => void;
}

export default function CVEditor({ onTemplateChange }: Props) {
  const { currentCV, updateSection, setTemplate, saveCV, isSaving, lastSaved } = useCV();
  const [activeTab, setActiveTab] = useState<TabKey>('personal');
  const saveRef = useRef(saveCV);
  saveRef.current = saveCV;

  // Debounced auto-save: 2 saniye sonra kaydet
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const debouncedSave = useRef(debounce(() => saveRef.current(), 2000)).current;

  // CV data değişince auto-save tetikle
  useEffect(() => {
    if (currentCV) debouncedSave();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentCV?.data, currentCV?.template]);

  if (!currentCV) return null;

  const data = currentCV.data;

  const handleSectionChange = (section: SectionType, value: CVData[SectionType]) => {
    updateSection(section, value);
  };

  const handleTemplateChange = (t: TemplateType) => {
    setTemplate(t);
    onTemplateChange(t);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Kayıt durumu */}
      <div className="px-4 py-2 border-b bg-muted/20 flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          {isSaving ? (
            <>
              <span className="animate-spin rounded-full h-3 w-3 border-b border-primary" />
              Kaydediliyor...
            </>
          ) : lastSaved ? (
            <>
              <span className="text-green-600">✓</span>
              Kaydedildi — {lastSaved.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
            </>
          ) : (
            <span>Değişiklikler otomatik kaydedilir</span>
          )}
        </div>

        {/* Template seçici */}
        <div className="flex items-center gap-1">
          {(Object.keys(TEMPLATE_INFO) as TemplateType[]).map((t) => (
            <button
              key={t}
              onClick={() => handleTemplateChange(t)}
              className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                currentCV.template === t
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted'
              }`}
            >
              {TEMPLATE_INFO[t].label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab navigasyonu */}
      <div className="border-b overflow-x-auto">
        <div className="flex gap-0 min-w-max">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-1.5 px-3 py-2.5 text-xs font-medium border-b-2 transition-colors whitespace-nowrap ${
                activeTab === tab.key
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground hover:border-muted-foreground/30'
              }`}
            >
              <span>{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Section içeriği */}
      <div className="flex-1 overflow-y-auto p-4">
        {activeTab === 'personal' && (
          <PersonalInfo
            data={data.personal}
            onChange={(v) => handleSectionChange('personal', v)}
          />
        )}

        {activeTab === 'summary' && (
          <div className="space-y-3">
            <Summary
              data={data.summary}
              onChange={(v) => handleSectionChange('summary', v)}
            />
            <div className="flex justify-end">
              <AIAssistButton
                text={data.summary}
                onAccept={(v) => handleSectionChange('summary', v)}
                label="AI ile Özeti Güçlendir"
              />
            </div>
          </div>
        )}

        {activeTab === 'experience' && (
          <Experience
            data={data.experience}
            onChange={(v) => handleSectionChange('experience', v)}
          />
        )}

        {activeTab === 'education' && (
          <Education
            data={data.education}
            onChange={(v) => handleSectionChange('education', v)}
          />
        )}

        {activeTab === 'skills' && (
          <Skills
            data={data.skills}
            onChange={(v) => handleSectionChange('skills', v)}
          />
        )}

        {activeTab === 'languages' && (
          <Languages
            data={data.languages}
            onChange={(v) => handleSectionChange('languages', v)}
          />
        )}

        {activeTab === 'certifications' && (
          <Certifications
            data={data.certifications}
            onChange={(v) => handleSectionChange('certifications', v)}
          />
        )}
      </div>
    </div>
  );
}
