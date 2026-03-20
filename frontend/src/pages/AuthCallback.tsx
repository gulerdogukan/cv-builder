import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';

export default function AuthCallback() {
  const navigate = useNavigate();
  const [error, setError] = useState('');

  useEffect(() => {
    // Supabase PKCE flow: URL'deki code'u session ile değiştir
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (error) {
        setError(error.message);
        setTimeout(() => navigate('/login'), 3000);
        return;
      }
      if (session) {
        navigate('/dashboard', { replace: true });
      } else {
        // Kod henüz işlenmedi, biraz bekle
        setTimeout(() => {
          supabase.auth.getSession()
            .then(({ data: { session } }) => {
              navigate(session ? '/dashboard' : '/login', { replace: true });
            })
            .catch((retryErr: unknown) => {
              const msg = retryErr instanceof Error ? retryErr.message : 'Doğrulama yeniden denenirken hata oluştu.';
              setError(msg);
              setTimeout(() => navigate('/login'), 3000);
            });
        }, 1000);
      }
    });
  }, [navigate]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30">
        <div className="text-center">
          <p className="text-destructive mb-2">Doğrulama hatası: {error}</p>
          <p className="text-sm text-muted-foreground">Giriş sayfasına yönlendiriliyorsunuz...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30">
      <div className="flex flex-col items-center gap-3">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        <p className="text-sm text-muted-foreground">E-posta doğrulanıyor...</p>
      </div>
    </div>
  );
}
