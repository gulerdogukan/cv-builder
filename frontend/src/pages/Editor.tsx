import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useCV } from '@/hooks/useCV';
import { useAuthStore } from '@/stores/authStore';
import { usePdf } from '@/hooks/usePdf';
import { useSEO } from '@/hooks/useSEO';
import type { TemplateType } from '@/types/cv.types';
import CVEditor from '@/components/editor/CVEditor';
import CVPreview from '@/components/preview/CVPreview';

type ViewMode = 'editor' | 'preview' | 'split';

export default function Editor() {
  useSEO({ title: 'CV Düzenle', noIndex: true });
  const { id } = useParams<{ id: string }>();
  const { currentCV, fetchCV, updateSection, updateCVTitle, isLoading } = useCV();
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const { exportPdf, isGenerating, error: pdfError } = usePdf();

  const [viewMode, setViewMode] = useState<ViewMode>('split');
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [titleInput, setTitleInput] = useState('');
  const [pdfToast, setPdfToast] = useState<string | null>(null);

  useEffect(() => {
    if (id) fetchCV(id);
  }, [id, fetchCV]);

  useEffect(() => {
    if (currentCV) setTitleInput(currentCV.title);
  }, [currentCV?.id]);

  // PDF hata toast
  useEffect(() => {
    if (pdfError) {
      setPdfToast(pdfError);
      const t = setTimeout(() => setPdfToast(null), 4000);
      return () => clearTimeout(t);
    }
  }, [pdfError]);

  const handleTitleSave = async () => {
    setIsEditingTitle(false);
    if (!currentCV || titleInput.trim() === currentCV.title) return;
    try {
      await updateCVTitle(currentCV.id, titleInput.trim() || 'Yeni CV');
    } catch {
      // title save failure is non-critical — silently restore
      setTitleInput(currentCV.title);
    }
  };

  const handleTemplateChange = (_template: TemplateType) => {};

  const handlePdfExport = async () => {
    if (!currentCV) return;
    try {
      await exportPdf({ cvId: currentCV.id, title: currentCV.title });
      setPdfToast('\u2713 PDF ba\u015far\u0131yla indirildi!');
      setTimeout(() => setPdfToast(null), 3000);
    } catch (err) {
      if (err instanceof Error && err.message === 'UPGRADE_REQUIRED') {
        navigate('/pricing');
      }
    }
  };

  if (isLoading || !currentCV) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/20">
        <div className="flex flex-col items-center gap-3">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          <p className="text-sm text-muted-foreground">CV y\u00fckleniyor...</p>
        </div>
      </div>
    );
  }

  const defaultData = {
    personal: { fullName: '', email: '', phone: '', location: '' },
    summary: '',
    experience: [],
    education: [],
    skills: [],
    languages: [],
    certifications: [],
  };

  const cvData = currentCV.data ?? defaultData;
  const isPaid = user?.plan === 'paid';

  return (
    <div className="h-screen flex flex-col bg-background overflow-hidden">
      {pdfToast && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-2.5 rounded-lg shadow-lg text-sm font-medium transition-all ${
          pdfToast.startsWith('\u2713') ? 'bg-green-600 text-white' : 'bg-destructive text-destructive-foreground'
        }`}>
          {pdfToast}
        </div>
      )}

      <nav className="border-b bg-card px-3 py-2 flex items-center gap-3 flex-shrink-0">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <button
            onClick={() => navigate('/dashboard')}
            className="text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1 text-sm shrink-0"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            <span className="hidden sm:inline">Dashboard</span>
          </button>
          <div className="h-4 w-px bg-border" />
          {isEditingTitle ? (
            <input
              autoFocus
              value={titleInput}
              onChange={(e) => setTitleInput(e.target.value)}
              onBlur={handleTitleSave}
              onKeyDown={(e) => e.key === 'Enter' && handleTitleSave()}
              className="flex-1 min-w-0 text-sm font-semibold bg-transparent border-b border-primary focus:outline-none px-0"
            />
          ) : (
            <button
              onClick={() => setIsEditingTitle(true)}
              className="flex-1 min-w-0 text-sm font-semibold truncate text-left hover:text-primary transition-colors"
              title="Ba\u015fl\u0131\u011f\u0131 d\u00fczenlemek i\u00e7in t\u0131klay\u0131n"
            >
              {currentCV.title}
            </button>
          )}
        </div>

        <div className="hidden md:flex items-center gap-1 bg-muted rounded-lg p-1">
          {([
            { key: 'editor', label: 'D\u00fczenle', icon: '\u270f\ufe0f' },
            { key: 'split',  label: '\u0130kiye B\u00f6l', icon: '\u229f' },
            { key: 'preview', label: '\u00d6nizle', icon: '\ud83d\udc41' },
          ] as { key: ViewMode; label: string; icon: string }[]).map((mode) => (
            <button
              key={mode.key}
              onClick={() => setViewMode(mode.key)}
              className={`px-2.5 py-1 rounded text-xs font-medium transition-colors flex items-center gap-1 ${
                viewMode === mode.key ? 'bg-background shadow-sm' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <span>{mode.icon}</span>
              <span className="hidden lg:inline">{mode.label}</span>
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {isPaid ? (
            <button
              onClick={handlePdfExport}
              disabled={isGenerating}
              className="rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-70 transition-colors flex items-center gap-1.5"
            >
              {isGenerating ? (
                <>
                  <span className="animate-spin rounded-full h-3 w-3 border-b border-white" />
                  Olu\u015fturuluyor...
                </>
              ) : (
                <>
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  PDF \u0130ndir
                </>
              )}
            </button>
          ) : (
            <Link
              to="/pricing"
              className="rounded-lg border border-primary px-3 py-1.5 text-xs font-medium text-primary hover:bg-primary/10 transition-colors flex items-center gap-1.5"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              PDF \u0130ndir
              <span className="ml-0.5 bg-amber-100 text-amber-700 text-[9px] px-1.5 py-0.5 rounded font-semibold">PREMIUM</span>
            </Link>
          )}
        </div>
      </nav>

      <div className="flex-1 flex overflow-hidden">
        {(viewMode === 'editor' || viewMode === 'split') && (
          <div className={`flex flex-col overflow-hidden border-r ${viewMode === 'split' ? 'w-1/2' : 'w-full'}`}>
            <CVEditor onTemplateChange={handleTemplateChange} />
          </div>
        )}
        {(viewMode === 'preview' || viewMode === 'split') && (
          <div className={`flex flex-col overflow-hidden ${viewMode === 'split' ? 'w-1/2' : 'w-full'} bg-gray-100`}>
            <div className="px-4 py-2 bg-card border-b flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground">Canl\u0131 \u00d6nizleme</span>
              <span className="text-xs text-muted-foreground capitalize">{currentCV.template} \u015fablonu</span>
            </div>
            <div className="flex-1 overflow-auto p-4">
              <div
                className="mx-auto shadow-xl overflow-hidden bg-white"
                style={{ width: '210mm', minHeight: '297mm', maxWidth: '100%' }}
              >
                <CVPreview
                  data={cvData}
                  template={currentCV.template}
                  atsScore={currentCV.atsScore}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
