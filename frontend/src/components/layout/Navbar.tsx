import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';

export default function Navbar() {
  const { user, isAuthenticated, logout } = useAuthStore();
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Menü dışına tıklanınca kapat
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <nav className="border-b bg-card px-4 sm:px-6 py-3">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Logo */}
        <Link to={isAuthenticated ? '/dashboard' : '/'} className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
            <span className="text-primary-foreground font-bold text-sm">CV</span>
          </div>
          <span className="text-lg font-bold">CV Builder</span>
        </Link>

        {/* Sağ taraf */}
        {isAuthenticated && user ? (
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="flex items-center gap-2 rounded-lg px-3 py-1.5 hover:bg-muted transition-colors"
            >
              {/* Avatar */}
              <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center">
                <span className="text-xs font-semibold text-primary">
                  {user.fullName?.charAt(0)?.toUpperCase() || user.email.charAt(0).toUpperCase()}
                </span>
              </div>
              <span className="text-sm font-medium hidden sm:inline">
                {user.fullName || user.email}
              </span>
              {/* Chevron */}
              <svg
                className={`w-4 h-4 text-muted-foreground transition-transform ${isMenuOpen ? 'rotate-180' : ''}`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {/* Dropdown menü */}
            {isMenuOpen && (
              <div className="absolute right-0 mt-2 w-56 rounded-xl border bg-card shadow-lg py-1 z-50">
                <div className="px-4 py-2 border-b">
                  <p className="text-sm font-medium truncate">{user.fullName || 'Kullanıcı'}</p>
                  <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                  <span className="inline-block mt-1 text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium">
                    {user.plan === 'paid' ? 'Premium' : 'Ücretsiz'}
                  </span>
                </div>
                <Link
                  to="/dashboard"
                  onClick={() => setIsMenuOpen(false)}
                  className="block px-4 py-2 text-sm hover:bg-muted transition-colors"
                >
                  CV'lerim
                </Link>
                <Link
                  to="/pricing"
                  onClick={() => setIsMenuOpen(false)}
                  className="block px-4 py-2 text-sm hover:bg-muted transition-colors"
                >
                  Planlar
                </Link>
                <div className="border-t mt-1">
                  <button
                    onClick={handleLogout}
                    className="w-full text-left px-4 py-2 text-sm text-destructive hover:bg-muted transition-colors"
                  >
                    Çıkış Yap
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <Link
              to="/login"
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              Giriş Yap
            </Link>
            <Link
              to="/register"
              className="rounded-lg bg-primary px-4 py-1.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              Kayıt Ol
            </Link>
          </div>
        )}
      </div>
    </nav>
  );
}
