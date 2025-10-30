// src/App.js
import React, { Suspense, lazy } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useLocation,
} from "react-router-dom";

import { AuthProvider, useAuth } from "./AuthContext";
import { ThemeProvider } from "./theme";
import { ToastProvider } from "./useToast";

// === IMPORTS DIRECTOS (evitan el error en /login y /register) ===
import Navbar from "./Navbar";
import Home from "./Home";
import Login from "./Login";
import Register from "./Register";
import MisDatos from "./MisDatos";
import Ejercicios from "./Ejercicios";

// === LAZY SOLO EN PÁGINAS PESADAS QUE EXISTEN ===
// Asegúrate de que estos archivos existen y exportan `export default`
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Rutinas = lazy(() => import("./services/Rutinas")); // <- ruta real
const Recomendadas = lazy(() => import("./pages/RutinasRecomendadas")); // <- ruta real
const SeedAdminFirestore = lazy(() => import("./SeedAdminFirestore"));
const SeedRoutinesFromJSON = lazy(() => import("./SeedRoutinesFromJSON"));

// Si aún no tienes ResetPassword, usa un componente simple:
function ResetPasswordFallback() {
  return (
    <div className="registro-container">
      <div className="form-box">
        <h2>Recuperar contraseña</h2>
        <p>Componente no implementado aún.</p>
      </div>
    </div>
  );
}
const ResetPassword = ResetPasswordFallback;

// ===== Helpers =====
function ScrollToTop() {
  const { pathname } = useLocation();
  React.useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [pathname]);
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

// Rutas protegidas
function PrivateRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <LoadingScreen />;
  return user ? children : <Navigate to="/login" replace />;
}
function PublicOnlyRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <LoadingScreen />;
  return user ? <Navigate to="/dashboard" replace /> : children;
}

// Admin
const ALLOWED_ADMINS = ["XbuiurTJjLRMZpKojLRyC1d0dRa2"];
function AdminRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <LoadingScreen />;
  if (!user) return <Navigate to="/login" replace />;
  return ALLOWED_ADMINS.includes(user.uid) ? children : <Navigate to="/dashboard" replace />;
}

// Ocultar navbar en auth
const AUTH_PATHS = new Set(["/login", "/register", "/reset"]);

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
          <Route
            path="/login"
            element={
              <PublicOnlyRoute>
                <Login />
              </PublicOnlyRoute>
            }
          />
          <Route
            path="/register"
            element={
              <PublicOnlyRoute>
                <Register />
              </PublicOnlyRoute>
            }
          />
          <Route
            path="/reset"
            element={
              <PublicOnlyRoute>
                <ResetPassword />
              </PublicOnlyRoute>
            }
          />

          {/* Privadas */}
          <Route
            path="/misdatos"
            element={
              <PrivateRoute>
                <MisDatos />
              </PrivateRoute>
            }
          />
          <Route
            path="/rutina"
            element={
              <PrivateRoute>
                <Rutinas />
              </PrivateRoute>
            }
          />
          <Route
            path="/recomendadas"
            element={
              <PrivateRoute>
                <Recomendadas />
              </PrivateRoute>
            }
          />
          <Route
            path="/ejercicios"
            element={
              <PrivateRoute>
                <Ejercicios />
              </PrivateRoute>
            }
          />
          <Route
            path="/dashboard"
            element={
              <PrivateRoute>
                <Dashboard />
              </PrivateRoute>
            }
          />

          {/* Admin */}
          <Route
            path="/seed-admin-fs"
            element={
              <AdminRoute>
                <SeedAdminFirestore />
              </AdminRoute>
            }
          />
          <Route
            path="/seed-routines"
            element={
              <AdminRoute>
                <SeedRoutinesFromJSON />
              </AdminRoute>
            }
          />

          {/* 404 */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </>
  );
}

export default function App() {
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

