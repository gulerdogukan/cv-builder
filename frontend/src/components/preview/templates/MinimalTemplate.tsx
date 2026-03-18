import type { CVData } from '@/types/cv.types';
import { formatDate } from '@/lib/utils';

interface Props { data: CVData }

export default function MinimalTemplate({ data }: Props) {
  const { personal, summary, experience, education, skills, languages, certifications } = data;

  return (
    <div className="bg-white text-gray-800 px-10 py-8" style={{ fontFamily: 'var(--cv-font)', fontSize: '11px', lineHeight: '1.6' }}>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-[20px] font-light tracking-tight" style={{ color: 'var(--cv-accent)' }}>{personal.fullName || 'Ad Soyad'}</h1>
        <div className="flex flex-wrap gap-x-5 mt-1.5 text-[9px] text-gray-500">
          {personal.email && <span>{personal.email}</span>}
          {personal.phone && <span>{personal.phone}</span>}
          {personal.location && <span>{personal.location}</span>}
          {personal.linkedin && <span>{personal.linkedin}</span>}
          {personal.github && <span>{personal.github}</span>}
        </div>
      </div>

      <div className="space-y-5">
        {summary && (
          <section>
            <div className="text-[8px] font-semibold uppercase tracking-[3px] text-gray-400 mb-2">Özet</div>
            <p className="text-gray-600">{summary}</p>
          </section>
        )}

        {experience.length > 0 && (
          <section>
            <div className="text-[8px] font-semibold uppercase tracking-[3px] mb-2" style={{ color: 'var(--cv-accent)', opacity: 0.7 }}>Deneyim</div>
            <div className="space-y-3">
              {experience.map((exp) => (
                <div key={exp.id} className="pl-3 border-l-2" style={{ borderColor: 'var(--cv-accent)' }}>
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="font-semibold">{exp.position}</span>
                      <span className="text-gray-500"> · {exp.company}</span>
                    </div>
                    <span className="text-[9px] text-gray-400 shrink-0">{formatDate(exp.startDate)} – {exp.isCurrent ? 'Şimdi' : exp.endDate ? formatDate(exp.endDate) : ''}</span>
                  </div>
                  {exp.description && <p className="text-gray-600 mt-1 text-[10px]">{exp.description}</p>}
                </div>
              ))}
            </div>
          </section>
        )}

        {education.length > 0 && (
          <section>
            <div className="text-[8px] font-semibold uppercase tracking-[3px] mb-2" style={{ color: 'var(--cv-accent)', opacity: 0.7 }}>Eğitim</div>
            <div className="space-y-2">
              {education.map((edu) => (
                <div key={edu.id} className="pl-3 border-l-2" style={{ borderColor: 'var(--cv-accent)' }}>
                  <div className="flex justify-between">
                    <span className="font-semibold">{edu.school}</span>
                    <span className="text-[9px] text-gray-400">{formatDate(edu.startDate)}{edu.endDate ? ` – ${formatDate(edu.endDate)}` : ''}</span>
                  </div>
                  <p className="text-gray-500 text-[10px]">{[edu.degree, edu.field].filter(Boolean).join(' · ')}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        <div className="grid grid-cols-2 gap-5">
          {skills.length > 0 && (
            <section>
              <div className="text-[8px] font-semibold uppercase tracking-[3px] mb-2" style={{ color: 'var(--cv-accent)', opacity: 0.7 }}>Beceriler</div>
              <div className="flex flex-wrap gap-1">
                {skills.map(s => (
                  <span key={s.id} className="text-[9px] px-2 py-0.5 rounded" style={{ backgroundColor: 'var(--cv-accent)', color: 'white' }}>{s.name}</span>
                ))}
              </div>
            </section>
          )}
          {languages.length > 0 && (
            <section>
              <div className="text-[8px] font-semibold uppercase tracking-[3px] mb-2" style={{ color: 'var(--cv-accent)', opacity: 0.7 }}>Diller</div>
              <div className="space-y-0.5">
                {languages.map(l => (
                  <p key={l.id} className="text-[10px]">{l.name} <span className="text-gray-400">— {l.level === 'native' ? 'Ana Dil' : l.level}</span></p>
                ))}
              </div>
            </section>
          )}
        </div>

        {certifications.length > 0 && (
          <section>
            <div className="text-[8px] font-semibold uppercase tracking-[3px] mb-2" style={{ color: 'var(--cv-accent)', opacity: 0.7 }}>Sertifikalar</div>
            <div className="space-y-1">
              {certifications.map(cert => (
                <p key={cert.id} className="text-[10px]"><span className="font-medium">{cert.name}</span> <span className="text-gray-500">· {cert.issuer}{cert.date ? `, ${formatDate(cert.date)}` : ''}</span></p>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
