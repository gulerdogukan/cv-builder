import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Sparkles, BarChart3, FileDown, Zap, ShieldCheck, Globe,
  ArrowRight, Play, Check, ChevronDown, Star,
  FileText, Sun, Moon
} from 'lucide-react';
import { useSEO } from '@/hooks/useSEO';
import { useTheme } from '@/hooks/useTheme';
import { motion, AnimatePresence, useInView } from 'framer-motion';
import { useRef } from 'react';

// ── Veriler ───────────────────────────────────────────────────────────────────

const FEATURES = [
  {
    Icon: Sparkles,
    color: 'bg-violet-100 text-violet-600 dark:bg-violet-900/40 dark:text-violet-400',
    title: 'AI Destekli Yazım',
    desc: 'Claude AI ile deneyim açıklamalarınızı güçlü aksiyon fiilleri ve metriklerle güçlendirin.',
  },
  {
    Icon: BarChart3,
    color: 'bg-green-100 text-green-600 dark:bg-green-900/40 dark:text-green-400',
    title: 'ATS Skoru',
    desc: "CV'nizin ATS uyumluluğunu 0-100 puan üzerinden görün, önerilerle optimize edin.",
  },
  {
    Icon: FileDown,
    color: 'bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-400',
    title: 'Profesyonel PDF',
    desc: 'A4 boyutunda, yüksek kaliteli PDF indirin. 3 farklı şablondan istediğinizi seçin.',
  },
  {
    Icon: Zap,
    color: 'bg-amber-100 text-amber-600 dark:bg-amber-900/40 dark:text-amber-400',
    title: 'Anlık Önizleme',
    desc: 'Değişikliklerinizi gerçek zamanlı görün. Bölme görünümü ile yan yana kullanın.',
  },
  {
    Icon: ShieldCheck,
    color: 'bg-primary/10 text-primary dark:bg-primary/20',
    title: 'Güvenli Depolama',
    desc: "CV'leriniz Supabase üzerinde güvenle saklanır. Google ile tek tıkla giriş yapın.",
  },
  {
    Icon: Globe,
    color: 'bg-sky-100 text-sky-600 dark:bg-sky-900/40 dark:text-sky-400',
    title: 'Türkçe Arayüz',
    desc: 'Tamamen Türkçe, sezgisel arayüz. İngilizce bilgisi gerektirmez.',
  },
];

const STEPS = [
  { num: '01', title: 'Kayıt Ol', desc: 'Google ile tek tıkla ücretsiz hesap oluşturun.' },
  { num: '02', title: 'Bilgileri Gir', desc: 'Profilinizi ve deneyimlerinizi kolayca doldurun.' },
  { num: '03', title: 'AI ile Güçlendir', desc: 'Tek tıkla dönüştürün, ATS skorunuzu ölçün.' },
  { num: '04', title: 'PDF İndir', desc: 'Beğendiğiniz şablonla PDF olarak indirin.' },
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
    q: 'ATS nedir, neden önemli?',
    a: "ATS (Applicant Tracking System), şirketlerin başvuruları otomatik taramak için kullandığı yazılımlardır. ATS uyumlu CV hazırlamak, şansınızı artırır.",
  },
  {
    q: "Yapay zeka CV'mi nasıl iyileştirir?",
    a: "Claude AI ile çalışan sistemimiz, açıklamalarınızı güçlü aksiyon fiilleriyle zenginleştirir ve pozisyonunuza özel anahtar kelimeler önerir.",
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

function TypewriterText({ text, delay = 0 }: { text: string; delay?: number }) {
  const [displayed, setDisplayed] = useState('');
  const [started, setStarted] = useState(false);
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  useEffect(() => {
    if (isInView) {
      const t = setTimeout(() => setStarted(true), delay * 1000);
      return () => clearTimeout(t);
    }
  }, [isInView, delay]);

  useEffect(() => {
    if (!started) return;
    let index = 0;
    const interval = setInterval(() => {
      setDisplayed((prev) => prev + text.charAt(index));
      index++;
      if (index >= text.length) clearInterval(interval);
    }, 40);
    return () => clearInterval(interval);
  }, [text, started]);

  return <span ref={ref}>{displayed}</span>;
}

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

export default function Landing() {
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
            Claude AI ile Güçlendirildi
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
      <section className="py-24 px-6 relative overflow-hidden bg-foreground text-background dark:bg-card">
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
            <p className="mt-5 text-muted-foreground text-lg leading-relaxed dark:text-muted-foreground">
              Claude AI, deneyim açıklamalarınızı insan gözünün ve ATS algoritmalarının beğeneceği biçimde yeniden yazar. Somut metrikler ve aksiyon fiilleri ile öne çıkın.
            </p>
            <ul className="mt-8 space-y-4">
              {[
                'Güçlü aksiyon fiilleri kullanımı',
                'Sektöre özel anahtar kelimeler',
                'Zayıf cümleleri başarı hikayesine çevirme'
              ].map((item) => (
                <li key={item} className="flex items-center gap-3 text-sm font-medium">
                  <div className="w-6 h-6 rounded-full bg-primary/20 flex flex-shrink-0 items-center justify-center">
                    <Check className="w-3.5 h-3.5 text-primary" strokeWidth={3} />
                  </div>
                  {item}
                </li>
              ))}
            </ul>
          </motion.div>

          {/* Daktilo Animasyonu Kısmı */}
          <motion.div 
            className="space-y-4 relative"
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            {/* Energy connector line */}
            <div className="absolute top-1/2 left-8 w-1 h-32 -translate-y-1/2 bg-gradient-to-b from-border via-primary to-border opacity-50 hidden md:block" />
            
            <div className="rounded-2xl bg-background/10 backdrop-blur-sm border border-border/10 p-5 md:ml-12">
              <p className="text-[10px] font-bold text-destructive uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-destructive" /> Eski Haliniz
              </p>
              <p className="text-sm font-medium opacity-60 line-through decoration-destructive/50">
                Takımla çalıştım ve projeler yaptım. Müşterilere yardım ettim.
              </p>
            </div>
            
            <motion.div 
              className="flex justify-center md:ml-12"
              animate={{ y: [0, 5, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center shadow-lg shadow-primary/30">
                <Zap className="w-4 h-4 text-primary-foreground" />
              </div>
            </motion.div>
            
            <div className="rounded-2xl bg-card border border-primary/30 shadow-2xl shadow-primary/10 p-5 md:ml-12 relative overflow-hidden">
               {/* Shimmer background */}
               <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/5 to-transparent animate-[shimmer_2s_infinite]" />
               <p className="text-[10px] font-bold text-primary uppercase tracking-wider mb-2 flex items-center gap-1.5 relative z-10">
                <Sparkles className="w-3 h-3 text-primary" /> AI ile Güçlendirilmiş
              </p>
              <p className="text-sm font-semibold leading-relaxed relative z-10 text-foreground">
                <TypewriterText text="5 kişilik çapraz fonksiyonel ekibi koordine ederek 3 ürün lansmanını zamanında teslim ettim; müşteri memnuniyeti skorunu %35 artırdım." delay={0.8} />
                <motion.span 
                  animate={{ opacity: [1, 0] }} 
                  transition={{ repeat: Infinity, duration: 0.8 }}
                  className="inline-block w-1.5 h-4 bg-primary ml-1 translate-y-1"
                />
              </p>
            </div>
          </motion.div>
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
