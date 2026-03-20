import { create } from 'zustand';
import { supabase } from '@/lib/supabase';
import api from '@/lib/api';
import type { User, LoginCredentials, RegisterCredentials, PlanType } from '@/types/auth.types';

interface AuthStore {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  _initialized: boolean;
  initialize: () => Promise<void>;
  login: (credentials: LoginCredentials) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  register: (credentials: RegisterCredentials) => Promise<void>;
  logout: () => Promise<void>;
  syncUserWithBackend: () => Promise<void>;
}

export const useAuthStore = create<AuthStore>((set, get) => ({
  user: null,
  isLoading: true,
  isAuthenticated: false,
  _initialized: false,

  // Backend'e verify-token çağrısı yaparak kullanıcıyı DB ile senkronize eder
  syncUserWithBackend: async () => {
    try {
      const response = await api.post<{
        userId: string;
        email: string;
        fullName: string;
        plan: string;
      }>('/api/auth/verify-token');

      const { userId, email, fullName, plan } = response.data;
      set((state) => ({
        user: state.user
          ? {
              ...state.user,
              id: userId,
              email: email || state.user.email,
              fullName: fullName || state.user.fullName,
              plan: (plan as PlanType) || state.user.plan,
            }
          : null,
      }));
    } catch {
      // Backend erişilemezse Supabase bilgileriyle devam et
      console.warn('Backend sync failed, using Supabase data only');
    }
  },

  initialize: async () => {
    // React StrictMode'da çift çağrıyı önle
    if (get()._initialized) return;
    set({ _initialized: true });

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        set({
          user: {
            id: session.user.id,
            email: session.user.email ?? '',
            fullName: (session.user.user_metadata?.['full_name'] as string) ?? '',
            plan: 'free',
            createdAt: session.user.created_at,
          },
        });

        // Backend ile senkronize et (plan bilgisi vb.)
        await get().syncUserWithBackend();
        
        set({ isAuthenticated: true, isLoading: false });
      } else {
        set({ user: null, isAuthenticated: false, isLoading: false });
      }
    } catch (error) {
      console.error('Auth initialization error:', error);
      set({ user: null, isAuthenticated: false, isLoading: false });
    }

    // Auth state değişikliklerini dinle (tek seferlik kayıt)
    supabase.auth.onAuthStateChange((event, session) => {
      // INITIAL_SESSION olayını skip et — initialize() zaten yönetti
      if (event === 'INITIAL_SESSION') return;

      if (session?.user) {
        set({
          user: {
            id: session.user.id,
            email: session.user.email ?? '',
            fullName: (session.user.user_metadata?.['full_name'] as string) ?? '',
            plan: 'free',
            createdAt: session.user.created_at,
          },
          isAuthenticated: true,
          isLoading: false,
        });

        // SIGNED_IN ve TOKEN_REFRESHED olaylarında backend ile senkronize et
        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
          get().syncUserWithBackend().catch(err => 
            console.error('Background sync failed:', err)
          );
        }
      } else {
        set({ user: null, isAuthenticated: false, isLoading: false });
      }
    });
  },

  login: async ({ email, password }: LoginCredentials) => {
    set({ isLoading: true });
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      set({ isLoading: false });
      // Supabase İngilizce hata mesajlarını Türkçe'ye çevir
      const msg = error.message.toLowerCase();
      if (msg.includes('invalid login credentials') || msg.includes('invalid credentials') || msg.includes('wrong password'))
        throw new Error('E-posta veya şifre hatalı. Lütfen tekrar deneyin.');
      if (msg.includes('email not confirmed'))
        throw new Error('E-posta adresinizi doğrulamadınız. Lütfen gelen kutunuzu kontrol edin.');
      if (msg.includes('too many requests'))
        throw new Error('Çok fazla deneme yapıldı. Lütfen birkaç dakika bekleyin.');
      if (msg.includes('user not found'))
        throw new Error('Bu e-posta adresiyle kayıtlı bir hesap bulunamadı.');
      throw new Error(error.message);
    }
    // onAuthStateChange otomatik olarak user'ı set edecek
    set({ isLoading: false });
  },

  loginWithGoogle: async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/dashboard` },
    });
    if (error) throw new Error(error.message);
  },

  register: async ({ email, password, fullName }: RegisterCredentials) => {
    set({ isLoading: true });
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName },
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    if (error) {
      set({ isLoading: false });
      const msg = error.message.toLowerCase();
      if (msg.includes('already registered') || msg.includes('already exists') || msg.includes('user already'))
        throw new Error('Bu e-posta adresi zaten kayıtlı. Giriş yapmayı deneyin.');
      if (msg.includes('password'))
        throw new Error('Şifre çok zayıf. En az 6 karakter ve daha güçlü bir şifre seçin.');
      if (msg.includes('invalid email'))
        throw new Error('Geçerli bir e-posta adresi girin.');
      throw new Error(error.message);
    }
    // Supabase güvenlik nedeniyle var olan e-postalar için hata döndürmez;
    // bunun yerine identities dizisi boş gelir → "email already registered" anlamına gelir
    if (data.user && (!data.user.identities || data.user.identities.length === 0)) {
      set({ isLoading: false });
      throw new Error('Bu e-posta adresi zaten kayıtlı. Giriş yapmayı deneyin.');
    }
    set({ isLoading: false });
  },

  logout: async () => {
    await supabase.auth.signOut();
    set({ user: null, isAuthenticated: false });
  },
}));
