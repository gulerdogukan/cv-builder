import { useState } from 'react';
import { Link } from 'react-router-dom';

// ── Veriler ───────────────────────────────────────────────────────────────────

const FEATURES = [
  {
    icon: '🤖',
    title: 'AI Destekli Yazım',
    desc: 'Claude AI ile deneyim açıklamalarınızı güçlü aksiyon fiilleri ve metriklerle güçlendirin. Pozisyonunuza özel beceri önerileri alın.',
  },
  {
    icon: '✅',
    title: 'ATS Skoru',
    desc: 'CV\'nizin ATS (işe alım yazılımı) uyumluluğunu 0-100 puan üzerinden görün, önerilerle optimize edin.',
  },
  {
    icon: '📄',
    title: 'Profesyonel PDF',
    desc: 'A4 boyutunda, yüksek kaliteli PDF indirin. 3 farklı şablondan istediğinizi seçin.',
  },
  {
    icon: '⚡',
    title: 'Anlık Önizleme',
    desc: 'Değişikliklerinizi gerçek zamanlı görün. Bölme görünümü ile düzenleyici ve önizlemeyi yan yana kullanın.',
  },
  {
    icon: '🔒',
    title: 'Güvenli Depolama',
    desc: 'CV\'leriniz Supabase üzerinde güvenle saklanır. Google ile tek tıkla giriş yapın.',
  },
  {
    icon: '🌐',
    title: 'Türkçe Arayüz',
    desc: 'Tamamen Türkçe, sezgisel arayüz. İngilizce bilgisi gerektirmez.',
  },
];

const STEPS = [
  {
    num: '01',
    title: 'Kayıt Ol',
    desc: 'Google ile tek tıkla ücretsiz hesap oluşturun.',
  },
  {
    num: '02',
    title: 'Bilgileri Gir',
    desc: 'Kişisel bilgiler, deneyim, eğitim ve becerilerinizi form arayüzünden doldurun.',
  },
  {
    num: '03',
    title: 'AI ile Güçlendir',
    desc: 'Tek tıkla AI önerileri alın, ATS skorunuzu hesaplayın.',
  },
  {
    num: '04',
    title: 'PDF İndir',
    desc: 'Beğendiğiniz şablonu seçin, PDF olarak indirin ve başvurunuzu yapın.',
  },
];

const TEMPLATES = [
  {
    id: 'modern',
    name: 'Modern',
    desc: 'Mavi başlık, temiz tipografi',
    color: 'from-blue-500 to-blue-700',
    preview: {
      header: 'bg-blue-600',
      accent: 'bg-blue-100 text-blue-700',
    },
  },
  {
    id: 'classic',
    name: 'Klasik',
    desc: 'Serif yazı, geleneksel düzen',
    color: 'from-gray-700 to-gray-900',
    preview: {
      header: 'bg-gray-900',
      accent: 'bg-gray-100 text-gray-700',
    },
  },
  {
    id: 'minimal',
    name: 'Minimal',
    desc: 'Sade, modern, az renk',
    color: 'from-slate-400 to-slate-600',
    preview: {
      header: 'bg-slate-100 border-b-2 border-slate-200',
      accent: 'bg-slate-100 text-slate-600',
    },
  },
];

