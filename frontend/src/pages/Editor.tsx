import { useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useRequireAuth } from '@/hooks/useAuth';
import { useCV } from '@/hooks/useCV';

export default function Editor() {
  const { id } = useParams<{ id: string }>();
  const { isLoading: authLoading } = useRequireAuth();
  const { currentCV, fetchCV, isSaving, lastSaved } = useCV();

  useEffect(() => {
    if (id) {
      fetchCV(id);
    }
  }, [id, fetchCV]);

  if (authLoading || !currentCV) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Editor Navbar */}
      <nav className="border-b bg-card px-4 py-2 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link to="/dashboard" className="text-sm text-muted-foreground hover:text-foreground">
            ← Dashboard
          </Link>
          <span className="font-semibold">{currentCV.title}</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-xs text-muted-foreground">
            {isSaving ? 'Kaydediliyor...' : lastSaved ? `Son kayıt: ${lastSaved.toLocaleTimeString('tr-TR')}` : ''}
          </span>
          <button className="rounded-lg bg-primary px-4 py-1.5 text-sm font-medium text-primary-foreground hover:bg-primary/90">
            PDF İndir
          </button>
        </div>
      </nav>

      {/* Editor Content — Phase 3'te doldurulacak */}
      <div className="flex-1 flex">
        <div className="w-1/2 border-r p-6 overflow-y-auto">
          <p className="text-muted-foreground text-sm">
            CV Editor formu burada olacak (Phase 3)
          </p>
        </div>
        <div className="w-1/2 bg-muted/30 p-6 overflow-y-auto">
          <p className="text-muted-foreground text-sm">
            Canlı önizleme burada olacak (Phase 3)
          </p>
        </div>
      </div>
    </div>
  );
}
