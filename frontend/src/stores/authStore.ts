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
          isAuthenticated: true,
          isLoading: false,
        });

        // Backend ile senkronize et (plan bilgisi vb.)
        get().syncUserWithBackend();
      } else {
        set({ user: null, isAuthenticated: false, isLoading: false });
      }
    } catch {
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
          get().syncUserWithBackend();
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
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName },
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    if (error) {
      set({ isLoading: false });
      throw new Error(error.message);
    }
    set({ isLoading: false });
  },

  logout: async () => {
    await supabase.auth.signOut();
    set({ user: null, isAuthenticated: false });
  },
}));
