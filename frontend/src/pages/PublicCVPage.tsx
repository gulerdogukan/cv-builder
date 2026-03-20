import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '@/lib/api';
import type { CV } from '@/types/cv.types';
import CVPreview from '@/components/preview/CVPreview';
import { Loader2, Globe, AlertCircle, Laptop } from 'lucide-react';

export default function PublicCVPage() {
  const { id } = useParams<{ id: string }>();
  const [cv, setCv] = useState<CV | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPublicCV = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await api.get<CV>(`/api/public/cv/${id}`);
        setCv(response.data);
      } catch (err: unknown) {
        const status = (err as { response?: { status?: number } })?.response?.status;
        if (status === 404) {
          setError('Bu CV bulunamadı veya paylaşımı kapatılmış.');
        } else {
          setError('CV yüklenirken bir hata oluştu.');
        }
      } finally {
        setIsLoading(false);
      }
    };

    if (id) fetchPublicCV();
  }, [id]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-muted/20">
        <Loader2 className="w-10 h-10 text-primary animate-spin mb-4" />
        <p className="text-sm text-muted-foreground font-medium">CV Yükleniyor...</p>
      </div>
    );
  }

  if (error || !cv) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-muted/20">
        <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mb-6">
          <AlertCircle className="w-8 h-8 text-destructive" />
        </div>
        <h1 className="text-xl font-bold text-foreground mb-2">Ops! Bir Sorun Var</h1>
        <p className="text-muted-foreground text-center max-w-sm mb-8">
          {error || 'Erişmek istediğiniz CV şu anda mevcut değil.'}
        </p>
        <Link
          to="/"
          className="px-6 py-2.5 bg-primary text-primary-foreground rounded-xl font-semibold hover:bg-primary/90 transition-all shadow-lg shadow-primary/20"
        >
          Kendi CV'ni Oluştur
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Mini Navbar */}
      <nav className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b">
        <div className="max-w-screen-xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-white font-bold text-lg">
              ✨
            </div>
            <span className="font-bold text-sm hidden sm:inline">CV Builder</span>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-100 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800">
              <Globe className="w-3.5 h-3.5" />
              <span className="text-[11px] font-bold uppercase tracking-wider">Herkese Açık Profil</span>
            </div>
            
            <Link
              to="/register"
              className="flex items-center gap-2 px-4 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-bold hover:bg-primary/90 transition-all shadow-md shadow-primary/10"
            >
              <Laptop className="w-3.5 h-3.5" />
              Hemen Başla
            </Link>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto p-4 sm:p-8">
        <div className="bg-white rounded-2xl shadow-2xl shadow-black/5 border overflow-hidden">
          <CVPreview
            data={cv.data}
            template={cv.template}
            accentColor={cv.accentColor}
            fontFamily={cv.fontFamily}
          />
        </div>

        {/* Footer */}
        <div className="mt-12 text-center pb-12">
          <p className="text-sm text-muted-foreground">
            Bu CV <span className="font-bold text-foreground">CV Builder</span> ile oluşturulmuştur.
          </p>
          <div className="mt-4 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs">
            <Link to="/" className="text-muted-foreground hover:text-primary transition-colors">Ana Sayfa</Link>
            <Link to="/pricing" className="text-muted-foreground hover:text-primary transition-colors">Fiyatlandırma</Link>
            <span className="text-muted-foreground/30">•</span>
            <span className="text-muted-foreground">© 2024 CV Builder</span>
          </div>
        </div>
      </main>
    </div>
  );
}
