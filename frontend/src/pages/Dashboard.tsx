import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCV } from '@/hooks/useCV';
import { useSEO } from '@/hooks/useSEO';
import { useAuthStore } from '@/stores/authStore';
import { useNotificationStore } from '@/stores/notificationStore';
import Navbar from '@/components/layout/Navbar';
import ImportCVModal from '@/components/dashboard/ImportCVModal';
import LinkedInImportModal from '@/components/dashboard/LinkedInImportModal';
import { motion } from 'framer-motion';
import { Linkedin, Copy } from 'lucide-react';

export default function Dashboard() {
  useSEO({ title: 'Dashboard', description: 'CV listeniği yönetin, yeni CV oluşturun.', noIndex: true });
  const { cvList, fetchCVList, createCV, deleteCV, duplicateCV, isLoading: cvLoading } = useCV();
  const { user } = useAuthStore();
  const { confirm, showToast } = useNotificationStore();
  const navigate = useNavigate();

  const [isCreating, setIsCreating] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showLinkedInModal, setShowLinkedInModal] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [duplicatingId, setDuplicatingId] = useState<string | null>(null);

  useEffect(() => {
    fetchCVList();
  }, [fetchCVList]);

  const handleCreateCV = async () => {
    setIsCreating(true);
    try {
      const cv = await createCV('Yeni CV');
      navigate(`/editor/${cv.id}`);
    } catch {
      showToast('CV oluşturulamadı. Lütfen tekrar deneyin.', 'error');
    } finally {
      setIsCreating(false);
    }
  };

  const handleDeleteCV = (id: string) => {
    confirm({
      title: 'CV Silme Onayı',
      message: 'Bu CV\'yi silmek istediğinize emin misiniz? Bu işlem geri alınamaz.',
      confirmLabel: 'Sil',
      variant: 'danger',
      onConfirm: async () => {
        setDeletingId(id);
        try {
          await deleteCV(id);
          showToast('CV başarıyla silindi.', 'success');
        } catch {
          showToast('CV silinirken bir hata oluştu.', 'error');
        } finally {
          setDeletingId(null);
        }
      }
    });
  };

  const handleDuplicateCV = async (id: string) => {
    setDuplicatingId(id);
    try {
      await duplicateCV(id);
      showToast('CV başarıyla kopyalandı.', 'success');
    } catch {
      showToast('CV kopyalanamadı. Tekrar deneyin.', 'error');
    } finally {
      setDuplicatingId(null);
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
          <div className="flex items-center gap-3">
            <button
              onClick={handleCreateCV}
              disabled={isCreating}
              className="rounded-lg border border-primary/20 bg-background px-4 py-2 text-sm font-medium text-primary hover:bg-primary/5 hover:border-primary/40 disabled:opacity-50 transition-colors flex items-center gap-2"
            >
              {isCreating ? (
                <>
                  <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary" />
                  Hazırlanıyor...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Sıfırdan Başla
                </>
              )}
            </button>
            <button
              onClick={() => setShowImportModal(true)}
              className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors flex items-center gap-2 shadow-md shadow-primary/20 hover:shadow-lg hover:shadow-primary/30"
            >
              <span>✨</span>
              Eski CV'ni Akıllandır
            </button>
            <button
              onClick={() => setShowLinkedInModal(true)}
              className="rounded-lg bg-blue-500 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-600 transition-colors flex items-center gap-2 shadow-md shadow-blue-500/20"
            >
              <Linkedin className="w-4 h-4" />
              LinkedIn'den Aktar
            </button>
          </div>
        </div>

        {/* CV listesi veya boş state */}
        {cvLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="rounded-xl border bg-card p-5 space-y-4 animate-pulse">
                <div className="flex justify-between items-start">
                  <div className="space-y-2 flex-1">
                    <div className="h-4 bg-muted rounded w-2/3" />
                    <div className="h-3 bg-muted rounded w-1/2" />
                  </div>
                  <div className="h-5 w-12 bg-muted rounded-full" />
                </div>
                <div className="h-4 w-16 bg-muted rounded mt-3" />
                <div className="flex gap-2 mt-4">
                  <div className="h-8 flex-1 bg-muted rounded-lg" />
                  <div className="h-8 w-14 bg-muted rounded-lg" />
                </div>
              </div>
            ))}
          </div>
        ) : cvList.length === 0 ? (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-xl border bg-card p-12 text-center"
          >
            <div className="w-16 h-16 mx-auto rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h2 className="text-lg font-semibold">Henüz CV'niz yok</h2>
            <p className="mt-2 text-sm text-muted-foreground max-w-sm mx-auto">
              Profesyonel, ATS uyumlu CV'nizi dakikalar içinde oluşturun. AI destekli önerilerle fark yaratın.
            </p>
            <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                onClick={handleCreateCV}
                disabled={isCreating}
                className="w-full sm:w-auto rounded-lg border border-primary/20 bg-background px-6 py-2.5 text-sm font-medium text-primary hover:bg-primary/5 transition-colors"
              >
                Sıfırdan Başla
              </button>
              <button
                onClick={() => setShowImportModal(true)}
                className="w-full sm:w-auto rounded-lg bg-primary px-6 py-2.5 text-sm font-bold text-primary-foreground hover:bg-primary/90 transition-colors flex items-center justify-center gap-2 shadow-md shadow-primary/20"
              >
                <span>✨</span>
                CV'ni Akıllandır
              </button>
            </div>
          </motion.div>
        ) : (
          <motion.div 
            initial="hidden"
            animate="show"
            variants={{
              hidden: { opacity: 0 },
              show: {
                opacity: 1,
                transition: {
                  staggerChildren: 0.05
                }
              }
            }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
          >
            {cvList.map((cv) => (
              <motion.div
                key={cv.id}
                variants={{
                  hidden: { opacity: 0, y: 20 },
                  show: { opacity: 1, y: 0 }
                }}
                className="group rounded-xl border border-border bg-card p-5 transition-all duration-200 hover:border-primary/50 hover:shadow-lg hover:shadow-primary/5"
              >
                {/* Template badge */}
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-foreground truncate">{cv.title}</h3>
                    <p className="text-xs text-muted-foreground mt-1">
                      Son düzenleme: {new Date(cv.updatedAt).toLocaleDateString('tr-TR', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                      })}
                    </p>
                  </div>
                  {cv.atsScore > 0 && (
                    <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${
                      cv.atsScore >= 80 ? 'bg-green-100/50 text-green-700 dark:bg-green-900/40 dark:text-green-400' :
                      cv.atsScore >= 50 ? 'bg-yellow-100/50 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-400' :
                      'bg-red-100/50 text-red-700 dark:bg-red-900/40 dark:text-red-400'
                    }`}>
                      ATS: {cv.atsScore}
                    </span>
                  )}
                </div>

                {/* Template info */}
                <div className="mt-4 flex items-center gap-2">
                  <span className="text-xs px-2 py-0.5 rounded bg-muted/50 text-muted-foreground capitalize border border-border/50">
                    {cv.template || 'modern'}
                  </span>
                </div>

                {/* Aksiyonlar */}
                <div className="flex items-center gap-2 mt-5">
                  <Link
                    to={`/editor/${cv.id}`}
                    className="flex-1 rounded-lg bg-primary/10 px-3 py-2 text-xs font-semibold text-primary text-center hover:bg-primary/20 transition-colors"
                  >
                    Düzenle
                  </Link>
                  <button
                    onClick={() => handleDuplicateCV(cv.id)}
                    disabled={duplicatingId === cv.id}
                    title="Kopyala"
                    className="rounded-lg bg-muted px-3 py-2 text-xs font-semibold text-muted-foreground hover:bg-muted/80 disabled:opacity-50 transition-colors flex items-center gap-1"
                  >
                    {duplicatingId === cv.id ? <span className="animate-spin rounded-full h-3 w-3 border-b border-foreground" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                  <button
                    onClick={() => handleDeleteCV(cv.id)}
                    disabled={deletingId === cv.id}
                    className="rounded-lg bg-destructive/10 px-3 py-2 text-xs font-semibold text-destructive hover:bg-destructive/20 disabled:opacity-50 transition-colors"
                  >
                    {deletingId === cv.id ? '...' : 'Sil'}
                  </button>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}

        {/* Alt bilgi — plan durumu */}
        {user && user.plan === 'free' && cvList.length > 0 && (
          <div className="mt-8 rounded-xl border bg-primary/5 p-4 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Ücretsiz plandasınız</p>
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
      
      {showImportModal && (
        <ImportCVModal onClose={() => setShowImportModal(false)} />
      )}
      <LinkedInImportModal
        isOpen={showLinkedInModal}
        onClose={() => setShowLinkedInModal(false)}
      />
    </div>
  );
}
