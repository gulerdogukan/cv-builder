import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { usePayment } from '@/hooks/usePayment';
import { useSEO } from '@/hooks/useSEO';
import IyzicoCheckoutModal from '@/components/payment/IyzicoCheckoutModal';

type PlanType = 'one_time' | 'monthly';

const PLANS = [
  {
    id: 'free' as const,
    name: 'Ücretsiz',
    price: '0₺',
    period: '',
    description: 'Temel özellikler ile başlayın',
    features: [
      { text: '1 CV oluşturma', included: true },
      { text: 'Tüm şablonları önizle', included: true },
      { text: 'Günde 5 AI önerisi', included: true },
      { text: 'PDF indirme', included: false },
      { text: 'Sınırsız CV', included: false },
    ],
    cta: 'Ücretsiz Başla',
    highlight: false,
    planType: null,
  },
  {
    id: 'one_time' as PlanType,
    name: 'Tek Seferlik',
    price: '99₺',
    period: 'tek ödeme',
    description: 'Bir kez öde, sonsuza kadar kullan',
    features: [
      { text: '3 CV oluşturma', included: true },
      { text: 'Tüm şablonlar', included: true },
      { text: 'Günde 20 AI önerisi', included: true },
      { text: 'Sınırsız PDF indirme', included: true },
      { text: 'Sınırsız CV', included: false },
    ],
    cta: 'Satın Al',
    highlight: true,
    planType: 'one_time' as PlanType,
  },
  {
    id: 'monthly' as PlanType,
    name: 'Aylık',
    price: '49₺',
    period: '/ay',
    description: 'Tüm özelliklere sınırsız erişim',
    features: [
      { text: 'Sınırsız CV', included: true },
      { text: 'Tüm şablonlar', included: true },
      { text: 'Sınırsız AI önerisi', included: true },
      { text: 'Sınırsız PDF indirme', included: true },
      { text: 'Öncelikli destek', included: true },
    ],
    cta: 'Abone Ol',
    highlight: false,
    planType: 'monthly' as PlanType,
  },
];

