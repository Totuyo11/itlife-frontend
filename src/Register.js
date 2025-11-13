import React, { useMemo, useState } from "react";
import {
  getAuth,
  createUserWithEmailAndPassword,
  updateProfile,
} from "firebase/auth";
import { Link, useNavigate } from "react-router-dom";
import "./Register.css";
import hero from "./assets/fitlife-hero.jpg"; // 👈 importa la imagen

const mapError = (code) => {
  switch (code) {
    case "auth/email-already-in-use":
      return "Ese correo ya está en uso.";
    case "auth/invalid-email":
      return "Correo inválido.";
    case "auth/weak-password":
      return "La contraseña es muy débil.";
    default:
      return "No pudimos crear la cuenta. Inténtalo de nuevo.";
  }
};

function scorePassword(pw) {
  let s = 0;
  if (pw.length >= 6) s++;
  if (pw.length >= 10) s++;
  if (/[A-Z]/.test(pw)) s++;
  if (/[0-9]/.test(pw) || /[^A-Za-z0-9]/.test(pw)) s++;
  return Math.min(s, 4);
}

export default function Register() {
  const [nombre, setNombre] = useState("");
  const [correo, setCorreo] = useState("");
  const [pass, setPass] = useState("");
  const [pass2, setPass2] = useState("");
  const [acepto, setAcepto] = useState(false);

  const [showPass, setShowPass] = useState(false);
  const [showPass2, setShowPass2] = useState(false);
  const [mensaje, setMensaje] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const strength = useMemo(() => scorePassword(pass), [pass]);
  const strengthText = ["Muy débil", "Débil", "Media", "Fuerte", "Muy fuerte"][strength];

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setMensaje("");

    if (!acepto) {
      setError("Debes aceptar los Términos y la Política de privacidad.");
      return;
    }
    if (pass !== pass2) {
      setError("Las contraseñas no coinciden.");
      return;
    }
    if (pass.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres.");
      return;
    }

    setLoading(true);
    const auth = getAuth();
    try {
      const cred = await createUserWithEmailAndPassword(
        auth,
        correo.trim(),
        pass
      );
      if (nombre.trim()) {
        await updateProfile(cred.user, { displayName: nombre.trim() });
      }
      setMensaje("✅ Cuenta creada. ¡Bienvenido!");
      setTimeout(() => navigate("/dashboard"), 500);
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
          `,
        }}
      >
        <div className="aside-overlay">
          <div className="aside-badge">🏋️ FitLife</div>
          <h1 className="aside-title">
            Comienza hoy. Tu yo del futuro te lo agradecerá.
          </h1>
          <ul className="aside-bullets">
            <li>🔒 Tus datos seguros en Firebase</li>
            <li>🔥 Mantén rachas y disciplina</li>
            <li>🧠 Crea hábitos saludables</li>
          </ul>
          <div className="aside-kpis">
            <div className="kpi">
              <div className="kpi-top">7d</div>
              <div className="kpi-foot">racha promedio</div>
            </div>
            <div className="kpi">
              <div className="kpi-top">+3</div>
              <div className="kpi-foot">rutinas creadas</div>
            </div>
          </div>
        </div>
      </aside>

      {/* Columna del formulario */}
      <main className="auth-main">
        <div className="registro-container">
          <div className="form-box form-deco" aria-busy={loading}>
            <div className="brand-mini">🏋️ FitLife</div>
            <h2 className="titulo-login">Crear cuenta</h2>
            <p className="subtitle">
              Únete y comienza a seguir tu progreso hoy mismo.
            </p>

            <div className="or-divider" aria-hidden="true">
              <span>Regístrate</span>
            </div>

            <form onSubmit={handleSubmit} className="registro-form" noValidate>
              <label className="sr-only" htmlFor="name">
                Nombre
              </label>
              <input
                id="name"
                type="text"
                placeholder="Tu nombre"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                disabled={loading}
              />

              <label className="sr-only" htmlFor="email">
                Correo
              </label>
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
                <label className="sr-only" htmlFor="pass">
                  Contraseña
                </label>
                <input
                  id="pass"
                  type={showPass ? "text" : "password"}
                  autoComplete="new-password"
                  placeholder="Contraseña"
                  value={pass}
                  onChange={(e) => setPass(e.target.value)}
                  required
                  disabled={loading}
                />
                <button
                  type="button"
                  className="toggle-pass"
                  onClick={() => setShowPass((s) => !s)}
                >
                  {showPass ? "No mostrar" : "Mostrar"}
                </button>
              </div>

              {/* Fuerza de contraseña */}
              <div className="strength">
                <div className={`bar s-${strength}`} />
                <span className="label">Fuerza: {strengthText}</span>
              </div>

              <div className="input-group">
                <label className="sr-only" htmlFor="pass2">
                  Confirmar contraseña
                </label>
                <input
                  id="pass2"
                  type={showPass2 ? "text" : "password"}
                  autoComplete="new-password"
                  placeholder="Confirmar contraseña"
                  value={pass2}
                  onChange={(e) => setPass2(e.target.value)}
                  required
                  disabled={loading}
                />
                <button
                  type="button"
                  className="toggle-pass"
                  onClick={() => setShowPass2((s) => !s)}
                >
                  {showPass2 ? "No Mostrar" : "Mostrar"}
                </button>
              </div>

              <label className="terms">
                <input
                  type="checkbox"
                  checked={acepto}
                  onChange={(e) => setAcepto(e.target.checked)}
                  disabled={loading}
                />
                <span>
                  Acepto los{" "}
                  <button
                    type="button"
                    className="link link-plain"
                    onClick={(e) => e.preventDefault()}
                  >
                    Términos
                  </button>{" "}
                  y la{" "}
                  <button
                    type="button"
                    className="link link-plain"
                    onClick={(e) => e.preventDefault()}
                  >
                    Política de privacidad
                  </button>
                  .
                </span>
              </label>

              <button
                type="submit"
                className={loading ? "btn loading" : "btn"}
                disabled={loading}
              >
                {loading ? "Creando…" : "Crear cuenta"}
              </button>

              {mensaje && <p className="mensaje ok">{mensaje}</p>}
              {error && <p className="mensaje error">{error}</p>}

              <div className="extras">
                <span>¿Ya tienes cuenta? </span>
                <Link to="/login" className="link">
                  Inicia sesión
                </Link>
              </div>

              <p className="legal">
                Al registrarte, aceptas nuestros Términos y Política.
              </p>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}
