import { useState } from 'react';
import { useAI } from '@/hooks/useAI';

interface Props {
  text: string;
  onAccept: (text: string) => void;
  label?: string;
  /** Compact mode: sadece ikon göster, metin gizle */
  compact?: boolean;
}

export default function AIAssistButton({ text, onAccept, label = 'AI ile Güçlendir', compact = false }: Props) {
  const { enhanceText, isLoading, error, isRateLimited } = useAI();
  const [suggestion, setSuggestion] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  const handleEnhance = async () => {
    if (!text.trim()) return;
    try {
      const enhanced = await enhanceText(text);
      setSuggestion(enhanced);
      setIsOpen(true);
    } catch {
      // error handled in hook — isRateLimited will be set
    }
  };

  const handleAccept = () => {
    if (suggestion) {
      onAccept(suggestion);
      setSuggestion(null);
      setIsOpen(false);
    }
  };

  const handleReject = () => {
    setSuggestion(null);
    setIsOpen(false);
  };

  return (
    <>
      <div className="flex flex-col items-end gap-1">
        <button
          type="button"
          onClick={handleEnhance}
          disabled={isLoading || !text.trim() || isRateLimited}
          title={isRateLimited ? 'Günlük AI limitine ulaştınız' : label}
          className={`inline-flex items-center gap-1.5 text-xs font-medium transition-colors ${
            isRateLimited
              ? 'text-muted-foreground cursor-not-allowed opacity-50'
              : 'text-primary hover:text-primary/80 disabled:opacity-50 disabled:cursor-not-allowed'
          }`}
        >
          {isLoading ? (
            <>
              <span className="animate-spin rounded-full h-3 w-3 border-b border-primary" />
              {!compact && 'Güçlendiriliyor...'}
            </>
          ) : (
            <>
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              {!compact && label}
            </>
          )}
        </button>

        {/* Rate limit / error mesajı */}
        {isRateLimited && (
          <p className="text-[10px] text-destructive">Günlük limit doldu</p>
        )}
        {error && !isRateLimited && (
          <p className="text-[10px] text-destructive">{error}</p>
        )}
      </div>

      {/* Öneri Modal */}
      {isOpen && suggestion && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-card rounded-xl border shadow-xl w-full max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
            <div className="px-6 py-4 border-b flex items-center justify-between">
              <h3 className="font-semibold flex items-center gap-2">
                <svg className="w-4 h-4 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                AI Önerisi
              </h3>
              <button onClick={handleReject} className="text-muted-foreground hover:text-foreground">✕</button>
            </div>

            <div className="p-6 flex-1 overflow-y-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-2">ORİJİNAL</p>
                  <div className="rounded-lg border bg-muted/50 p-3 text-sm leading-relaxed">
                    {text}
                  </div>
                </div>
                <div>
                  <p className="text-xs font-medium text-primary mb-2">AI ÖNERİSİ</p>
                  <div className="rounded-lg border border-primary/30 bg-primary/5 p-3 text-sm leading-relaxed">
                    {suggestion}
                  </div>
                </div>
              </div>
            </div>

            <div className="px-6 py-4 border-t flex items-center justify-end gap-3">
              <button
                onClick={handleReject}
                className="px-4 py-2 text-sm rounded-lg border hover:bg-muted transition-colors"
              >
                Reddet
              </button>
              <button
                onClick={handleAccept}
                className="px-4 py-2 text-sm rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
              >
                Kabul Et
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
