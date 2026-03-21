import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { CVData, SectionType, TemplateType } from '@/types/cv.types';
import type { ATSResult } from '@/hooks/useAI';
import { useCV } from '@/hooks/useCV';
import { useAI } from '@/hooks/useAI';
import { useAuthStore } from '@/stores/authStore';
import { useNotificationStore } from '@/stores/notificationStore';
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
import { Check, Sparkles, Cpu } from 'lucide-react';



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
  const { getATSScore, isLoading: isAILoading, isRateLimited, remainingRequests } = useAI();
  const { user } = useAuthStore();
  const { showToast: _showToast } = useNotificationStore();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabKey>('personal');
  const [showAtsModal, setShowAtsModal] = useState(false);
  const [atsResult, setAtsResult] = useState<ATSResult | null>(null);
  const saveRef = useRef(saveCV);
  saveRef.current = saveCV;

  // Debounced auto-save: 2 saniye sonra kaydet
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const debouncedSave = useRef(debounce(() => saveRef.current(), 2000)).current;

  // Unmount'ta bekleyen debounce timer'ını iptal et — memory leak önlenir
  useEffect(() => {
    return () => debouncedSave.cancel();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
    const isPremium = TEMPLATE_INFO[t].isPremium;
    const isLocked  = isPremium && user?.plan !== 'paid';
    if (isLocked) {
      _showToast(`"${TEMPLATE_INFO[t].label}" şablonu Premium'a özeldir. Yükseltmek için tıklayın.`, 'error');
      navigate('/pricing');
      return;
    }
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
    <div className="flex flex-col h-full bg-background text-foreground overflow-hidden">
      {/* Üst Panel: Kayıt Durumu */}
      <div className="h-11 px-4 border-b bg-muted/30 flex items-center justify-between gap-4 backdrop-blur-md shrink-0">
        <div className="flex items-center gap-3 text-[10px] font-black uppercase tracking-widest text-muted-foreground">
          {isSaving ? (
            <div className="flex items-center gap-2">
              <span className="animate-spin h-2.5 w-2.5 rounded-full border-b border-primary" />
              <span>SİSTEME KAYDEDİLİYOR</span>
            </div>
          ) : lastSaved ? (
            <div className="flex items-center gap-1.5 text-emerald-500/80">
              <Check className="w-3.5 h-3.5" />
              <span>SON KAYIT: {lastSaved.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}</span>
            </div>
          ) : (
            <span>DEĞİŞİKLİKLER OTOMATİK KAYDEDİLİR</span>
          )}
        </div>

        <div className="flex items-center gap-3">
          {remainingRequests !== null && remainingRequests < 2_147_483_647 && (
            <div className="flex items-center gap-1.5 px-2 py-1 bg-primary/5 rounded border border-primary/10 text-[9px] font-black text-primary/70 uppercase">
              <Cpu className="w-3 h-3" />
              <span>AI KREDİ: {remainingRequests}</span>
            </div>
          )}
        </div>
      </div>

      <div className="px-4 py-2 border-b bg-muted/20 flex items-center gap-4 shrink-0">
        <div className="flex flex-wrap items-center gap-1.5">
          {(Object.keys(TEMPLATE_INFO) as TemplateType[]).map((t) => {
            const isPremium = TEMPLATE_INFO[t].isPremium;
            const isLocked  = isPremium && user?.plan !== 'paid';
            const isActive  = currentCV.template === t;
            return (
              <button
                key={t}
                onClick={() => handleTemplateChange(t)}
                title={isLocked ? `${TEMPLATE_INFO[t].label} — Önizlemek için tıkla` : TEMPLATE_INFO[t].label}
                className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-tighter transition-all whitespace-nowrap border ${
                  isActive
                    ? 'bg-primary text-primary-foreground border-primary shadow-lg shadow-primary/20 scale-105'
                    : isLocked
                      ? 'bg-muted/20 text-muted-foreground/60 border-amber-300/40 hover:bg-amber-50/30 hover:text-muted-foreground'
                      : 'bg-muted/30 text-muted-foreground border-transparent hover:bg-muted/50 hover:text-foreground'
                }`}
              >
                {TEMPLATE_INFO[t].label}
                {isPremium && <span className="ml-1 opacity-60">👑</span>}
              </button>
            );
          })}
        </div>
      </div>

      {/* ATS Simülasyon & Skor Şeridi */}
      <div className="h-11 bg-amber-500/5 px-4 border-b border-amber-500/10 flex items-center justify-center gap-8 relative overflow-hidden shrink-0">
        <AnimatePresence mode="wait">
          {(currentCV.atsScore ?? 0) > 0 ? (
            <motion.div
              key="score"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center gap-3"
            >
              <span className="text-[10px] font-black text-amber-500/60 uppercase tracking-widest hidden sm:inline">Analiz Sonucu:</span>
              <div className={`text-xs font-black px-3 py-1 rounded-md border shadow-sm ${
                currentCV.atsScore >= 80 ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' :
                currentCV.atsScore >= 50 ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' : 'bg-rose-500/10 text-rose-500 border-rose-500/20'
              }`}>
                ATS SKORU: {currentCV?.atsScore || 0}/100
              </div>
            </motion.div>
          ) : (
            <motion.span
              key="cta"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-[10px] font-black text-amber-500/50 uppercase tracking-widest hidden sm:inline"
            >
              CV'niz henüz analiz edilmedi →
            </motion.span>
          )}
        </AnimatePresence>

        <button
          onClick={handleATSScore}
          disabled={isAILoading || isRateLimited}
          className="group relative flex items-center gap-2 px-8 py-1.5 bg-amber-500 text-white rounded-full text-[11px] font-black uppercase tracking-widest transition-all hover:bg-amber-600 active:scale-95 shadow-lg shadow-amber-500/20 disabled:opacity-50"
        >
          <Sparkles className={`w-3.5 h-3.5 ${isAILoading ? 'animate-spin' : 'group-hover:scale-125 transition-transform'}`} />
          {isAILoading ? 'SİMÜLE EDİLİYOR...' : 'ATS ANALİZİ YAP'}
        </button>
      </div>

      {/* Tab Navigasyonu */}
      <div className="bg-muted/10 border-b overflow-x-auto no-scrollbar shrink-0">
        <div className="flex min-w-max">
          {TABS.map((tab) => {
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-2 px-6 py-4 text-[11px] font-bold uppercase tracking-widest transition-all border-b-2 ${
                  isActive 
                    ? 'border-primary text-primary bg-primary/5' 
                    : 'border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/20'
                }`}
              >
                <span className={`text-sm transition-transform ${isActive ? 'scale-125' : 'opacity-50'}`}>{tab.icon}</span>
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Editör Alanı */}
      <div className="flex-1 overflow-y-auto p-4 md:p-8 bg-slate-50/10 dark:bg-slate-900/10 relative no-scrollbar">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, scale: 0.98, y: 5 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.98, y: -5 }}
            transition={{ duration: 0.15 }}
            className="w-full max-w-3xl mx-auto"
          >
            {activeTab === 'personal' && (
              <PersonalInfo
                data={data.personal}
                onChange={(v) => handleSectionChange('personal', v)}
              />
            )}
            {activeTab === 'summary' && (
              <Summary
                cvDataJson={JSON.stringify(currentCV.data)}
                data={data.summary}
                onChange={(v) => handleSectionChange('summary', v)}
              />
            )}
            {activeTab === 'experience' && (
              <Experience
                data={data.experience}
                template={currentCV.template}
                onChange={(v) => handleSectionChange('experience', v)}
              />
            )}
            {activeTab === 'education' && (
              <Education
                data={data.education}
                template={currentCV.template}
                onChange={(v) => handleSectionChange('education', v)}
              />
            )}
            {activeTab === 'skills' && (
              <Skills
                data={data.skills}
                template={currentCV.template}
                profession={data.personal?.profession}
                onChange={(v) => handleSectionChange('skills', v)}
              />
            )}
            {activeTab === 'languages' && (
              <Languages
                data={data.languages}
                template={currentCV.template}
                onChange={(v) => handleSectionChange('languages', v)}
              />
            )}
            {activeTab === 'certifications' && (
              <Certifications
                data={data.certifications}
                template={currentCV.template}
                onChange={(v) => handleSectionChange('certifications', v)}
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
