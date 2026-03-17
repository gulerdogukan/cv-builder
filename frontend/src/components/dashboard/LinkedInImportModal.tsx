import { useState } from 'react';
import { X, Linkedin, FileCheck, AlertCircle, ArrowRight } from 'lucide-react';
import { useAI } from '@/hooks/useAI';
import { useCV } from '@/hooks/useCV';
import { useNavigate } from 'react-router-dom';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

const HINT_TEXT = `Nasıl kopyalarım?
1. LinkedIn profil sayfanıza gidin (linkedin.com/in/...)
2. Hakkında / About, Deneyim, Eğitim ve Yetenekler bölümlerini seçip kopyalayın
3. Buraya yapıştırın`;

export default function LinkedInImportModal({ isOpen, onClose }: Props) {
  const { importLinkedIn, isLoading, error } = useAI();
  const { createCV } = useCV();
  const navigate = useNavigate();

  const [profileText, setProfileText] = useState('');
  const [preview, setPreview] = useState<any>(null);
  const [step, setStep] = useState<'input' | 'preview'>('input');

  if (!isOpen) return null;

  const handleImport = async () => {
    if (!profileText.trim()) return;
    try {
      const cvDataJson = await importLinkedIn(profileText);
      if (cvDataJson) {
        const parsed = JSON.parse(cvDataJson);
        setPreview(parsed);
        setStep('preview');
      }
    } catch {
      // error is exposed via hook
    }
  };

  const handleApply = async () => {
    if (!preview) return;
    try {
      const fullName = preview.personal?.fullName || 'LinkedIn CV';
      const cv = await createCV(`${fullName} — LinkedIn`);
      // navigate to editor — existing import logic will populate
      navigate(`/editor/${cv.id}`, { state: { importData: preview } });
      onClose();
    } catch {
      // handled
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-card rounded-2xl border shadow-2xl w-full max-w-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b bg-gradient-to-r from-blue-500/10 to-blue-600/5">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-500/15 flex items-center justify-center">
              <Linkedin className="w-5 h-5 text-blue-500" />
            </div>
            <div>
              <h2 className="font-semibold text-base">LinkedIn Profil İçe Aktarma</h2>
              <p className="text-xs text-muted-foreground">Profilini yapıştır, AI CV'ye dönüştürsün</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {step === 'input' && (
          <div className="p-6 space-y-4">
            {/* Hint */}
            <div className="flex gap-2 p-3 rounded-lg bg-blue-50 text-blue-800 text-xs whitespace-pre-line border border-blue-100">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{HINT_TEXT}</span>
            </div>

            <textarea
              value={profileText}
              onChange={(e) => setProfileText(e.target.value)}
              placeholder="LinkedIn profil metnini buraya yapıştırın..."
              rows={10}
              className="w-full rounded-xl border bg-background px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400/40 resize-none"
            />

            {error && (
              <p className="text-xs text-destructive flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" />
                {error}
              </p>
            )}

            <div className="flex items-center justify-end gap-3">
              <button onClick={onClose} className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
                İptal
              </button>
              <button
                onClick={handleImport}
                disabled={isLoading || !profileText.trim()}
                className="flex items-center gap-2 px-5 py-2 text-sm font-medium rounded-xl bg-blue-500 text-white hover:bg-blue-600 disabled:opacity-50 transition-colors"
              >
                {isLoading ? (
                  <>
                    <span className="animate-spin rounded-full h-3.5 w-3.5 border-b border-white" />
                    Analiz ediliyor...
                  </>
                ) : (
                  <>
                    <Linkedin className="w-3.5 h-3.5" />
                    İçe Aktar
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {step === 'preview' && preview && (
          <div className="p-6 space-y-4">
            <div className="flex items-center gap-2 text-sm font-medium text-green-700">
              <FileCheck className="w-4 h-4 text-green-600" />
              Veriler başarıyla çıkarıldı!
            </div>

            <div className="border rounded-xl p-4 space-y-2 bg-muted/20 text-sm max-h-64 overflow-y-auto">
              <div><span className="font-medium">İsim:</span> {preview.personal?.fullName || '—'}</div>
              <div><span className="font-medium">Meslek:</span> {preview.personal?.profession || '—'}</div>
              <div><span className="font-medium">Konum:</span> {preview.personal?.location || '—'}</div>
              <div><span className="font-medium">Özet:</span> {preview.summary ? preview.summary.slice(0, 100) + '...' : '—'}</div>
              <div><span className="font-medium">Deneyim:</span> {preview.experience?.length ?? 0} kayıt</div>
              <div><span className="font-medium">Eğitim:</span> {preview.education?.length ?? 0} kayıt</div>
              <div><span className="font-medium">Yetenek:</span> {preview.skills?.length ?? 0} kayıt</div>
            </div>

            <div className="flex items-center justify-between pt-2">
              <button
                onClick={() => setStep('input')}
                className="text-sm text-muted-foreground hover:text-foreground"
              >
                ← Geri
              </button>
              <button
                onClick={handleApply}
                disabled={isLoading}
                className="flex items-center gap-2 px-5 py-2 text-sm font-medium rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
              >
                Editöre Aktar
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
