import { useEffect, useRef, useState } from 'react';
import type { CVData, SectionType, TemplateType } from '@/types/cv.types';
import { useCV } from '@/hooks/useCV';
import { useAI } from '@/hooks/useAI';
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
  const { currentCV, updateSection, setTemplate, saveCV, setAtsScore, isSaving, lastSaved } = useCV();
  const { getATSScore, isLoading: isAILoading, isRateLimited, remainingRequests } = useAI();
  const [activeTab, setActiveTab] = useState<TabKey>('personal');
  const [atsSuggestions, setAtsSuggestions] = useState<string[]>([]);
  const [showAtsSuggestions, setShowAtsSuggestions] = useState(false);
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

  const handleATSScore = async () => {
    if (!currentCV) return;
    try {
      // CV datasını JSON olarak gönder
      const cvDataJson = JSON.stringify(currentCV.data);
      const result = await getATSScore(currentCV.id, cvDataJson);
      setAtsScore(result.score);
      setAtsSuggestions(result.suggestions);
      setShowAtsSuggestions(true);
    } catch {
      // error handled in hook
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Kayıt durumu + template seçici */}
      <div className="px-4 py-2 border-b bg-muted/20 flex items-center justify-between gap-2">
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

      {/* ATS Skoru butonu + rate limit göstergesi */}
      <div className="px-4 py-2 border-b bg-muted/10 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleATSScore}
            disabled={isAILoading || isRateLimited}
            className="inline-flex items-center gap-1.5 text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200 rounded-lg px-3 py-1.5 hover:bg-amber-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isAILoading ? (
              <span className="animate-spin rounded-full h-3 w-3 border-b border-amber-700" />
            ) : (
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            )}
            ATS Skoru Hesapla
          </button>

          {currentCV.atsScore > 0 && (
            <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
              currentCV.atsScore >= 80 ? 'bg-green-100 text-green-700' :
              currentCV.atsScore >= 50 ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'
            }`}>
              {currentCV.atsScore}/100
            </span>
          )}
        </div>

        {/* Rate limit göstergesi (sadece ücretsiz kullanıcılar) */}
        {remainingRequests !== null && remainingRequests !== Infinity && (
          <span className={`text-[10px] ${remainingRequests <= 1 ? 'text-destructive' : 'text-muted-foreground'}`}>
            {isRateLimited ? '⚠️ Günlük limit doldu' : `${remainingRequests} AI isteği kaldı`}
          </span>
        )}
      </div>

      {/* ATS öneriler paneli */}
      {showAtsSuggestions && atsSuggestions.length > 0 && (
        <div className="px-4 py-3 border-b bg-amber-50 space-y-1.5">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-amber-800">ATS İyileştirme Önerileri</p>
            <button
              type="button"
              onClick={() => setShowAtsSuggestions(false)}
              className="text-amber-600 hover:text-amber-800 text-xs"
            >✕</button>
          </div>
          <ul className="space-y-1">
            {atsSuggestions.map((s, i) => (
              <li key={i} className="flex items-start gap-1.5 text-xs text-amber-700">
                <span className="mt-0.5 shrink-0">•</span>
                {s}
              </li>
            ))}
          </ul>
        </div>
      )}

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
