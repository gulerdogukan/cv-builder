import type { CVData } from '@/types/cv.types';

interface Props {
  data: CVData;
}

export default function MinimalistTemplate({ data }: Props) {
  const { personal, summary, experience, education, skills, languages, certifications } = data;

  return (
    <div className="p-10 text-gray-900 leading-relaxed max-w-4xl mx-auto" style={{ fontFamily: 'var(--cv-font)' }}>
      {/* Header */}
      <header className="text-center mb-8">
        <h1 className="text-3xl font-bold uppercase tracking-wider mb-2" style={{ color: 'var(--cv-accent)' }}>{personal.fullName || 'AD SOYAD'}</h1>
        <div className="text-sm flex flex-wrap justify-center gap-x-4 gap-y-1 text-gray-700">
          {personal.email && <span>{personal.email}</span>}
          {personal.phone && <span>{personal.phone}</span>}
          {personal.location && <span>{personal.location}</span>}
          {personal.linkedin && <a href={`https://${personal.linkedin}`} className="hover:underline" style={{ color: 'var(--cv-accent)' }}>{personal.linkedin}</a>}
          {personal.github && <a href={`https://${personal.github}`} className="hover:underline" style={{ color: 'var(--cv-accent)' }}>{personal.github}</a>}
        </div>
      </header>

      {/* Summary */}
      {summary && (
        <section className="mb-6">
          <h2 className="text-lg font-bold uppercase border-b-2 mb-2" style={{ borderColor: 'var(--cv-accent)' }}>Profesyonel Özet</h2>
          <p className="text-sm text-justify">{summary}</p>
        </section>
      )}

      {/* Experience */}
      {experience.length > 0 && (
        <section className="mb-6">
          <h2 className="text-lg font-bold uppercase border-b-2 mb-3" style={{ borderColor: 'var(--cv-accent)' }}>Deneyim</h2>
          <div className="space-y-4">
            {experience.map((exp) => (
              <div key={exp.id}>
                <div className="flex justify-between items-baseline mb-1">
                  <h3 className="font-bold text-base">{exp.position}</h3>
                  <span className="text-sm border-l pl-2">{exp.startDate} - {exp.isCurrent ? "Devam Ediyor" : exp.endDate}</span>
                </div>
                <div className="flex justify-between items-baseline mb-1 text-sm italic">
                  <span>{exp.company}</span>
                  {exp.location && <span>{exp.location}</span>}
                </div>
                {exp.description && (
                  <p className="text-sm mt-1 whitespace-pre-wrap">{exp.description}</p>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Education */}
      {education.length > 0 && (
        <section className="mb-6">
          <h2 className="text-lg font-bold uppercase border-b-2 mb-3" style={{ borderColor: 'var(--cv-accent)' }}>Eğitim</h2>
          <div className="space-y-4">
            {education.map((edu) => (
              <div key={edu.id}>
                <div className="flex justify-between items-baseline mb-1">
                  <h3 className="font-bold text-base">{edu.school}</h3>
                  <span className="text-sm">{edu.startDate} - {edu.endDate || 'Devam Ediyor'}</span>
                </div>
                <div className="flex justify-between items-baseline text-sm">
                  <span className="italic">{edu.degree} {edu.field && `- ${edu.field}`}</span>
                  {edu.gpa && <span>GPA: {edu.gpa}</span>}
                </div>
                {edu.description && <p className="text-sm mt-1">{edu.description}</p>}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Skills & Languages & Certifications grid */}
      <div className="grid grid-cols-2 gap-6">
        {skills.length > 0 && (
          <section>
            <h2 className="text-lg font-bold uppercase border-b-2 mb-3" style={{ borderColor: 'var(--cv-accent)' }}>Beceriler</h2>
            <ul className="list-disc list-inside text-sm columns-1 space-y-1">
              {skills.map(s => (
                <li key={s.id}>{s.name} <span className="text-gray-500 text-xs">({s.level})</span></li>
              ))}
            </ul>
          </section>
        )}

        <div>
          {languages.length > 0 && (
            <section className="mb-6">
              <h2 className="text-lg font-bold uppercase border-b-2 mb-3" style={{ borderColor: 'var(--cv-accent)' }}>Diller</h2>
              <ul className="text-sm space-y-1">
                {languages.map(l => (
                  <li key={l.id} className="flex justify-between border-b border-gray-100 pb-1">
                    <span>{l.name}</span>
                    <span className="text-gray-600 italic text-xs">{l.level}</span>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {certifications.length > 0 && (
            <section>
              <h2 className="text-lg font-bold uppercase border-b-2 mb-3" style={{ borderColor: 'var(--cv-accent)' }}>Sertifikalar</h2>
              <ul className="text-sm space-y-2">
                {certifications.map(c => (
                  <li key={c.id}>
                    <div className="font-semibold">{c.name}</div>
                    <div className="text-xs text-gray-600 flex justify-between mt-0.5">
                      <span>{c.issuer}</span>
                      <span>{c.date}</span>
                    </div>
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
