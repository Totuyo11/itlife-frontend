// src/ResetPassword.jsx
import React, { useEffect, useState } from "react";
import "./Register.css";
import {
  sendPasswordResetEmail,
  verifyPasswordResetCode,
  confirmPasswordReset,
} from "firebase/auth";
import { auth } from "./firebase";
import { Link, useNavigate, useSearchParams } from "react-router-dom";

function RequestResetView() {
  const [email, setEmail] = useState("");
  const [ok, setOk] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setOk(""); setErr("");
    try {
      setLoading(true);
      if (!email.trim()) throw new Error("Escribe tu correo.");
      await sendPasswordResetEmail(auth, email.trim());
      setOk("Te enviamos un correo con el enlace para restablecer tu contraseña.");
      setEmail("");
    } catch (e) {
      console.error(e);
      setErr(e.message || "No se pudo enviar el correo. Intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="registro-container">
      <div className="form-box">
        <h2 className="titulo-login">Recuperar contraseña</h2>
        <p className="mensaje">Escribe tu correo y te enviaremos un enlace de restablecimiento.</p>

        <form onSubmit={handleSubmit} className="form">
          <input
            className="input"
            type="email"
            placeholder="tu@correo.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <button className={`btn ${loading ? "loading" : ""}`} disabled={loading}>
            {loading ? "Enviando…" : "Enviar enlace"}
          </button>
        </form>

        {ok && <p className="mensaje ok">{ok}</p>}
        {err && <p className="mensaje error">{err}</p>}

        <div className="form-foot">
          <Link to="/login" className="link">Volver a iniciar sesión</Link>
        </div>
      </div>
    </div>
  );
}

function ConfirmResetView({ oobCode }) {
  const nav = useNavigate();
  const [checking, setChecking] = useState(true);
  const [email, setEmail] = useState("");
  const [pass1, setPass1] = useState("");
  const [pass2, setPass2] = useState("");
  const [ok, setOk] = useState("");
  const [err, setErr] = useState("");

  useEffect(() => {
    (async () => {
      try {
        setChecking(true);
        const mail = await verifyPasswordResetCode(auth, oobCode);
        setEmail(mail);
      } catch (e) {
        console.error(e);
        setErr("El enlace es inválido o ha expirado. Solicita uno nuevo.");
      } finally {
        setChecking(false);
      }
    })();
  }, [oobCode]);

  async function handleConfirm(e) {
    e.preventDefault();
    setOk(""); setErr("");
    try {
      if (pass1.length < 6) throw new Error("La contraseña debe tener al menos 6 caracteres.");
      if (pass1 !== pass2) throw new Error("Las contraseñas no coinciden.");
      await confirmPasswordReset(auth, oobCode, pass1);
      setOk("¡Listo! Tu contraseña fue actualizada.");
      setTimeout(() => nav("/login"), 1200);
    } catch (e) {
      console.error(e);
      setErr(e.message || "No se pudo actualizar la contraseña.");
    }
  }

  if (checking) {
    return (
      <div className="registro-container">
        <div className="form-box" aria-busy="true">
          <h2 className="titulo-login">Verificando enlace…</h2>
        </div>
      </div>
    );
  }

  return (
    <div className="registro-container">
      <div className="form-box">
        <h2 className="titulo-login">Establece una nueva contraseña</h2>
        {email && <p className="mensaje">Cuenta: <strong>{email}</strong></p>}

        <form onSubmit={handleConfirm} className="form">
          <input
            className="input"
            type="password"
            placeholder="Nueva contraseña"
            value={pass1}
            onChange={(e) => setPass1(e.target.value)}
          />
          <input
            className="input"
            type="password"
            placeholder="Confirmar nueva contraseña"
            value={pass2}
            onChange={(e) => setPass2(e.target.value)}
          />
          <button className="btn">Guardar contraseña</button>
        </form>

        {ok && <p className="mensaje ok">{ok}</p>}
        {err && <p className="mensaje error">{err}</p>}

        <div className="form-foot">
          <Link to="/login" className="link">Ir al login</Link>
        </div>
      </div>
    </div>
  );
}

export default function ResetPassword() {
  const [params] = useSearchParams();
  const mode = params.get("mode");
  const oobCode = params.get("oobCode");

  // Si el usuario viene desde el correo de Firebase:
  if (mode === "resetPassword" && oobCode) {
    return <ConfirmResetView oobCode={oobCode} />;
  }

  // Vista por defecto: solicitar el correo
  return <RequestResetView />;
}
