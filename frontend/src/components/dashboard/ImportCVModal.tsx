import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAI } from '@/hooks/useAI';
import { useCV } from '@/hooks/useCV';
import { useNotificationStore } from '@/stores/notificationStore';
import type { CVData } from '@/types/cv.types';

interface Props {
  onClose: () => void;
}

export default function ImportCVModal({ onClose }: Props) {
  const [isDragging, setIsDragging] = useState(false);
  const [parsedData, setParsedData] = useState<CVData | null>(null);
  const { importCVFromPdf, isLoading, isRateLimited, remainingRequests } = useAI();
  const { createCV, hydrateCV } = useCV();
  const { showToast } = useNotificationStore();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => setIsDragging(false);

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const selectedFile = e.dataTransfer.files.item(0);
      if (selectedFile) await processFile(selectedFile);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selectedFile = e.target.files.item(0);
      if (selectedFile) await processFile(selectedFile);
    }
  };

  const processFile = async (selectedFile: File) => {
    if (selectedFile.type !== 'application/pdf') {
      showToast('Lütfen sadece PDF dosyası yükleyin.', 'error');
      return;
    }
    try {
      const jsonStr = await importCVFromPdf(selectedFile);
      if (jsonStr) {
        setParsedData(JSON.parse(jsonStr));
        showToast('CV başarıyla analiz edildi.', 'success');
      }
    } catch {
      showToast('Dosya okunurken veya AI ile dönüşüm yapılırken hata oluştu.', 'error');
    }
  };

  const handleHydrate = async () => {
    if (!parsedData) return;
    try {
      const cv = await createCV(parsedData.personal?.fullName ? `${parsedData.personal.fullName} - İçe Aktarılan CV` : 'İçe Aktarılan CV');
      await hydrateCV(cv.id, parsedData);
      showToast('CV editöre başarıyla aktarıldı.', 'success');
      navigate(`/editor/${cv.id}`);
    } catch {
      showToast('CV editöre aktarılamadı.', 'error');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-card rounded-xl border shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="px-6 py-4 border-b flex items-center justify-between">
          <h3 className="font-semibold flex items-center gap-2">
            <span>✨</span> Eski CV'ni Akıllandır
          </h3>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">✕</button>
        </div>

        <div className="p-6 flex-1 overflow-y-auto">
          {!parsedData ? (
            <div className="space-y-6">
              <div className="text-center">
                <p className="text-lg font-medium text-foreground">
                  Sıfırdan yazma, bize bırak.
                </p>
                <p className="text-sm text-muted-foreground mt-1 max-w-md mx-auto">
                  Mevcut CV'ni yükle, saniyeler içinde akıllı taslak haline getirelim. Editörde dilediğin gibi düzenle.
                </p>
              </div>

              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`relative border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-all duration-300 ${
                  isDragging || isLoading
                    ? 'border-purple-500 bg-gradient-to-br from-purple-500/10 to-indigo-500/10'
                    : 'border-border/60 hover:border-purple-500/50 hover:bg-gradient-to-br hover:from-purple-500/5 hover:to-indigo-500/5'
                }`}
              >
                <input
                  type="file"
                  accept=".pdf"
                  className="hidden"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  disabled={isLoading || isRateLimited}
                />
                
                {isLoading ? (
                  <div className="space-y-4">
                    <div className="w-16 h-16 mx-auto rounded-full bg-primary/10 flex items-center justify-center">
                      <span className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
                    </div>
                    <p className="text-sm font-medium text-primary">Sihir gerçekleşiyor... Lütfen bekleyin.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="w-16 h-16 mx-auto rounded-full bg-primary/10 flex items-center justify-center text-3xl">
                      📂
                    </div>
                    <div>
                      <p className="text-sm font-medium">Sürükle bırak veya seçmek için tıkla</p>
                      <p className="text-xs text-muted-foreground mt-1">Sadece PDF dosyaları (.pdf)</p>
                    </div>
                  </div>
                )}
              </div>
              
              {remainingRequests !== undefined && remainingRequests !== null && (
                <p className={`text-center text-[10px] ${remainingRequests <= 1 ? 'text-destructive' : 'text-muted-foreground'}`}>
                  {isRateLimited ? '⚠️ Günlük limit doldu' : `${remainingRequests} AI isteği kaldı`}
                </p>
              )}
            </div>
          ) : (
            <div className="space-y-6">
              <div className="bg-green-500/10 border border-green-500/30 text-green-700 p-4 rounded-lg flex items-start gap-3">
                <span className="text-xl">✅</span>
                <div>
                  <h4 className="font-semibold text-sm">Veriler Başarıyla Ayıklandı</h4>
                  <p className="text-xs mt-1">Aşağıdaki önizlemeyi kontrol edin. Her şey doğruysa Editöre Aktar diyebilirsiniz.</p>
                </div>
              </div>

              <div className="space-y-4 text-sm bg-muted/20 p-4 rounded-lg border">
                <div>
                  <span className="text-muted-foreground text-xs uppercase font-medium">Kişisel:</span>
                  <p className="font-medium">{parsedData.personal?.fullName || '-'} {parsedData.personal?.profession ? `(${parsedData.personal.profession})` : ''}</p>
                </div>
                <div>
                  <span className="text-muted-foreground text-xs uppercase font-medium">Deneyimler ({parsedData.experience?.length || 0}):</span>
                  <ul className="list-disc list-inside mt-1">
                    {parsedData.experience?.map((e, idx) => (
                      <li key={idx} className="truncate">{e.position} @ {e.company}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <span className="text-muted-foreground text-xs uppercase font-medium">Eğitim ({parsedData.education?.length || 0}):</span>
                  <ul className="list-disc list-inside mt-1">
                    {parsedData.education?.map((e, idx) => (
                      <li key={idx} className="truncate">{e.degree} - {e.school}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <span className="text-muted-foreground text-xs uppercase font-medium">Yetenekler ({parsedData.skills?.length || 0}):</span>
                  <p className="mt-1">{parsedData.skills?.map(s => s.name).join(', ')}</p>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t">
                <button 
                  onClick={() => { setParsedData(null); }}
                  className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground"
                >
                  Yeniden Yükle
                </button>
                <button 
                  onClick={handleHydrate}
                  className="px-6 py-2 bg-primary text-primary-foreground text-sm font-semibold rounded-lg hover:bg-primary/90 transition-colors flex items-center gap-2"
                >
                  <span>✨</span> Editöre Aktar
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
