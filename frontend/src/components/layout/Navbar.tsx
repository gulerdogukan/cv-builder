import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FileText, Sun, Moon, ChevronDown, LayoutDashboard, CreditCard, LogOut, User } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import { useTheme } from '@/hooks/useTheme';

export default function Navbar() {
  const { user, isAuthenticated, logout } = useAuthStore();
  const { isDark, toggle } = useTheme();
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

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
    setIsMenuOpen(false);
    await logout();
    navigate('/');
  };

  return (
    <nav className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-4">

        {/* Logo */}
        <Link
          to={isAuthenticated ? '/dashboard' : '/'}
          className="flex items-center gap-2 shrink-0 group"
        >
          <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center shadow-sm shadow-primary/30 group-hover:shadow-primary/50 transition-shadow">
            <FileText className="w-4 h-4 text-primary-foreground" strokeWidth={2.5} />
          </div>
          <span className="text-sm font-bold tracking-tight">CV Builder</span>
        </Link>

        {/* Sağ grup */}
        <div className="flex items-center gap-2">

          {/* Dark/Light toggle */}
          <button
            onClick={toggle}
            aria-label={isDark ? 'Açık moda geç' : 'Koyu moda geç'}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            {isDark
              ? <Sun className="w-4 h-4" />
              : <Moon className="w-4 h-4" />
            }
          </button>

          {isAuthenticated && user ? (
            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="flex items-center gap-2 rounded-lg px-2.5 py-1.5 hover:bg-muted transition-colors"
              >
                {/* Avatar */}
                <div className="w-6 h-6 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
                  <span className="text-[11px] font-bold text-primary">
                    {user.fullName?.charAt(0)?.toUpperCase() || user.email.charAt(0).toUpperCase()}
                  </span>
                </div>
                <span className="text-sm font-medium hidden sm:inline max-w-[120px] truncate">
                  {user.fullName || user.email}
                </span>
                <ChevronDown className={`w-3.5 h-3.5 text-muted-foreground transition-transform duration-200 ${isMenuOpen ? 'rotate-180' : ''}`} />
              </button>

              {/* Dropdown */}
              {isMenuOpen && (
                <div className="absolute right-0 mt-1.5 w-56 rounded-xl border border-border bg-card shadow-lg shadow-black/10 dark:shadow-black/30 py-1.5 z-50">
                  {/* Kullanıcı bilgisi */}
                  <div className="px-4 py-2.5 border-b border-border mb-1">
                    <p className="text-sm font-semibold truncate">{user.fullName || 'Kullanıcı'}</p>
                    <p className="text-xs text-muted-foreground truncate mt-0.5">{user.email}</p>
                    <span className={`inline-flex items-center mt-1.5 text-[11px] px-2 py-0.5 rounded-full font-semibold ${
                      user.plan === 'paid'
                        ? 'bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300'
                        : 'bg-primary/10 text-primary'
                    }`}>
                      {user.plan === 'paid' ? '✦ Premium' : 'Ücretsiz Plan'}
                    </span>
                  </div>

                  <Link
                    to="/dashboard"
                    onClick={() => setIsMenuOpen(false)}
                    className="flex items-center gap-2.5 px-4 py-2 text-sm hover:bg-muted transition-colors text-foreground"
                  >
                    <LayoutDashboard className="w-4 h-4 text-muted-foreground" />
                    CV'lerim
                  </Link>
                  <Link
                    to="/pricing"
                    onClick={() => setIsMenuOpen(false)}
                    className="flex items-center gap-2.5 px-4 py-2 text-sm hover:bg-muted transition-colors text-foreground"
                  >
                    <CreditCard className="w-4 h-4 text-muted-foreground" />
                    Planlar
                  </Link>

                  <div className="border-t border-border mt-1 pt-1">
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-2.5 px-4 py-2 text-sm text-destructive hover:bg-destructive/5 transition-colors"
                    >
                      <LogOut className="w-4 h-4" />
                      Çıkış Yap
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                to="/login"
                className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors rounded-lg hover:bg-muted"
              >
                <User className="w-3.5 h-3.5" />
                Giriş Yap
              </Link>
              <Link
                to="/register"
                className="inline-flex items-center px-3.5 py-1.5 text-sm font-semibold rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors shadow-sm shadow-primary/25"
              >
                Ücretsiz Başla
              </Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
