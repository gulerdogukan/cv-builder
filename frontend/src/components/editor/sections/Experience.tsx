import { useState } from 'react';
import type { Experience as ExperienceType, TemplateType } from '@/types/cv.types';
import { generateId } from '@/lib/utils';
import AIAssistButton from '@/components/editor/AIAssistButton';
import { useAI } from '@/hooks/useAI';
import { Sparkles, Loader2 } from 'lucide-react';


interface Props {
  data: ExperienceType[];
  template: TemplateType;
  onChange: (data: ExperienceType[]) => void;
}

const emptyExperience = (): ExperienceType => ({
  id: generateId(),
  company: '',
  position: '',
  startDate: '',
  endDate: '',
  isCurrent: false,
  description: '',
  location: '',
});

interface ItemProps {
  item: ExperienceType;
  index: number;
  total: number;
  template: TemplateType;
  onUpdate: (updated: ExperienceType) => void;
  onRemove: () => void;
  onMove: (dir: 'up' | 'down') => void;
}

function ExperienceItem({ item, index, total, template, onUpdate, onRemove, onMove }: ItemProps) {
  const [isOpen, setIsOpen] = useState(index === 0);
  const { bulletizeDescription, isLoading: isAiLoading } = useAI();
  const [localIsLoading, setLocalIsLoading] = useState(false);


  const update = <K extends keyof ExperienceType>(field: K, value: ExperienceType[K]) => {
    onUpdate({ ...item, [field]: value });
  };

  const title = item.position && item.company
    ? `${item.position} — ${item.company}`
    : item.position || item.company || 'Yeni Deneyim';

  const isTech = template === 'tech-focus';
  const posPlaceholder = isTech ? 'Senior Backend Developer' : 'Pazarlama Uzmanı';
  const descPlaceholder = isTech 
    ? "Microservice mimarisine geçiş yaparak sistem performansını %40 artırdım." 
    : "Sosyal medya kampanyaları yürüterek etkileşimi %20 artırdım.";

  const handleBulletize = async () => {
    if (!item.description || item.description.trim().length < 10) return;
    setLocalIsLoading(true);
    try {
      const result = await bulletizeDescription(item.description, item.position);
      update('description', result);
    } catch {
      // Error handled by hook
    } finally {
      setLocalIsLoading(false);
    }
  };

  return (
    <div className="border rounded-lg overflow-hidden">
      {/* Başlık satırı */}
      <div
        className="flex items-center gap-2 px-4 py-3 bg-muted/30 cursor-pointer hover:bg-muted/50 transition-colors"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex flex-col gap-0.5">
          <button
            type="button"
            disabled={index === 0}
            onClick={(e) => { e.stopPropagation(); onMove('up'); }}
            className="text-muted-foreground hover:text-foreground disabled:opacity-30 leading-none"
          >▲</button>
          <button
            type="button"
            disabled={index === total - 1}
            onClick={(e) => { e.stopPropagation(); onMove('down'); }}
            className="text-muted-foreground hover:text-foreground disabled:opacity-30 leading-none"
          >▼</button>
        </div>
        <span className="flex-1 text-sm font-medium truncate">{title}</span>
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onRemove(); }}
          className="text-destructive hover:text-destructive/80 text-xs px-2"
        >Sil</button>
        <span className="text-muted-foreground text-xs">{isOpen ? '▲' : '▼'}</span>
      </div>

      {/* Form alanları */}
      {isOpen && (
        <div className="p-4 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1.5">Pozisyon *</label>
              <input
                type="text"
                value={item.position}
                onChange={(e) => update('position', e.target.value)}
                placeholder={posPlaceholder}
                className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1.5">Şirket *</label>
              <input
                type="text"
                value={item.company}
                onChange={(e) => update('company', e.target.value)}
                placeholder="ABC Teknoloji A.Ş."
                className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1.5">Başlangıç Tarihi</label>
              <input
                type="month"
                value={item.startDate}
                onChange={(e) => update('startDate', e.target.value)}
                className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1.5">Bitiş Tarihi</label>
              {item.isCurrent ? (
                <div className="rounded-lg border bg-muted px-3 py-2 text-sm text-muted-foreground">
                  Halen çalışıyorum
                </div>
              ) : (
                <input
                  type="month"
                  value={item.endDate ?? ''}
                  onChange={(e) => update('endDate', e.target.value)}
                  className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                />
              )}
              <label className="flex items-center gap-2 mt-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={item.isCurrent}
                  onChange={(e) => update('isCurrent', e.target.checked)}
                  className="rounded"
                />
                <span className="text-xs text-muted-foreground">Halen bu pozisyonda çalışıyorum</span>
              </label>
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1.5">Konum</label>
              <input
                type="text"
                value={item.location ?? ''}
                onChange={(e) => update('location', e.target.value)}
                placeholder="İstanbul, Türkiye"
                className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
            </div>
          </div>
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-medium text-muted-foreground">Açıklama</label>
              <div className="flex items-center gap-2">
                {item.description && item.description.trim().length > 10 && (
                  <>
                    <button
                      type="button"
                      onClick={handleBulletize}
                      disabled={localIsLoading || isAiLoading}
                      className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-100 text-[10px] font-bold hover:bg-blue-100 disabled:opacity-50 transition-colors"
                    >
                      {localIsLoading ? (
                        <Loader2 className="w-2.5 h-2.5 animate-spin" />
                      ) : (
                        <Sparkles className="w-2.5 h-2.5" />
                      )}
                      Madde Madde Yaz
                    </button>
                    <AIAssistButton
                      text={item.description}
                      onAccept={(v) => update('description', v)}
                      label="AI ile Güçlendir"
                      compact
                    />
                  </>
                )}
              </div>
            </div>
            <textarea
              value={item.description}
              onChange={(e) => update('description', e.target.value)}
              rows={3}
              placeholder={descPlaceholder}
              className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 resize-none"
            />
          </div>
        </div>
      )}
    </div>
  );
}

export default function Experience({ data, template, onChange }: Props) {
  const add = () => onChange([...data, emptyExperience()]);

  const remove = (id: string) => onChange(data.filter((e) => e.id !== id));

  const update = (id: string, updated: ExperienceType) => {
    onChange(data.map((e) => (e.id === id ? updated : e)));
  };

  const move = (index: number, dir: 'up' | 'down') => {
    const newData = [...data];
    const targetIndex = dir === 'up' ? index - 1 : index + 1;
    const temp = newData[index];
    if (temp && newData[targetIndex]) {
      newData[index] = newData[targetIndex];
      newData[targetIndex] = temp;
      onChange(newData);
    }
  };

  return (
    <div className="space-y-3">
      {data.map((item, index) => (
        <ExperienceItem
          key={item.id}
          item={item}
          index={index}
          total={data.length}
          template={template}
          onUpdate={(updated) => update(item.id, updated)}
          onRemove={() => remove(item.id)}
          onMove={(dir) => move(index, dir)}
        />
      ))}
      <button
        type="button"
        onClick={add}
        className="w-full rounded-lg border-2 border-dashed border-muted-foreground/30 py-3 text-sm text-muted-foreground hover:border-primary/50 hover:text-primary transition-colors flex items-center justify-center gap-2"
      >
        <span className="text-lg leading-none">+</span> Deneyim Ekle
      </button>
    </div>
  );
}
