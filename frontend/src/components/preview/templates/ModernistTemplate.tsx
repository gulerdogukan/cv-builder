import type { CVData } from '@/types/cv.types';

interface Props {
  data: CVData;
}

export default function ModernistTemplate({ data }: Props) {
  const { personal, summary, experience, education, skills, languages, certifications } = data;

  return (
    <div className="min-h-[297mm] flex text-gray-800" style={{ fontFamily: 'var(--cv-font)' }}>
      {/* Left Column - 30% */}
      <aside className="w-[30%] bg-slate-50 p-6 flex flex-col gap-6 border-r border-slate-200">
        <div className="text-center mb-4">
          <div className="w-24 h-24 bg-slate-200 rounded-full mx-auto mb-4 border-2 border-white shadow-sm flex items-center justify-center text-slate-400 font-bold text-2xl">
            {personal.fullName?.charAt(0) || 'P'}
          </div>
          <h1 
            className="text-xl font-bold leading-tight mb-2" 
            style={{ color: 'var(--cv-accent)' }}
          >
            {personal.fullName || 'Ad Soyad'}
          </h1>
        </div>

        <section>
          <h2 className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-3 border-b-2 pb-1" style={{ borderColor: 'var(--cv-accent)' }}>İletişim</h2>
          <ul className="text-xs space-y-2 text-slate-600 break-all">
            {personal.email && (
              <li className="flex items-center gap-2">
                <span className="text-slate-400">✉</span> {personal.email}
              </li>
            )}
            {personal.phone && (
              <li className="flex items-center gap-2">
                <span className="text-slate-400">📱</span> {personal.phone}
              </li>
            )}
            {personal.location && (
              <li className="flex items-center gap-2">
                <span className="text-slate-400">📍</span> {personal.location}
              </li>
            )}
            {personal.linkedin && (
              <li className="flex items-center gap-2">
                <span className="text-slate-400">in</span> {personal.linkedin}
              </li>
            )}
          </ul>
        </section>

        {skills.length > 0 && (
          <section>
            <h2 className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-3 border-b-2 pb-1" style={{ borderColor: 'var(--cv-accent)' }}>Beceriler</h2>
            <div className="flex flex-wrap gap-1.5">
              {skills.map((s) => (
                <span key={s.id} className="bg-slate-200 text-slate-700 text-[10px] px-2 py-1 rounded-md font-medium">
                  {s.name}
                </span>
              ))}
            </div>
          </section>
        )}

        {languages.length > 0 && (
          <section>
            <h2 className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-3 border-b-2 pb-1" style={{ borderColor: 'var(--cv-accent)' }}>Diller</h2>
            <ul className="text-xs space-y-1 text-slate-600">
              {languages.map((l) => (
                <li key={l.id} className="flex justify-between">
                  <span>{l.name}</span>
                  <span className="text-slate-400 text-[10px]">{l.level}</span>
                </li>
              ))}
            </ul>
          </section>
        )}
      </aside>

      {/* Right Column - 70% */}
      <main className="w-[70%] bg-white p-8">
        
        {summary && (
          <section className="mb-8 relative">
            <h2 className="text-sm font-bold uppercase tracking-widest text-slate-800 mb-3 flex items-center gap-2">
              <span className="w-6 h-[2px]" style={{ backgroundColor: 'var(--cv-accent)' }}></span> Özet
            </h2>
            <p className="text-sm text-slate-600 leading-relaxed pl-8">
              {summary}
            </p>
          </section>
        )}

        {experience.length > 0 && (
          <section className="mb-8">
            <h2 className="text-sm font-bold uppercase tracking-widest text-slate-800 mb-4 flex items-center gap-2">
              <span className="w-6 h-[2px]" style={{ backgroundColor: 'var(--cv-accent)' }}></span> Deneyim
            </h2>
            <div className="space-y-6 pl-8">
              {experience.map((exp) => (
                <div key={exp.id} className="relative">
                  <div className="absolute -left-9 top-1.5 w-2.5 h-2.5 rounded-full border-2 border-white" style={{ backgroundColor: 'var(--cv-accent)' }}></div>
                  <div className="flex justify-between items-start mb-1">
                    <h3 className="text-base font-bold text-slate-900">{exp.position}</h3>
                    <span className="text-xs font-semibold text-slate-500 bg-slate-50 px-2 py-0.5 rounded">
                      {exp.startDate} - {exp.isCurrent ? 'Devam' : exp.endDate}
                    </span>
                  </div>
                  <div className="text-sm font-medium text-slate-600 mb-2">{exp.company} <span className="text-slate-400 font-normal">| {exp.location}</span></div>
                  {exp.description && (
                    <p className="text-xs text-slate-500 leading-relaxed whitespace-pre-wrap">{exp.description}</p>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {education.length > 0 && (
          <section className="mb-8">
            <h2 className="text-sm font-bold uppercase tracking-widest text-slate-800 mb-4 flex items-center gap-2">
              <span className="w-6 h-[2px]" style={{ backgroundColor: 'var(--cv-accent)' }}></span> Eğitim
            </h2>
            <div className="space-y-4 pl-8">
              {education.map((edu) => (
                <div key={edu.id}>
                  <div className="flex justify-between items-start mb-1">
                    <h3 className="text-sm font-bold text-slate-900">{edu.school}</h3>
                    <span className="text-xs text-slate-500">{edu.startDate} - {edu.endDate || 'Devam'}</span>
                  </div>
                  <div className="text-xs text-slate-600 font-medium">{edu.degree} - {edu.field}</div>
                  {edu.gpa && <div className="text-[10px] text-slate-400 mt-1">GPA: {edu.gpa}</div>}
                </div>
              ))}
            </div>
          </section>
        )}

        {certifications.length > 0 && (
          <section>
            <h2 className="text-sm font-bold uppercase tracking-widest text-slate-800 mb-4 flex items-center gap-2">
              <span className="w-6 h-[2px]" style={{ backgroundColor: 'var(--cv-accent)' }}></span> Sertifikalar
            </h2>
            <ul className="pl-8 space-y-3">
              {certifications.map((c) => (
                <li key={c.id}>
                  <div className="text-sm font-semibold text-slate-800">{c.name}</div>
                  <div className="text-xs text-slate-500 flex gap-2 mt-0.5">
                    <span>{c.issuer}</span> • <span>{c.date}</span>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        )}

      </main>
    </div>
  );
}
