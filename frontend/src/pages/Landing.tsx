import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Sparkles, FileDown, Zap, ArrowRight, Play, Check, ChevronDown, Star,
  FileText, Sun, Moon, Linkedin, FileSearch, Target,
  BarChart2, Wand2, ListChecks, BookOpen, TrendingUp, CheckCircle2, XCircle
} from 'lucide-react';
import { useSEO } from '@/hooks/useSEO';
import { useTheme } from '@/hooks/useTheme';
import { motion, AnimatePresence } from 'framer-motion';

// ── Veriler ───────────────────────────────────────────────────────────────────

const FEATURES = [
  {
    Icon: Sparkles,
    color: 'bg-violet-100 text-violet-600 dark:bg-violet-900/40 dark:text-violet-400',
    title: 'AI İçerik Optimizasyonu',
    desc: 'Yapay zeka ile deneyimlerinizi profesyonel aksiyon fiilleri ve somut başarılarla güçlendirin.',
  },
  {
    Icon: Linkedin,
    color: 'bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-400',
    title: 'Akıllı İçe Aktarma',
    desc: 'LinkedIn profilinizi veya eski PDF CV\'nizi tek tıkla aktarın, manuel girişi unutun.',
  },
  {
    Icon: FileSearch,
    color: 'bg-green-100 text-green-600 dark:bg-green-900/40 dark:text-green-400',
    title: 'ATS Simülatörü',
    desc: "CV'nizin 0-100 arası ATS skorunu görün, okunabilirlik ve doluluk analizlerini inceleyin.",
  },
  {
    Icon: Target,
    color: 'bg-rose-100 text-rose-600 dark:bg-rose-900/40 dark:text-rose-400',
    title: 'İlan Eşleşme (Gap Analysis)',
    desc: 'Başvurduğunuz iş ilanı ile CV\'nizi karşılaştırın, eksik yeteneklerinizi belirleyin.',
  },
  {
    Icon: Zap,
    color: 'bg-amber-100 text-amber-600 dark:bg-amber-900/40 dark:text-amber-400',
    title: 'Kariyer Asistanı',
    desc: 'Hedeflediğiniz pozisyona özel "Ön Yazı" (Cover Letter) üretin ve kariyer tavsiyeleri alın.',
  },
  {
    Icon: FileDown,
    color: 'bg-sky-100 text-sky-600 dark:bg-sky-900/40 dark:text-sky-400',
    title: 'Profesyonel PDF & Paylaşım',
    desc: 'High-quality PDF indirin veya tek tıkla CV\'nizi web\'e açıp linkle paylaşın.',
  },
];

const STEPS = [
  { num: '01', title: 'Verilerini Aktar', desc: 'LinkedIn veya eski PDF CV\'ni saniyeler içinde akıllandır.' },
  { num: '02', title: 'AI ile Optimize Et', desc: 'Deneyimlerini AI ile güçlendir, ATS skorunu yükselt.' },
  { num: '03', title: 'İlanla Eşleştir', desc: 'Hedef iş ilanına uygunluk testini yap ve kapak yazını hazırla.' },
  { num: '04', title: 'İndir & Paylaş', desc: 'PDF olarak indir veya web linki ile işverenlere gönder.' },
];

const TEMPLATES = [
  {
    id: 'modern', name: 'Modern', desc: 'Mavi başlık, temiz tipografi',
    preview: { header: 'bg-blue-600', accent: 'bg-blue-100 text-blue-700' },
  },
  {
    id: 'classic', name: 'Klasik', desc: 'Serif yazı, geleneksel düzen',
    preview: { header: 'bg-gray-900', accent: 'bg-gray-100 text-gray-700' },
  },
  {
    id: 'minimal', name: 'Minimal', desc: 'Sade, modern, az renk',
    preview: { header: 'bg-slate-100 border-b-2 border-slate-200', accent: 'bg-slate-100 text-slate-600' },
  },
];

