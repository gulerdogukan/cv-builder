import type { CVData } from '@/types/cv.types';

interface Props {
  data: CVData;
}

export default function StartupTemplate({ data }: Props) {
  const { personal, summary, experience, education, skills, languages, certifications } = data;

  return (
    <div className="min-h-[297mm] p-10 font-sans text-slate-800 bg-white shadow-xl max-w-4xl mx-auto">
      {/* Header */}
      <header className="flex flex-col md:flex-row gap-8 items-center bg-blue-600 text-white p-8 rounded-3xl mb-8">
        <div className="w-28 h-28 shrink-0 bg-blue-500 rounded-full flex items-center justify-center border-4 border-blue-400 shadow-lg text-4xl font-black">
          {personal.fullName?.charAt(0) || 'S'}
        </div>
        <div className="flex-1 text-center md:text-left">
          <h1 className="text-4xl font-black mb-2 tracking-tight">{personal.fullName || 'Ad Soyad'}</h1>
          <h2 className="text-xl font-medium text-blue-200 mb-4">{personal.profession || 'Startup Pozisyonu'}</h2>
          <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 text-sm font-medium text-blue-100">
            {personal.email && <div className="flex items-center gap-1.5"><span className="text-blue-300">@</span> {personal.email}</div>}
            {personal.phone && <div className="flex items-center gap-1.5"><span className="text-blue-300">T:</span> {personal.phone}</div>}
            {personal.location && <div className="flex items-center gap-1.5"><span className="text-blue-300">L:</span> {personal.location}</div>}
            {personal.linkedin && <div className="flex items-center gap-1.5"><span className="text-blue-300">in:</span> <a href={`https://${personal.linkedin}`} className="hover:text-white transition-colors">{personal.linkedin}</a></div>}
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
                <span className="w-1.5 h-6 bg-blue-600 rounded-full inline-block"></span> Özet
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
                <span className="w-1.5 h-6 bg-blue-600 rounded-full inline-block"></span> Deneyim
              </h3>
              <div className="space-y-6">
                {experience.map((exp) => (
                  <div key={exp.id} className="relative pl-6 before:absolute before:left-0 before:top-2 before:bottom-0 before:w-0.5 before:bg-blue-100 last:before:bg-transparent">
                    <div className="absolute left-[-4px] top-2 w-2.5 h-2.5 bg-blue-600 rounded-full shadow-[0_0_0_4px_white]"></div>
                    <div className="flex justify-between items-start mb-1">
                      <h4 className="font-bold text-lg text-slate-900">{exp.position}</h4>
                      <span className="text-xs font-bold px-2.5 py-1 bg-blue-50 text-blue-700 rounded-full">
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
                <span className="w-1.5 h-6 bg-blue-600 rounded-full inline-block"></span> Yetenekler
              </h3>
              <div className="flex flex-col gap-2">
                {skills.map(s => (
                  <div key={s.id} className="bg-slate-100 px-4 py-2 rounded-xl flex items-center justify-between">
                    <span className="font-bold text-slate-800 text-sm">{s.name}</span>
                    <span className="text-xs font-bold text-blue-600 uppercase tracking-tight">{s.level}</span>
                  </div>
                ))}
              </div>
            </section>
          )}

          {education.length > 0 && (
            <section>
              <h3 className="text-xl font-black text-slate-900 mb-4 flex items-center gap-2">
                <span className="w-1.5 h-6 bg-blue-600 rounded-full inline-block"></span> Eğitim
              </h3>
              <div className="space-y-4">
                {education.map(edu => (
                  <div key={edu.id} className="bg-blue-50/50 p-4 rounded-xl border border-blue-100">
                    <h4 className="font-bold text-slate-900 text-sm leading-tight mb-1">{edu.school}</h4>
                    <div className="text-xs text-slate-700 font-semibold mb-2">{edu.degree} - {edu.field}</div>
                    <div className="flex justify-between items-center text-xs text-slate-500">
                      <span>{edu.startDate} - {edu.endDate || 'Devam'}</span>
                      {edu.gpa && <span className="font-bold text-blue-600 bg-white px-2 py-0.5 rounded shadow-sm">GPA: {edu.gpa}</span>}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {languages.length > 0 && (
            <section>
              <h3 className="text-xl font-black text-slate-900 mb-4 flex items-center gap-2">
                <span className="w-1.5 h-6 bg-blue-600 rounded-full inline-block"></span> Diller
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
                <span className="w-1.5 h-6 bg-blue-600 rounded-full inline-block"></span> Sertifikalar
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