const FAQS = [
  {
    q: 'CV Builder ücretsiz mi?',
    a: 'Evet! CV oluşturma, düzenleme ve önizleme tamamen ücretsizdir. PDF indirme özelliği için 99₺ tek seferlik ödeme veya 49₺/ay abonelik seçeneklerimiz mevcuttur.',
  },
  {
    q: 'ATS nedir, neden önemli?',
    a: 'ATS (Applicant Tracking System), büyük şirketlerin başvuruları otomatik taramak için kullandığı yazılımlardır. Araştırmalar, başvuruların %75\'inin bir insan görmeden ATS tarafından elenebildiğini göstermektedir. ATS uyumlu CV hazırlamak, görüşmeye çağrılma şansınızı önemli ölçüde artırır.',
  },
  {
    q: 'Yapay zeka CV\'mi nasıl iyileştirir?',
    a: 'Claude AI ile çalışan sistemimiz, deneyim açıklamalarınızı güçlü aksiyon fiilleriyle (Geliştirdim, Yönettim, %40 artırdım gibi) zenginleştirir, pozisyonunuza özel beceri önerileri sunar ve ATS algoritmalarının aradığı anahtar kelimeleri eklemek için rehberlik eder.',
  },
  {
    q: 'Kaç CV oluşturabilirim?',
    a: 'Ücretsiz planda 1 CV oluşturabilirsiniz. 99₺ tek seferlik planda 3 CV, 49₺/ay abonelikte ise sınırsız CV oluşturabilirsiniz.',
  },
  {
    q: 'Verilerim güvende mi?',
    a: 'Verileriniz Supabase altyapısı üzerinde şifreli olarak saklanır. Hesabınızı dilediğiniz zaman silebilirsiniz. Verilerinizi üçüncü taraflarla paylaşmıyoruz.',
  },
];

const STATS = [
  { value: '10.000+', label: 'Oluşturulan CV' },
  { value: '%94', label: 'ATS Geçme Oranı' },
  { value: '3 dk', label: 'Ortalama Hazırlama Süresi' },
  { value: '4.8/5', label: 'Kullanıcı Puanı' },
];

// ── Bileşenler ────────────────────────────────────────────────────────────────

function TemplatePreviewCard({ t, active, onClick }: {
  t: typeof TEMPLATES[0];
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`rounded-xl border-2 overflow-hidden text-left transition-all ${
        active ? 'border-primary shadow-lg scale-[1.02]' : 'border-border hover:border-primary/50'
      }`}
    >
      {/* Mini CV önizleme */}
      <div className="bg-white p-3 space-y-2">
        <div className={`h-8 rounded ${t.preview.header} flex items-center px-2`}>
          {t.id !== 'minimal' && <div className="w-16 h-2 bg-white/60 rounded" />}
          {t.id === 'minimal' && <div className="w-20 h-2 bg-gray-400 rounded" />}
        </div>
        <div className="space-y-1.5 px-1">
          {[60, 80, 50, 70].map((w, i) => (
            <div key={i} className={`h-1.5 rounded bg-gray-200`} style={{ width: `${w}%` }} />
          ))}
          <div className="flex gap-1 pt-0.5">
            {['React', 'Node.js', 'Python'].map((s) => (
              <span key={s} className={`text-[8px] px-1.5 py-0.5 rounded ${t.preview.accent}`}>{s}</span>
            ))}
          </div>
        </div>
      </div>
      <div className="px-3 py-2 bg-muted/30 border-t">
        <p className="text-xs font-semibold">{t.name}</p>
        <p className="text-[10px] text-muted-foreground">{t.desc}</p>
      </div>
    </button>
  );
}

function FAQItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-muted/30 transition-colors"
      >
        <span className="font-medium text-sm pr-4">{q}</span>
        <span className={`text-primary shrink-0 transition-transform ${open ? 'rotate-45' : ''}`}>+</span>
      </button>
      {open && (
        <div className="px-5 pb-4 text-sm text-muted-foreground leading-relaxed border-t bg-muted/10">
          <div className="pt-3">{a}</div>
        </div>
      )}
    </div>
  );
}

// ── Sayfa ─────────────────────────────────────────────────────────────────────

