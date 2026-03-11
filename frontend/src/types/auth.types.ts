export type PlanType = 'free' | 'paid';

export interface User {
  id: string;
  email: string;
  fullName: string;
  plan: PlanType;
  createdAt: string;
}

export interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterCredentials {
  email: string;
  password: string;
  fullName: string;
}
