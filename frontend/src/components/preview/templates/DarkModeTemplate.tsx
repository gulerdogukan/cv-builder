import type { CVData } from '@/types/cv.types';

interface Props {
  data: CVData;
}

export default function DarkModeTemplate({ data }: Props) {
  const { personal, summary, experience, education, skills, languages, certifications } = data;

  return (
    <div className="min-h-[297mm] p-12 text-slate-300 bg-[#0f111a] max-w-4xl mx-auto tracking-wide relative" style={{ fontFamily: 'var(--cv-font)' }}>
      <div className="absolute top-0 right-0 w-full h-[600px] pointer-events-none" style={{ background: 'linear-gradient(to bottom, var(--cv-accent) 0%, transparent 100%)', opacity: 0.1 }}></div>

      {/* Header */}
      <header className="mb-12 relative z-10">
        <h1 className="text-5xl font-black text-white tracking-tighter mb-4 font-mono">{personal.fullName || 'AD.SOYAD'}</h1>
        <div className="h-[2px] w-16 mb-6" style={{ backgroundColor: 'var(--cv-accent)', boxShadow: '0 0 10px var(--cv-accent)' }}></div>
        <div className="flex flex-wrap items-center gap-6 text-sm font-semibold text-slate-400 font-mono">
          {personal.email && <div className="flex items-center gap-2"><span style={{ color: 'var(--cv-accent)' }}>→</span> {personal.email}</div>}
          {personal.phone && <div className="flex items-center gap-2"><span style={{ color: 'var(--cv-accent)' }}>→</span> {personal.phone}</div>}
          {personal.location && <div className="flex items-center gap-2"><span style={{ color: 'var(--cv-accent)' }}>→</span> {personal.location}</div>}
          {personal.linkedin && <div className="flex items-center gap-2"><span style={{ color: 'var(--cv-accent)' }}>→</span> <a href={`https://${personal.linkedin}`} className="hover:opacity-80 transition-opacity" style={{ color: 'var(--cv-accent)' }}>{personal.linkedin}</a></div>}
          {personal.github && <div className="flex items-center gap-2"><span style={{ color: 'var(--cv-accent)' }}>→</span> <a href={`https://${personal.github}`} className="hover:opacity-80 transition-opacity" style={{ color: 'var(--cv-accent)' }}>{personal.github}</a></div>}
        </div>
      </header>

      {/* Summary */}
      {summary && (
        <section className="mb-12 relative z-10">
          <h2 className="text-xs uppercase tracking-[0.25em] font-bold mb-4" style={{ color: 'var(--cv-accent)' }}>// SYS_SUMMARY</h2>
          <p className="text-sm text-slate-300 leading-loose border-l border-slate-700 pl-6 border-dashed">
            {summary}
          </p>
        </section>
      )}

      {/* Main Split Layout */}
      <div className="grid grid-cols-1 md:grid-cols-12 md:gap-14 relative z-10">
        <div className="md:col-span-8 space-y-12">
          {/* Experience */}
          {experience.length > 0 && (
            <section>
              <h2 className="text-xs uppercase tracking-[0.25em] font-bold mb-6" style={{ color: 'var(--cv-accent)' }}>// EXE_EXPERIENCE</h2>
              <div className="space-y-8">
                {experience.map((exp) => (
                  <div key={exp.id} className="bg-[#151821] border border-[#232736] p-6 rounded-xl relative hover:border transition-colors group" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
                    <div className="absolute top-0 right-6 px-3 py-1 bg-[#1a1f2b] border-x border-b border-[#232736] rounded-b-lg text-xs font-mono text-slate-400 group-hover:text-current transition-colors" style={{ color: 'var(--cv-accent)' }}>
                      {exp.startDate} :: {exp.isCurrent ? 'ACTIVE' : exp.endDate}
                    </div>
                    
                    <h3 className="font-bold text-white text-lg mt-2 mb-1">{exp.position}</h3>
                    <div className="text-sm font-semibold mb-4" style={{ color: 'var(--cv-accent)' }}>{exp.company} <span className="text-slate-500 font-normal">[{exp.location}]</span></div>
                    
                    {exp.description && (
                      <p className="text-sm leading-relaxed text-slate-400 whitespace-pre-wrap">{exp.description}</p>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Education */}
          {education.length > 0 && (
            <section>
              <h2 className="text-xs uppercase tracking-[0.25em] font-bold mb-6" style={{ color: 'var(--cv-accent)' }}>// DB_EDUCATION</h2>
              <div className="space-y-4">
                {education.map((edu) => (
                  <div key={edu.id} className="relative pl-6 border-l-2 border-[#232736]">
                    <div className="absolute -left-[5px] top-2 w-2 h-2 rounded-full" style={{ backgroundColor: 'var(--cv-accent)', boxShadow: '0 0 8px var(--cv-accent)' }}></div>
                    <div className="flex justify-between items-start mb-1">
                      <h3 className="font-bold text-white text-base leading-none">{edu.school}</h3>
                      <span className="text-xs font-mono text-slate-500">{edu.startDate} : {edu.endDate || 'ACTIVE'}</span>
                    </div>
                    <div className="text-sm font-medium mb-1" style={{ color: 'var(--cv-accent)', opacity: 0.8 }}>{edu.degree} - {edu.field}</div>
                    {edu.gpa && <div className="text-xs text-slate-500 font-mono inline-flex items-center gap-2 bg-[#151821] px-2 py-1 rounded border border-[#232736]">SYS.GPA = <span className="text-white font-bold">{edu.gpa}</span></div>}
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>

        {/* Sidebar */}
        <div className="md:col-span-4 space-y-12">
          {/* Skills */}
          {skills.length > 0 && (
            <section>
              <h2 className="text-xs uppercase tracking-[0.25em] font-bold mb-6" style={{ color: 'var(--cv-accent)' }}>// CFG_SKILLS</h2>
              <div className="flex flex-col gap-3">
                {skills.map(s => {
                  const levelVal = { beginner: 1, intermediate: 2, advanced: 3, expert: 4 }[s.level] || 2;
                  return (
                    <div key={s.id}>
                      <div className="flex justify-between items-center mb-1.5">
                        <span className="text-sm font-bold text-slate-200">{s.name}</span>
                        <span className="text-[10px] font-mono font-bold text-slate-500 uppercase">{s.level}</span>
                      </div>
                      <div className="flex gap-1 h-1.5">
                        {[1,2,3,4].map(i => (
                          <div key={i} className={`flex-1 rounded-sm ${i <= levelVal ? 'shadow-[0_0_5px_rgba(255,255,255,0.2)]' : 'bg-[#232736]'}`} style={{ backgroundColor: i <= levelVal ? 'var(--cv-accent)' : undefined }}></div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {/* Languages */}
          {languages.length > 0 && (
            <section>
              <h2 className="text-xs uppercase tracking-[0.25em] font-bold mb-6" style={{ color: 'var(--cv-accent)' }}>// MOD_LANGS</h2>
              <ul className="space-y-3">
                {languages.map(l => (
                  <li key={l.id} className="flex justify-between items-center p-3 rounded bg-[#151821] border border-[#232736]">
                    <span className="font-bold text-sm text-slate-200">{l.name}</span>
                    <span className="text-xs font-mono font-bold bg-[#1a1f2b] px-2 py-0.5 rounded border border-white/10" style={{ color: 'var(--cv-accent)' }}>
                      {l.level}
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* Certifications */}
          {certifications.length > 0 && (
            <section>
              <h2 className="text-xs uppercase tracking-[0.25em] font-bold mb-6" style={{ color: 'var(--cv-accent)' }}>// NET_CERTS</h2>
              <div className="space-y-4">
                {certifications.map(c => (
                  <div key={c.id}>
                    <h3 className="font-bold text-slate-200 text-sm mb-1 leading-snug">{c.name}</h3>
                    <div className="text-xs text-slate-400 flex flex-col gap-0.5">
                      <span>✓ {c.issuer}</span>
                      <span className="font-mono" style={{ color: 'var(--cv-accent)', opacity: 0.8 }}>[{c.date}]</span>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}
