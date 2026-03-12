import { useState } from 'react';
import type { Skill, SkillLevel } from '@/types/cv.types';
import { generateId } from '@/lib/utils';

interface Props {
  data: Skill[];
  onChange: (data: Skill[]) => void;
}

const LEVEL_LABELS: Record<SkillLevel, string> = {
  beginner: 'Başlangıç',
  intermediate: 'Orta',
  advanced: 'İleri',
  expert: 'Uzman',
};

const LEVEL_COLORS: Record<SkillLevel, string> = {
  beginner: 'bg-gray-100 text-gray-600',
  intermediate: 'bg-blue-100 text-blue-700',
  advanced: 'bg-purple-100 text-purple-700',
  expert: 'bg-green-100 text-green-700',
};

export default function Skills({ data, onChange }: Props) {
  const [newSkill, setNewSkill] = useState('');
  const [newLevel, setNewLevel] = useState<SkillLevel>('intermediate');

  const add = () => {
    const name = newSkill.trim();
    if (!name) return;
    onChange([...data, { id: generateId(), name, level: newLevel }]);
    setNewSkill('');
  };

  const remove = (id: string) => onChange(data.filter((s) => s.id !== id));

  const updateLevel = (id: string, level: SkillLevel) => {
    onChange(data.map((s) => s.id === id ? { ...s, level } : s));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') { e.preventDefault(); add(); }
  };

  return (
    <div className="space-y-4">
      {/* Ekleme alanı */}
      <div className="flex gap-2">
        <input
          type="text"
          value={newSkill}
          onChange={(e) => setNewSkill(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Beceri adı (Enter ile ekle)"
          className="flex-1 rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
        />
        <select
          value={newLevel}
          onChange={(e) => setNewLevel(e.target.value as SkillLevel)}
          className="rounded-lg border bg-background px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
        >
          {(Object.keys(LEVEL_LABELS) as SkillLevel[]).map((level) => (
            <option key={level} value={level}>{LEVEL_LABELS[level]}</option>
          ))}
        </select>
        <button
          type="button"
          onClick={add}
          disabled={!newSkill.trim()}
          className="rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
        >
          Ekle
        </button>
      </div>

      {/* Beceri etiketleri */}
      {data.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {data.map((skill) => (
            <div key={skill.id} className="flex items-center gap-1 rounded-full border bg-card px-3 py-1 text-sm">
              <span className="font-medium">{skill.name}</span>
              <select
                value={skill.level}
                onChange={(e) => updateLevel(skill.id, e.target.value as SkillLevel)}
                className={`text-xs rounded px-1 border-0 outline-none cursor-pointer ${LEVEL_COLORS[skill.level]}`}
              >
                {(Object.keys(LEVEL_LABELS) as SkillLevel[]).map((level) => (
                  <option key={level} value={level}>{LEVEL_LABELS[level]}</option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => remove(skill.id)}
                className="text-muted-foreground hover:text-destructive transition-colors ml-1 leading-none"
              >×</button>
            </div>
          ))}
        </div>
      )}

      {data.length === 0 && (
        <p className="text-xs text-muted-foreground text-center py-4">
          Henüz beceri eklenmedi. Yukarıdan ekleyebilirsiniz.
        </p>
      )}
    </div>
  );
}
