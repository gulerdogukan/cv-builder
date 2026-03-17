import { useEffect, useRef, useState } from 'react';
import type { CVData, SectionType, TemplateType } from '@/types/cv.types';
import { useCV } from '@/hooks/useCV';
import { useAI } from '@/hooks/useAI';
import { useAuthStore } from '@/stores/authStore';
import { debounce } from '@/lib/utils';
import PersonalInfo from './sections/PersonalInfo';
import Summary from './sections/Summary';
import Experience from './sections/Experience';
import Education from './sections/Education';
import Skills from './sections/Skills';
import Languages from './sections/Languages';
import Certifications from './sections/Certifications';
import { TEMPLATE_INFO } from '@/components/preview/CVPreview';
import { motion, AnimatePresence } from 'framer-motion';
import AtsSimulatorModal from './AtsSimulatorModal';
import { Palette, Type, Check } from 'lucide-react';

const COLORS = [
  { name: 'Mavi', value: '#3b82f6' },
  { name: 'Lacivert', value: '#1e3a8a' },
  { name: 'Zümrüt', value: '#10b981' },
  { name: 'Gül', value: '#e11d48' },
  { name: 'Turuncu', value: '#f59e0b' },
  { name: 'Mor', value: '#8b5cf6' },
  { name: 'Kömür', value: '#374151' },
];

const FONTS = [
  { name: 'Inter (Modern)', value: 'Inter, system-ui, sans-serif' },
  { name: 'Roboto (Temiz)', value: 'Roboto, sans-serif' },
  { name: 'Merriweather (Klasik)', value: 'Merriweather, serif' },
  { name: 'Outfit (Şık)', value: 'Outfit, sans-serif' },
  { name: 'Playfair (Zarif)', value: 'Playfair Display, serif' },
];

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
  const { currentCV, updateSection, setTemplate, setAccentColor, setFontFamily, saveCV, isSaving, lastSaved } = useCV();
  const { getATSScore, isLoading: isAILoading, isRateLimited, remainingRequests } = useAI();
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState<TabKey>('personal');
  const [showAtsModal, setShowAtsModal] = useState(false);
  const [atsResult, setAtsResult] = useState<any>(null);
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
    setShowAtsModal(true);
    try {
      const cvDataJson = JSON.stringify(currentCV.data);
      const result = await getATSScore(currentCV.id, cvDataJson);
      setAtsResult(result);
    } catch {
      setAtsResult(null);
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
          {(Object.keys(TEMPLATE_INFO) as TemplateType[]).map((t) => {
            const isLocked = TEMPLATE_INFO[t].isPremium && user?.plan !== 'paid';
            return (
              <button
                key={t}
                onClick={() => {
                  if (isLocked) {
                    alert('Bu Premium bir şablondur. Yetkili erişim için planınızı yükseltin.');
                  } else {
                    handleTemplateChange(t);
                  }
                }}
                className={`relative px-2.5 py-1 rounded text-xs font-medium transition-colors flex items-center gap-1 ${
                  currentCV.template === t
                    ? 'bg-primary text-primary-foreground'
                    : isLocked 
                      ? 'text-muted-foreground/60 hover:bg-muted/50 cursor-not-allowed'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                }`}
              >
                {TEMPLATE_INFO[t].label}
                {TEMPLATE_INFO[t].isPremium && (
                  <span className="text-[10px]" title="Premium Şablon">👑</span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Görsel Özelleştirme (Renk & Font) */}
      <div className="px-4 py-2 border-b bg-card/10 flex items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 font-bold text-[10px] text-muted-foreground">
              <Palette className="w-3 h-3" />
              <span>RENK:</span>
            </div>
            <div className="flex items-center gap-1">
              {COLORS.map((c) => (
                <button
                  key={c.value}
                  onClick={() => setAccentColor(c.value)}
                  className="w-3.5 h-3.5 rounded-full border border-white shadow-sm ring-1 ring-border transition-transform hover:scale-110 flex items-center justify-center"
                  style={{ backgroundColor: c.value }}
                >
                  {(currentCV.accentColor === c.value || (!currentCV.accentColor && c.value === '#3b82f6')) && (
                    <Check className="w-2 h-2 text-white" />
                  )}
                </button>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 font-bold text-[10px] text-muted-foreground">
              <Type className="w-3 h-3" />
              <span>FONT:</span>
            </div>
            <select
              value={currentCV?.fontFamily || FONTS[0].value}
              onChange={(e) => setFontFamily(e.target.value)}
              className="bg-transparent text-[10px] font-bold text-foreground focus:outline-none cursor-pointer border-b border-dashed border-muted-foreground/30 pb-0.5"
            >
              {FONTS.map((f) => (
                <option key={f.value} value={f.value}>{f.name}</option>
              ))}
            </select>
          </div>
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

          <AnimatePresence>
            {(currentCV.atsScore ?? 0) > 0 && (
              <motion.span 
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
                className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                  currentCV.atsScore >= 80 ? 'bg-green-100 text-green-700' :
                  currentCV.atsScore >= 50 ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'
                }`}
              >
                <motion.span
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  key={currentCV?.atsScore || 0}
                >
                  {currentCV?.atsScore || 0}
                </motion.span>
                /100
              </motion.span>
            )}
          </AnimatePresence>
        </div>

        {/* Rate limit göstergesi (sadece ücretsiz kullanıcılar) */}
        {remainingRequests !== null && remainingRequests !== Infinity && (
          <span className={`text-[10px] ${remainingRequests <= 1 ? 'text-destructive' : 'text-muted-foreground'}`}>
            {isRateLimited ? '⚠️ Günlük limit doldu' : `${remainingRequests} AI isteği kaldı`}
          </span>
        )}
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

      <div className="flex-1 overflow-y-auto p-4 relative overflow-x-hidden">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            transition={{ duration: 0.2, ease: "easeInOut" }}
            className="w-full h-full"
          >
            {activeTab === 'personal' && (
              <PersonalInfo
                data={data.personal}
                onChange={(v: any) => handleSectionChange('personal', v)}
              />
            )}

            {activeTab === 'summary' && (
              <div className="space-y-3">
                <Summary
                  cvDataJson={JSON.stringify(currentCV.data)}
                  data={data.summary}
                  onChange={(v: any) => handleSectionChange('summary', v)}
                />
              </div>
            )}

            {activeTab === 'experience' && (
              <Experience
                data={data.experience}
                template={currentCV.template}
                onChange={(v: any) => handleSectionChange('experience', v)}
              />
            )}

            {activeTab === 'education' && (
              <Education
                data={data.education}
                template={currentCV.template}
                onChange={(v: any) => handleSectionChange('education', v)}
              />
            )}

            {activeTab === 'skills' && (
              <Skills
                data={data.skills}
                template={currentCV.template}
                profession={data.personal.profession}
                onChange={(v: any) => handleSectionChange('skills', v)}
              />
            )}

            {activeTab === 'languages' && (
              <Languages
                data={data.languages}
                template={currentCV.template}
                onChange={(v: any) => handleSectionChange('languages', v)}
              />
            )}

            {activeTab === 'certifications' && (
              <Certifications
                data={data.certifications}
                template={currentCV.template}
                onChange={(v: any) => handleSectionChange('certifications', v)}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      <AtsSimulatorModal
        isOpen={showAtsModal}
        onClose={() => setShowAtsModal(false)}
        result={atsResult}
        isLoading={isAILoading}
      />
    </div>
  );
}
