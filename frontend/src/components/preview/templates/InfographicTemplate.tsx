import type { CVData } from '@/types/cv.types';

interface Props {
  data: CVData;
}

export default function InfographicTemplate({ data }: Props) {
  const { personal, summary, experience, education, skills, languages, certifications } = data;

  return (
    <div className="min-h-[297mm] p-0 font-sans text-slate-800 bg-white max-w-4xl mx-auto overflow-hidden relative">
      {/* Heavy Graphic Header */}
      <header className="bg-emerald-600 text-emerald-50 p-12 relative overflow-hidden text-center pb-20">
        <div className="absolute -top-24 -left-24 w-64 h-64 bg-emerald-500 rounded-full mix-blend-multiply opacity-50 blur-2xl"></div>
        <div className="absolute -bottom-24 -right-24 w-80 h-80 bg-emerald-700 rounded-full mix-blend-multiply opacity-50 blur-2xl"></div>
        
        <div className="relative z-10 w-full">
          <h1 className="text-5xl font-black tracking-tight mb-4 uppercase">{personal.fullName || 'Ad Soyad'}</h1>
          <h2 className="text-2xl font-light text-emerald-200 tracking-widest uppercase mb-8">{personal.profession || 'Vizyoner Uzman'}</h2>
          
          <div className="flex flex-wrap items-center justify-center gap-6 text-sm font-medium">
            {personal.email && <div className="bg-emerald-700/50 px-4 py-2 rounded-full backdrop-blur-sm border border-emerald-500/50">E: {personal.email}</div>}
            {personal.phone && <div className="bg-emerald-700/50 px-4 py-2 rounded-full backdrop-blur-sm border border-emerald-500/50">T: {personal.phone}</div>}
            {personal.location && <div className="bg-emerald-700/50 px-4 py-2 rounded-full backdrop-blur-sm border border-emerald-500/50">Konum: {personal.location}</div>}
            {personal.linkedin && <div className="bg-emerald-700/50 px-4 py-2 rounded-full backdrop-blur-sm border border-emerald-500/50">IN: {personal.linkedin}</div>}
          </div>
        </div>
      </header>

      <div className="px-10 -mt-10 relative z-20 space-y-12">
        {/* Summary Card */}
        {summary && (
          <div className="bg-white rounded-2xl shadow-xl shadow-emerald-900/5 border border-slate-100 p-8 text-center mx-auto max-w-3xl">
            <h3 className="text-xs font-black text-emerald-600 uppercase tracking-[0.2em] mb-4">Profil</h3>
            <p className="text-slate-600 font-medium leading-relaxed italic text-lg">{summary}</p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 pt-4 pb-12">
          {/* Left Column (Timeline) */}
          <div className="space-y-12">
            {experience.length > 0 && (
              <section>
                <div className="flex items-center gap-4 mb-8">
                  <div className="h-0.5 flex-1 bg-slate-100"></div>
                  <h3 className="text-sm font-black text-slate-900 uppercase tracking-[0.2em]">Kariyer Yolu</h3>
                  <div className="h-0.5 flex-1 bg-slate-100"></div>
                </div>
                <div className="space-y-0 text-center relative before:absolute before:left-1/2 before:top-0 before:bottom-0 before:w-1 before:bg-slate-100 before:-translate-x-1/2">
                  {experience.map((exp) => (
                    <div key={exp.id} className="relative py-6 z-10 w-full flex flex-col items-center">
                      <div className="w-16 h-1 bg-emerald-500 mb-4 rounded-full shadow-sm relative z-20 ring-4 ring-white"></div>
                      <div className="bg-white border border-slate-200 shadow-sm p-4 w-full rounded-2xl relative z-10 box-border text-center">
                        <div className="text-xs font-bold text-emerald-600 tracking-widest mb-2 uppercase">{exp.startDate} — {exp.isCurrent ? 'Günümüz' : exp.endDate}</div>
                        <h4 className="font-extrabold text-slate-800 text-lg mb-1">{exp.position}</h4>
                        <div className="text-sm font-semibold text-slate-500 mb-3">{exp.company} <span className="font-normal text-slate-400">| {exp.location}</span></div>
                        {exp.description && (
                          <p className="text-xs font-medium text-slate-600 leading-relaxed max-w-sm mx-auto">{exp.description}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}
            
            {education.length > 0 && (
              <section className="bg-slate-50 rounded-3xl p-8 border border-slate-100">
                <h3 className="text-sm font-black text-center text-slate-900 uppercase tracking-[0.2em] mb-6">Eğitim</h3>
                <div className="space-y-6">
                  {education.map(edu => (
                    <div key={edu.id} className="text-center relative pb-6 last:pb-0 border-b border-slate-200 last:border-0 border-dashed">
                      <h4 className="font-black text-slate-800 text-base mb-1">{edu.school}</h4>
                      <div className="text-sm font-semibold text-emerald-600 mb-2">{edu.degree} - {edu.field}</div>
                      <div className="text-xs font-bold text-slate-400 bg-white px-3 py-1 inline-block rounded-full shadow-sm border border-slate-100">
                        {edu.startDate} – {edu.endDate || 'Devam'} {edu.gpa && <span className="text-slate-600 font-black ml-2">GPA: {edu.gpa}</span>}
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>

          {/* Right Column (Data Vis) */}
          <div className="space-y-12">
            {skills.length > 0 && (
              <section>
                <div className="flex items-center gap-4 mb-8">
                  <div className="h-0.5 flex-1 bg-slate-100"></div>
                  <h3 className="text-sm font-black text-slate-900 uppercase tracking-[0.2em]">Yetenek Skoru</h3>
                  <div className="h-0.5 flex-1 bg-slate-100"></div>
                </div>
                <div className="space-y-4">
                  {skills.map(s => {
                    const widthMap: Record<string, string> = { 'beginner': '25%', 'intermediate': '50%', 'advanced': '75%', 'expert': '100%' };
                    return (
                      <div key={s.id} className="relative">
                        <div className="flex justify-between items-end mb-1">
                          <span className="font-bold text-slate-700 text-sm uppercase">{s.name}</span>
                          <span className="text-[10px] font-black tracking-widest text-emerald-600 uppercase">{s.level}</span>
                        </div>
                        <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                          <div className="h-full bg-emerald-500 rounded-full" style={{ width: widthMap[s.level] || '50%' }}></div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </section>
            )}

            {languages.length > 0 && (
              <section className="bg-emerald-50 rounded-3xl p-8 border border-emerald-100">
                <h3 className="text-sm font-black text-center text-slate-900 uppercase tracking-[0.2em] mb-6">Poliglot Profil</h3>
                <div className="grid grid-cols-2 gap-4">
                  {languages.map(l => (
                    <div key={l.id} className="bg-white p-4 rounded-2xl text-center shadow-sm border border-emerald-100 border-b-4 border-b-emerald-200">
                      <div className="font-black text-slate-800 mb-1 leading-snug">{l.name}</div>
                      <div className="text-xs font-bold text-emerald-600 uppercase tracking-widest">{l.level}</div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {certifications.length > 0 && (
              <section>
                <div className="flex items-center gap-4 mb-6">
                  <div className="h-0.5 flex-1 bg-slate-100"></div>
                  <h3 className="text-sm font-black text-slate-900 uppercase tracking-[0.2em]">Kazanımlar</h3>
                  <div className="h-0.5 flex-1 bg-slate-100"></div>
                </div>
                <div className="space-y-3">
                  {certifications.map(c => (
                    <div key={c.id} className="flex gap-4 items-center bg-white border border-slate-200 p-4 rounded-xl shadow-sm">
                      <div className="w-10 h-10 shrink-0 bg-emerald-100 text-emerald-500 rounded-full flex items-center justify-center font-black text-xl">
                        ★
                      </div>
                      <div className="flex-1">
                        <h4 className="font-bold text-slate-800 text-sm">{c.name}</h4>
                        <div className="text-xs font-medium text-slate-500 mt-1 flex justify-between">
                          <span>{c.issuer}</span>
                          <span className="text-emerald-600 font-bold">{c.date}</span>
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
    </div>
  );
}
