import type { CVData } from '@/types/cv.types';

interface Props {
  data: CVData;
}

export default function ExecutiveTemplate({ data }: Props) {
  const { personal, summary, experience, education, skills, languages, certifications } = data;

  return (
    <div className="p-10 font-sans text-gray-900 leading-relaxed max-w-4xl mx-auto">
      {/* Header */}
      <header className="mb-6">
        <h1 className="text-4xl font-extrabold uppercase tracking-tight text-gray-900 mb-2">{personal.fullName || 'Ad Soyad'}</h1>
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm font-medium text-gray-700">
          {personal.email && <div className="flex items-center gap-1.5"><span className="text-gray-400">E:</span> {personal.email}</div>}
          {personal.phone && <div className="flex items-center gap-1.5"><span className="text-gray-400">T:</span> {personal.phone}</div>}
          {personal.location && <div className="flex items-center gap-1.5"><span className="text-gray-400">L:</span> {personal.location}</div>}
          {personal.linkedin && <div className="flex items-center gap-1.5"><span className="text-gray-400">in:</span> <a href={`https://${personal.linkedin}`} className="hover:underline">{personal.linkedin}</a></div>}
        </div>
      </header>

      {/* Summary */}
      {summary && (
        <section className="mb-8">
          <h2 className="text-xl font-bold uppercase tracking-widest border-b-4 border-gray-900 pb-1 mb-4">{personal.profession || 'Yönetici Özeti'}</h2>
          <p className="text-base text-justify leading-relaxed font-medium text-gray-800">{summary}</p>
        </section>
      )}

      {/* Experience */}
      {experience.length > 0 && (
        <section className="mb-8">
          <h2 className="text-xl font-bold uppercase tracking-widest border-b-4 border-gray-900 pb-1 mb-4">Kariyer Özeti</h2>
          <div className="space-y-6">
            {experience.map((exp) => (
              <div key={exp.id}>
                <div className="flex justify-between items-end mb-1">
                  <h3 className="text-lg font-bold text-gray-900 uppercase">{exp.position}</h3>
                  <span className="text-sm font-bold text-gray-600 tracking-wide">
                    {exp.startDate} – {exp.isCurrent ? 'Günümüz' : exp.endDate}
                  </span>
                </div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-base font-bold text-gray-700">{exp.company}</span>
                  <span className="text-sm font-medium text-gray-500">{exp.location}</span>
                </div>
                {exp.description && (
                  <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">{exp.description}</p>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Core Competencies (Skills & Languages) */}
      {(skills.length > 0 || languages.length > 0) && (
        <section className="mb-8">
          <h2 className="text-xl font-bold uppercase tracking-widest border-b-4 border-gray-900 pb-1 mb-4">Temel Yetkinlikler</h2>
          <div className="grid grid-cols-2 gap-8">
            {skills.length > 0 && (
              <div>
                <h3 className="font-bold text-gray-800 uppercase text-sm mb-3">Uzmanlık Alanları</h3>
                <ul className="list-disc list-inside text-sm text-gray-700 grid grid-cols-2 gap-x-2 gap-y-1">
                  {skills.map(s => <li key={s.id} className="truncate">{s.name}</li>)}
                </ul>
              </div>
            )}
            {languages.length > 0 && (
              <div>
                <h3 className="font-bold text-gray-800 uppercase text-sm mb-3">Yabancı Diller</h3>
                <ul className="text-sm text-gray-700 space-y-1">
                  {languages.map(l => (
                    <li key={l.id} className="flex justify-between">
                      <span className="font-medium">{l.name}</span>
                      <span className="text-gray-500">{l.level}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </section>
      )}

      {/* Education & Certs */}
      <div className="grid grid-cols-2 gap-8">
        {education.length > 0 && (
          <section>
            <h2 className="text-xl font-bold uppercase tracking-widest border-b-4 border-gray-900 pb-1 mb-4">Eğitim</h2>
            <div className="space-y-4">
              {education.map((edu) => (
                <div key={edu.id}>
                  <h3 className="font-bold text-gray-900 text-base">{edu.school}</h3>
                  <div className="text-sm font-medium text-gray-700">{edu.degree} - {edu.field}</div>
                  <div className="text-sm text-gray-500 flex justify-between mt-1">
                    <span>{edu.startDate} – {edu.endDate || 'Devam'}</span>
                    {edu.gpa && <span>GPA: {edu.gpa}</span>}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {certifications.length > 0 && (
          <section>
            <h2 className="text-xl font-bold uppercase tracking-widest border-b-4 border-gray-900 pb-1 mb-4">Sertifikalar & Ödüller</h2>
            <div className="space-y-3">
              {certifications.map((c) => (
                <div key={c.id}>
                  <h3 className="font-bold text-gray-900 text-sm">{c.name}</h3>
                  <div className="flex justify-between items-center text-xs text-gray-600 mt-1">
                    <span className="font-medium">{c.issuer}</span>
                    <span>{c.date}</span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
