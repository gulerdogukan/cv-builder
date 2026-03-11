import { Link } from 'react-router-dom';

export default function Landing() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      {/* Navbar */}
      <nav className="flex items-center justify-between px-6 py-4 max-w-7xl mx-auto">
        <h1 className="text-2xl font-bold text-primary">CV Builder</h1>
        <div className="flex items-center gap-4">
          <Link to="/login" className="text-sm text-muted-foreground hover:text-foreground">
            Giriş Yap
          </Link>
          <Link
            to="/register"
            className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            Ücretsiz Başla
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="px-6 py-20 text-center max-w-4xl mx-auto">
        <h2 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
          Ücretsiz CV Oluştur
          <br />
          <span className="text-primary">ATS Uyumlu, Profesyonel</span>
        </h2>
        <p className="mt-6 text-lg text-muted-foreground max-w-2xl mx-auto">
          AI destekli CV oluşturucu ile dakikalar içinde profesyonel özgeçmişinizi hazırlayın.
          ATS sistemlerini geçin, hayalinizdeki işe ulaşın.
        </p>
        <div className="mt-10">
          <Link
            to="/register"
            className="rounded-lg bg-primary px-8 py-3 text-lg font-medium text-primary-foreground hover:bg-primary/90"
          >
            Hemen Başla — Ücretsiz
          </Link>
        </div>
      </section>

      {/* Özellikler */}
      <section className="px-6 py-16 max-w-6xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="rounded-xl border bg-card p-6 text-center">
            <div className="text-3xl mb-4">🤖</div>
            <h3 className="text-lg font-semibold">AI Destekli</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Yapay zeka ile deneyim açıklamalarınızı güçlendirin, beceri önerileri alın.
            </p>
          </div>
          <div className="rounded-xl border bg-card p-6 text-center">
            <div className="text-3xl mb-4">📄</div>
            <h3 className="text-lg font-semibold">PDF Export</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Yüksek kaliteli, A4 boyutunda PDF olarak indirin. 3 profesyonel template.
            </p>
          </div>
          <div className="rounded-xl border bg-card p-6 text-center">
            <div className="text-3xl mb-4">✅</div>
            <h3 className="text-lg font-semibold">ATS Uyumlu</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              ATS skorunuzu görün, önerilerle CV&apos;nizi optimize edin.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t px-6 py-8 text-center text-sm text-muted-foreground">
        <p>&copy; 2026 CV Builder. Tüm hakları saklıdır.</p>
      </footer>
    </div>
  );
}
