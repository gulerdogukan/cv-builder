import { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import ProtectedRoute from '@/components/layout/ProtectedRoute';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Editor from './pages/Editor';
import Pricing from './pages/Pricing';
import PaymentResult from './pages/PaymentResult';
import AuthCallback from './pages/AuthCallback';
import PublicCVPage from './pages/PublicCVPage';
import ScrollToTop from '@/components/ui/ScrollToTop';

function App() {
  const initialize = useAuthStore((s) => s.initialize);

  // Uygulama yüklendiğinde auth durumunu kontrol et
  useEffect(() => {
    initialize();
  }, [initialize]);

  return (
    <>
      <ScrollToTop />
      <Routes>
        {/* Herkese açık sayfalar */}
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/pricing" element={<Pricing />} />
        <Route path="/payment/result" element={<PaymentResult />} />
        <Route path="/auth/callback" element={<AuthCallback />} />
        <Route path="/cv/:id" element={<PublicCVPage />} />

        {/* Korumalı sayfalar */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/editor/:id"
          element={
            <ProtectedRoute>
              <Editor />
            </ProtectedRoute>
          }
        />

        {/* 404 → Ana sayfa */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}

export default App;
