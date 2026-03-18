import type { CVData } from '@/types/cv.types';

interface Props {
  data: CVData;
}

export default function CreativeCanvasTemplate({ data }: Props) {
  const { personal, summary, experience, education, skills, languages, certifications } = data;

  return (
    <div className="min-h-[297mm] p-12 text-slate-700 bg-white relative overflow-hidden" style={{ fontFamily: 'var(--cv-font)' }}>
      {/* Background decoration */}
      <div className="absolute top-0 right-0 w-64 h-64 rounded-bl-full -z-0 opacity-20 blur-3xl print:hidden" style={{ backgroundColor: 'var(--cv-accent)' }}></div>
      <div className="absolute bottom-0 left-0 w-80 h-80 rounded-tr-full -z-0 opacity-20 blur-3xl print:hidden" style={{ backgroundColor: 'var(--cv-accent)' }}></div>

      <div className="relative z-10 w-full max-w-4xl mx-auto">
        {/* Header */}
        <header className="mb-12 flex flex-col md:flex-row md:items-center justify-between gap-6 border-b-2 pb-8" style={{ borderColor: 'rgba(0,0,0,0.1)' }}>
          <div className="flex-1">
            <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight leading-none mb-3" style={{ color: 'var(--cv-accent)' }}>
              {personal.fullName || 'Ad Soyad'}
            </h1>
            <h2 className="text-xl font-medium text-slate-500 tracking-wide uppercase">
              {personal.profession || 'Kreatif Profesyonel'}
            </h2>
          </div>

          <div className="flex flex-col gap-1.5 text-sm font-medium text-slate-600 text-right">
            {personal.location && <div className="flex items-center justify-end gap-2 text-slate-800">
              {personal.location} <span style={{ color: 'var(--cv-accent)' }}>📍</span>
            </div>}
            {personal.email && <div className="flex items-center justify-end gap-2 hover:opacity-80 transition-opacity">
              {personal.email} <span style={{ color: 'var(--cv-accent)' }}>✉️</span>
            </div>}
            {personal.phone && <div className="flex items-center justify-end gap-2">
              {personal.phone} <span style={{ color: 'var(--cv-accent)' }}>📱</span>
            </div>}
            {personal.linkedin && <div className="flex items-center justify-end gap-2">
              <a href={`https://${personal.linkedin}`} className="hover:underline transition-all" style={{ color: 'var(--cv-accent)' }}>{personal.linkedin}</a> <span style={{ color: 'var(--cv-accent)' }}>🔗</span>
            </div>}
          </div>
        </header>

        {/* Summary */}
        {summary && (
          <section className="mb-10 bg-slate-50/80 p-6 rounded-2xl border border-slate-100 shadow-sm">
            <h3 className="text-sm font-bold uppercase tracking-widest mb-4 flex items-center gap-2" style={{ color: 'var(--cv-accent)' }}>
              Özet
              <div className="flex-1 h-px" style={{ backgroundColor: 'rgba(0,0,0,0.05)' }}></div>
            </h3>
            <p className="text-base text-slate-800 leading-relaxed font-medium">
              {summary}
            </p>
          </section>
        )}

        <div className="grid grid-cols-1 md:grid-cols-12 gap-10">
          {/* Main Content (Experience, Education) */}
          <div className="col-span-1 md:col-span-8 space-y-10">
            {experience.length > 0 && (
              <section>
                <h3 className="text-sm font-bold uppercase tracking-widest mb-6 flex items-center gap-2" style={{ color: 'var(--cv-accent)' }}>
                  Deneyim
                  <div className="flex-1 h-px" style={{ backgroundColor: 'rgba(0,0,0,0.05)' }}></div>
                </h3>
                <div className="space-y-8 relative before:absolute before:inset-0 before:ml-2.5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-200 before:to-transparent">
                  {experience.map((exp) => (
                    <div key={exp.id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                      <div className="flex items-center justify-center w-6 h-6 rounded-full border-4 border-white transition-colors shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10" style={{ backgroundColor: 'var(--cv-accent)' }}></div>
                      <div className="w-[calc(100%-3rem)] md:w-[calc(50%-2rem)] p-4 rounded-xl border border-slate-100 bg-white shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-1">
                          <h4 className="font-bold text-slate-900 text-base">{exp.position}</h4>
                          <span className="text-xs font-bold px-2 py-1 rounded-full whitespace-nowrap" style={{ color: 'var(--cv-accent)', backgroundColor: 'rgba(0,0,0,0.05)' }}>
                            {exp.startDate} - {exp.isCurrent ? 'Devam' : exp.endDate}
                          </span>
                        </div>
                        <div className="text-sm font-semibold mb-3" style={{ color: 'var(--cv-accent)', opacity: 0.8 }}>{exp.company} <span className="text-slate-400 font-normal">| {exp.location}</span></div>
                        {exp.description && (
                          <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-wrap">{exp.description}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {education.length > 0 && (
              <section>
                <h3 className="text-sm font-bold uppercase tracking-widest mb-6 flex items-center gap-2" style={{ color: 'var(--cv-accent)' }}>
                  Eğitim
                  <div className="flex-1 h-px" style={{ backgroundColor: 'rgba(0,0,0,0.05)' }}></div>
                </h3>
                <div className="grid gap-4 sm:grid-cols-2">
                  {education.map((edu) => (
                    <div key={edu.id} className="p-4 rounded-xl border transition-colors" style={{ backgroundColor: 'rgba(0,0,0,0.02)', borderColor: 'rgba(0,0,0,0.05)' }}>
                      <h4 className="font-bold text-slate-900 h-10 line-clamp-2">{edu.school}</h4>
                      <p className="text-sm font-medium text-slate-700 mt-2">{edu.degree}</p>
                      <p className="text-xs text-slate-500 mb-3">{edu.field}</p>
                      <div className="flex items-center justify-between text-xs pt-3 border-t" style={{ borderColor: 'rgba(0,0,0,0.05)' }}>
                        <span className="font-medium" style={{ color: 'var(--cv-accent)' }}>{edu.startDate} - {edu.endDate || 'Devam'}</span>
                        {edu.gpa && <span className="bg-white px-2 py-0.5 rounded-full text-slate-600 shadow-sm">GPA: {edu.gpa}</span>}
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>

          {/* Sidebar (Skills, Langs, Certs) */}
          <div className="col-span-1 md:col-span-4 space-y-10">
            {skills.length > 0 && (
              <section>
                <h3 className="text-sm font-bold uppercase tracking-widest mb-4 pb-2 border-b" style={{ color: 'var(--cv-accent)', borderColor: 'rgba(0,0,0,0.1)' }}>
                  Uzmanlık
                </h3>
                <div className="flex flex-wrap gap-2">
                  {skills.map(s => (
                    <span key={s.id} className="text-sm px-3 py-1.5 bg-white border border-slate-200 text-slate-700 font-medium rounded-2xl shadow-sm">
                      {s.name}
                    </span>
                  ))}
                </div>
              </section>
            )}

            {languages.length > 0 && (
              <section>
                <h3 className="text-sm font-bold uppercase tracking-widest mb-4 pb-2 border-b" style={{ color: 'var(--cv-accent)', borderColor: 'rgba(0,0,0,0.1)' }}>
                  Diller
                </h3>
                <ul className="space-y-3">
                  {languages.map(l => (
                    <li key={l.id} className="flex justify-between items-center text-sm p-2 rounded-lg hover:bg-slate-50 transition-colors">
                      <span className="font-bold text-slate-800">{l.name}</span>
                      <span className="px-2 py-1 rounded-md text-xs font-semibold" style={{ color: 'var(--cv-accent)', backgroundColor: 'rgba(0,0,0,0.05)' }}>{l.level}</span>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {certifications.length > 0 && (
              <section>
                <h3 className="text-sm font-bold uppercase tracking-widest mb-4 pb-2 border-b" style={{ color: 'var(--cv-accent)', borderColor: 'rgba(0,0,0,0.1)' }}>
                  Sertifikalar
                </h3>
                <div className="space-y-4">
                  {certifications.map(c => (
                    <div key={c.id} className="relative pl-4 border-l-2" style={{ borderColor: 'rgba(0,0,0,0.1)' }}>
                      <div className="absolute w-2 h-2 rounded-full -left-1.5 top-1.5 border-2 border-white" style={{ backgroundColor: 'var(--cv-accent)' }}></div>
                      <h4 className="text-sm font-bold text-slate-900 leading-snug">{c.name}</h4>
                      <p className="text-xs text-slate-500 mt-1">{c.issuer}</p>
                      <p className="text-xs font-medium text-slate-400 mt-0.5">{c.date}</p>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
