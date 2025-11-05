// src/AuthContext.js
import React, { createContext, useContext, useEffect, useState } from "react";
import {
  getAuth,
  onAuthStateChanged,
  setPersistence,
  browserLocalPersistence,
  signOut,
} from "firebase/auth";
import { app } from "./firebase"; // tu init de firebase (getApps/initializeApp)

const AuthCtx = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(undefined); // undefined=loading, null=sin sesión
  const auth = getAuth(app);

  useEffect(() => {
    let unsub = () => {};
    (async () => {
      // Persistencia local (no impide signOut, sólo recuerda la sesión)
      await setPersistence(auth, browserLocalPersistence);

      unsub = onAuthStateChanged(auth, (u) => {
        setUser(u ?? null);
      });
    })();

    return () => unsub && unsub();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const logout = async () => {
    try {
      await signOut(auth);
      // Limpieza opcional de caches locales tuyas
      sessionStorage.removeItem("fitlife:tmp");
      localStorage.removeItem("fitlife:tmp");

      // Forzar refresco de la app para evitar estados “fantasma”
      window.location.replace("/login"); // o "/" si no tienes /login
    } catch (e) {
      console.error("logout error", e);
      alert("No se pudo cerrar sesión. Revisa consola.");
    }
  };

  const value = { user, loading: user === undefined, logout };
  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>;
}

export const useAuth = () => useContext(AuthCtx);
