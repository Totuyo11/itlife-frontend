import React, { useState } from 'react';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, updateProfile, getAuth } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
import './Register.css';

function Auth() {
  const [modo, setModo] = useState('login'); // 'login' o 'register'
  const [nombre, setNombre] = useState('');
  const [correo, setCorreo] = useState('');
  const [contraseña, setContraseña] = useState('');
  const [confirmar, setConfirmar] = useState('');
  const [mensaje, setMensaje] = useState('');

  const navigate = useNavigate();
  const auth = getAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (modo === 'register' && contraseña !== confirmar) {
      setMensaje('❌ Las contraseñas no coinciden');
      return;
    }

    try {
      if (modo === 'login') {
        await signInWithEmailAndPassword(auth, correo, contraseña);
        setMensaje('✅ Bienvenido!');
      } else {
        const userCredential = await createUserWithEmailAndPassword(auth, correo, contraseña);
        await updateProfile(userCredential.user, { displayName: nombre });
        setMensaje('✅ Registro exitoso!');
      }

      setTimeout(() => {
        navigate('/dashboard');
      }, 1500);
    } catch (err) {
      setMensaje('❌ ' + err.message);
    }
  };

  return (
    <div className="registro-container">
      <div className="form-box">
        <h2 className="titulo-login">{modo === 'login' ? 'Iniciar Sesión' : 'Crear Cuenta'}</h2>
        <form onSubmit={handleSubmit} className="registro-form">
          {modo === 'register' && (
            <input
              type="text"
              placeholder="Nombre completo"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              required
            />
          )}
          <input
            type="email"
            placeholder="Correo electrónico"
            value={correo}
            onChange={(e) => setCorreo(e.target.value)}
            required
          />
          <input
            type="password"
            placeholder="Contraseña"
            value={contraseña}
            onChange={(e) => setContraseña(e.target.value)}
            required
          />
          {modo === 'register' && (
            <input
              type="password"
              placeholder="Confirmar contraseña"
              value={confirmar}
              onChange={(e) => setConfirmar(e.target.value)}
              required
            />
          )}
          <button type="submit">{modo === 'login' ? 'Entrar' : 'Registrarme'}</button>
          {mensaje && <p className="mensaje">{mensaje}</p>}
        </form>

        <p className="switch-auth">
          {modo === 'login'
            ? "¿No tienes cuenta? "
            : "¿Ya tienes cuenta? "}
          <button className="linkcito" onClick={() => setModo(modo === 'login' ? 'register' : 'login')}>
            {modo === 'login' ? 'Regístrate aquí' : 'Inicia sesión'}
          </button>
        </p>
      </div>
    </div>
  );
}

export default Auth;

