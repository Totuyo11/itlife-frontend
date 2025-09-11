import React, { useState } from 'react';
import { getAuth, sendPasswordResetEmail } from 'firebase/auth';
import { Link } from 'react-router-dom';
import './Register.css';

export default function ResetPassword() {
  const [correo, setCorreo] = useState('');
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setMsg(''); setErr('');
    setLoading(true);
    const auth = getAuth();
    try {
      await sendPasswordResetEmail(auth, correo.trim());
      setMsg('📧 Te enviamos un correo para restablecer tu contraseña.');
    } catch (error) {
      setErr('No pudimos enviar el correo. Verifica el email.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="registro-container">
      <div className="form-box" aria-busy={loading}>
        <h2 className="titulo-login">Recuperar contraseña</h2>
        <form onSubmit={handleSubmit} className="registro-form">
          <label className="sr-only" htmlFor="email">Correo</label>
          <input
            id="email" type="email" placeholder="Tu correo"
            value={correo} onChange={(e) => setCorreo(e.target.value)} required disabled={loading}
          />
          <button type="submit" className={loading ? 'btn loading' : 'btn'} disabled={loading}>
            {loading ? 'Enviando…' : 'Enviar enlace'}
          </button>

          {msg && <p className="mensaje ok">{msg}</p>}
          {err && <p className="mensaje error">{err}</p>}

          <div className="extras">
            <Link to="/login" className="link">Volver a iniciar sesión</Link>
          </div>
        </form>
      </div>
    </div>
  );
}
