import type { Language, LanguageLevel } from '@/types/cv.types';
import { generateId } from '@/lib/utils';
import { useState } from 'react';

interface Props {
  data: Language[];
  onChange: (data: Language[]) => void;
}

const LEVEL_LABELS: Record<LanguageLevel, string> = {
  A1: 'A1 — Başlangıç',
  A2: 'A2 — Temel',
  B1: 'B1 — Orta Altı',
  B2: 'B2 — Orta Üstü',
  C1: 'C1 — İleri',
  C2: 'C2 — Ustalaşmış',
  native: 'Ana Dil',
};

export default function Languages({ data, onChange }: Props) {
  const [newName, setNewName] = useState('');
  const [newLevel, setNewLevel] = useState<LanguageLevel>('B2');

  const add = () => {
    const name = newName.trim();
    if (!name) return;
    onChange([...data, { id: generateId(), name, level: newLevel }]);
    setNewName('');
  };

  const remove = (id: string) => onChange(data.filter((l) => l.id !== id));

  const updateLevel = (id: string, level: LanguageLevel) => {
    onChange(data.map((l) => l.id === id ? { ...l, level } : l));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') { e.preventDefault(); add(); }
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <input
          type="text"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Dil (örn: İngilizce)"
          className="flex-1 rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
        />
        <select
          value={newLevel}
          onChange={(e) => setNewLevel(e.target.value as LanguageLevel)}
          className="rounded-lg border bg-background px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
        >
          {(Object.keys(LEVEL_LABELS) as LanguageLevel[]).map((level) => (
            <option key={level} value={level}>{level === 'native' ? 'Ana Dil' : level}</option>
          ))}
        </select>
        <button
          type="button"
          onClick={add}
          disabled={!newName.trim()}
          className="rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
        >
          Ekle
        </button>
      </div>

      {data.length > 0 && (
        <div className="space-y-2">
          {data.map((lang) => (
            <div key={lang.id} className="flex items-center gap-3 rounded-lg border bg-card px-4 py-2.5">
              <span className="flex-1 text-sm font-medium">{lang.name}</span>
              <select
                value={lang.level}
                onChange={(e) => updateLevel(lang.id, e.target.value as LanguageLevel)}
                className="text-sm rounded border-0 outline-none bg-transparent text-muted-foreground cursor-pointer"
              >
                {(Object.keys(LEVEL_LABELS) as LanguageLevel[]).map((level) => (
                  <option key={level} value={level}>{LEVEL_LABELS[level]}</option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => remove(lang.id)}
                className="text-muted-foreground hover:text-destructive transition-colors"
              >×</button>
            </div>
          ))}
        </div>
      )}

      {data.length === 0 && (
        <p className="text-xs text-muted-foreground text-center py-4">
          Henüz dil eklenmedi.
        </p>
      )}
    </div>
  );
}
