import { useState } from 'react';
import type { Certification } from '@/types/cv.types';
import { generateId } from '@/lib/utils';

interface Props {
  data: Certification[];
  onChange: (data: Certification[]) => void;
}

const emptyCert = (): Certification => ({
  id: generateId(),
  name: '',
  issuer: '',
  date: '',
  url: '',
});

interface ItemProps {
  item: Certification;
  onUpdate: (updated: Certification) => void;
  onRemove: () => void;
}

function CertItem({ item, onUpdate, onRemove }: ItemProps) {
  const [isOpen, setIsOpen] = useState(!item.name);
  const update = <K extends keyof Certification>(field: K, value: Certification[K]) =>
    onUpdate({ ...item, [field]: value });

  const title = item.name || 'Yeni Sertifika';

  return (
    <div className="border rounded-lg overflow-hidden">
      <div
        className="flex items-center gap-2 px-4 py-3 bg-muted/30 cursor-pointer hover:bg-muted/50 transition-colors"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className="flex-1 text-sm font-medium truncate">{title}</span>
        <button type="button" onClick={(e) => { e.stopPropagation(); onRemove(); }} className="text-destructive text-xs px-2">Sil</button>
        <span className="text-muted-foreground text-xs">{isOpen ? '▲' : '▼'}</span>
      </div>
      {isOpen && (
        <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <label className="block text-xs font-medium text-muted-foreground mb-1.5">Sertifika Adı *</label>
            <input type="text" value={item.name} onChange={(e) => update('name', e.target.value)} placeholder="AWS Solutions Architect" className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40" />
          </div>
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1.5">Veren Kurum</label>
            <input type="text" value={item.issuer} onChange={(e) => update('issuer', e.target.value)} placeholder="Amazon Web Services" className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40" />
          </div>
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1.5">Tarih</label>
            <input type="month" value={item.date} onChange={(e) => update('date', e.target.value)} className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40" />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-xs font-medium text-muted-foreground mb-1.5">Sertifika URL (İsteğe bağlı)</label>
            <input type="url" value={item.url ?? ''} onChange={(e) => update('url', e.target.value)} placeholder="https://..." className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40" />
          </div>
        </div>
      )}
    </div>
  );
}

export default function Certifications({ data, onChange }: Props) {
  return (
    <div className="space-y-3">
      {data.map((item) => (
        <CertItem key={item.id} item={item}
          onUpdate={(u) => onChange(data.map((c) => c.id === item.id ? u : c))}
          onRemove={() => onChange(data.filter((c) => c.id !== item.id))}
        />
      ))}
      <button type="button" onClick={() => onChange([...data, emptyCert()])} className="w-full rounded-lg border-2 border-dashed border-muted-foreground/30 py-3 text-sm text-muted-foreground hover:border-primary/50 hover:text-primary transition-colors flex items-center justify-center gap-2">
        <span className="text-lg leading-none">+</span> Sertifika Ekle
      </button>
    </div>
  );
}
