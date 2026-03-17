import { useState } from 'react';
import type { Skill, SkillLevel, TemplateType } from '@/types/cv.types';
import { generateId } from '@/lib/utils';
import { useAI } from '@/hooks/useAI';

interface Props {
  data: Skill[];
  template: TemplateType;
  profession?: string;
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

export default function Skills({ data, profession, onChange }: Props) {
  const [newSkill, setNewSkill] = useState('');
  const [newLevel, setNewLevel] = useState<SkillLevel>('intermediate');
  const [showSuggest, setShowSuggest] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const { suggestSkills, isLoading: isAILoading, isRateLimited } = useAI();

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

  const handleAISuggest = async () => {
    if (!profession || !profession.trim()) return;
    try {
      const result = await suggestSkills(profession);
      // Zaten eklenmiş olanları filtrele
      const existingNames = new Set(data.map(s => s.name.toLowerCase()));
      setSuggestions(result.filter(s => !existingNames.has(s.toLowerCase())));
      setShowSuggest(true);
    } catch {
      // error handled in hook
    }
  };

  const addSuggestion = (name: string) => {
    onChange([...data, { id: generateId(), name, level: 'intermediate' }]);
    setSuggestions(prev => prev.filter(s => s !== name));
  };

  const addAllSuggestions = () => {
    const newSkills = suggestions.map(name => ({ id: generateId(), name, level: 'intermediate' as SkillLevel }));
    onChange([...data, ...newSkills]);
    setSuggestions([]);
  };

  return (
    <div className="space-y-4">
      {/* Manuel ekleme alanı */}
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

      {/* AI Beceri Önerisi */}
      <div className="rounded-lg border border-dashed border-primary/30 bg-primary/5 p-3 space-y-2">
        <button
          type="button"
          onClick={() => setShowSuggest(!showSuggest)}
          className="flex items-center gap-1.5 text-xs font-medium text-primary hover:text-primary/80 transition-colors w-full"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
          AI ile Beceri Öner
          <span className="ml-auto text-muted-foreground">{showSuggest ? '▲' : '▼'}</span>
        </button>

        {showSuggest && (
          <div className="space-y-2 pt-2 border-t border-primary/10">
            <div className="flex gap-2 items-center text-sm">
              <span className="text-muted-foreground">Seçili Unvan:</span>
              <span className="font-semibold text-foreground">{profession || "Belirtilmedi"}</span>
              <button
                type="button"
                onClick={handleAISuggest}
                disabled={isAILoading || !profession || !profession.trim() || isRateLimited}
                className="ml-auto rounded-lg bg-primary px-3 py-1 text-xs font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 flex items-center gap-1.5"
                title={!profession ? "Önce Kişisel Bilgiler'den Unvan girin" : "Önerileri Yenile"}
              >
                {isAILoading ? (
                  <span className="animate-spin rounded-full h-3 w-3 border-b border-white" />
                ) : '✨'}
                Önerileri Getir
              </button>
            </div>

            {/* Öneriler */}
            {suggestions.length > 0 && (
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wide font-medium">
                    Önerilen Beceriler
                  </p>
                  <button
                    type="button"
                    onClick={addAllSuggestions}
                    className="text-[10px] text-primary hover:underline"
                  >
                    Tümünü Ekle
                  </button>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {suggestions.map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => addSuggestion(s)}
                      className="text-xs bg-white border border-primary/30 text-primary rounded-full px-2.5 py-0.5 hover:bg-primary hover:text-primary-foreground transition-colors flex items-center gap-1"
                    >
                      <span>+</span> {s}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
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
          Henüz beceri eklenmedi. Yukarıdan ekleyebilir veya AI önerilerini kullanabilirsiniz.
        </p>
      )}
    </div>
  );
}
