// src/Navbar.js
import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "./AuthContext";

export default function Navbar() {
  const { user, logout } = useAuth();
  const nav = useNavigate();
  const isAdmin = user?.uid === process.env.REACT_APP_ADMIN_UID;

  const S = {
    bar: {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      padding: "10px 16px",
      background: "#0f172a",
      borderBottom: "1px solid #1f2937",
      position: "sticky",
      top: 0,
      zIndex: 20,
    },
    left: { display: "flex", gap: 10, alignItems: "center" },
    right: { display: "flex", gap: 10, alignItems: "center" },
    brand: { color: "#ef4444", fontWeight: 800, textDecoration: "none" },
    link: {
      color: "#e5e7eb",
      textDecoration: "none",
      padding: "6px 10px",
      borderRadius: 8,
      border: "1px solid transparent",
    },
    linkHover: { borderColor: "#1f2937", background: "#111827" },
    btn: {
      background: "#ef4444",
      color: "#fff",
      border: 0,
      borderRadius: 8,
      padding: "6px 10px",
      cursor: "pointer",
      fontWeight: 700,
    },
    user: { color: "#9ca3af", fontSize: 12 },
  };

  async function onLogout() {
    try {
      await logout();
      nav("/login");
    } catch (e) {
      console.error(e);
    }
  }

  // helper para hover sin librerías
  const hx = (style) => ({
    ...S.link,
    ...style,
    onMouseEnter: (e) => (e.currentTarget.style.background = "#111827"),
    onMouseLeave: (e) => (e.currentTarget.style.background = "transparent"),
  });

  return (
    <header style={S.bar}>
      <div style={S.left}>
        <Link to="/" style={S.brand}>FitLife</Link>
        <Link to="/" style={hx()}>Inicio</Link>
        <Link to="/generar" style={hx()}>Generar</Link>
        <Link to="/dashboard" style={hx()}>Dashboard</Link>
        <Link to="/rutinas" style={hx()}>Rutinas</Link>
        <Link to="/ejercicios" style={hx()}>Ejercicios</Link>
        {isAdmin && <Link to="/admin-ejercicios" style={hx({ color: "#22c55e" })}>Admin</Link>}
      </div>

      <div style={S.right}>
        {user ? (
          <>
            <span style={S.user}>{user.email}</span>
            <button style={S.btn} onClick={onLogout}>Salir</button>
          </>
        ) : (
          <>
            <Link to="/login" style={hx()}>Login</Link>
            <Link to="/register" style={hx()}>Register</Link>
          </>
        )}
      </div>
    </header>
  );
}