const FAQS = [
  {
    q: 'CV Builder ücretsiz mi?',
    a: 'Evet! CV oluşturma, düzenleme ve önizleme tamamen ücretsizdir. PDF indirme özelliği için Premium plana geçmeniz gerekmektedir.',
  },
  {
    q: 'Verilerim güvende mi?',
    a: 'Kesinlikle. Verileriniz şifrelenmiş olarak Supabase altyapımızda saklanır. Bilgileriniz asla üçüncü şahıslarla paylaşılmaz ve dilediğiniz zaman tüm verilerinizi silebilirsiniz.',
  },
  {
    q: 'LinkedIn profilimi nasıl aktarabilirim?',
    a: "LinkedIn'den profilinizin PDF halini indirip sistemimize yükleyerek tüm deneyim ve yeteneklerinizin otomatik olarak doldurulmasını sağlayabilirsiniz.",
  },
  {
    q: 'ATS nedir, neden önemli?',
    a: "ATS (Applicant Tracking System), şirketlerin başvuruları otomatik taramak için kullandığı yazılımlardır. ATS uyumlu CV hazırlamak, şansınızı artırır.",
  },
  {
    q: "Yapay zeka CV'mi nasıl iyileştirir?",
    a: "Yapay zeka motorumuz, basit açıklamalarınızı profesyonel aksiyon fiilleriyle zenginleştirir, eksik yeteneklerinizi analiz eder ve her başvuruya özel ön yazı hazırlar.",
  },
  {
    q: 'Public Link (Genel Bağlantı) nedir?',
    a: 'Oluşturduğunuz CV\'yi tek tıkla web üzerinde yayınlayabilir ve bu linki işverenlere veya sosyal ağlarda paylaşabilirsiniz. PDF gönderme devrini kapatıyoruz!',
  },
  {
    q: 'Kaç CV oluşturabilirim?',
    a: 'Ücretsiz planda 1 CV oluşturabilirsiniz. Premium planda ise dilediğiniz kadar (sınırsız) CV oluşturun ve indirin.',
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
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      className={`rounded-xl border-2 overflow-hidden text-left transition-colors ${
        active
          ? 'border-primary shadow-lg shadow-primary/20 scale-[1.03]'
          : 'border-border hover:border-primary/40 hover:shadow-md'
      }`}
    >
      <div className="bg-white p-3 space-y-2">
        <div className={`h-8 rounded ${t.preview.header} flex items-center px-2`}>
          {t.id !== 'minimal'
            ? <div className="w-16 h-2 bg-white/60 rounded" />
            : <div className="w-20 h-2 bg-gray-400 rounded" />}
        </div>
        <div className="space-y-1.5 px-1">
          {[60, 80, 50, 70].map((w, i) => (
            <div key={i} className="h-1.5 rounded bg-gray-200" style={{ width: `${w}%` }} />
          ))}
          <div className="flex gap-1 pt-0.5">
            {['React', 'Node.js', 'Python'].map((s) => (
              <span key={s} className={`text-[8px] px-1.5 py-0.5 rounded ${t.preview.accent}`}>{s}</span>
            ))}
          </div>
        </div>
      </div>
      <div className="px-3 py-2 bg-muted/30 border-t border-border">
        <p className="text-xs font-semibold">{t.name}</p>
        <p className="text-[10px] text-muted-foreground">{t.desc}</p>
      </div>
    </motion.button>
  );
}

function FAQItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border border-border rounded-xl overflow-hidden bg-card transition-colors">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-muted/40 transition-colors"
      >
        <span className="font-medium text-sm pr-4">{q}</span>
        <motion.div animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.3 }}>
          <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" />
        </motion.div>
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className="px-5 pb-4 text-sm text-muted-foreground leading-relaxed border-t border-border bg-muted/10">
              <div className="pt-3">{a}</div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Sayfa ─────────────────────────────────────────────────────────────────────

const AI_EXAMPLES = [
  {
    before: "Takımla çalıştım ve projeler yaptım. Müşterilere yardım ettim.",
    after: "10 kişilik çapraz fonksiyonel ekibi koordine ederek 3 ürün lansmanını başarıyla tamamladım; müşteri memnuniyet skorunu %35 artırdım.",
    tag: "Deneyim Yazısı"
  },
  {
    before: "React ve JavaScript biliyorum. Web siteleri geliştirdim.",
    after: "Modern React (Hooks, Context API) ve TypeScript kullanarak, 50.000+ aktif kullanıcısı olan ölçeklenebilir bir e-ticaret platformu geliştirdim.",
    tag: "Teknik Yetkinlik"
  },
  {
    before: "Hızlı biriyim ve çok çalışırım. Takım oyuncusuyumdur.",
    after: "Zaman yönetimi ve analitik düşünme becerilerimle, karmaşık teknik problemleri takım içi iş birliğiyle %25 daha hızlı çözüme ulaştırdım.",
    tag: "Yumuşak Yetenekler"
  }
];

