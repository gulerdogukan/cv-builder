import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { usePayment } from '@/hooks/usePayment';
import { useSEO } from '@/hooks/useSEO';
import IyzicoCheckoutModal from '@/components/payment/IyzicoCheckoutModal';
import { motion } from 'framer-motion';

type PlanType = 'one_time' | 'monthly';

const PLANS = [
  {
    id: 'free' as const,
    name: 'Ücretsiz',
    price: 0,
    priceStr: '0₺',
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
    price: 99,
    priceStr: '99₺',
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
    price: 49,
    priceStr: '49₺',
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

// Number counting animation component
function CountUpPrice({ to }: { to: number }) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let start = 0;
    if (to === 0) {
      setCount(0);
      return;
    }
    const duration = 1000;
    const increment = to / (duration / 16);
    const timer = setInterval(() => {
      start += increment;
      if (start >= to) {
        setCount(to);
        clearInterval(timer);
      } else {
        setCount(Math.ceil(start));
      }
    }, 16);
    return () => clearInterval(timer);
  }, [to]);

  return <span>{count}</span>;
}

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
        fullName: user.fullName || (user.email ? user.email.split('@')[0] : 'Guest') || 'Guest',
        email: user.email || '',
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
      <nav className="border-b bg-card/80 backdrop-blur px-6 py-4 flex items-center justify-between z-10 relative">
        <Link to="/" className="text-xl font-bold text-primary">CV Builder</Link>
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate(-1)} 
            className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Geri Dön
          </button>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-6 py-16 relative">
        
        {/* Glow Effects */}
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-primary/10 rounded-full blur-[100px] pointer-events-none" />

        {/* Başlık */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-16 relative z-10"
        >
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight">Fiyatlandırma</h1>
          <p className="mt-4 text-lg text-muted-foreground">
            İhtiyacınıza uygun planı seçin. İstediğiniz zaman iptal edebilirsiniz.
          </p>
        </motion.div>

        {/* Hata mesajı */}
        {error && (
          <div className="mb-8 p-4 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm text-center">
            {error}
          </div>
        )}

        {/* Planlar */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
          {PLANS.map((plan, index) => {
            const isCurrentPlan = user?.plan === 'paid' && plan.planType !== null;
            const isFreeAndLoggedIn = !plan.planType && user;
            const isPopular = plan.highlight;

            return (
              <motion.div
                key={plan.id}
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ 
                  duration: 0.6, 
                  delay: isPopular ? 0.4 : index * 0.15,
                  type: "spring",
                  bounce: 0.4
                }}
                className={`relative rounded-3xl border p-8 flex flex-col transition-shadow ${
                  isPopular
                    ? 'border-primary bg-card ring-2 ring-primary shadow-2xl scale-[1.02] shadow-primary/20 z-10'
                    : 'bg-card hover:shadow-lg z-0'
                }`}
              >
                {isPopular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                    <span className="bg-primary text-primary-foreground text-[11px] font-bold px-4 py-1.5 rounded-full shadow-lg">
                      EN POPÜLER
                    </span>
                  </div>
                )}

                <div>
                  <h3 className="text-xl font-extrabold">{plan.name}</h3>
                  <p className="text-sm text-muted-foreground mt-1.5 min-h-[40px]">{plan.description}</p>
                  <div className="mt-6 flex items-baseline gap-1">
                    <span className="text-5xl font-extrabold">
                      <CountUpPrice to={plan.price} />
                    </span>
                    <span className="text-2xl font-bold tracking-tight">₺</span>
                    {plan.period && (
                      <span className="text-sm text-muted-foreground ml-1">{plan.period}</span>
                    )}
                  </div>
                </div>

                <div className="my-6 border-t border-border" />

                <ul className="space-y-4 flex-1">
                  {plan.features.map((f) => (
                    <li key={f.text} className="flex items-start gap-3 text-sm">
                      {f.included ? (
                        <span className="w-5 h-5 rounded-full bg-primary/20 text-primary flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">✓</span>
                      ) : (
                        <span className="w-5 h-5 rounded-full bg-muted text-muted-foreground flex items-center justify-center text-xs shrink-0 mt-0.5">✕</span>
                      )}
                      <span className={f.included ? 'font-medium' : 'text-muted-foreground'}>{f.text}</span>
                    </li>
                  ))}
                </ul>

                <button
                  onClick={() => handlePlanClick(plan)}
                  disabled={isLoading && activePlan === plan.planType || isCurrentPlan || !!isFreeAndLoggedIn}
                  className={`mt-8 w-full rounded-xl px-4 py-3.5 text-sm font-bold transition-all ${
                    isPopular
                      ? 'bg-primary text-primary-foreground hover:bg-primary/90 hover:shadow-lg disabled:opacity-60'
                      : 'border-2 border-primary/20 text-primary hover:bg-primary/10 disabled:opacity-50'
                  }`}
                >
                  {isLoading && activePlan === plan.planType ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-current" />
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
              </motion.div>
            );
          })}
        </div>

        {/* Güven rozetleri */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1, duration: 1 }}
          className="mt-20 flex flex-wrap items-center justify-center gap-10 text-sm font-medium text-muted-foreground relative z-10"
        >
          <span className="flex items-center gap-2.5">
            <svg className="w-5 h-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
            256-bit SSL Şifreleme
          </span>
          <span className="flex items-center gap-2.5">
            <svg className="w-5 h-5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
            </svg>
            İyzico Güvencesi
          </span>
          <span className="flex items-center gap-2.5">
            <svg className="w-5 h-5 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Anında Aktivasyon
          </span>
        </motion.div>
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
