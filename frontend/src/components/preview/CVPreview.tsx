import { useState, useEffect } from 'react';
import type { CVData, TemplateType } from '@/types/cv.types';
import MinimalistTemplate from './templates/MinimalistTemplate';
import ModernistTemplate from './templates/ModernistTemplate';
import ExecutiveTemplate from './templates/ExecutiveTemplate';
import TechFocusTemplate from './templates/TechFocusTemplate';
import CreativeCanvasTemplate from './templates/CreativeCanvasTemplate';
import StartupTemplate from './templates/StartupTemplate';
import InfographicTemplate from './templates/InfographicTemplate';
import DarkModeTemplate from './templates/DarkModeTemplate';

interface Props {
  data: CVData;
  template: TemplateType;
  accentColor?: string | null;
  fontFamily?: string | null;
  atsScore?: number;
}

const TEMPLATE_INFO: Record<TemplateType, { label: string; desc: string; isPremium: boolean }> = {
  'minimalist': { label: 'The Minimalist', desc: 'Akademik/Geleneksel, ATS dostu', isPremium: false },
  'modernist': { label: 'The Modernist', desc: 'Kurumsal, 2 sütunlu', isPremium: false },
  'executive': { label: 'The Executive', desc: 'Yönetici, net ve otoriter', isPremium: false },
  'tech-focus': { label: 'Tech-Focus', desc: 'Yazılımcı, kod bloku stili', isPremium: true },
  'creative-canvas': { label: 'Creative Canvas', desc: 'Tasarımcı, asimetrik', isPremium: true },
  'startup': { label: 'The Startup', desc: 'Dinamik, yuvarlak hatlar', isPremium: true },
  'infographic': { label: 'Infographic Light', desc: 'Veri odaklı', isPremium: true },
  'dark-mode': { label: 'Dark Mode Pro', desc: 'Koyu arka plan, profesyonel', isPremium: true },
};

export default function CVPreview({ data, template, accentColor, fontFamily, atsScore }: Props) {
  const [isUpdating, setIsUpdating] = useState(false);

  // Veri değiştiğinde debounce ile opacity animasyonu yap
  useEffect(() => {
    setIsUpdating(true);
    const timeout = setTimeout(() => {
      setIsUpdating(false);
    }, 300);
    return () => clearTimeout(timeout);
  }, [data, template]);

  const TemplateComponent = {
    'minimalist': MinimalistTemplate,
    'modernist': ModernistTemplate,
    'executive': ExecutiveTemplate,
    'tech-focus': TechFocusTemplate,
    'creative-canvas': CreativeCanvasTemplate,
    'startup': StartupTemplate,
    'infographic': InfographicTemplate,
    'dark-mode': DarkModeTemplate,
  }[template] || MinimalistTemplate;

  return (
    <div className="flex flex-col h-full">
      {/* ATS skor widget */}
      {atsScore !== undefined && atsScore > 0 && (
        <div className="no-print flex items-center gap-3 px-4 py-2 bg-card border-b">
          <span className="text-xs text-muted-foreground">ATS Skoru:</span>
          <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
            <div
              className={`h-2 rounded-full transition-all ${
                atsScore >= 80 ? 'bg-green-500' :
                atsScore >= 50 ? 'bg-yellow-500' : 'bg-red-500'
              }`}
              style={{ width: `${atsScore}%` }}
            />
          </div>
          <span className={`text-xs font-bold ${
            atsScore >= 80 ? 'text-green-600' :
            atsScore >= 50 ? 'text-yellow-600' : 'text-red-600'
          }`}>{atsScore}/100</span>
        </div>
      )}

      {/* A4 önizleme */}
      <div className="flex-1 overflow-auto bg-gray-100 p-4">
        <div
          id="cv-print-target"
          className="mx-auto shadow-lg overflow-hidden transition-opacity duration-300"
          style={{
            width: '210mm',
            minHeight: '297mm',
            maxWidth: '100%',
            backgroundColor: 'white',
            transform: 'scale(var(--preview-scale, 1))',
            transformOrigin: 'top center',
            opacity: isUpdating ? 0.8 : 1,
            willChange: 'transform, opacity',
            // Customizations
            '--cv-accent': accentColor || '#3b82f6', // Default blue-500
            '--cv-font': fontFamily || 'Inter, system-ui, sans-serif'
          } as React.CSSProperties}
        >
          <TemplateComponent data={data} />
        </div>
      </div>
    </div>
  );
}

export { TEMPLATE_INFO };
