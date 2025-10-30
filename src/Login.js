import React, { useState } from 'react';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import { Link, useNavigate } from 'react-router-dom';
import './Register.css';
import hero from './assets/fitlife-hero.jpg'; // 👈 importa la imagen

const mapError = (code) => {
  switch (code) {
    case 'auth/invalid-email': return 'Correo inválido.';
    case 'auth/user-disabled': return 'Tu cuenta está deshabilitada.';
    case 'auth/user-not-found': return 'No existe una cuenta con ese correo.';
    case 'auth/wrong-password': return 'Contraseña incorrecta.';
    case 'auth/too-many-requests': return 'Demasiados intentos. Intenta más tarde.';
    default: return 'No pudimos iniciar sesión. Revisa tus datos.';
  }
};

export default function Login() {
  const [correo, setCorreo] = useState('');
  const [contraseña, setContraseña] = useState('');
  const [mensaje, setMensaje] = useState('');
  const [error, setError] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setError(''); setMensaje('');
    setLoading(true);
    const auth = getAuth();
    try {
      await signInWithEmailAndPassword(auth, correo.trim(), contraseña);
      setMensaje('✅ ¡Bienvenido de nuevo!');
      setTimeout(() => navigate('/dashboard'), 400);
    } catch (err) {
      setError(`❌ ${mapError(err.code)}`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-layout">
      {/* Panel lateral con imagen */}
      <aside
        className="auth-aside"
        style={{
          backgroundImage: `
            radial-gradient(1200px 600px at -10% -10%, rgba(255,64,129,.25), transparent 60%),
            radial-gradient(800px 400px at 110% 110%, rgba(109,40,217,.25), transparent 55%),
            url(${hero})
          `
        }}
      >
        <div className="aside-overlay">
          <div className="aside-badge">🏋️ FitLife</div>
          <h1 className="aside-title">Entrena mejor, mide tu progreso.</h1>
          <ul className="aside-bullets">
            <li>📈 Gráficas y rachas semanales</li>
            <li>🏷️ Rutinas personalizadas</li>
            <li>💾 Historial y seguimiento</li>
          </ul>
          <div className="aside-kpis">
            <div className="kpi">
              <div className="kpi-top">+120k</div>
              <div className="kpi-foot">minutos registrados</div>
            </div>
            <div className="kpi">
              <div className="kpi-top">98%</div>
              <div className="kpi-foot">usuarios activos</div>
            </div>
          </div>
        </div>
      </aside>

      {/* Columna del formulario */}
      <main className="auth-main">
        <div className="registro-container">
          <div className="form-box form-deco" aria-busy={loading}>
            <div className="brand-mini">🏋️ FitLife</div>
            <h2 className="titulo-login">Iniciar sesión</h2>
            <p className="subtitle">Entrena mejor, mide tu progreso y alcanza tus metas.</p>

            <div className="or-divider" aria-hidden="true"><span>Bienvenido</span></div>

            <form onSubmit={handleSubmit} className="registro-form" noValidate>
              <label className="sr-only" htmlFor="email">Correo</label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="Correo electrónico"
                value={correo}
                onChange={(e) => setCorreo(e.target.value)}
                required
                disabled={loading}
              />

              <div className="input-group">
                <label className="sr-only" htmlFor="pass">Contraseña</label>
                <input
                  id="pass"
                  type={showPass ? 'text' : 'password'}
                  autoComplete="current-password"
                  placeholder="Contraseña"
                  value={contraseña}
                  onChange={(e) => setContraseña(e.target.value)}
                  required
                  disabled={loading}
                />
                <button
                  type="button"
                  className="toggle-pass"
                  onClick={() => setShowPass(s => !s)}
                  aria-label={showPass ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                >
                  {showPass ? '🙈' : '👁️'}
                </button>
              </div>

              <button type="submit" className={loading ? 'btn loading' : 'btn'} disabled={loading}>
                {loading ? 'Entrando…' : 'Entrar'}
              </button>

              {mensaje && <p className="mensaje ok">{mensaje}</p>}
              {error && <p className="mensaje error">{error}</p>}

              <div className="extras">
                <Link to="/reset" className="link">¿Olvidaste tu contraseña?</Link>
                <span className="sep">•</span>
                <Link to="/register" className="link">Crear cuenta</Link>
              </div>

              <p className="legal">Al continuar, aceptas nuestros Términos y Política.</p>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}

