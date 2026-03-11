import { useAuthStore } from '@/stores/authStore';

/**
 * Auth store'a kolay erişim hook'u.
 * Initialize App.tsx'te yapılır, burada tekrar çağırmaya gerek yok.
 */
export function useAuth() {
  return useAuthStore();
}

/**
 * @deprecated ProtectedRoute component'i kullanın.
 * Eski hook — geriye uyumluluk için tutuldu.
 */
export function useRequireAuth() {
  const { isAuthenticated, isLoading } = useAuthStore();
  return { isAuthenticated, isLoading };
}
