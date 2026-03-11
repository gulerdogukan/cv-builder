import { Link } from 'react-router-dom';

const plans = [
  {
    name: 'Ücretsiz',
    price: '0₺',
    period: '',
    features: [
      '1 CV oluşturma',
      'Template önizleme',
      'Günde 5 AI öneri',
    ],
    cta: 'Hemen Başla',
    highlight: false,
  },
  {
    name: 'Tek Seferlik',
    price: '99₺',
    period: 'tek ödeme',
    features: [
      'Sınırsız PDF export',
      '3 CV oluşturma',
      'Günde 20 AI öneri',
      'Tüm template\'ler',
    ],
    cta: 'Satın Al',
    highlight: true,
  },
  {
    name: 'Aylık',
    price: '49₺',
    period: '/ay',
    features: [
      'Tüm özellikler',
      'Sınırsız CV',
      'Sınırsız AI öneri',
      'Öncelikli destek',
    ],
    cta: 'Abone Ol',
    highlight: false,
  },
];

export default function Pricing() {
  return (
    <div className="min-h-screen bg-muted/30">
      <nav className="border-b bg-card px-6 py-4 flex items-center justify-between">
        <Link to="/" className="text-xl font-bold text-primary">CV Builder</Link>
        <Link to="/login" className="text-sm text-muted-foreground hover:text-foreground">
          Giriş Yap
        </Link>
      </nav>

      <div className="max-w-5xl mx-auto px-6 py-16 text-center">
        <h1 className="text-3xl font-bold">Fiyatlandırma</h1>
        <p className="mt-3 text-muted-foreground">İhtiyacınıza uygun planı seçin</p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`rounded-xl border p-6 text-left ${
                plan.highlight ? 'border-primary bg-primary/5 ring-2 ring-primary' : 'bg-card'
              }`}
            >
              <h3 className="text-lg font-semibold">{plan.name}</h3>
              <div className="mt-2">
                <span className="text-3xl font-bold">{plan.price}</span>
                {plan.period && (
                  <span className="text-sm text-muted-foreground ml-1">{plan.period}</span>
                )}
              </div>
              <ul className="mt-6 space-y-3">
                {plan.features.map((feature) => (
                  <li key={feature} className="text-sm flex items-center gap-2">
                    <span className="text-green-500">✓</span> {feature}
                  </li>
                ))}
              </ul>
              <button
                className={`mt-8 w-full rounded-lg px-4 py-2 text-sm font-medium ${
                  plan.highlight
                    ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                    : 'border bg-background hover:bg-muted'
                }`}
              >
                {plan.cta}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
