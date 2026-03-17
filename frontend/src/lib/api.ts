import axios from 'axios';
import { supabase } from './supabase';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor — Supabase JWT token ekleme
api.interceptors.request.use(async (config) => {
  const { data: { session } } = await supabase.auth.getSession();
  if (session?.access_token) {
    config.headers.Authorization = `Bearer ${session.access_token}`;
  }
  return config;
});

// Response interceptor — hata yönetimi
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Supabase session'ı hâlâ geçerliyse backend problemidir, redirect yapma
      // (Backend JWT validator hatası gibi geçici sorunlar sonsuz döngüye yol açmamalı)
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        // Gerçekten oturum kapanmış → login'e yönlendir
        const returnUrl = encodeURIComponent(window.location.pathname + window.location.search);
        window.location.href = `/login?returnUrl=${returnUrl}`;
      }
      // Session geçerliyse sadece hataı fırlat, redirect yapma
    }
    return Promise.reject(error);
  }
);

export default api;
