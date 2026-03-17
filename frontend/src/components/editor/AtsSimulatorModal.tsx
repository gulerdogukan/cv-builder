import { X, CheckCircle2, Lightbulb, FileSearch, TrendingUp, BarChart2, MessageSquare } from 'lucide-react';
import { useEffect, useState } from 'react';

interface ATSScoreResult {
  score: number;
  readabilityScore: number;
  keywordDensityScore: number;
  completenessScore: number;
  impactScore: number;
  suggestions: string[];
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  result: ATSScoreResult | null;
  isLoading: boolean;
}

export default function AtsSimulatorModal({ isOpen, onClose, result, isLoading }: Props) {
  const [animate, setAnimate] = useState(false);

  useEffect(() => {
    if (!isLoading && result) {
      setTimeout(() => setAnimate(true), 100);
    } else {
      setAnimate(false);
    }
  }, [isLoading, result]);

  if (!isOpen) return null;

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-primary stroke-primary bg-primary/10 border-primary/20';
    if (score >= 60) return 'text-amber-500 stroke-amber-500 bg-amber-500/10 border-amber-500/20';
    return 'text-destructive stroke-destructive bg-destructive/10 border-destructive/20';
  };

  const getProgressBarColor = (score: number) => {
    if (score >= 80) return 'bg-primary';
    if (score >= 60) return 'bg-amber-500';
    return 'bg-destructive';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
      <div className="bg-card w-full max-w-2xl max-h-[90vh] rounded-2xl shadow-xl border border-border flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-border flex items-center justify-between shrink-0 bg-muted/30">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-primary flex items-center justify-center shadow-lg shadow-primary/20">
              <FileSearch className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold">ATS Simülatörü</h2>
              <p className="text-sm text-muted-foreground">Özgeçmişinizin sistem uyumluluk analizi</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 flex flex-col items-center">
          
          {isLoading ? (
            <div className="py-20 flex flex-col items-center justify-center text-center max-w-sm">
              <div className="relative w-20 h-20 mb-6">
                <svg className="animate-spin w-full h-full text-muted" viewBox="0 0 50 50">
                  <circle className="stroke-current opacity-25" cx="25" cy="25" r="20" fill="none" strokeWidth="4"></circle>
                  <circle className="stroke-primary" cx="25" cy="25" r="20" fill="none" strokeWidth="4" strokeDasharray="90 150" strokeLinecap="round"></circle>
                </svg>
                <FileSearch className="absolute inset-0 m-auto w-8 h-8 text-primary animate-pulse" />
              </div>
              <h3 className="text-lg font-bold mb-2">Yapay Zeka Devrede</h3>
              <p className="text-sm text-muted-foreground">
                CV'niz okunabilirlik, anahtar kelime yoğunluğu ve yapısal bütünlük açısından analiz ediliyor...
              </p>
            </div>
          ) : result ? (
            <div className="w-full space-y-8">
              
              {/* Overall Score Section */}
              <div className="flex flex-col md:flex-row items-center gap-8 justify-center p-6 border border-border rounded-xl bg-muted/10">
                <div className="relative w-40 h-40 shrink-0">
                  <svg className="w-full h-full -rotate-90 transform" viewBox="0 0 36 36" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="18" cy="18" r="16" fill="none" className="stroke-muted" strokeWidth="2.5" />
                    <circle 
                      cx="18" cy="18" r="16" fill="none" 
                      className={`${getScoreColor(result.score).split(' ')[1]} transition-all duration-1000 ease-out`} 
                      strokeWidth="2.5" 
                      strokeDasharray={animate ? `${result.score}, 100` : "0, 100"} 
                      strokeLinecap="round" 
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className={`text-4xl font-black ${getScoreColor(result.score).split(' ')[0]}`}>
                      {result.score}
                    </span>
                    <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">SKOR</span>
                  </div>
                </div>

                <div className="text-center md:text-left">
                  <h3 className="text-2xl font-bold mb-2">
                    {result.score >= 80 ? 'Mükemmel Uyum! 🎯' : result.score >= 60 ? 'Geliştirilebilir 👍' : 'Kritik Uyarılar Var ⚠️'}
                  </h3>
                  <p className="text-sm text-muted-foreground max-w-sm">
                    {result.score >= 80 
                      ? "CV'niz çoğu İnsan Kaynakları bariyerini ve filtreleme yazılımını rahatlıkla geçebilecek seviyede."
                      : result.score >= 60
                      ? "CV'niz iyi yolda ancak filtrelerden firesiz geçmesi için aşağıdaki tavsiyelere kulak verin."
                      : "Bu CV mevcut haliyle muhtemelen otomatik sistemler tarafından reddedilecektir. Lütfen eksikleri giderin."}
                  </p>
                </div>
              </div>

              {/* Sub Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  { label: "Okunabilirlik ve Format", value: result.readabilityScore, icon: <FileSearch className="w-4 h-4" />, desc: "Otomatik sistemlerin bilgiyi parse etme kolaylığı" },
                  { label: "Anahtar Kelime Yoğunluğu", value: result.keywordDensityScore, icon: <BarChart2 className="w-4 h-4" />, desc: "Sektörel ve teknik kelimelerin yeterliliği" },
                  { label: "Doluluk Oranı", value: result.completenessScore, icon: <CheckCircle2 className="w-4 h-4" />, desc: "Kişisel, eğitim ve iletişim bilgilerinin mevcudiyeti" },
                  { label: "Başarı Etkisi", value: result.impactScore, icon: <TrendingUp className="w-4 h-4" />, desc: "Sayısal veriler ve güçlü aksiyon fiili kullanımı" }
                ].map((metric, i) => (
                  <div key={i} className={`p-4 rounded-xl border ${getScoreColor(metric.value).split(' ').slice(2).join(' ')} transition-colors`}>
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex items-center gap-2">
                        <div className={`p-1.5 rounded-md bg-background/50 ${getScoreColor(metric.value).split(' ')[0]}`}>
                          {metric.icon}
                        </div>
                        <div>
                          <h4 className="font-semibold text-sm">{metric.label}</h4>
                          <span className={`text-xs ${getScoreColor(metric.value).split(' ')[0]}`}>
                            {metric.value >= 80 ? 'Güçlü' : metric.value >= 60 ? 'Orta' : 'Zayıf'}
                          </span>
                        </div>
                      </div>
                      <span className={`font-bold ${getScoreColor(metric.value).split(' ')[0]}`}>{metric.value}</span>
                    </div>
                    <div className="h-1.5 w-full bg-background rounded-full overflow-hidden mt-3">
                      <div 
                        className={`h-full rounded-full ${getProgressBarColor(metric.value)} transition-all duration-1000 ease-out`}
                        style={{ width: animate ? `${metric.value}%` : '0%' }}
                      />
                    </div>
                    <p className="text-[10px] text-muted-foreground mt-2">{metric.desc}</p>
                  </div>
                ))}
              </div>

              {/* Suggestions */}
              {result.suggestions && result.suggestions.length > 0 && (
                <div className="border border-border rounded-xl p-5 bg-card">
                  <h4 className="font-semibold flex items-center gap-2 mb-4">
                    <MessageSquare className="w-4 h-4 text-primary" />
                    İyileştirme Önerileri
                  </h4>
                  <ul className="space-y-3">
                    {result.suggestions.map((sug, i) => (
                      <li key={i} className="flex gap-3 text-sm">
                        <Lightbulb className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                        <span className="text-muted-foreground leading-relaxed">{sug}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

            </div>
          ) : (
            <div className="py-10 text-center text-muted-foreground">
              Analiz yapılamadı.
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
