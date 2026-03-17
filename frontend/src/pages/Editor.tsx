import { useEffect, useState, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useCV } from '@/hooks/useCV';
import { useAuthStore } from '@/stores/authStore';
import { useSEO } from '@/hooks/useSEO';
import { useTheme } from '@/hooks/useTheme';
import { Sun, Moon, Sparkles, Download, Code, FileText, Globe, Link2, Check } from 'lucide-react';
import type { TemplateType } from '@/types/cv.types';
import CVEditor from '@/components/editor/CVEditor';
import CVPreview from '@/components/preview/CVPreview';
import CareerAssistantModal from '@/components/editor/CareerAssistantModal';

type ViewMode = 'editor' | 'preview' | 'split';

export default function Editor() {
  useSEO({ title: 'CV Düzenle', noIndex: true });
  const { id } = useParams<{ id: string }>();
  const { currentCV, fetchCV, updateCVTitle, setTemplate, togglePublic, isLoading } = useCV();
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const { isDark, toggle } = useTheme();

  const [viewMode, setViewMode] = useState<ViewMode>('split');
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [titleInput, setTitleInput] = useState('');
  const [isPrinting, setIsPrinting] = useState(false);
  const [showCareerModal, setShowCareerModal] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopyLink = () => {
    if (!currentCV) return;
    const url = `${window.location.origin}/cv/${currentCV.id}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };


  useEffect(() => {
    if (id) fetchCV(id);
  }, [id, fetchCV]);

  useEffect(() => {
    if (currentCV) setTitleInput(currentCV.title);
  }, [currentCV?.id]);

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

  // Fix: actually update the template in store so preview reflects change
  const handleTemplateChange = useCallback((template: TemplateType) => {
    setTemplate(template);
  }, [setTemplate]);

  // PDF export via browser's native print dialog — matches preview exactly
  const handlePdfExport = () => {
    if (!currentCV) return;
    setIsPrinting(true);

    const prev = viewMode;
    // Switch to preview so cv-print-target is in the DOM
    setViewMode('preview');

    setTimeout(() => {
      window.print();
      // Restore view mode after print dialog closes
      setViewMode(prev);
      setIsPrinting(false);
    }, 200);
  };

  const handleJsonExport = () => {
    if (!currentCV) return;
    const jsonString = JSON.stringify(currentCV.data, null, 2);
    const blob = new Blob([jsonString], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `cv_${currentCV.title || 'export'}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleTxtExport = () => {
    if (!currentCV) return;
    const { personal, summary, experience, education, skills, languages, certifications } = currentCV.data;
    
    let text = `${personal?.fullName || 'İsimsiz'}\n${personal?.profession || ''}\n\n`;
    text += `İletişim:\nE-posta: ${personal?.email}\nTelefon: ${personal?.phone}\nKonum: ${personal?.location}\n`;
    if (personal?.linkedin) text += `LinkedIn: ${personal.linkedin}\n`;
    if (personal?.github) text += `GitHub: ${personal.github}\n`;
    
    if (summary) text += `\n\n--- ÖZET ---\n${summary}\n`;
    
    if (experience && experience.length > 0) {
      text += `\n\n--- DENEYİM ---\n`;
      experience.forEach(e => {
        text += `${e.position} @ ${e.company} (${e.startDate} - ${e.endDate || 'Devam'}) | ${e.location}\n${e.description}\n\n`;
      });
    }

    if (education && education.length > 0) {
      text += `\n--- EĞİTİM ---\n`;
      education.forEach(e => {
        text += `${e.degree} - ${e.field} @ ${e.school} (${e.startDate} - ${e.endDate || 'Devam'})\n`;
      });
    }

    if (skills && skills.length > 0) {
      text += `\n\n--- YETENEKLER ---\n${skills.map(s => s.name).join(', ')}\n`;
    }

    if (languages && languages.length > 0) {
      text += `\n\n--- DİLLER ---\n${languages.map(l => `${l.name} (${l.level})`).join(', ')}\n`;
    }

    if (certifications && certifications.length > 0) {
      text += `\n\n--- SERTİFİKALAR ---\n${certifications.map(c => `${c.name} - ${c.issuer} (${c.date})`).join('\n')}\n`;
    }

    const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `cv_${currentCV.title || 'export'}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  if (isLoading || !currentCV) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/20">
        <div className="flex flex-col items-center gap-3">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          <p className="text-sm text-muted-foreground">CV yükleniyor...</p>
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

      {/* no-print: hide navbar from print output */}
      <nav className="no-print border-b bg-card px-3 py-2 flex items-center justify-between gap-3 flex-shrink-0">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <button
            onClick={() => navigate('/dashboard')}
            className="text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1 text-sm shrink-0"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            <span className="hidden sm:inline">Geri Dön</span>
          </button>

          <div className="h-4 w-px bg-border" />
          
          <div className="w-32 sm:w-48 md:w-64 max-w-full shrink-0">
            {isEditingTitle ? (
              <input
                autoFocus
                value={titleInput}
                onChange={(e) => setTitleInput(e.target.value)}
                onBlur={handleTitleSave}
                onKeyDown={(e) => e.key === 'Enter' && handleTitleSave()}
                className="w-full text-sm font-semibold bg-transparent border-b border-primary focus:outline-none px-0"
              />
            ) : (
              <button
                onClick={() => setIsEditingTitle(true)}
                className="w-full text-sm font-semibold truncate text-left hover:text-primary transition-colors"
                title="Başlığı düzenlemek için tıklayın"
              >
                {currentCV.title}
              </button>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={toggle}
            aria-label={isDark ? 'Açık moda geç' : 'Koyu moda geç'}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors shrink-0"
          >
            {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>

          <div className="hidden md:flex items-center gap-1 bg-muted rounded-lg p-1">
            {([
              { key: 'editor',  label: 'Düzenle',   icon: '✏️' },
              { key: 'split',   label: 'İkiye Böl', icon: '⊟' },
              { key: 'preview', label: 'Önizle',    icon: '👁' },
            ] as { key: ViewMode; label: string; icon: string }[]).map((mode) => (
              <button
                key={mode.key}
                onClick={() => setViewMode(mode.key)}
                className={`px-2.5 py-1 rounded text-xs font-medium transition-colors flex items-center gap-1 ${
                  viewMode === mode.key ? 'bg-background shadow-sm' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <span>{mode.icon}</span>
                <span className="hidden xl:inline">{mode.label}</span>
              </button>
            ))}
          </div>

          <div className="h-4 w-px bg-border hidden sm:block" />

          {/* Share Toggle */}
          <div className="flex items-center gap-2 px-2 py-1 bg-muted/50 rounded-lg border">
            <button
              onClick={togglePublic}
              className={`flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[10px] font-bold transition-all ${
                currentCV.isPublic 
                  ? 'bg-blue-500 text-white shadow-sm' 
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Globe className="w-3 h-3" />
              {currentCV.isPublic ? 'Herkes Görebilir' : 'Gizli'}
            </button>
            
            {currentCV.isPublic && (
              <button
                onClick={handleCopyLink}
                className="p-1 hover:bg-muted rounded text-muted-foreground hover:text-primary transition-colors"
                title="Linh Kopyala"
              >
                {copied ? <Check className="w-3 h-3 text-green-600" /> : <Link2 className="w-3 h-3" />}
              </button>
            )}
          </div>
        </div>


        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => setShowCareerModal(true)}
            className="rounded-lg bg-gradient-to-r from-violet-500 to-fuchsia-500 px-3 py-1.5 text-xs font-medium text-white hover:opacity-90 transition-opacity flex items-center gap-1.5 shadow-md shadow-violet-500/20"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Kariyer Asistanı</span>
          </button>

          {isPaid ? (
            <div className="flex bg-muted/30 p-1 rounded-lg border border-border">
              <button
                title="JSON İndir"
                onClick={handleJsonExport}
                className="px-2.5 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-background rounded transition-colors flex items-center gap-1.5"
              >
                <Code className="w-3.5 h-3.5" />
                <span className="hidden lg:inline text-[10px] tracking-wider font-semibold">JSON</span>
              </button>
              <button
                title="Düz Metin İndir"
                onClick={handleTxtExport}
                className="px-2.5 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-background rounded transition-colors flex items-center gap-1.5"
              >
                <FileText className="w-3.5 h-3.5" />
                <span className="hidden lg:inline text-[10px] tracking-wider font-semibold">TXT</span>
              </button>
              
              <div className="w-px h-auto bg-border mx-1"></div>

              <button
                onClick={handlePdfExport}
                disabled={isPrinting}
                className="rounded bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-70 transition-colors flex items-center gap-1.5 shadow-sm"
              >
                {isPrinting ? (
                  <>
                    <span className="animate-spin rounded-full h-3 w-3 border-b border-white" />
                    Hazırlanıyor...
                  </>
                ) : (
                  <>
                    <Download className="w-3.5 h-3.5" />
                    PDF İndir
                  </>
                )}
              </button>
            </div>
          ) : (
            <Link
              to="/pricing"
              className="rounded-lg border border-primary px-3 py-1.5 text-xs font-medium text-primary hover:bg-primary/10 transition-colors flex items-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5" />
              Dışa Aktar
              <span className="ml-0.5 bg-amber-100 text-amber-700 text-[9px] px-1.5 py-0.5 rounded font-semibold">PREMIUM</span>
            </Link>
          )}
        </div>
      </nav>

      <div className="flex-1 flex overflow-hidden">
        {/* no-print: hide editor panel from print output */}
        {(viewMode === 'editor' || viewMode === 'split') && (
          <div className={`no-print flex flex-col overflow-hidden border-r ${viewMode === 'split' ? 'w-1/2' : 'w-full'}`}>
            <CVEditor onTemplateChange={handleTemplateChange} />
          </div>
        )}

        {(viewMode === 'preview' || viewMode === 'split') && (
          <div className={`flex flex-col overflow-hidden ${viewMode === 'split' ? 'w-1/2' : 'w-full'} bg-gray-100`}>
            {/* no-print: hide preview header bar */}
            <div className="no-print px-4 py-2 bg-card border-b flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground">Canlı Önizleme</span>
              <span className="text-xs text-muted-foreground capitalize">{currentCV.template} şablonu</span>
            </div>
            <div className="flex-1 overflow-hidden">
              <CVPreview
                data={cvData}
                template={currentCV.template}
                accentColor={currentCV.accentColor}
                fontFamily={currentCV.fontFamily}
                atsScore={currentCV.atsScore}
              />
            </div>
          </div>
        )}
      </div>

      {showCareerModal && currentCV && (
        <CareerAssistantModal
          isOpen={showCareerModal}
          onClose={() => setShowCareerModal(false)}
          cvData={currentCV.data ?? defaultData}
        />
      )}
    </div>
  );
}
