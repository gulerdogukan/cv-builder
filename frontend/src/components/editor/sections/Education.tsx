import { useState } from 'react';
import type { Education as EducationType } from '@/types/cv.types';
import { generateId } from '@/lib/utils';

interface Props {
  data: EducationType[];
  onChange: (data: EducationType[]) => void;
}

const emptyEducation = (): EducationType => ({
  id: generateId(),
  school: '',
  degree: '',
  field: '',
  startDate: '',
  endDate: '',
  gpa: undefined,
  description: '',
});

interface ItemProps {
  item: EducationType;
  index: number;
  total: number;
  onUpdate: (updated: EducationType) => void;
  onRemove: () => void;
  onMove: (dir: 'up' | 'down') => void;
}

function EducationItem({ item, index, total, onUpdate, onRemove, onMove }: ItemProps) {
  const [isOpen, setIsOpen] = useState(index === 0);

  const update = <K extends keyof EducationType>(field: K, value: EducationType[K]) => {
    onUpdate({ ...item, [field]: value });
  };

  const title = item.school
    ? `${item.degree ? item.degree + ' — ' : ''}${item.school}`
    : 'Yeni Eğitim';

  return (
    <div className="border rounded-lg overflow-hidden">
      <div
        className="flex items-center gap-2 px-4 py-3 bg-muted/30 cursor-pointer hover:bg-muted/50 transition-colors"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex flex-col gap-0.5">
          <button type="button" disabled={index === 0} onClick={(e) => { e.stopPropagation(); onMove('up'); }} className="text-muted-foreground hover:text-foreground disabled:opacity-30 leading-none">▲</button>
          <button type="button" disabled={index === total - 1} onClick={(e) => { e.stopPropagation(); onMove('down'); }} className="text-muted-foreground hover:text-foreground disabled:opacity-30 leading-none">▼</button>
        </div>
        <span className="flex-1 text-sm font-medium truncate">{title}</span>
        <button type="button" onClick={(e) => { e.stopPropagation(); onRemove(); }} className="text-destructive hover:text-destructive/80 text-xs px-2">Sil</button>
        <span className="text-muted-foreground text-xs">{isOpen ? '▲' : '▼'}</span>
      </div>

      {isOpen && (
        <div className="p-4 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-muted-foreground mb-1.5">Okul / Üniversite *</label>
              <input
                type="text"
                value={item.school}
                onChange={(e) => update('school', e.target.value)}
                placeholder="İstanbul Teknik Üniversitesi"
                className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1.5">Derece</label>
              <select
                value={item.degree}
                onChange={(e) => update('degree', e.target.value)}
                className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
              >
                <option value="">Seçin</option>
                <option value="Lisans">Lisans</option>
                <option value="Yüksek Lisans">Yüksek Lisans</option>
                <option value="Doktora">Doktora</option>
                <option value="Ön Lisans">Ön Lisans</option>
                <option value="Lise">Lise</option>
                <option value="Sertifika">Sertifika</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1.5">Bölüm</label>
              <input
                type="text"
                value={item.field}
                onChange={(e) => update('field', e.target.value)}
                placeholder="Bilgisayar Mühendisliği"
                className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1.5">Başlangıç</label>
              <input
                type="month"
                value={item.startDate}
                onChange={(e) => update('startDate', e.target.value)}
                className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1.5">Bitiş</label>
              <input
                type="month"
                value={item.endDate ?? ''}
                onChange={(e) => update('endDate', e.target.value)}
                className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1.5">Not Ortalaması (GPA)</label>
              <input
                type="number"
                min="0"
                max="4"
                step="0.01"
                value={item.gpa ?? ''}
                onChange={(e) => update('gpa', e.target.value ? parseFloat(e.target.value) : undefined)}
                placeholder="3.50"
                className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1.5">Açıklama (İsteğe bağlı)</label>
            <textarea
              value={item.description ?? ''}
              onChange={(e) => update('description', e.target.value)}
              rows={2}
              placeholder="Önemli projeler, ödüller, aktiviteler..."
              className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 resize-none"
            />
          </div>
        </div>
      )}
    </div>
  );
}

export default function Education({ data, onChange }: Props) {
  const add = () => onChange([...data, emptyEducation()]);
  const remove = (id: string) => onChange(data.filter((e) => e.id !== id));
  const update = (id: string, updated: EducationType) => onChange(data.map((e) => e.id === id ? updated : e));
  const move = (index: number, dir: 'up' | 'down') => {
    const newData = [...data];
    const target = dir === 'up' ? index - 1 : index + 1;
    [newData[index], newData[target]] = [newData[target], newData[index]];
    onChange(newData);
  };

  return (
    <div className="space-y-3">
      {data.map((item, index) => (
        <EducationItem key={item.id} item={item} index={index} total={data.length}
          onUpdate={(u) => update(item.id, u)}
          onRemove={() => remove(item.id)}
          onMove={(dir) => move(index, dir)}
        />
      ))}
      <button type="button" onClick={add} className="w-full rounded-lg border-2 border-dashed border-muted-foreground/30 py-3 text-sm text-muted-foreground hover:border-primary/50 hover:text-primary transition-colors flex items-center justify-center gap-2">
        <span className="text-lg leading-none">+</span> Eğitim Ekle
      </button>
    </div>
  );
}
