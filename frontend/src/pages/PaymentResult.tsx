import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { usePayment } from '@/hooks/usePayment';
import { useAuthStore } from '@/stores/authStore';

type ResultState = 'loading' | 'success' | 'failed' | 'error';

export default function PaymentResult() {
  const [searchParams] = useSearchParams();
  const token  = searchParams.get('token');
  const status = searchParams.get('status'); // İyzico bazı durumlarda ekler

  const { verifyPayment } = usePayment();
  const { syncUserWithBackend } = useAuthStore();
  const [resultState, setResultState] = useState<ResultState>('loading');
  const [message, setMessage]         = useState('');

  useEffect(() => {
    if (!token) {
      setResultState('error');
      setMessage('Geçersiz ödeme bağlantısı. Token bulunamadı.');
      return;
    }

    (async () => {
      try {
        const result = await verifyPayment(token);
        if (result.success) {
          // Auth store'u yenile — plan "paid" olarak güncellensin
          await syncUserWithBackend();
          setResultState('success');
        } else {
          setResultState('failed');
          setMessage(result.message || 'Ödeme gerçekleştirilemedi.');
        }
      } catch {
        setResultState('error');
        setMessage('Ödeme doğrulanamadı. Lütfen destek ekibiyle iletişime geçin.');
      }
    })();
  }, [token, verifyPayment, syncUserWithBackend]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/20 p-4">
      <div className="bg-card border rounded-2xl shadow-xl max-w-md w-full p-8 text-center">
        {resultState === 'loading' && (
          <>
            <div className="flex justify-center mb-5">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
            </div>
            <h2 className="text-xl font-bold">Ödeme Doğrulanıyor</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Lütfen bekleyin, ödemeniz onaylanıyor...
            </p>
          </>
        )}

        {resultState === 'success' && (
          <>
            <div className="flex justify-center mb-5">
              <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
                <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            </div>
            <h2 className="text-2xl font-bold text-green-700">Ödeme Başarılı!</h2>
            <p className="mt-3 text-sm text-muted-foreground">
              Premium üyeliğiniz aktif edildi. Artık tüm özelliklere erişebilirsiniz.
            </p>
            <div className="mt-4 p-3 rounded-lg bg-green-50 border border-green-200 text-xs text-green-700">
              ✓ Sınırsız PDF indirme açıldı<br />
              ✓ Sınırsız AI önerisi açıldı
            </div>
            <Link
              to="/dashboard"
              className="mt-7 block w-full rounded-xl bg-primary py-3 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              Dashboard'a Git →
            </Link>
          </>
        )}

        {(resultState === 'failed' || resultState === 'error') && (
          <>
            <div className="flex justify-center mb-5">
              <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center">
                <svg className="w-8 h-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
            </div>
            <h2 className="text-2xl font-bold text-red-700">
              {resultState === 'failed' ? 'Ödeme Başarısız' : 'Bir Hata Oluştu'}
            </h2>
            <p className="mt-3 text-sm text-muted-foreground">{message}</p>
            <div className="mt-7 flex flex-col gap-3">
              <Link
                to="/pricing"
                className="block w-full rounded-xl bg-primary py-3 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
              >
                Tekrar Dene
              </Link>
              <Link
                to="/dashboard"
                className="block w-full rounded-xl border border-border py-3 text-sm font-medium hover:bg-muted transition-colors"
              >
                Dashboard'a Dön
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
