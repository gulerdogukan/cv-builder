import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useRequireAuth } from '@/hooks/useAuth';
import { useCV } from '@/hooks/useCV';
import { useAuthStore } from '@/stores/authStore';

export default function Dashboard() {
  const { isLoading: authLoading } = useRequireAuth();
  const { cvList, fetchCVList, createCV, deleteCV } = useCV();
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    fetchCVList();
  }, [fetchCVList]);

  const handleCreateCV = async () => {
    setIsCreating(true);
    try {
      const cv = await createCV('Yeni CV');
      navigate(`/editor/${cv.id}`);
    } finally {
      setIsCreating(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Navbar */}
      <nav className="border-b bg-card px-6 py-3 flex items-center justify-between">
        <Link to="/" className="text-xl font-bold text-primary">CV Builder</Link>
        <div className="flex items-center gap-4">
          <span className="text-sm text-muted-foreground">{user?.email}</span>
          <button
            onClick={logout}
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            Çıkış
          </button>
        </div>
      </nav>

      {/* Content */}
      <div className="max-w-5xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-bold">CV&apos;lerim</h1>
          <button
            onClick={handleCreateCV}
            disabled={isCreating}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
          >
            {isCreating ? 'Oluşturuluyor...' : '+ Yeni CV Oluştur'}
          </button>
        </div>

        {cvList.length === 0 ? (
          <div className="rounded-xl border bg-card p-12 text-center">
            <div className="text-4xl mb-4">📝</div>
            <h2 className="text-lg font-semibold">Henüz CV&apos;niz yok</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              İlk CV&apos;nizi oluşturmaya başlayın.
            </p>
            <button
              onClick={handleCreateCV}
              disabled={isCreating}
              className="mt-6 rounded-lg bg-primary px-6 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            >
              İlk CV&apos;ni Oluştur
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {cvList.map((cv) => (
              <div key={cv.id} className="rounded-xl border bg-card p-5 hover:shadow-md transition-shadow">
                <h3 className="font-semibold truncate">{cv.title}</h3>
                <p className="text-xs text-muted-foreground mt-1">
                  {new Date(cv.updatedAt).toLocaleDateString('tr-TR')}
                </p>
                <div className="flex items-center gap-2 mt-4">
                  <Link
                    to={`/editor/${cv.id}`}
                    className="flex-1 rounded-lg bg-primary/10 px-3 py-1.5 text-xs font-medium text-primary text-center hover:bg-primary/20"
                  >
                    Düzenle
                  </Link>
                  <button
                    onClick={() => deleteCV(cv.id)}
                    className="rounded-lg bg-destructive/10 px-3 py-1.5 text-xs font-medium text-destructive hover:bg-destructive/20"
                  >
                    Sil
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
