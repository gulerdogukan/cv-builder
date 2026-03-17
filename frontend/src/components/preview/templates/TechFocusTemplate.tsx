import type { CVData } from '@/types/cv.types';

interface Props {
  data: CVData;
}

export default function TechFocusTemplate({ data }: Props) {
  const { personal, summary, experience, education, skills, languages, certifications } = data;

  return (
    <div className="p-10 font-mono text-gray-800 leading-relaxed max-w-4xl mx-auto bg-white min-h-[297mm]">
      {/* Header */}
      <header className="mb-8 border-b-2 border-slate-900 pb-6 flex items-end justify-between">
        <div>
          <h1 className="text-4xl font-bold tracking-tighter text-slate-900 mb-1">
            {personal.fullName || 'Ad Soyad'}
          </h1>
          <h2 className="text-lg text-slate-500">{personal.profession || 'Yazılım Geliştirici'}</h2>
        </div>
        <div className="text-right text-sm text-slate-600 flex flex-col gap-1 items-end">
          {personal.email && <div className="hover:text-slate-900 transition-colors">{personal.email}</div>}
          {personal.phone && <div>{personal.phone}</div>}
          {personal.location && <div>{personal.location}</div>}
          {personal.github && (
            <a href={`https://${personal.github}`} className="font-semibold text-slate-900 hover:underline flex items-center gap-1">
              github.com/{personal.github.split('/').pop()} ✓
            </a>
          )}
          {personal.linkedin && (
            <a href={`https://${personal.linkedin}`} className="text-slate-900 hover:underline">
              {personal.linkedin}
            </a>
          )}
        </div>
      </header>

      {/* Summary */}
      {summary && (
        <section className="mb-8">
          <h3 className="text-sm font-bold uppercase tracking-widest text-slate-400 mb-3 block border-b border-slate-200 pb-1">
            &gt; /özet
          </h3>
          <p className="text-sm text-slate-700 leading-loose">
            {summary}
          </p>
        </section>
      )}

      {/* Experience */}
      {experience.length > 0 && (
        <section className="mb-8">
          <h3 className="text-sm font-bold uppercase tracking-widest text-slate-400 mb-4 block border-b border-slate-200 pb-1">
            &gt; /deneyimler
          </h3>
          <div className="space-y-6">
            {experience.map((exp) => (
              <div key={exp.id} className="relative pl-4 border-l-2 border-slate-200 hover:border-slate-800 transition-colors">
                <div className="flex justify-between items-start mb-1">
                  <div>
                    <h4 className="text-base font-bold text-slate-900">{exp.position}</h4>
                    <div className="text-sm font-medium text-slate-600">@ {exp.company}</div>
                  </div>
                  <div className="text-right text-xs font-semibold text-slate-500 font-sans tracking-wide bg-slate-100 px-2 py-1 rounded">
                    {exp.startDate} - {exp.isCurrent ? 'Devam' : exp.endDate}
                  </div>
                </div>
                {exp.location && <div className="text-xs text-slate-400 mb-2">{exp.location}</div>}
                
                {exp.description && (
                  <p className="text-sm text-slate-700 mt-2 whitespace-pre-wrap leading-relaxed">
                    {exp.description}
                  </p>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Two Column Grid for Skills / Edu */}
      <div className="grid grid-cols-12 gap-8">
        {/* Left Col (Skills + Languages) */}
        <div className="col-span-5 space-y-8">
          {skills.length > 0 && (
            <section>
              <h3 className="text-sm font-bold uppercase tracking-widest text-slate-400 mb-3 block border-b border-slate-200 pb-1">
                &gt; /yetenekler
              </h3>
              <div className="flex flex-wrap gap-2">
                {skills.map(s => (
                  <span key={s.id} className="px-2 py-1 bg-slate-900 text-slate-100 text-xs rounded border border-slate-700 font-medium">
                    {s.name}
                  </span>
                ))}
              </div>
            </section>
          )}

          {languages.length > 0 && (
            <section>
              <h3 className="text-sm font-bold uppercase tracking-widest text-slate-400 mb-3 block border-b border-slate-200 pb-1">
                &gt; /diller
              </h3>
              <ul className="text-sm space-y-2">
                {languages.map(l => (
                  <li key={l.id} className="flex justify-between items-center border-b border-slate-100 pb-1">
                    <span className="font-semibold text-slate-800">{l.name}</span>
                    <span className="text-xs text-slate-500 bg-slate-100 px-2 py-0.5 rounded">{l.level}</span>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>

        {/* Right Col (Education + Certs) */}
        <div className="col-span-7 space-y-8">
          {education.length > 0 && (
            <section>
              <h3 className="text-sm font-bold uppercase tracking-widest text-slate-400 mb-3 block border-b border-slate-200 pb-1">
                &gt; /eğitim
              </h3>
              <div className="space-y-4">
                {education.map((edu) => (
                  <div key={edu.id} className="bg-slate-50 p-4 rounded border border-slate-200">
                    <h4 className="font-bold text-slate-900">{edu.school}</h4>
                    <div className="text-sm text-slate-700 mt-1">{edu.degree} - {edu.field}</div>
                    <div className="text-xs text-slate-500 flex justify-between items-center mt-2">
                      <span>{edu.startDate} - {edu.endDate || 'Devam'}</span>
                      {edu.gpa && <span className="font-semibold bg-white px-2 py-0.5 border border-slate-200 rounded">GPA: {edu.gpa}</span>}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {certifications.length > 0 && (
            <section>
              <h3 className="text-sm font-bold uppercase tracking-widest text-slate-400 mb-3 block border-b border-slate-200 pb-1">
                &gt; /sertifikalar
              </h3>
              <div className="space-y-3">
                {certifications.map(c => (
                  <div key={c.id} className="flex items-start gap-3">
                    <div className="mt-1 text-slate-400">▹</div>
                    <div className="flex-1">
                      <h4 className="font-bold text-sm text-slate-900">{c.name}</h4>
                      <div className="text-xs text-slate-600 flex justify-between mt-0.5">
                        <span>{c.issuer}</span>
                        <span>{c.date}</span>
                      </div>
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
