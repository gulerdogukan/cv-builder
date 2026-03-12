import type { CVData, TemplateType } from '@/types/cv.types';
import ModernTemplate from './templates/ModernTemplate';
import ClassicTemplate from './templates/ClassicTemplate';
import MinimalTemplate from './templates/MinimalTemplate';

interface Props {
  data: CVData;
  template: TemplateType;
  atsScore?: number;
}

const TEMPLATE_INFO: Record<TemplateType, { label: string; desc: string }> = {
  modern: { label: 'Modern', desc: 'Renkli başlık, ATS uyumlu' },
  classic: { label: 'Klasik', desc: 'Geleneksel, serif tipografi' },
  minimal: { label: 'Minimal', desc: 'Temiz, beyaz alan odaklı' },
};

export default function CVPreview({ data, template, atsScore }: Props) {
  const TemplateComponent = {
    modern: ModernTemplate,
    classic: ClassicTemplate,
    minimal: MinimalTemplate,
  }[template];

  return (
    <div className="flex flex-col h-full">
      {/* ATS skor widget */}
      {atsScore !== undefined && atsScore > 0 && (
        <div className="flex items-center gap-3 px-4 py-2 bg-card border-b">
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
          className="mx-auto shadow-lg overflow-hidden"
          style={{
            width: '210mm',
            minHeight: '297mm',
            maxWidth: '100%',
            backgroundColor: 'white',
            transform: 'scale(var(--preview-scale, 1))',
            transformOrigin: 'top center',
          }}
        >
          <TemplateComponent data={data} />
        </div>
      </div>
    </div>
  );
}

export { TEMPLATE_INFO };
