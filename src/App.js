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

// 👉 Toastify (notificaciones globales)
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

// === IMPORTS DIRECTOS (páginas principales) ===
import Navbar from "./Navbar";
import Home from "./Home";
import Login from "./Login";
import Register from "./Register";
import MisDatos from "./MisDatos";
import Ejercicios from "./Ejercicios";
import MisRutinas from "./pages/MisRutinas"; // ✅ Mis Rutinas

// === LAZY (para carga diferida de módulos pesados) ===
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Rutinas = lazy(() => import("./services/Rutinas")); // ✅ Ruta corregida (tuviste este path)
const Recomendadas = lazy(() => import("./pages/RutinasRecomendadas"));
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

// ===== Rutas protegidas =====
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

// ===== Rutas admin =====
const ALLOWED_ADMINS = ["XbuiurTJjLRMZpKojLRyC1d0dRa2"];
function AdminRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <LoadingScreen />;
  if (!user) return <Navigate to="/login" replace />;
  return ALLOWED_ADMINS.includes(user.uid)
    ? children
    : <Navigate to="/dashboard" replace />;
}

// Ocultar navbar en páginas de autenticación
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
          {/* === Públicas === */}
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

          {/* === Privadas === */}
          {/* Alias de Mis Datos: /misdatos y /mis-datos */}
          <Route
            path="/misdatos"
            element={
              <PrivateRoute>
                <MisDatos />
              </PrivateRoute>
            }
          />
          <Route path="/mis-datos" element={<Navigate to="/misdatos" replace />} />

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
          {/* ✅ Nueva ruta “Mis Rutinas” */}
          <Route
            path="/mis-rutinas"
            element={
              <PrivateRoute>
                <MisRutinas />
              </PrivateRoute>
            }
          />

          {/* === Admin === */}
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

          {/* === 404 === */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>

      {/* 👉 Contenedor global de Toastify (usa tu tema oscuro) */}
      <ToastContainer
        position="bottom-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        draggable
        pauseOnHover
        theme="dark"
        toastClassName="fitlife-toast"     // opcional: aplica si defines esta clase en tu CSS
        bodyClassName="fitlife-toast-body" // opcional
      />
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
