import { useState, useCallback } from 'react';
import api from '@/lib/api';

interface PdfExportOptions {
  cvId: string;
  title?: string;
}

export function usePdf() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const exportPdf = useCallback(async ({ cvId, title = 'cv' }: PdfExportOptions) => {
    setIsGenerating(true);
    setError(null);

    try {
      // Backend binary response olarak döndürüyor
      const response = await api.post(
        `/api/pdf/${cvId}/export`,
        {},
        { responseType: 'blob' }
      );

      // Blob'dan indirme bağlantısı oluştur
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);

      const a = document.createElement('a');
      a.href = url;
      a.download = `${sanitizeFilename(title)}.pdf`;
      document.body.appendChild(a);
      a.click();

      // Temizlik
      setTimeout(() => {
        URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }, 100);

      return true;
    } catch (err) {
      if (err && typeof err === 'object' && 'response' in err) {
        const axiosErr = err as {
          response?: { status: number; data?: Blob };
        };
        const status = axiosErr.response?.status;

        if (status === 402) {
          setError('PDF indirme özelliği sadece Premium kullanıcılara açıktır.');
          throw new Error('UPGRADE_REQUIRED');
        }

        if (status === 503 || status === 500) {
          // Error body is a Blob when responseType:'blob' — read it for details
          let detail = 'PDF servisi şu anda kullanılamıyor.';
          try {
            const blob = axiosErr.response?.data as Blob;
            const text = await blob.text();
            const json = JSON.parse(text);
            if (json?.error) detail = json.error;
          } catch {
            // ignore — use default message
          }
          setError(detail);
          throw new Error('SERVICE_UNAVAILABLE');
        }
      }

      const message = err instanceof Error ? err.message : 'PDF oluşturulamadı.';
      setError(message);
      throw err;
    } finally {
      setIsGenerating(false);
    }
  }, []);

  return { exportPdf, isGenerating, error };
}

function sanitizeFilename(name: string): string {
  return name
    .replace(/[^\w\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .toLowerCase()
    .slice(0, 60) || 'cv';
}
