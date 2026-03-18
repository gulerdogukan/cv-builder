import type { CVData } from '@/types/cv.types';
import { formatDate } from '@/lib/utils';

interface Props {
  data: CVData;
  title?: string;
}

export default function ModernTemplate({ data }: Props) {
  const { personal, summary, experience, education, skills, languages, certifications } = data;

  return (
    <div className="bg-white text-gray-900 leading-relaxed" style={{ fontFamily: 'var(--cv-font)', fontSize: '11px' }}>
      {/* Header */}
      <div className="px-8 py-6 text-white" style={{ backgroundColor: 'var(--cv-accent)' }}>
        <h1 className="text-2xl font-bold tracking-tight">{personal.fullName || 'Adınız Soyadınız'}</h1>
        <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-blue-100 text-[10px]" style={{ opacity: 0.9 }}>
          {personal.email && <span>✉ {personal.email}</span>}
          {personal.phone && <span>☎ {personal.phone}</span>}
          {personal.location && <span>📍 {personal.location}</span>}
          {personal.linkedin && <span>🔗 {personal.linkedin}</span>}
          {personal.github && <span>⌥ {personal.github}</span>}
          {personal.website && <span>🌐 {personal.website}</span>}
        </div>
      </div>

      <div className="px-8 py-5 space-y-5">
        {/* Özet */}
        {summary && (
          <section>
            <h2 className="text-[10px] font-bold uppercase tracking-widest mb-2 pb-1 border-b" style={{ color: 'var(--cv-accent)', borderColor: 'var(--cv-accent)', opacity: 0.8 }}>
              Profesyonel Özet
            </h2>
            <p className="text-gray-700 leading-relaxed">{summary}</p>
          </section>
        )}

        {/* Deneyim */}
        {experience.length > 0 && (
          <section>
            <h2 className="text-[10px] font-bold uppercase tracking-widest mb-3 pb-1 border-b" style={{ color: 'var(--cv-accent)', borderColor: 'var(--cv-accent)', opacity: 0.8 }}>
              İş Deneyimi
            </h2>
            <div className="space-y-3">
              {experience.map((exp) => (
                <div key={exp.id}>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-semibold text-[11px]">{exp.position}</p>
                      <p className="font-medium text-[10px]" style={{ color: 'var(--cv-accent)' }}>{exp.company}{exp.location ? ` · ${exp.location}` : ''}</p>
                    </div>
                    <p className="text-gray-500 text-[9px] whitespace-nowrap shrink-0">
                      {formatDate(exp.startDate)} — {exp.isCurrent ? 'Devam ediyor' : exp.endDate ? formatDate(exp.endDate) : ''}
                    </p>
                  </div>
                  {exp.description && (
                    <p className="text-gray-600 mt-1 leading-relaxed">{exp.description}</p>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Eğitim */}
        {education.length > 0 && (
          <section>
            <h2 className="text-[10px] font-bold uppercase tracking-widest mb-3 pb-1 border-b" style={{ color: 'var(--cv-accent)', borderColor: 'var(--cv-accent)', opacity: 0.8 }}>
              Eğitim
            </h2>
            <div className="space-y-2">
              {education.map((edu) => (
                <div key={edu.id} className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold text-[11px]">{edu.school}</p>
                    <p className="text-gray-600 text-[10px]">
                      {[edu.degree, edu.field].filter(Boolean).join(' · ')}
                      {edu.gpa ? ` · GPA: ${edu.gpa}` : ''}
                    </p>
                  </div>
                  <p className="text-gray-500 text-[9px] whitespace-nowrap shrink-0">
                    {formatDate(edu.startDate)}{edu.endDate ? ` — ${formatDate(edu.endDate)}` : ''}
                  </p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Alt satır: Beceriler + Diller + Sertifikalar */}
        <div className="grid grid-cols-2 gap-5">
          {skills.length > 0 && (
            <section>
              <h2 className="text-[10px] font-bold uppercase tracking-widest mb-2 pb-1 border-b" style={{ color: 'var(--cv-accent)', borderColor: 'var(--cv-accent)', opacity: 0.8 }}>
                Beceriler
              </h2>
              <div className="flex flex-wrap gap-1">
                {skills.map((skill) => (
                  <span key={skill.id} className="text-[9px] px-2 py-0.5 rounded-full font-medium" style={{ backgroundColor: 'var(--cv-accent)', color: 'white', opacity: 0.9 }}>
                    {skill.name}
                  </span>
                ))}
              </div>
            </section>
          )}

          {languages.length > 0 && (
            <section>
              <h2 className="text-[10px] font-bold uppercase tracking-widest mb-2 pb-1 border-b" style={{ color: 'var(--cv-accent)', borderColor: 'var(--cv-accent)', opacity: 0.8 }}>
                Diller
              </h2>
              <div className="space-y-1">
                {languages.map((lang) => (
                  <div key={lang.id} className="flex items-center justify-between">
                    <span className="text-[10px] font-medium">{lang.name}</span>
                    <span className="text-[9px] text-gray-500">{lang.level === 'native' ? 'Ana Dil' : lang.level}</span>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>

        {certifications.length > 0 && (
          <section>
            <h2 className="text-[10px] font-bold uppercase tracking-widest mb-2 pb-1 border-b" style={{ color: 'var(--cv-accent)', borderColor: 'var(--cv-accent)', opacity: 0.8 }}>
              Sertifikalar
            </h2>
            <div className="grid grid-cols-2 gap-2">
              {certifications.map((cert) => (
                <div key={cert.id}>
                  <p className="font-medium text-[10px]">{cert.name}</p>
                  <p className="text-gray-500 text-[9px]">{cert.issuer}{cert.date ? ` · ${formatDate(cert.date)}` : ''}</p>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