export default function Landing() {
  const [activeTemplate, setActiveTemplate] = useState('modern');

  return (
    <div className="min-h-screen bg-white">

      {/* ── Navbar ── */}
      <header className="sticky top-0 z-40 border-b bg-white/90 backdrop-blur">
        <nav className="flex items-center justify-between px-6 py-3.5 max-w-7xl mx-auto">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <span className="text-lg font-bold tracking-tight">CV Builder</span>
          </div>
          <div className="hidden md:flex items-center gap-6 text-sm text-muted-foreground">
            <a href="#ozellikler" className="hover:text-foreground transition-colors">Özellikler</a>
            <a href="#nasil-calisir" className="hover:text-foreground transition-colors">Nasıl Çalışır</a>
            <a href="#sss" className="hover:text-foreground transition-colors">SSS</a>
            <Link to="/pricing" className="hover:text-foreground transition-colors">Fiyatlar</Link>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/login" className="text-sm text-muted-foreground hover:text-foreground transition-colors hidden sm:inline">
              Giriş Yap
            </Link>
            <Link
              to="/register"
              className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              Ücretsiz Başla
            </Link>
          </div>
        </nav>
      </header>

      {/* ── Hero ── */}
      <section className="relative overflow-hidden bg-gradient-to-br from-blue-50 via-white to-indigo-50">
        {/* Dekor daireler */}
        <div className="absolute -top-32 -right-32 w-96 h-96 bg-blue-100 rounded-full blur-3xl opacity-60" />
        <div className="absolute -bottom-20 -left-20 w-72 h-72 bg-indigo-100 rounded-full blur-3xl opacity-40" />

        <div className="relative max-w-6xl mx-auto px-6 py-20 md:py-28 text-center">
          {/* Rozet */}
          <div className="inline-flex items-center gap-2 bg-blue-50 border border-blue-200 text-blue-700 text-xs font-medium px-3 py-1.5 rounded-full mb-6">
            <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse" />
            Claude AI ile Güçlendirildi
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-gray-900 leading-tight">
            Dakikalar İçinde
            <br />
            <span className="text-primary">ATS Uyumlu CV</span> Oluştur
          </h1>

          <p className="mt-6 text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Yapay zeka destekli CV oluşturucumuz ile profesyonel özgeçmişinizi hazırlayın.
            ATS skorunuzu görün, PDF olarak indirin — <strong>ücretsiz başlayın</strong>.
          </p>

          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to="/register"
              className="w-full sm:w-auto rounded-xl bg-primary px-8 py-3.5 text-base font-semibold text-primary-foreground hover:bg-primary/90 shadow-lg shadow-primary/30 transition-all hover:-translate-y-0.5"
            >
              Hemen Başla — Ücretsiz
            </Link>
            <a
              href="#nasil-calisir"
              className="w-full sm:w-auto rounded-xl border-2 border-border px-8 py-3.5 text-base font-medium hover:bg-muted transition-colors flex items-center justify-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Nasıl Çalışır?
            </a>
          </div>

          {/* Güven satırı */}
          <p className="mt-6 text-xs text-muted-foreground">
            Kredi kartı gerekmez · Ücretsiz plan sonsuza kadar ücretsiz
          </p>
        </div>
      </section>

      {/* ── İstatistikler ── */}
      <section className="border-y bg-muted/30">
        <div className="max-w-5xl mx-auto px-6 py-10 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {STATS.map((s) => (
            <div key={s.label}>
              <p className="text-3xl font-extrabold text-primary">{s.value}</p>
              <p className="mt-1 text-xs text-muted-foreground font-medium uppercase tracking-wide">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Özellikler ── */}
      <section id="ozellikler" className="py-20 px-6 max-w-6xl mx-auto">
        <div className="text-center mb-14">
          <span className="text-xs font-semibold text-primary uppercase tracking-widest">Özellikler</span>
          <h2 className="mt-2 text-3xl font-extrabold">Hayalinizdeki İşe Ulaşmanız İçin Her Şey</h2>
          <p className="mt-3 text-muted-foreground max-w-xl mx-auto">
            Modern iş başvuru sürecinde öne çıkmanızı sağlayan araçlar.
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {FEATURES.map((f) => (
            <div key={f.title} className="rounded-2xl border bg-card p-6 hover:shadow-md transition-shadow">
              <div className="text-3xl mb-4">{f.icon}</div>
              <h3 className="text-base font-bold">{f.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Nasıl Çalışır ── */}
      <section id="nasil-calisir" className="py-20 px-6 bg-gradient-to-b from-muted/30 to-white">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <span className="text-xs font-semibold text-primary uppercase tracking-widest">Süreç</span>
            <h2 className="mt-2 text-3xl font-extrabold">4 Adımda Profesyonel CV</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {STEPS.map((step, i) => (
              <div key={step.num} className="relative">
                {i < STEPS.length - 1 && (
                  <div className="hidden lg:block absolute top-7 left-full w-full h-0.5 bg-border z-0 -translate-x-1/2" />
                )}
                <div className="relative z-10 flex flex-col items-center text-center gap-3">
                  <div className="w-14 h-14 rounded-2xl bg-primary text-primary-foreground flex items-center justify-center text-lg font-black shadow-lg shadow-primary/20">
                    {step.num}
                  </div>
                  <h3 className="font-bold text-sm">{step.title}</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Şablon Galerisi ── */}
      <section className="py-20 px-6 max-w-5xl mx-auto">
        <div className="text-center mb-12">
          <span className="text-xs font-semibold text-primary uppercase tracking-widest">Şablonlar</span>
          <h2 className="mt-2 text-3xl font-extrabold">3 Profesyonel Şablon</h2>
          <p className="mt-3 text-muted-foreground">Sektörünüze ve kişisel tarzınıza uygun şablonu seçin.</p>
        </div>
        <div className="grid grid-cols-3 gap-4 sm:gap-6 max-w-lg mx-auto">
          {TEMPLATES.map((t) => (
            <TemplatePreviewCard
              key={t.id}
              t={t}
              active={activeTemplate === t.id}
              onClick={() => setActiveTemplate(t.id)}
            />
          ))}
        </div>
        <div className="mt-10 text-center">
          <Link
            to="/register"
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-8 py-3 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors shadow-md shadow-primary/20"
          >
            Bu Şablonu Kullan
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </Link>
        </div>
      </section>

      {/* ── AI Özelliği Spotlight ── */}
      <section className="py-20 px-6 bg-gradient-to-br from-blue-600 to-indigo-700 text-white">
        <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <div>
            <span className="text-xs font-semibold text-blue-200 uppercase tracking-widest">Yapay Zeka</span>
            <h2 className="mt-2 text-3xl font-extrabold leading-tight">
              CV Yazımında<br />AI Farkı
            </h2>
            <p className="mt-4 text-blue-100 leading-relaxed">
              Claude AI, deneyim açıklamalarınızı ATS algoritmalarının ve insan gözünün
              beğeneceği biçimde yeniden yazar. Sıradan bir cümleyi etkileyici bir başarıya dönüştürür.
            </p>
            <ul className="mt-6 space-y-3">
              {[
                'Güçlü aksiyon fiilleri (Geliştirdim, Liderlik ettim, %40 artırdım)',
                'Sektöre özel anahtar kelimeler',
                'Somut metrikler ve başarı odaklı dil',
                'ATS skoru + iyileştirme önerileri',
              ].map((item) => (
                <li key={item} className="flex items-start gap-2.5 text-sm text-blue-50">
                  <span className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center text-[10px] shrink-0 mt-0.5">✓</span>
                  {item}
                </li>
              ))}
            </ul>
            <Link
              to="/register"
              className="mt-8 inline-flex items-center gap-2 rounded-xl bg-white text-primary px-6 py-3 text-sm font-semibold hover:bg-blue-50 transition-colors"
            >
              AI ile Dene — Ücretsiz
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </Link>
          </div>
          {/* Örnek AI dönüşümü */}
          <div className="space-y-4">
            <div className="rounded-xl bg-white/10 backdrop-blur border border-white/20 p-4">
              <p className="text-[10px] font-semibold text-blue-200 uppercase tracking-wide mb-2">❌ Öncesi</p>
              <p className="text-sm text-blue-100 italic">
                "Takımla çalıştım ve projeler yaptım. Müşterilere yardım ettim."
              </p>
            </div>
            <div className="flex justify-center">
              <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
            </div>
            <div className="rounded-xl bg-white/20 backdrop-blur border border-white/30 p-4">
              <p className="text-[10px] font-semibold text-green-300 uppercase tracking-wide mb-2">✓ Sonrası (AI)</p>
              <p className="text-sm text-white leading-relaxed">
                "5 kişilik çapraz fonksiyonel ekibi koordine ederek 3 ürün lansmanını zamanında teslim ettim; müşteri memnuniyeti skorunu %35 artırdım."
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── SSS ── */}
      <section id="sss" className="py-20 px-6 max-w-3xl mx-auto">
        <div className="text-center mb-12">
          <span className="text-xs font-semibold text-primary uppercase tracking-widest">SSS</span>
          <h2 className="mt-2 text-3xl font-extrabold">Sık Sorulan Sorular</h2>
        </div>
        <div className="space-y-3">
          {FAQS.map((faq) => (
            <FAQItem key={faq.q} q={faq.q} a={faq.a} />
          ))}
        </div>
      </section>

      {/* ── Final CTA ── */}
      <section className="py-20 px-6 bg-muted/30">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-3xl font-extrabold">Hayalinizdeki İşe Bir Adım Daha Yakın</h2>
          <p className="mt-4 text-muted-foreground">
            Binlerce kişi CV Builder ile başvurularını güçlendirdi. Sıra sizde.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to="/register"
              className="w-full sm:w-auto rounded-xl bg-primary px-10 py-3.5 text-base font-semibold text-primary-foreground hover:bg-primary/90 shadow-lg shadow-primary/25 transition-all hover:-translate-y-0.5"
            >
              Ücretsiz CV Oluştur
            </Link>
            <Link
              to="/pricing"
              className="w-full sm:w-auto rounded-xl border-2 border-border px-8 py-3.5 text-base font-medium hover:bg-muted transition-colors"
            >
              Fiyatları Gör →
            </Link>
          </div>
          <p className="mt-4 text-xs text-muted-foreground">
            Kredi kartı gerekmez · Kayıt sadece 30 saniye
          </p>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t bg-card">
        <div className="max-w-6xl mx-auto px-6 py-10 grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="md:col-span-2">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-6 h-6 rounded bg-primary flex items-center justify-center">
                <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <span className="font-bold">CV Builder</span>
            </div>
            <p className="text-sm text-muted-foreground max-w-xs leading-relaxed">
              Yapay zeka destekli, ATS uyumlu CV oluşturucu. Türkiye'nin en kullanıcı dostu özgeçmiş platformu.
            </p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3">Ürün</p>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><a href="#ozellikler" className="hover:text-foreground transition-colors">Özellikler</a></li>
              <li><a href="#nasil-calisir" className="hover:text-foreground transition-colors">Nasıl Çalışır</a></li>
              <li><Link to="/pricing" className="hover:text-foreground transition-colors">Fiyatlandırma</Link></li>
              <li><a href="#sss" className="hover:text-foreground transition-colors">SSS</a></li>
            </ul>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3">Hesap</p>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link to="/register" className="hover:text-foreground transition-colors">Ücretsiz Başla</Link></li>
              <li><Link to="/login" className="hover:text-foreground transition-colors">Giriş Yap</Link></li>
              <li><Link to="/dashboard" className="hover:text-foreground transition-colors">Dashboard</Link></li>
            </ul>
          </div>
        </div>
        <div className="border-t px-6 py-4 max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-muted-foreground">
          <p>© 2026 CV Builder. Tüm hakları saklıdır.</p>
          <p>Güvenli ödeme: İyzico · SSL şifreleme</p>
        </div>
      </footer>

    </div>
  );
}
