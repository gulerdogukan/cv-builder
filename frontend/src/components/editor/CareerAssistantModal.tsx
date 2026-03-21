import { useState } from 'react';
import { X, Copy, Check, Briefcase, FileText, AlertCircle, Sparkles, Loader2, Target } from 'lucide-react';
import { useAI } from '@/hooks/useAI';
import type { CVData } from '@/types/cv.types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  cvData: CVData;
}

type TabType = 'cover-letter' | 'match-job';

export default function CareerAssistantModal({ isOpen, onClose, cvData }: Props) {
  const [activeTab, setActiveTab] = useState<TabType>('cover-letter');
  const [jobDescription, setJobDescription] = useState('');
  
  const [coverLetterResult, setCoverLetterResult] = useState<string | null>(null);
  const [matchResult, setMatchResult] = useState<{
    matchScore: number;
    matchingSkills: string[];
    missingSkills: string[];
    advice: string;
  } | null>(null);
  
  const [copied, setCopied] = useState(false);
  const { generateCoverLetter, matchJob, isLoading, error, remainingRequests, isRateLimited } = useAI();

  if (!isOpen) return null;

  const handleGenerateCoverLetter = async () => {
    if (!jobDescription.trim()) return;
    const result = await generateCoverLetter(JSON.stringify(cvData), jobDescription);
    if (result) setCoverLetterResult(result);
  };

  const handleMatchJob = async () => {
    if (!jobDescription.trim()) return;
    const result = await matchJob(JSON.stringify(cvData), jobDescription);
    if (result) setMatchResult(result);
  };

  const handleCopy = async () => {
    if (!coverLetterResult) return;
    try {
      await navigator.clipboard.writeText(coverLetterResult);
    } catch {
      // Clipboard API kullanılamadığında execCommand fallback
      try {
        const textarea = document.createElement('textarea');
        textarea.value = coverLetterResult;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.focus();
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
      } catch {
        // Sessizce devam et — kopyalama başarısız
        return;
      }
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
      <div className="bg-card w-full max-w-4xl max-h-[90vh] rounded-2xl shadow-xl border border-border flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-border flex items-center justify-between shrink-0 bg-muted/30">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center shadow-lg shadow-violet-500/20">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold">Kariyer Asistanı</h2>
              <p className="text-sm text-muted-foreground">İş ilanına özel ön yazı üretin ve eşleşme skorunuzu ölçün.</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex px-6 border-b border-border shrink-0">
          <button
            onClick={() => setActiveTab('cover-letter')}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'cover-letter' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            <FileText className="w-4 h-4" />
            Kapak Yazısı (Cover Letter)
          </button>
          <button
            onClick={() => setActiveTab('match-job')}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'match-job' ? 'border-violet-500 text-violet-500' : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            <Target className="w-4 h-4" />
            İlana Uygunluk Testi
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 flex flex-col lg:flex-row min-h-0">
          
          {/* Sol Kolon - İş İlanı Girişi */}
          <div className="w-full lg:w-1/3 p-6 border-r border-border flex flex-col shrink-0 bg-muted/10 overflow-y-auto">
            <label className="text-sm font-semibold mb-2 flex items-center gap-2">
              <Briefcase className="w-4 h-4 text-primary" />
              İş İlanı Detayı
            </label>
            <p className="text-xs text-muted-foreground mb-3">
              Başvurmak istediğiniz işin açıklamalarını (Job Description) buraya yapıştırın.
            </p>
            <textarea
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              placeholder="Örn: We are looking for a Senior React Developer with 5+ years of experience..."
              className="flex-1 min-h-[200px] w-full p-3 rounded-lg border border-border bg-background resize-none focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm"
              disabled={isLoading}
            />
            
            <button
              onClick={activeTab === 'cover-letter' ? handleGenerateCoverLetter : handleMatchJob}
              disabled={isLoading || !jobDescription.trim() || isRateLimited}
              className={`mt-4 w-full py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 font-medium text-white transition-all shadow-md active:scale-[0.98] ${
                activeTab === 'cover-letter' 
                ? 'bg-primary hover:bg-primary/90 shadow-primary/20' 
                : 'bg-violet-600 hover:bg-violet-700 shadow-violet-600/20'
              } disabled:opacity-50 disabled:active:scale-100`}
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Sparkles className="w-4 h-4" />
              )}
              {isLoading ? 'Analiz Ediliyor...' : (activeTab === 'cover-letter' ? 'Ön Yazı Üret' : 'Uygunluğu Test Et')}
            </button>
            {error && <p className="mt-3 text-xs text-destructive text-center">{error}</p>}
            {remainingRequests !== null && !error && (
              <p className="mt-3 text-[10px] text-center text-muted-foreground">Kalan AI Hakkınız: {remainingRequests}</p>
            )}
          </div>

          {/* Sağ Kolon - Sonuç Alanı */}
          <div className="flex-1 p-6 overflow-y-auto bg-background">
            
            {/* KAPAK YAZISI EKRANI */}
            {activeTab === 'cover-letter' && (
              <div className="h-full flex flex-col">
                {!coverLetterResult && !isLoading && (
                  <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground opacity-50">
                    <FileText className="w-16 h-16 mb-4 stroke-1" />
                    <p>İş ilanını girip butona tıkladığınızda ön yazınız burada belirecektir.</p>
                  </div>
                )}
                {isLoading && (
                  <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground animate-pulse">
                    <Sparkles className="w-10 h-10 mb-4 animate-bounce text-primary" />
                    <p>AI sizin için kişiselleştirilmiş bir mektup hazırlıyor...</p>
                  </div>
                )}
                {coverLetterResult && !isLoading && (
                  <div className="flex-1 flex flex-col animate-in fade-in duration-500">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-semibold text-lg flex items-center gap-2">
                        <Sparkles className="w-5 h-5 text-primary" />
                        Üretilen Ön Yazı
                      </h3>
                      <button
                        onClick={handleCopy}
                        className="text-xs font-medium px-3 py-1.5 rounded-lg border border-border bg-muted/50 hover:bg-muted flex items-center gap-1.5 transition-colors"
                      >
                        {copied ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
                        {copied ? 'Kopyalandı' : 'Kopyala'}
                      </button>
                    </div>
                    <div className="flex-1 bg-muted/20 border border-border rounded-xl p-5 text-sm whitespace-pre-wrap font-serif leading-relaxed text-foreground overflow-y-auto">
                      {coverLetterResult}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* İLAN EŞLEŞTİRME EKRANI */}
            {activeTab === 'match-job' && (
              <div className="h-full flex flex-col">
                {!matchResult && !isLoading && (
                  <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground opacity-50">
                    <Target className="w-16 h-16 mb-4 stroke-1" />
                    <p>İş ilanını girerek mevcut CV'nizin uygunluğunu keşfedin.</p>
                  </div>
                )}
                {isLoading && (
                  <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground animate-pulse">
                    <Sparkles className="w-10 h-10 mb-4 animate-bounce text-violet-500" />
                    <p>Deneyimleriniz iş ilanındaki anahtar kelimelerle taranıyor...</p>
                  </div>
                )}
                {matchResult && !isLoading && (
                  <div className="flex flex-col gap-6 animate-in fade-in duration-500">
                    
                    {/* Skor */}
                    <div className="flex items-center gap-6 p-5 rounded-xl border border-border bg-card shadow-sm">
                      <div className="relative w-24 h-24 shrink-0 flex items-center justify-center">
                        <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36" xmlns="http://www.w3.org/2000/svg">
                          <circle cx="18" cy="18" r="16" fill="none" className="stroke-muted" strokeWidth="3" />
                          <circle cx="18" cy="18" r="16" fill="none" className={`stroke-violet-500 ${matchResult.matchScore >= 70 ? 'stroke-primary' : matchResult.matchScore < 50 ? 'stroke-destructive' : ''}`} strokeWidth="3" strokeDasharray={`${matchResult.matchScore}, 100`} strokeLinecap="round" />
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center flex-col">
                          <span className="text-2xl font-black">{matchResult.matchScore}</span>
                          <span className="text-[10px] uppercase text-muted-foreground font-semibold">Skor</span>
                        </div>
                      </div>
                      <div>
                        <h3 className="text-xl font-bold mb-1">Eşleşme Oranı</h3>
                        <p className="text-sm text-muted-foreground">CV'niz bu ilanda belirtilen gereksinimlerin %{matchResult.matchScore}'ünü karşılıyor.</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* Eşleşen Yetenekler */}
                      <div className="p-4 rounded-xl border border-green-500/20 bg-green-500/5">
                        <h4 className="font-semibold text-green-600 dark:text-green-400 mb-3 flex items-center gap-2">
                          <Check className="w-4 h-4" /> Sahip Olduklarınız
                        </h4>
                        <div className="flex flex-wrap gap-2">
                          {matchResult.matchingSkills.length > 0 ? matchResult.matchingSkills.map((skill, i) => (
                            <span key={i} className="px-2.5 py-1 rounded-md text-[11px] font-bold bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300 border border-green-200 dark:border-green-800">
                              {skill}
                            </span>
                          )) : <span className="text-xs text-muted-foreground">Eşleşen spesifik bir yetenek bulunamadı.</span>}
                        </div>
                      </div>

                      {/* Eksik Yetenekler */}
                      <div className="p-4 rounded-xl border border-destructive/20 bg-destructive/5">
                        <h4 className="font-semibold text-destructive mb-3 flex items-center gap-2">
                          <AlertCircle className="w-4 h-4" /> Eksik Olanlar (İlanda İstenen)
                        </h4>
                        <div className="flex flex-wrap gap-2">
                          {matchResult.missingSkills.length > 0 ? matchResult.missingSkills.map((skill, i) => (
                            <span key={i} className="px-2.5 py-1 rounded-md text-[11px] font-bold bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300 border border-red-200 dark:border-red-800">
                              {skill}
                            </span>
                          )) : <span className="text-xs text-muted-foreground">İlanda istenip de sizde olmayan kritik bir yetenek bulunmadı!</span>}
                        </div>
                      </div>
                    </div>

                    {/* AI Advisor */}
                    <div className="p-4 rounded-xl border border-border bg-muted/30">
                      <h4 className="font-semibold mb-2 flex items-center gap-2 text-primary">
                        <Sparkles className="w-4 h-4" /> AI Danışman Tavsiyesi
                      </h4>
                      <p className="text-sm text-foreground/80 leading-relaxed">
                        {matchResult.advice}
                      </p>
                    </div>

                  </div>
                )}
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
