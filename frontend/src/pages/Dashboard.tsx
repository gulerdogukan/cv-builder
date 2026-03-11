import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCV } from '@/hooks/useCV';
import { useAuthStore } from '@/stores/authStore';
import Navbar from '@/components/layout/Navbar';

export default function Dashboard() {
  const { cvList, fetchCVList, createCV, deleteCV, isLoading: cvLoading } = useCV();
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [isCreating, setIsCreating] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    fetchCVList();
  }, [fetchCVList]);

  const handleCreateCV = async () => {
    setIsCreating(true);
    try {
      const cv = await createCV('Yeni CV');
      navigate(`/editor/${cv.id}`);
    } catch {
      // hata useCV hook'unda yönetilir
    } finally {
      setIsCreating(false);
    }
  };

  const handleDeleteCV = async (id: string) => {
    if (!window.confirm('Bu CV\'yi silmek istediğinize emin misiniz?')) return;
    setDeletingId(id);
    try {
      await deleteCV(id);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-muted/30">
      <Navbar />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        {/* Başlık ve yeni CV butonu */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold">CV'lerim</h1>
            {user && (
              <p className="text-sm text-muted-foreground mt-1">
                Hoş geldin, {user.fullName || user.email}
              </p>
            )}
          </div>
          <button
            onClick={handleCreateCV}
            disabled={isCreating}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors flex items-center gap-2"
          >
            {isCreating ? (
              <>
                <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-foreground" />
                Oluşturuluyor...
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Yeni CV Oluştur
              </>
            )}
          </button>
        </div>

        {/* CV listesi veya boş state */}
        {cvLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="flex flex-col items-center gap-3">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
              <p className="text-sm text-muted-foreground">CV'leriniz yükleniyor...</p>
            </div>
          </div>
        ) : cvList.length === 0 ? (
          <div className="rounded-xl border bg-card p-12 text-center">
            <div className="w-16 h-16 mx-auto rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h2 className="text-lg font-semibold">Henüz CV'niz yok</h2>
            <p className="mt-2 text-sm text-muted-foreground max-w-sm mx-auto">
              Profesyonel, ATS uyumlu CV'nizi dakikalar içinde oluşturun. AI destekli önerilerle fark yaratın.
            </p>
            <button
              onClick={handleCreateCV}
              disabled={isCreating}
              className="mt-6 rounded-lg bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              İlk CV'ni Oluştur
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {cvList.map((cv) => (
              <div
                key={cv.id}
                className="group rounded-xl border bg-card p-5 hover:shadow-md hover:border-primary/30 transition-all"
              >
                {/* Template badge */}
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold truncate">{cv.title}</h3>
                    <p className="text-xs text-muted-foreground mt-1">
                      Son düzenleme: {new Date(cv.updatedAt).toLocaleDateString('tr-TR', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                      })}
                    </p>
                  </div>
                  {cv.atsScore > 0 && (
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                      cv.atsScore >= 80 ? 'bg-green-100 text-green-700' :
                      cv.atsScore >= 50 ? 'bg-yellow-100 text-yellow-700' :
                      'bg-red-100 text-red-700'
                    }`}>
                      ATS: {cv.atsScore}
                    </span>
                  )}
                </div>

                {/* Template info */}
                <div className="mt-3 flex items-center gap-2">
                  <span className="text-xs px-2 py-0.5 rounded bg-muted text-muted-foreground capitalize">
                    {cv.template || 'modern'}
                  </span>
                </div>

                {/* Aksiyonlar */}
                <div className="flex items-center gap-2 mt-4">
                  <Link
                    to={`/editor/${cv.id}`}
                    className="flex-1 rounded-lg bg-primary/10 px-3 py-2 text-xs font-medium text-primary text-center hover:bg-primary/20 transition-colors"
                  >
                    Düzenle
                  </Link>
                  <button
                    onClick={() => handleDeleteCV(cv.id)}
                    disabled={deletingId === cv.id}
                    className="rounded-lg bg-destructive/10 px-3 py-2 text-xs font-medium text-destructive hover:bg-destructive/20 disabled:opacity-50 transition-colors"
                  >
                    {deletingId === cv.id ? '...' : 'Sil'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Alt bilgi — plan durumu */}
        {user && user.plan === 'free' && cvList.length > 0 && (
          <div className="mt-8 rounded-xl border bg-primary/5 p-4 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Ücretsiz plandayısınız</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Premium'a geçerek sınırsız CV oluşturun ve PDF indirin.
              </p>
            </div>
            <Link
              to="/pricing"
              className="rounded-lg bg-primary px-4 py-2 text-xs font-medium text-primary-foreground hover:bg-primary/90 transition-colors whitespace-nowrap"
            >
              Planları Gör
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
