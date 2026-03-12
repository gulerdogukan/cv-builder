import type { CVData } from '@/types/cv.types';
import { formatDate } from '@/lib/utils';

interface Props { data: CVData }

export default function ClassicTemplate({ data }: Props) {
  const { personal, summary, experience, education, skills, languages, certifications } = data;

  return (
    <div className="bg-white text-gray-900 px-10 py-8" style={{ fontFamily: 'Georgia, Times New Roman, serif', fontSize: '11px', lineHeight: '1.6' }}>
      {/* Header */}
      <div className="text-center border-b-2 border-gray-800 pb-4 mb-5">
        <h1 className="text-[22px] font-bold tracking-wide uppercase">{personal.fullName || 'Ad Soyad'}</h1>
        <div className="flex flex-wrap justify-center gap-x-4 mt-2 text-gray-600 text-[10px]">
          {personal.email && <span>{personal.email}</span>}
          {personal.phone && <span>{personal.phone}</span>}
          {personal.location && <span>{personal.location}</span>}
          {personal.linkedin && <span>{personal.linkedin}</span>}
        </div>
      </div>

      <div className="space-y-4">
        {summary && (
          <section>
            <h2 className="text-[11px] font-bold uppercase tracking-widest border-b border-gray-400 pb-1 mb-2">Özet</h2>
            <p className="text-gray-700">{summary}</p>
          </section>
        )}

        {experience.length > 0 && (
          <section>
            <h2 className="text-[11px] font-bold uppercase tracking-widest border-b border-gray-400 pb-1 mb-2">Deneyim</h2>
            <div className="space-y-3">
              {experience.map((exp) => (
                <div key={exp.id}>
                  <div className="flex justify-between items-baseline">
                    <p className="font-bold">{exp.position}</p>
                    <p className="text-[9px] text-gray-500 shrink-0">{formatDate(exp.startDate)} – {exp.isCurrent ? 'Günümüz' : exp.endDate ? formatDate(exp.endDate) : ''}</p>
                  </div>
                  <p className="italic text-gray-600 text-[10px]">{exp.company}{exp.location ? `, ${exp.location}` : ''}</p>
                  {exp.description && <p className="text-gray-700 mt-1">{exp.description}</p>}
                </div>
              ))}
            </div>
          </section>
        )}

        {education.length > 0 && (
          <section>
            <h2 className="text-[11px] font-bold uppercase tracking-widest border-b border-gray-400 pb-1 mb-2">Eğitim</h2>
            <div className="space-y-2">
              {education.map((edu) => (
                <div key={edu.id}>
                  <div className="flex justify-between items-baseline">
                    <p className="font-bold">{edu.school}</p>
                    <p className="text-[9px] text-gray-500 shrink-0">{formatDate(edu.startDate)}{edu.endDate ? ` – ${formatDate(edu.endDate)}` : ''}</p>
                  </div>
                  <p className="italic text-gray-600 text-[10px]">{[edu.degree, edu.field].filter(Boolean).join(', ')}{edu.gpa ? ` — GPA: ${edu.gpa}` : ''}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        <div className="grid grid-cols-2 gap-5">
          {skills.length > 0 && (
            <section>
              <h2 className="text-[11px] font-bold uppercase tracking-widest border-b border-gray-400 pb-1 mb-2">Beceriler</h2>
              <p className="text-gray-700">{skills.map(s => s.name).join(', ')}</p>
            </section>
          )}
          {languages.length > 0 && (
            <section>
              <h2 className="text-[11px] font-bold uppercase tracking-widest border-b border-gray-400 pb-1 mb-2">Diller</h2>
              <div className="space-y-0.5">
                {languages.map(l => (
                  <p key={l.id} className="text-gray-700">{l.name} <span className="text-gray-500">({l.level === 'native' ? 'Ana Dil' : l.level})</span></p>
                ))}
              </div>
            </section>
          )}
        </div>

        {certifications.length > 0 && (
          <section>
            <h2 className="text-[11px] font-bold uppercase tracking-widest border-b border-gray-400 pb-1 mb-2">Sertifikalar</h2>
            <div className="space-y-1">
              {certifications.map(cert => (
                <p key={cert.id} className="text-gray-700"><span className="font-semibold">{cert.name}</span> — {cert.issuer}{cert.date ? `, ${formatDate(cert.date)}` : ''}</p>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
