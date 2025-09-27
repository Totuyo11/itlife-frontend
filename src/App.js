import React, { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './AuthContext';
import { ThemeProvider } from './theme';
import { ToastProvider } from './useToast';

// ✅ Lazy imports (mejor performance)
const Navbar = lazy(() => import('./Navbar'));
const Home = lazy(() => import('./Home'));
const Login = lazy(() => import('./Login'));
const Register = lazy(() => import('./Register'));
const MisDatos = lazy(() => import('./MisDatos'));
const Rutinas = lazy(() => import('./pages/Rutinas'));
const Ejercicios = lazy(() => import('./Ejercicios'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const SeedAdminFirestore = lazy(() => import('./SeedAdminFirestore'));

// 🔹 NUEVO: seed desde JSON (routines.json)
const SeedRoutinesFromJSON = lazy(() => import('./SeedRoutinesFromJSON'));

// 🔹 NUEVO: Recomendador de rutinas (Opción 1)
const RutinasRecomendadas = lazy(() => import('./pages/RutinasRecomendadas'));

// (Opcional) reset de contraseña si lo tienes/crearás
const ResetPassword = lazy(() => import('./ResetPassword').catch(() => ({ default: () => (
  <div className="registro-container"><div className="form-box"><h2>Recuperar contraseña</h2>
    <p>Componente no implementado aún.</p></div></div>
) })));

// =============== Helpers de Rutas ===============
function ScrollToTop() {
  const { pathname } = useLocation();
  React.useEffect(() => { window.scrollTo({ top: 0, behavior: 'smooth' }); }, [pathname]);
  return null;
}

function LoadingScreen() {
  return (
    <div className="registro-container">
      <div className="form-box" aria-busy="true">
        <h2 className="titulo-login">Cargando…</h2>
        <p className="mensaje">Preparando FitLife</p>
      </div>
    </div>
  );
}

// 🔐 Ruta privada (requiere sesión)
function PrivateRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <LoadingScreen />;
  return user ? children : <Navigate to="/login" replace />;
}

// 🚪 Sólo pública (si ya hay sesión → redirige al dashboard)
function PublicOnlyRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <LoadingScreen />;
  return user ? <Navigate to="/dashboard" replace /> : children;
}

// 🛡️ Admin/Seed protegido
const ALLOWED_ADMINS = [
  "XbuiurTJjLRMZpKojLRyC1d0dRa2" // ✅ tu UID
];
function AdminRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <LoadingScreen />;
  if (!user) return <Navigate to="/login" replace />;
  const isAllowed = ALLOWED_ADMINS.includes(user.uid);
  return isAllowed ? children : <Navigate to="/dashboard" replace />;
}

// Ocultar Navbar en rutas de auth
const AUTH_PATHS = new Set(['/login', '/register', '/reset']);

function AppShell() {
  const location = useLocation();
  const hideNavbar = AUTH_PATHS.has(location.pathname);

  return (
    <>
      <ScrollToTop />
      {!hideNavbar && <Navbar />}
      <Suspense fallback={<LoadingScreen />}>
        <Routes>
          {/* Públicas */}
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<PublicOnlyRoute><Login /></PublicOnlyRoute>} />
          <Route path="/register" element={<PublicOnlyRoute><Register /></PublicOnlyRoute>} />
          <Route path="/reset" element={<PublicOnlyRoute><ResetPassword /></PublicOnlyRoute>} />

          {/* Privadas */}
          <Route path="/misdatos" element={<PrivateRoute><MisDatos /></PrivateRoute>} />
          <Route path="/rutina" element={<PrivateRoute><Rutinas /></PrivateRoute>} />
          <Route path="/recomendadas" element={<PrivateRoute><RutinasRecomendadas /></PrivateRoute>} />
          <Route path="/ejercicios" element={<PrivateRoute><Ejercicios /></PrivateRoute>} />
          <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />

          {/* Admin/Seed */}
          <Route path="/seed-admin-fs" element={<AdminRoute><SeedAdminFirestore /></AdminRoute>} />
          <Route path="/seed-routines" element={<AdminRoute><SeedRoutinesFromJSON /></AdminRoute>} />

          {/* 404 */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </>
  );
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <ThemeProvider>
          <ToastProvider>
            <AppShell />
          </ToastProvider>
        </ThemeProvider>
      </Router>
    </AuthProvider>
  );
}

export default App;
