import { useState } from 'react';
import AIAssistButton from '../AIAssistButton';
import { useAI } from '@/hooks/useAI';
import { Target } from 'lucide-react';

interface Props {
  cvDataJson: string;
  data: string;
  onChange: (data: string) => void;
}

const MAX_CHARS = 600;

export default function Summary({ cvDataJson, data, onChange }: Props) {
  const remaining = MAX_CHARS - data.length;
  const isOverLimit = remaining < 0;
  
  const { generateSummary, isLoading, isRateLimited, remainingRequests } = useAI();
  const [drafts, setDrafts] = useState<string[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [targetPosition, setTargetPosition] = useState('');

  const handleGenerate = async () => {
    try {
      const result = await generateSummary(cvDataJson, targetPosition.trim() || undefined);
      if (result && result.length > 0) {
        setDrafts(result);
        setShowModal(true);
      }
    } catch {
      // hook handles error
    }
  };

  const handleSelectDraft = (draft: string) => {
    onChange(draft);
    setShowModal(false);
  };

  return (
    <div className="space-y-3">
      {/* Target position hint */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Target className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
          <input
            type="text"
            value={targetPosition}
            onChange={(e) => setTargetPosition(e.target.value)}
            placeholder="Hedef pozisyon (opsiyonel) — örn: 'Senior Frontend Developer'"
            className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border bg-background focus:outline-none focus:ring-2 focus:ring-primary/40 placeholder:text-muted-foreground/60"
          />
        </div>
      </div>

      <textarea
        value={data}
        onChange={(e) => onChange(e.target.value)}
        rows={5}
        placeholder="Kendinizi kısaca tanıtın. Güçlü yönlerinizi, kariyer hedeflerinizi ve en önemli başarılarınızı öne çıkarın. ATS sistemleri için anahtar kelimeler kullanın..."
        className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 resize-none"
      />
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleGenerate}
            disabled={isLoading || isRateLimited}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border bg-primary/5 text-primary hover:bg-primary/15 transition-colors disabled:opacity-50"
            title={remainingRequests !== null ? `${remainingRequests} hak kaldı` : 'Özet üret'}
          >
            {isLoading ? (
              <span className="animate-spin rounded-full h-3 w-3 border-b border-primary" />
            ) : (
              <span className="text-sm leading-none">✨</span>
            )}
            {targetPosition.trim() ? `"${targetPosition.trim().slice(0, 20)}" için Taslak` : 'AI ile Taslak Çıkar'}
          </button>
        </div>
        <div className="flex items-center gap-3">
          <AIAssistButton
            text={data}
            onAccept={(v) => onChange(v)}
            label="Mevcut Özeti Güçlendir"
            compact={false}
          />
          <span className={`text-xs font-medium ${isOverLimit ? 'text-destructive' : remaining < 50 ? 'text-yellow-600' : 'text-muted-foreground'}`}>
            {data.length}/{MAX_CHARS}
          </span>
        </div>
      </div>

      {/* AI Drafts Modal */}
      {showModal && drafts.length > 0 && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-card rounded-xl border shadow-xl w-full max-w-3xl max-h-[80vh] overflow-hidden flex flex-col">
            <div className="px-6 py-4 border-b flex items-center justify-between">
              <h3 className="font-semibold flex items-center gap-2">
                <span>✨</span>
                {targetPosition.trim() ? (
                  <>AI Özet Taslakları — <span className="text-primary font-bold">{targetPosition}</span></>
                ) : 'AI Özet Taslakları'}
              </h3>
              <button onClick={() => setShowModal(false)} className="text-muted-foreground hover:text-foreground">✕</button>
            </div>
            
            <div className="p-6 flex-1 overflow-y-auto space-y-4">
              <p className="text-sm text-muted-foreground">Profil verilerinize göre size en uygun taslağı seçin:</p>
              
              {drafts.map((draft, idx) => {
                const toneLabels = ['Kurumsal & Resmi', 'Yaratıcı & Dinamik', 'Teknik & Lider'];
                const label = toneLabels[idx] || `Alternatif ${idx + 1}`;
                return (
                  <div key={idx} className="border rounded-lg p-4 hover:border-primary/50 transition-colors">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold text-primary uppercase tracking-wider">{label}</span>
                      <button 
                        onClick={() => handleSelectDraft(draft)}
                        className="px-3 py-1.5 text-xs bg-primary text-primary-foreground rounded hover:bg-primary/90 transition-colors"
                      >
                        Bunu Kullan
                      </button>
                    </div>
                    <p className="text-sm text-foreground/90 leading-relaxed">{draft}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
