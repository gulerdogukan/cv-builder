import type { CVData } from '@/types/cv.types';

interface Props {
  data: CVData;
}

export default function StartupTemplate({ data }: Props) {
  const { personal, summary, experience, education, skills, languages, certifications } = data;

  return (
    <div className="min-h-[297mm] p-10 font-sans text-slate-800 bg-white max-w-4xl mx-auto" style={{ fontFamily: 'var(--cv-font)' }}>
      {/* Header */}
      <header className="flex flex-col md:flex-row gap-8 items-center text-white p-8 rounded-3xl mb-8" style={{ backgroundColor: 'var(--cv-accent)' }}>
        <div className="w-28 h-28 shrink-0 rounded-full flex items-center justify-center border-4 shadow-lg text-4xl font-black" style={{ backgroundColor: 'white', color: 'var(--cv-accent)', borderColor: 'rgba(255,255,255,0.3)' }}>
          {personal.fullName?.charAt(0) || 'S'}
        </div>
        <div className="flex-1 text-center md:text-left">
          <h1 className="text-4xl font-black mb-2 tracking-tight">{personal.fullName || 'Ad Soyad'}</h1>
          <h2 className="text-xl font-medium mb-4" style={{ opacity: 0.8 }}>{personal.profession || 'Startup Pozisyonu'}</h2>
          <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 text-sm font-medium" style={{ opacity: 0.9 }}>
            {personal.email && <div className="flex items-center gap-1.5"><span>@</span> {personal.email}</div>}
            {personal.phone && <div className="flex items-center gap-1.5"><span>T:</span> {personal.phone}</div>}
            {personal.location && <div className="flex items-center gap-1.5"><span>L:</span> {personal.location}</div>}
            {personal.linkedin && <div className="flex items-center gap-1.5"><span>in:</span> <a href={`https://${personal.linkedin}`} className="hover:underline transition-colors">{personal.linkedin}</a></div>}
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
        {/* Left Col */}
        <div className="md:col-span-2 space-y-10">
          {/* Summary */}
          {summary && (
            <section>
              <h3 className="text-2xl font-black text-slate-900 mb-4 flex items-center gap-3">
                <span className="w-1.5 h-6 rounded-full inline-block" style={{ backgroundColor: 'var(--cv-accent)' }}></span> Özet
              </h3>
              <p className="text-base leading-relaxed text-slate-700 font-medium bg-slate-50 p-6 rounded-2xl">
                {summary}
              </p>
            </section>
          )}

          {/* Experience */}
          {experience.length > 0 && (
            <section>
              <h3 className="text-2xl font-black text-slate-900 mb-6 flex items-center gap-3">
                <span className="w-1.5 h-6 rounded-full inline-block" style={{ backgroundColor: 'var(--cv-accent)' }}></span> Deneyim
              </h3>
              <div className="space-y-6">
                {experience.map((exp) => (
                  <div key={exp.id} className="relative pl-6 before:absolute before:left-0 before:top-2 before:bottom-0 before:w-0.5 before:bg-slate-100 last:before:bg-transparent">
                    <div className="absolute left-[-4px] top-2 w-2.5 h-2.5 rounded-full shadow-[0_0_0_4px_white]" style={{ backgroundColor: 'var(--cv-accent)' }}></div>
                    <div className="flex justify-between items-start mb-1">
                      <h4 className="font-bold text-lg text-slate-900">{exp.position}</h4>
                      <span className="text-xs font-bold px-2.5 py-1 rounded-full" style={{ backgroundColor: 'rgba(0,0,0,0.05)', color: 'var(--cv-accent)' }}>
                        {exp.startDate} - {exp.isCurrent ? 'Devam' : exp.endDate}
                      </span>
                    </div>
                    <div className="text-sm font-semibold text-slate-600 mb-3">{exp.company} <span className="text-slate-400 font-normal">| {exp.location}</span></div>
                    {exp.description && (
                      <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">{exp.description}</p>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>

        {/* Right Col */}
        <div className="md:col-span-1 space-y-8">
          {skills.length > 0 && (
            <section>
              <h3 className="text-xl font-black text-slate-900 mb-4 flex items-center gap-2">
                <span className="w-1.5 h-6 rounded-full inline-block" style={{ backgroundColor: 'var(--cv-accent)' }}></span> Yetenekler
              </h3>
              <div className="flex flex-col gap-2">
                {skills.map(s => (
                  <div key={s.id} className="bg-slate-100 px-4 py-2 rounded-xl flex items-center justify-between">
                    <span className="font-bold text-slate-800 text-sm">{s.name}</span>
                    <span className="text-xs font-bold uppercase tracking-tight" style={{ color: 'var(--cv-accent)' }}>{s.level}</span>
                  </div>
                ))}
              </div>
            </section>
          )}

          {education.length > 0 && (
            <section>
              <h3 className="text-xl font-black text-slate-900 mb-4 flex items-center gap-2">
                <span className="w-1.5 h-6 rounded-full inline-block" style={{ backgroundColor: 'var(--cv-accent)' }}></span> Eğitim
              </h3>
              <div className="space-y-4">
                {education.map(edu => (
                  <div key={edu.id} className="p-4 rounded-xl border" style={{ backgroundColor: 'rgba(0,0,0,0.02)', borderColor: 'rgba(0,0,0,0.05)' }}>
                    <h4 className="font-bold text-slate-900 text-sm leading-tight mb-1">{edu.school}</h4>
                    <div className="text-xs text-slate-700 font-semibold mb-2">{edu.degree} - {edu.field}</div>
                    <div className="flex justify-between items-center text-xs text-slate-500">
                      <span>{edu.startDate} - {edu.endDate || 'Devam'}</span>
                      {edu.gpa && <span className="font-bold bg-white px-2 py-0.5 rounded shadow-sm" style={{ color: 'var(--cv-accent)' }}>GPA: {edu.gpa}</span>}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {languages.length > 0 && (
            <section>
              <h3 className="text-xl font-black text-slate-900 mb-4 flex items-center gap-2">
                <span className="w-1.5 h-6 rounded-full inline-block" style={{ backgroundColor: 'var(--cv-accent)' }}></span> Diller
              </h3>
              <div className="space-y-3">
                {languages.map(l => (
                  <div key={l.id} className="flex justify-between items-center border-b-2 border-slate-100 pb-2 border-dotted">
                    <span className="font-bold text-sm text-slate-800">{l.name}</span>
                    <span className="text-xs font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">{l.level}</span>
                  </div>
                ))}
              </div>
            </section>
          )}

          {certifications.length > 0 && (
            <section>
              <h3 className="text-xl font-black text-slate-900 mb-4 flex items-center gap-2">
                <span className="w-1.5 h-6 rounded-full inline-block" style={{ backgroundColor: 'var(--cv-accent)' }}></span> Sertifikalar
              </h3>
              <ul className="space-y-4">
                {certifications.map(c => (
                  <li key={c.id}>
                    <div className="font-bold text-sm text-slate-800 mb-0.5">{c.name}</div>
                    <div className="text-xs text-slate-500 font-medium">{c.issuer}</div>
                    <div className="text-xs text-slate-400 mt-0.5">{c.date}</div>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}
