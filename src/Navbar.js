import React, { useEffect, useMemo, useRef, useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from './AuthContext';
import './Register.css'; // estilos neón + light

function classNames(...xs) {
  return xs.filter(Boolean).join(' ');
}

function UserAvatar({ user }) {
  const fallback = useMemo(() => {
    const src = user?.displayName || user?.email || 'U';
    return src.trim().charAt(0).toUpperCase();
  }, [user]);
  return (
    <div className="avatar" title={user?.email || 'Usuario'}>
      {fallback}
    </div>
  );
}

// === Helpers de tema ===
function readStoredTheme() {
  try { return localStorage.getItem('fitlife:theme'); } catch { return null; }
}
function storeTheme(v) {
  try { localStorage.setItem('fitlife:theme', v); } catch {}
}
function getSystemPref() {
  if (typeof window === 'undefined') return 'dark';
  return window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches
    ? 'light'
    : 'dark';
}
function applyThemeAttr(theme) {
  document.documentElement.setAttribute('data-theme', theme);
}

export default function Navbar() {
  const { user, loading, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const [menuUserOpen, setMenuUserOpen] = useState(false);
  const [theme, setTheme] = useState(() => {
    const stored = readStoredTheme();
    const initial = stored || getSystemPref() || 'dark';
    if (typeof document !== 'undefined') applyThemeAttr(initial);
    return initial;
  });

  const location = useLocation();
  const navigate = useNavigate();

  // Ocultar navbar en rutas de auth
  const AUTH_PATHS = new Set(['/login', '/register', '/reset']);
  if (AUTH_PATHS.has(location.pathname)) return null;

  // Cerrar menús al cambiar de ruta
  useEffect(() => {
    setOpen(false);
    setMenuUserOpen(false);
  }, [location.pathname]);

  // Cerrar menús al hacer click fuera / Escape
  const userMenuRef = useRef(null);
  useEffect(() => {
    function onDocClick(e) {
      if (menuUserOpen && userMenuRef.current && !userMenuRef.current.contains(e.target)) {
        setMenuUserOpen(false);
      }
    }
    function onEsc(e) { if (e.key === 'Escape') { setOpen(false); setMenuUserOpen(false); } }
    document.addEventListener('mousedown', onDocClick);
    document.addEventListener('keydown', onEsc);
    return () => {
      document.removeEventListener('mousedown', onDocClick);
      document.removeEventListener('keydown', onEsc);
    };
  }, [menuUserOpen]);

  // Reaccionar si cambia el sistema (opcional)
  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: light)');
    const handler = () => {
      const stored = readStoredTheme();
      if (!stored) {
        const sys = mq.matches ? 'light' : 'dark';
        setTheme(sys);
        applyThemeAttr(sys);
      }
    };
    mq.addEventListener?.('change', handler);
    return () => mq.removeEventListener?.('change', handler);
  }, []);

  // Toggle de tema
  function toggleTheme() {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    applyThemeAttr(next);
    storeTheme(next);
  }

  // 🔹 Links (agregué Recomendadas)
  const links = [
    { to: '/', label: 'Inicio', public: true },
    { to: '/rutina', label: 'Rutinas', private: true },
    { to: '/recomendadas', label: 'Recomendadas', private: true }, // ← nuevo
    { to: '/ejercicios', label: 'Ejercicios', private: true },
    { to: '/dashboard', label: 'Progreso', private: true },
  ];

  async function handleLogout() {
    try {
      await logout();
      navigate('/login');
    } catch (e) {
      console.error(e);
    }
  }

  return (
    <header className="navbar">
      <div className="navbar-inner">
        {/* Brand */}
        <NavLink to="/" className="brand">
          <span className="brand-icon">Fl</span>
          <span className="brand-text">FitLife</span>
        </NavLink>

        {/* Desktop nav */}
        <nav className="nav-links">
          {links
            .filter(l => (l.private ? !!user : l.public))
            .map((l) => (
              <NavLink
                key={l.to}
                to={l.to}
                className={({ isActive }) =>
                  classNames('nav-link', isActive && 'nav-active')
                }
              >
                {l.label}
              </NavLink>
            ))}
        </nav>

        {/* Right actions */}
        <div className="nav-actions">
          {/* Toggle de tema */}
          <button
            className="theme-toggle"
            aria-label={theme === 'dark' ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
            title={theme === 'dark' ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
            onClick={toggleTheme}
          >
            {theme === 'dark' ? '☀️' : '🌙'}
          </button>

          {loading ? null : user ? (
            <div className="userbox" ref={userMenuRef}>
              <button
                className="avatar-btn"
                onClick={() => setMenuUserOpen((s) => !s)}
                aria-haspopup="menu"
                aria-expanded={menuUserOpen}
                aria-controls="user-menu"
              >
                <UserAvatar user={user} />
              </button>
              {menuUserOpen && (
                <div id="user-menu" className="menu-panel" role="menu">
                  <button className="menu-item" onClick={() => navigate('/misdatos')}>
                    Mi perfil
                  </button>
                  <button className="menu-item" onClick={() => navigate('/dashboard')}>
                    Dashboard
                  </button>
                  <hr className="menu-sep" />
                  <button className="menu-item danger" onClick={handleLogout}>
                    Cerrar sesión
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="auth-buttons">
              <NavLink to="/login" className="btn-secondary">Iniciar sesión</NavLink>
              <NavLink to="/register" className="btn-primary">Crear cuenta</NavLink>
            </div>
          )}

          {/* Hamburger (mobile) */}
          <button
            className="hamburger"
            aria-label="Abrir menú"
            aria-controls="mobile-menu"
            aria-expanded={open}
            onClick={() => setOpen((s) => !s)}
          >
            <span />
            <span />
            <span />
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {open && (
        <div id="mobile-menu" className="mobile-menu" role="dialog" aria-modal="true">
          <nav className="mobile-links" onClick={() => setOpen(false)}>
            {links
              .filter(l => (l.private ? !!user : l.public))
              .map((l) => (
                <NavLink
                  key={l.to}
                  to={l.to}
                  className={({ isActive }) =>
                    classNames('mobile-link', isActive && 'mobile-active')
                  }
                >
                  {l.label}
                </NavLink>
              ))}
          </nav>

          {!loading && !user && (
            <div className="mobile-auth">
              <NavLink to="/login" className="btn-secondary block">Iniciar sesión</NavLink>
              <NavLink to="/register" className="btn-primary block">Crear cuenta</NavLink>
            </div>
          )}

          {!loading && user && (
            <div className="mobile-user" onClick={(e) => e.stopPropagation()}>
              <div className="mobile-user-row">
                <UserAvatar user={user} />
                <div className="mobile-user-info">
                  <div className="mobile-user-name">{user.displayName || 'Usuario'}</div>
                  <div className="mobile-user-email">{user.email}</div>
                </div>
              </div>
              <div className="mobile-user-actions">
                <button className="menu-item" onClick={() => navigate('/misdatos')}>
                  Mi perfil
                </button>
                <button className="menu-item" onClick={() => navigate('/dashboard')}>
                  Dashboard
                </button>
                <button className="menu-item danger" onClick={handleLogout}>
                  Cerrar sesión
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </header>
  );
}