export default function Pricing() {
  useSEO({
    title: 'Fiyatlandırma',
    description: 'CV Builder Premium ile sınırsız PDF, sınırsız AI önerisi. Tek seferlik 99₺ veya 49₺/ay.',
    canonical: 'https://cvbuilder.app/pricing',
  });
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const { initiatePayment, isLoading, error } = usePayment();

  const [checkoutContent, setCheckoutContent] = useState<string | null>(null);
  const [activePlan, setActivePlan] = useState<PlanType | null>(null);

  const handlePlanClick = async (plan: typeof PLANS[number]) => {
    if (!plan.planType) {
      navigate(user ? '/dashboard' : '/register');
      return;
    }

    if (!user) {
      navigate('/login', { state: { from: '/pricing' } });
      return;
    }

    if (user.plan === 'paid') return; // Zaten premium

    setActivePlan(plan.planType);
    try {
      const result = await initiatePayment({
        planType: plan.planType,
        fullName: user.fullName || user.email.split('@')[0],
        email: user.email,
      });
      setCheckoutContent(result.checkoutFormContent);
    } catch {
      // error state already set in hook
    }
  };

  const handleModalClose = () => {
    setCheckoutContent(null);
    setActivePlan(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-muted/30 to-background">
      {/* Navbar */}
      <nav className="border-b bg-card/80 backdrop-blur px-6 py-4 flex items-center justify-between">
        <Link to="/" className="text-xl font-bold text-primary">CV Builder</Link>
        <div className="flex items-center gap-4">
          {user ? (
            <Link to="/dashboard" className="text-sm font-medium text-primary hover:underline">
              Dashboard
            </Link>
          ) : (
            <>
              <Link to="/login" className="text-sm text-muted-foreground hover:text-foreground">Giriş Yap</Link>
              <Link to="/register" className="text-sm font-medium bg-primary text-primary-foreground px-3 py-1.5 rounded-lg hover:bg-primary/90 transition-colors">
                Ücretsiz Başla
              </Link>
            </>
          )}
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-6 py-16">
        {/* Başlık */}
        <div className="text-center mb-14">
          <h1 className="text-4xl font-bold tracking-tight">Fiyatlandırma</h1>
          <p className="mt-3 text-lg text-muted-foreground">
            İhtiyacınıza uygun planı seçin. İstediğiniz zaman iptal edebilirsiniz.
          </p>
        </div>

        {/* Hata mesajı */}
        {error && (
          <div className="mb-8 p-4 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm text-center">
            {error}
          </div>
        )}

        {/* Planlar */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {PLANS.map((plan) => {
            const isCurrentPlan = user?.plan === 'paid' && plan.planType !== null;
            const isFreeAndLoggedIn = !plan.planType && user;

            return (
              <div
                key={plan.id}
                className={`relative rounded-2xl border p-7 flex flex-col transition-shadow ${
                  plan.highlight
                    ? 'border-primary bg-primary/5 ring-2 ring-primary shadow-lg'
                    : 'bg-card hover:shadow-md'
                }`}
              >
                {plan.highlight && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                    <span className="bg-primary text-primary-foreground text-[11px] font-semibold px-3 py-1 rounded-full">
                      EN POPÜLER
                    </span>
                  </div>
                )}

                <div>
                  <h3 className="text-lg font-bold">{plan.name}</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">{plan.description}</p>
                  <div className="mt-4 flex items-baseline gap-1">
                    <span className="text-4xl font-extrabold">{plan.price}</span>
                    {plan.period && (
                      <span className="text-sm text-muted-foreground">{plan.period}</span>
                    )}
                  </div>
                </div>

                <ul className="mt-7 space-y-3 flex-1">
                  {plan.features.map((f) => (
                    <li key={f.text} className="flex items-center gap-2.5 text-sm">
                      {f.included ? (
                        <span className="w-4 h-4 rounded-full bg-green-100 text-green-600 flex items-center justify-center text-[10px] font-bold shrink-0">✓</span>
                      ) : (
                        <span className="w-4 h-4 rounded-full bg-muted text-muted-foreground flex items-center justify-center text-[10px] shrink-0">✕</span>
                      )}
                      <span className={f.included ? '' : 'text-muted-foreground'}>{f.text}</span>
                    </li>
                  ))}
                </ul>

                <button
                  onClick={() => handlePlanClick(plan)}
                  disabled={isLoading && activePlan === plan.planType || isCurrentPlan || !!isFreeAndLoggedIn}
                  className={`mt-8 w-full rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors ${
                    plan.highlight
                      ? 'bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-60'
                      : 'border-2 border-primary/20 text-primary hover:bg-primary/10 disabled:opacity-50'
                  }`}
                >
                  {isLoading && activePlan === plan.planType ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="animate-spin rounded-full h-3.5 w-3.5 border-b-2 border-current" />
                      Yükleniyor...
                    </span>
                  ) : isCurrentPlan ? (
                    '✓ Mevcut Planınız'
                  ) : isFreeAndLoggedIn ? (
                    'Mevcut Planınız'
                  ) : (
                    plan.cta
                  )}
                </button>
              </div>
            );
          })}
        </div>

        {/* Güven rozetleri */}
        <div className="mt-14 flex flex-wrap items-center justify-center gap-8 text-sm text-muted-foreground">
          <span className="flex items-center gap-2">
            <svg className="w-4 h-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
            256-bit SSL Şifreleme
          </span>
          <span className="flex items-center gap-2">
            <svg className="w-4 h-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
            </svg>
            İyzico ile Güvenli Ödeme
          </span>
          <span className="flex items-center gap-2">
            <svg className="w-4 h-4 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Anında Aktivasyon
          </span>
        </div>
      </div>

      {/* İyzico Checkout Modal */}
      {checkoutContent && (
        <IyzicoCheckoutModal
          checkoutFormContent={checkoutContent}
          onClose={handleModalClose}
        />
      )}
    </div>
  );
}