export default function Landing() {
  const [activeExample, setActiveExample] = useState(0);
  const [activeAiTab, setActiveAiTab] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveExample((prev) => (prev + 1) % AI_EXAMPLES.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveAiTab((prev) => (prev + 1) % 5);
    }, 4500);
    return () => clearInterval(timer);
  }, []);
  useSEO({ canonical: 'https://cvbuilder.app/' });
  const { isDark, toggle } = useTheme();
  const [activeTemplate, setActiveTemplate] = useState('modern');

  // Infinite Scroll Slider Data (Duplicate for seamless loop)
  const marqueeFeatures = [...FEATURES, ...FEATURES, ...FEATURES];

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.15 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { duration: 0.5 } }
  };

  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden">

      {/* ── Navbar ── */}
      <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-md">
        <nav className="flex items-center justify-between px-6 py-3 max-w-7xl mx-auto">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center shadow-sm shadow-primary/30">
              <FileText className="w-4 h-4 text-primary-foreground" strokeWidth={2.5} />
            </div>
            <span className="text-sm font-bold tracking-tight">CV Builder</span>
          </Link>

          <div className="hidden md:flex items-center gap-6 text-sm text-muted-foreground">
            <a href="#ozellikler" className="hover:text-foreground transition-colors">Özellikler</a>
            <a href="#nasil-calisir" className="hover:text-foreground transition-colors">Süreç</a>
            <a href="#sss" className="hover:text-foreground transition-colors">SSS</a>
            <Link to="/pricing" className="hover:text-foreground transition-colors">Fiyatlar</Link>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={toggle}
              aria-label={isDark ? 'Açık moda geç' : 'Koyu moda geç'}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            >
              <motion.div whileTap={{ rotate: 180 }} transition={{ duration: 0.3 }}>
                {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              </motion.div>
            </button>
            <Link
              to="/login"
              className="hidden sm:inline-flex items-center px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors"
            >
              Giriş Yap
            </Link>
            <Link
              to="/register"
              className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3.5 py-1.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors shadow-sm shadow-primary/25"
            >
              Ücretsiz Başla
            </Link>
          </div>
        </nav>
      </header>

      {/* ── Hero ── */}
      <section className="relative overflow-hidden">
        {/* Animated Gradient Background Pan */}
        <div className="absolute inset-0 z-0 opacity-40 dark:opacity-20 animate-gradient-pan bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/30 via-background to-violet-500/10 pointer-events-none" />
        <div className="absolute -top-32 -right-32 w-96 h-96 bg-primary/20 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute -bottom-20 -left-20 w-72 h-72 bg-violet-600/20 rounded-full blur-[100px] pointer-events-none" />

        <motion.div 
          className="relative z-10 max-w-6xl mx-auto px-6 py-20 md:py-32 text-center"
          variants={containerVariants}
          initial="hidden"
          animate="show"
        >
          {/* Rozet */}
          <motion.div variants={itemVariants} className="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 text-primary text-xs font-medium px-3 py-1.5 rounded-full mb-6 relative overflow-hidden group">
            <span className="w-1.5 h-1.5 bg-primary rounded-full animate-pulse" />
            Yeni Nesil AI Motoru ile Güçlendirildi
            {/* Shimmer effect */}
            <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent group-hover:animate-[shimmer_1.5s_infinite]" />
          </motion.div>

          <motion.h1 variants={itemVariants} className="text-4xl sm:text-5xl lg:text-7xl font-extrabold tracking-tight leading-[1.1]">
            Dakikalar İçinde
            <br />
            <span className="text-primary tracking-tight">ATS Uyumlu CV</span> Oluştur
          </motion.h1>

          <motion.p variants={itemVariants} className="mt-6 text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Yapay zeka destekli CV oluşturucumuz ile profesyonel özgeçmişinizi hazırlayın.
            ATS skorunuzu görün, PDF olarak indirin — <span className="font-semibold text-foreground">ücretsiz başlayın</span>.
          </motion.p>

          <motion.div variants={itemVariants} className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <motion.div
              animate={{ y: [0, -5, 0] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut", delay: 2 }}
            >
              <Link
                to="/register"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-8 py-4 text-base font-semibold text-primary-foreground hover:bg-primary/90 shadow-lg shadow-primary/30 transition-colors"
              >
                Hemen Başla — Ücretsiz
                <ArrowRight className="w-5 h-5" />
              </Link>
            </motion.div>
            <a
              href="#nasil-calisir"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl border-2 border-border px-8 py-3.5 text-base font-medium hover:bg-muted transition-colors"
            >
              <Play className="w-4 h-4" />
              Nasıl Çalışır?
            </a>
          </motion.div>

          <motion.p variants={itemVariants} className="mt-6 text-xs text-muted-foreground">
            Kredi kartı gerekmez · Ücretsiz plan sonsuza kadar ücretsiz
          </motion.p>
          
          <motion.div variants={itemVariants} className="mt-8 flex items-center justify-center gap-1">
            {[...Array(5)].map((_, i) => (
              <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
            ))}
            <span className="ml-2 text-sm text-muted-foreground">4.8/5 · Sektör Lideri</span>
          </motion.div>
        </motion.div>
      </section>

      {/* ── İstatistikler ── */}
      <section className="border-y border-border bg-card">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-50px" }}
          transition={{ duration: 0.6 }}
          className="max-w-5xl mx-auto px-6 py-10 grid grid-cols-2 md:grid-cols-4 gap-8 text-center"
        >
          {STATS.map((s) => (
            <div key={s.label}>
              <p className="text-3xl font-extrabold text-primary">{s.value}</p>
              <p className="mt-1 text-xs text-muted-foreground font-medium uppercase tracking-wide">{s.label}</p>
            </div>
          ))}
        </motion.div>
      </section>

      {/* ── Özellikler (Infinite Scroll Marquee) ── */}
      <section id="ozellikler" className="py-24 bg-muted/20 overflow-hidden relative">
        <div className="text-center mb-14 px-6 relative z-20">
          <span className="text-xs font-semibold text-primary uppercase tracking-widest">Özellikler</span>
          <h2 className="mt-2 text-3xl font-extrabold">Hayalinizdeki İşe Ulaşmanız İçin</h2>
          <p className="mt-3 text-muted-foreground max-w-xl mx-auto">Modern iş süreçlerinde öne çıkmanızı sağlayan araçlar.</p>
        </div>

        {/* Marquee Wrapper */}
        <div className="relative w-full max-w-[100vw] overflow-hidden">
          {/* Gradient Masks for fade edges */}
          <div className="absolute inset-y-0 left-0 w-32 bg-gradient-to-r from-muted/20 to-transparent z-10 pointer-events-none" />
          <div className="absolute inset-y-0 right-0 w-32 bg-gradient-to-l from-muted/20 to-transparent z-10 pointer-events-none" />
          
          <div className="flex w-max animate-marquee">
            {marqueeFeatures.map(({ Icon, color, title, desc }, idx) => (
              <motion.div
                key={idx}
                whileHover={{ rotate: -2, scale: 1.02 }}
                className="w-[300px] sm:w-[350px] mx-4 rounded-2xl border border-border bg-card p-6 shadow-sm flex flex-col items-start cursor-default"
              >
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-5 ${color}`}>
                  <Icon className="w-6 h-6" strokeWidth={2} />
                </div>
                <h3 className="text-lg font-bold">{title}</h3>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── AI Özellik Vitrini ── */}
      <section id="ai-ozellikleri" className="py-24 px-6 bg-background border-t border-border overflow-hidden">
        <div className="max-w-6xl mx-auto">
          <motion.div
            className="text-center mb-12"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <span className="text-xs font-semibold text-primary uppercase tracking-widest">Yapay Zeka Araçları</span>
            <h2 className="mt-2 text-3xl font-extrabold">AI ile Fark Yaratan 5 Özellik</h2>
            <p className="mt-3 text-muted-foreground max-w-xl mx-auto">
              Sadece CV editörü değil — her adımda sizi öne çıkaran akıllı araçlar.
            </p>
          </motion.div>

          {/* Tab Butonları */}
          <div className="flex flex-wrap gap-2 justify-center mb-10">
            {[
              { Icon: BarChart2,   label: 'ATS Simülatörü',      color: 'text-violet-500' },
              { Icon: Target,      label: 'İlan Eşleşme',         color: 'text-rose-500'   },
              { Icon: BookOpen,    label: 'AI Özet Taslakları',   color: 'text-blue-500'   },
              { Icon: Wand2,       label: 'İçerik İyileştirme',   color: 'text-amber-500'  },
              { Icon: ListChecks,  label: 'Beceri Önerisi',       color: 'text-green-500'  },
            ].map(({ Icon, label, color }, i) => (
              <motion.button
                key={i}
                onClick={() => setActiveAiTab(i)}
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.96 }}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all border ${
                  activeAiTab === i
                    ? 'bg-primary text-primary-foreground border-primary shadow-lg shadow-primary/25'
                    : 'bg-card text-muted-foreground border-border hover:border-primary/40 hover:text-foreground'
                }`}
              >
                <Icon className={`w-4 h-4 ${activeAiTab === i ? 'text-primary-foreground' : color}`} />
                {label}
              </motion.button>
            ))}
          </div>

          {/* Mockup Paneli */}
          <AnimatePresence mode="wait">
            <motion.div
              key={activeAiTab}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={{ duration: 0.35, ease: 'easeOut' }}
              className="rounded-2xl border border-border bg-card shadow-xl overflow-hidden"
            >
              {/* ─── Tab 0: ATS Simülatörü ─── */}
              {activeAiTab === 0 && (
                <div className="p-6 md:p-8">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-9 h-9 rounded-xl bg-violet-100 dark:bg-violet-900/40 flex items-center justify-center">
                      <BarChart2 className="w-5 h-5 text-violet-600 dark:text-violet-400" />
                    </div>
                    <div>
                      <p className="font-bold text-sm">ATS Simülatörü</p>
                      <p className="text-xs text-muted-foreground">Özgeçmişinizin sistem uyumluluk analizi</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
                    {/* Sol: Skor */}
                    <div className="flex flex-col items-center gap-4">
                      <div className="relative w-36 h-36">
                        <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                          <circle cx="50" cy="50" r="40" fill="none" stroke="currentColor" strokeWidth="8" className="text-muted/30" />
                          <circle cx="50" cy="50" r="40" fill="none" stroke="currentColor" strokeWidth="8"
                            strokeDasharray={`${2 * Math.PI * 40 * 0.82} ${2 * Math.PI * 40 * 0.18}`}
                            strokeLinecap="round" className="text-violet-500 transition-all duration-1000" />
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                          <span className="text-4xl font-black text-foreground">82</span>
                          <span className="text-xs text-muted-foreground font-medium">SKOR</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 bg-green-500/10 border border-green-500/20 text-green-600 dark:text-green-400 rounded-full px-3 py-1 text-xs font-semibold">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        ATS Uyumlu
                      </div>
                    </div>
                    {/* Sağ: Alt Metrikler */}
                    <div className="space-y-3">
                      {[
                        { label: 'Okunabilirlik ve Format', val: 80, color: 'bg-violet-500', tag: 'Güçlü' },
                        { label: 'Anahtar Kelime Yoğunluğu', val: 75, color: 'bg-blue-500',   tag: 'İyi'   },
                        { label: 'Doluluk Oranı',            val: 90, color: 'bg-green-500',  tag: 'Mükemmel' },
                        { label: 'Başarı Etkisi',            val: 70, color: 'bg-amber-500',  tag: 'İyi'   },
                      ].map(({ label, val, color, tag }) => (
                        <div key={label}>
                          <div className="flex justify-between items-center mb-1">
                            <span className="text-xs text-muted-foreground">{label}</span>
                            <span className="text-xs font-bold">{val} <span className="text-muted-foreground font-normal">— {tag}</span></span>
                          </div>
                          <div className="h-2 rounded-full bg-muted/40 overflow-hidden">
                            <motion.div
                              className={`h-full rounded-full ${color}`}
                              initial={{ width: 0 }}
                              animate={{ width: `${val}%` }}
                              transition={{ duration: 0.8, ease: 'easeOut' }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* ─── Tab 1: İlan Eşleşme ─── */}
              {activeAiTab === 1 && (
                <div className="p-6 md:p-8">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-9 h-9 rounded-xl bg-rose-100 dark:bg-rose-900/40 flex items-center justify-center">
                      <Target className="w-5 h-5 text-rose-600 dark:text-rose-400" />
                    </div>
                    <div>
                      <p className="font-bold text-sm">Kariyer Asistanı — İlan Uygunluk Testi</p>
                      <p className="text-xs text-muted-foreground">İş ilanına özel CV eşleşme skoru ve boşluk analizi</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Skor */}
                    <div className="flex flex-col items-center justify-center gap-3">
                      <div className="relative w-28 h-28">
                        <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                          <circle cx="50" cy="50" r="40" fill="none" strokeWidth="10" className="stroke-muted/30" />
                          <circle cx="50" cy="50" r="40" fill="none" strokeWidth="10"
                            strokeDasharray={`${2 * Math.PI * 40 * 0.72} ${2 * Math.PI * 40 * 0.28}`}
                            strokeLinecap="round" stroke="#f43f5e"
                            className="transition-all duration-1000" />
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                          <span className="text-3xl font-black">72</span>
                          <span className="text-[10px] text-muted-foreground">UYUM</span>
                        </div>
                      </div>
                      <p className="text-xs text-center text-muted-foreground">CV'niz ilandaki gereksinimlerin <strong className="text-foreground">%72'sini</strong> karşılıyor.</p>
                    </div>
                    {/* Sahip Olunanlar */}
                    <div>
                      <p className="text-xs font-semibold text-green-600 dark:text-green-400 flex items-center gap-1 mb-2">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Sahip Olduklarınız
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {['Yazılım geliştirme','Karmaşık sistem analizi','Yüksek performanslı çözümler','Kalite odaklı yaklaşım','CI/CD bilgisi'].map(s => (
                          <span key={s} className="text-[11px] bg-green-500/10 border border-green-500/20 text-green-700 dark:text-green-400 rounded-full px-2.5 py-1 font-medium">{s}</span>
                        ))}
                      </div>
                    </div>
                    {/* Eksik Olanlar */}
                    <div>
                      <p className="text-xs font-semibold text-rose-600 dark:text-rose-400 flex items-center gap-1 mb-2">
                        <XCircle className="w-3.5 h-3.5" /> Eksik Olanlar
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {['Mikroservis mimarisi','RESTful API tasarımı','Docker & Kubernetes','NoSQL yönetimi'].map(s => (
                          <span key={s} className="text-[11px] bg-rose-500/10 border border-rose-500/20 text-rose-700 dark:text-rose-400 rounded-full px-2.5 py-1 font-medium">{s}</span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ─── Tab 2: AI Özet Taslakları ─── */}
              {activeAiTab === 2 && (
                <div className="p-6 md:p-8">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-9 h-9 rounded-xl bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center">
                      <BookOpen className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <p className="font-bold text-sm">AI Özet Taslakları</p>
                      <p className="text-xs text-muted-foreground">Profilinize göre 3 farklı ton — birini seçin, hemen kullanın</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {[
                      {
                        tag: 'KURUMSAL & RESMİ', tagColor: 'text-blue-600 dark:text-blue-400',
                        text: 'Yazılım geliştirme alanında sağlam bir temele sahip, sonuç odaklı bir profesyonelim. Karmaşık sistemlerin analizinden ve yüksek performanslı çözümlerin tasarımında etkin rol aldım.',
                        active: true,
                      },
                      {
                        tag: 'YARATICI & DİNAMİK', tagColor: 'text-violet-600 dark:text-violet-400',
                        text: 'Yazılım dünyasının dinamiklerini yakından takip eden, sürekli öğrenmeye açık ve inovatif çözümler üreten bir geliştiriciyim. Modern teknolojilerle kullanıcı deneyimini zenginleştiriyorum.',
                        active: false,
                      },
                      {
                        tag: 'TEKNİK & LİDER', tagColor: 'text-amber-600 dark:text-amber-400',
                        text: 'Derinlemesine teknik bilgiye sahip, liderlik vasıfları gelişmiş bir yazılım mühendisiyim. Büyük ölçekli projelerde teknik ekipleri yönlendirme ve mentorluk konusunda deneyimliyim.',
                        active: false,
                      },
                    ].map(({ tag, tagColor, text, active }) => (
                      <div key={tag} className={`rounded-xl border p-4 transition-all ${active ? 'border-primary shadow-md shadow-primary/15 bg-primary/5' : 'border-border bg-muted/20'}`}>
                        <p className={`text-[10px] font-bold tracking-wider mb-2 ${tagColor}`}>{tag}</p>
                        <p className="text-xs text-muted-foreground leading-relaxed">{text}</p>
                        <button className={`mt-3 w-full rounded-lg py-1.5 text-xs font-semibold transition-colors ${active ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80 text-foreground'}`}>
                          {active ? '✓ Seçili' : 'Bunu Kullan'}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ─── Tab 3: İçerik İyileştirme ─── */}
              {activeAiTab === 3 && (
                <div className="p-6 md:p-8">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-9 h-9 rounded-xl bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center">
                      <Wand2 className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                    </div>
                    <div>
                      <p className="font-bold text-sm">AI İçerik İyileştirme</p>
                      <p className="text-xs text-muted-foreground">Sıradan açıklamalar → güçlü, ölçülebilir başarılar</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="rounded-xl border border-border bg-muted/20 p-4">
                      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-3">Orijinal</p>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        Takımla çalıştım ve projeler yaptım. Müşterilere yardım ettim. Sistemleri geliştirdim ve bakımını yaptım.
                      </p>
                    </div>
                    <div className="rounded-xl border border-primary/40 bg-primary/5 p-4 relative overflow-hidden">
                      <div className="absolute top-2 right-2">
                        <span className="flex items-center gap-1 text-[10px] bg-primary/15 text-primary px-2 py-0.5 rounded-full font-medium">
                          <Sparkles className="w-3 h-3" /> AI Önerisi
                        </span>
                      </div>
                      <p className="text-[10px] font-bold text-primary uppercase tracking-wider mb-3">AI Önerisi</p>
                      <p className="text-sm text-foreground leading-relaxed">
                        10 kişilik çapraz fonksiyonel ekibi koordine ederek <strong>3 ürün lansmanını</strong> başarıyla tamamladım; müşteri memnuniyet skorunu <strong>%35 artırdım</strong> ve sistemin uptime oranını <strong>%99.8'e</strong> yükselttim.
                      </p>
                      <div className="flex gap-2 mt-4">
                        <button className="flex-1 rounded-lg bg-primary py-1.5 text-xs font-semibold text-primary-foreground">Kabul Et</button>
                        <button className="flex-1 rounded-lg border border-border py-1.5 text-xs font-semibold text-muted-foreground">Reddet</button>
                      </div>
                    </div>
                  </div>
                  <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
                    <TrendingUp className="w-3.5 h-3.5 text-green-500" />
                    AI, belirsiz ifadeleri sayısal başarılara ve aksiyon fiillerine dönüştürür.
                  </div>
                </div>
              )}

              {/* ─── Tab 4: Beceri Önerisi ─── */}
              {activeAiTab === 4 && (
                <div className="p-6 md:p-8">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-9 h-9 rounded-xl bg-green-100 dark:bg-green-900/40 flex items-center justify-center">
                      <ListChecks className="w-5 h-5 text-green-600 dark:text-green-400" />
                    </div>
                    <div>
                      <p className="font-bold text-sm">AI Beceri Önerisi</p>
                      <p className="text-xs text-muted-foreground">Unvanınıza ve sektörünüze göre eksik becerileri keşfedin</p>
                    </div>
                  </div>
                  <div className="max-w-lg">
                    <div className="flex items-center gap-2 mb-4">
                      <span className="text-xs text-muted-foreground">Seçili Unvan:</span>
                      <span className="text-xs font-bold bg-primary/10 text-primary border border-primary/20 rounded-full px-3 py-1">Full Stack Developer</span>
                    </div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Önerilen Beceriler</p>
                    <div className="flex flex-wrap gap-2">
                      {[
                        { skill: 'React', added: true },
                        { skill: 'Node.js', added: true },
                        { skill: 'TypeScript', added: false },
                        { skill: 'Docker', added: false },
                        { skill: 'PostgreSQL', added: false },
                        { skill: 'GraphQL', added: false },
                        { skill: 'Redis', added: false },
                        { skill: 'Kubernetes', added: false },
                        { skill: 'CI/CD', added: false },
                        { skill: 'REST API', added: true },
                      ].map(({ skill, added }) => (
                        <motion.button
                          key={skill}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium border transition-colors ${
                            added
                              ? 'bg-green-500/15 border-green-500/30 text-green-700 dark:text-green-400'
                              : 'bg-muted/40 border-border text-muted-foreground hover:border-primary/40 hover:text-foreground'
                          }`}
                        >
                          {added ? <Check className="w-3 h-3" /> : <span className="text-base leading-none">+</span>}
                          {skill}
                        </motion.button>
                      ))}
                    </div>
                    <button className="mt-5 flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors shadow-sm shadow-primary/25">
                      <Sparkles className="w-4 h-4" />
                      Tümünü Ekle
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>

          {/* Alt CTA */}
          <motion.div
            className="text-center mt-10"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
          >
            <Link
              to="/register"
              className="inline-flex items-center gap-2 rounded-xl bg-primary px-7 py-3.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-all hover:shadow-lg shadow-primary/25"
            >
              <Sparkles className="w-4 h-4" />
              AI Özellikleri Ücretsiz Dene
              <ArrowRight className="w-4 h-4" />
            </Link>
            <p className="mt-2 text-xs text-muted-foreground">Kredi kartı gerekmez · 30 saniyede başla</p>
          </motion.div>
        </div>
      </section>

      {/* ── Nasıl Çalışır (Scroll-triggered Adımlar) ── */}
      <section id="nasil-calisir" className="py-24 px-6 bg-background">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <span className="text-xs font-semibold text-primary uppercase tracking-widest">Süreç</span>
            <h2 className="mt-2 text-3xl font-extrabold">4 Adımda Profesyonel CV</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {STEPS.map((step, i) => (
              <motion.div 
                key={step.num} 
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 0.5, delay: i * 0.15 }}
                className="relative"
              >
                {i < STEPS.length - 1 && (
                  <div className="hidden lg:block absolute top-7 left-full w-full h-0.5 bg-gradient-to-r from-primary to-transparent opacity-20 z-0 -translate-x-1/2" />
                )}
                <div className="relative z-10 flex flex-col items-center text-center gap-3">
                  <motion.div 
                    whileHover={{ scale: 1.1, rotate: 5 }}
                    className="w-14 h-14 rounded-2xl bg-primary text-primary-foreground flex items-center justify-center text-lg font-black shadow-lg shadow-primary/25"
                  >
                    {step.num}
                  </motion.div>
                  <h3 className="font-bold text-base mt-2">{step.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{step.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Şablon Galerisi ── */}
      <section className="py-24 px-6 max-w-5xl mx-auto border-t border-border">
        <div className="text-center mb-12">
          <span className="text-xs font-semibold text-primary uppercase tracking-widest">Şablonlar</span>
          <h2 className="mt-2 text-3xl font-extrabold">Size Uygun Şablonlar</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-3xl mx-auto">
          {TEMPLATES.map((t, idx) => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.1 }}
            >
              <TemplatePreviewCard
                t={t}
                active={activeTemplate === t.id}
                onClick={() => setActiveTemplate(t.id)}
              />
            </motion.div>
          ))}
        </div>
        <motion.div 
          className="mt-14 text-center"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
        >
          <Link
            to="/register"
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-8 py-3.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-all hover:shadow-lg shadow-primary/30"
          >
            Seçili Şablonu Kullan
            <ArrowRight className="w-4 h-4" />
          </Link>
        </motion.div>
      </section>

      {/* ── AI Özelliği Spotlight ── */}
      <section className="py-24 px-6 relative overflow-hidden bg-slate-900 text-slate-50 dark:bg-card dark:text-foreground">
        {/* Glow Effects */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary/20 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-violet-500/20 rounded-full blur-[120px] pointer-events-none" />

        <div className="relative z-10 max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-flex items-center gap-2 bg-primary/20 border border-primary/30 text-primary-foreground text-xs font-medium px-3 py-1.5 rounded-full mb-6">
              <Sparkles className="w-3.5 h-3.5" />
              Yapay Zeka Farkı
            </div>
            <h2 className="text-3xl md:text-4xl font-extrabold leading-tight">
              CV'nizi Sıradanlıktan <br className="hidden md:block"/> <span className="text-primary italic">Mükemmelliğe</span> Taşıyın
            </h2>
            <p className="mt-5 text-slate-300 dark:text-muted-foreground text-lg leading-relaxed">
              Yapay zeka sadece metin yazmakla kalmaz, iş dünyasındaki "boşlukları" kapatır. LinkedIn verilerinizi çeker, ATS filtrelerini analiz eder ve her başvuruya özel kariyer asistanlığı yapar.
            </p>
            <ul className="mt-8 space-y-4">
              {[
                'LinkedIn ve PDF üzerinden saniyeler içinde CV oluşturma',
                'ATS sistemlerine özel "Okunabilirlik ve Etki" analizi',
                'İş ilanına %100 uyumlu Cover Letter (Ön Yazı) üretimi',
                'Deneyimlerinizi somut başarı hikayelerine çeviren AI motoru'
              ].map((item) => (
                <li key={item} className="flex items-center gap-3 text-sm font-medium text-slate-100 dark:text-foreground">
                  <div className="w-6 h-6 rounded-full bg-primary/20 flex flex-shrink-0 items-center justify-center">
                    <Check className="w-3.5 h-3.5 text-primary" strokeWidth={3} />
                  </div>
                  {item}
                </li>
              ))}
            </ul>
          </motion.div>

          {/* Daktilo Animasyonu Kısmı */}
          <div className="relative min-h-[460px] md:pl-20 flex flex-col justify-center">
            {/* Perfectly aligned vertical axis line */}
            <div className="absolute top-0 bottom-0 left-[2.5rem] md:left-[5rem] w-px bg-gradient-to-b from-transparent via-primary/30 to-transparent hidden md:block" />

            <AnimatePresence mode="wait">
              <motion.div
                key={activeExample}
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.3 }}
                className="space-y-8 relative z-10"
              >
                {/* Eski Haliniz - Starts at the axis (padding 80px) */}
                <div className="rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10 p-5 relative max-w-[420px] shadow-xl">
                   <div className="flex justify-between items-center mb-2">
                    <p className="text-[10px] font-bold text-destructive uppercase tracking-wider flex items-center gap-1.5 font-mono">
                      <span className="w-2 h-2 rounded-full bg-destructive" /> ESKİ HALİ
                    </p>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-white/10 text-slate-400 font-medium">
                      {AI_EXAMPLES[activeExample]?.tag}
                    </span>
                  </div>
                  <p className="text-sm font-medium text-slate-400 line-through decoration-destructive/30 italic">
                    {AI_EXAMPLES[activeExample]?.before}
                  </p>
                </div>

                {/* Geçiş İkonu - To center its midpoint (24px) on the 80px axis (container padding): ml-[-1.5rem] */}
                <motion.div 
                  className="flex justify-start md:ml-[-1.5rem] py-1"
                  animate={{ y: [0, 5, 0] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center shadow-[0_0_30px_rgba(59,130,246,0.5)] relative z-20 border-2 border-white/20">
                    <Zap className="w-6 h-6 text-white" fill="currentColor" />
                    <div className="absolute -inset-2 rounded-full bg-primary/20 animate-pulse" />
                  </div>
                </motion.div>
                
                {/* AI Hali - Align perfectly with top card left edge */}
                <div className="rounded-2xl bg-slate-950/90 backdrop-blur-md border border-primary/40 shadow-2xl shadow-primary/40 p-6 relative overflow-hidden max-w-[440px]">
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/10 to-transparent animate-[shimmer_3s_infinite]" />
                  <p className="text-[10px] font-bold text-primary uppercase tracking-wider mb-3 flex items-center gap-1.5 relative z-10 font-mono">
                    <Sparkles className="w-3 h-3 text-primary" /> AI GÜNCELLEMESİ
                  </p>
                  <p className="text-base font-bold text-white leading-relaxed relative z-10">
                    {AI_EXAMPLES[activeExample]?.after}
                  </p>
                </div>
              </motion.div>
            </AnimatePresence>

            {/* Dots - Align with the axis */}
            <div className="flex justify-start gap-2 mt-12">
              {AI_EXAMPLES.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setActiveExample(i)}
                  className={`h-1.5 rounded-full transition-all duration-300 ${activeExample === i ? 'bg-primary w-6' : 'bg-white/20 w-1.5'}`}
                  aria-label={`Örnek ${i + 1}`}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── SSS ── */}
      <section id="sss" className="py-24 px-6 max-w-3xl mx-auto">
        <div className="text-center mb-12">
          <span className="text-xs font-semibold text-primary uppercase tracking-widest">SSS</span>
          <h2 className="mt-2 text-3xl font-extrabold">Merak Edilenler</h2>
        </div>
        <div className="space-y-3">
          {FAQS.map((faq, i) => (
            <motion.div
              key={faq.q}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
            >
              <FAQItem q={faq.q} a={faq.a} />
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── Final CTA ── */}
      <section className="py-24 px-6 bg-gradient-to-t from-muted/30 to-background border-t border-border">
        <motion.div 
          className="max-w-2xl mx-auto text-center"
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
        >
          <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight">Kariyerinize Yatırım Yapın</h2>
          <p className="mt-6 text-lg text-muted-foreground">
            Binlerce kişi CV Builder ile hayalindeki işe daha hızlı ulaştı. Şimdi sıra sizde.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to="/register"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-10 py-4 text-base font-bold text-primary-foreground hover:bg-primary/90 shadow-xl shadow-primary/30 transition-all hover:-translate-y-1"
            >
              Ücretsiz CV Oluştur
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </motion.div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-border bg-card">
         <div className="px-6 py-6 max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-primary flex items-center justify-center">
              <FileText className="w-3.5 h-3.5 text-primary-foreground" strokeWidth={2.5} />
            </div>
            <span className="font-bold text-sm text-foreground">CV Builder</span>
          </div>
          <p>© 2026 CV Builder. Tüm hakları saklıdır.</p>
        </div>
      </footer>

    </div>
  );
}
