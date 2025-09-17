// src/MisDatos.js
import React, { useEffect, useMemo, useState } from "react";
import "./Register.css";
import { useAuth } from "./AuthContext";
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  Timestamp,
  addDoc,
  collection,
} from "firebase/firestore";
import { sendPasswordResetEmail } from "firebase/auth";
import { auth, db } from "./firebase";

function Avatar({ name, email }) {
  const ch = useMemo(() => {
    const src = (name || email || "U").trim();
    return src.charAt(0).toUpperCase();
  }, [name, email]);
  return <div className="avatar big">{ch}</div>;
}

export default function MisDatos() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);

  // Perfil
  const [displayName, setDisplayName] = useState("");
  const [goalWeight, setGoalWeight] = useState("");
  const [createdAt, setCreatedAt] = useState(null);

  // Peso hoy
  const [weightToday, setWeightToday] = useState("");

  // Tema
  const [theme, setTheme] = useState(
    () => localStorage.getItem("fitlife:theme") || "dark"
  );

  // Cargar perfil
  useEffect(() => {
    if (!user) return;
    (async () => {
      setLoading(true);
      const uref = doc(db, "users", user.uid);
      const snap = await getDoc(uref);

      if (snap.exists()) {
        const d = snap.data() || {};
        setDisplayName(d.displayName || user.displayName || "");
        setGoalWeight(
          typeof d.goalWeight === "number" ? String(d.goalWeight) : ""
        );
        setCreatedAt(d.createdAt?.toDate?.() || null);
      } else {
        // crea doc mínimo
        await setDoc(uref, {
          displayName: user.displayName || "",
          createdAt: Timestamp.now(),
        });
        setDisplayName(user.displayName || "");
        setCreatedAt(new Date());
      }

      setLoading(false);
    })();
  }, [user]);

  // Aplicar tema
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("fitlife:theme", theme);
  }, [theme]);

  if (!user) {
    return (
      <div className="rtn-wrap">
        <div className="rtn-empty">
          <div className="rtn-empty-ico">🔒</div>
          <div className="rtn-empty-title">Inicia sesión</div>
          <div className="rtn-empty-sub">
            Debes iniciar sesión para ver tu perfil.
          </div>
        </div>
      </div>
    );
  }

  async function saveProfile(e) {
    e.preventDefault();
    try {
      const uref = doc(db, "users", user.uid);
      const payload = {
        displayName: displayName.trim(),
      };
      const gw = Number(goalWeight);
      if (!Number.isNaN(gw) && gw > 0) payload.goalWeight = gw;

      await updateDoc(uref, payload);
      alert("Perfil guardado ✅");
    } catch (err) {
      console.error(err);
      alert("No se pudo guardar el perfil");
    }
  }

  async function registerWeightToday() {
    try {
      const kg = Number(weightToday);
      if (Number.isNaN(kg) || kg <= 0) {
        alert("Ingresa un peso válido.");
        return;
      }
      await addDoc(collection(db, "users", user.uid, "weights"), {
        kg,
        at: Timestamp.now(),
      });
      setWeightToday("");
      alert("Peso guardado ✅");
    } catch (err) {
      console.error(err);
      alert("No se pudo guardar el peso");
    }
  }

  async function onResetPassword() {
    try {
      await sendPasswordResetEmail(auth, user.email);
      alert("Te enviamos un correo para restablecer tu contraseña.");
    } catch (err) {
      console.error(err);
      alert("No pudimos enviar el correo de reset.");
    }
  }

  return (
    <div className="profile-wrap">
      <header className="profile-head">
        <h1 className="profile-title">👤 Mis Datos</h1>

        <div className="profile-theme">
          <span>Tema:</span>
          <button
            className={`chip-btn ${theme === "dark" ? "is-active" : ""}`}
            onClick={() => setTheme("dark")}
          >
            🌙 Oscuro
          </button>
          <button
            className={`chip-btn ${theme === "light" ? "is-active" : ""}`}
            onClick={() => setTheme("light")}
          >
            ☀️ Claro
          </button>
        </div>
      </header>

      <section className="profile-grid">
        {/* Card principal */}
        <div className="profile-card form-deco">
          <div className="profile-row">
            <Avatar name={displayName} email={user.email} />
            <div>
              <div className="profile-name">
                {displayName || "Sin nombre"}
              </div>
              <div className="profile-email">{user.email}</div>
              {createdAt && (
                <div className="profile-meta">
                  Cuenta creada:{" "}
                  {createdAt.toLocaleDateString("es-MX", {
                    year: "numeric",
                    month: "2-digit",
                    day: "2-digit",
                  })}
                </div>
              )}
            </div>
          </div>

          <form className="profile-form" onSubmit={saveProfile}>
            <div className="rtn-row">
              <label>Nombre para mostrar</label>
              <input
                className="rtn-input"
                placeholder="Tu nombre"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
              />
            </div>

            <div className="rtn-row">
              <label>Meta de peso (kg)</label>
              <input
                className="rtn-input"
                type="number"
                step="0.1"
                placeholder="Ej. 72"
                value={goalWeight}
                onChange={(e) => setGoalWeight(e.target.value)}
              />
              <small className="profile-hint">
                Esta meta también se usa en el Dashboard para el logro 🎯
              </small>
            </div>

            <div className="rtn-actions">
              <button className="btn" type="submit" disabled={loading}>
                Guardar perfil
              </button>
              <button
                type="button"
                className="btn-secondary"
                onClick={onResetPassword}
              >
                Restablecer contraseña
              </button>
            </div>
          </form>
        </div>

        {/* Card de progreso rápido */}
        <div className="profile-card">
          <h2 className="card-title">Progreso rápido</h2>
          <div className="rtn-row">
            <label>Peso de hoy (kg)</label>
            <input
              className="rtn-input"
              type="number"
              step="0.1"
              placeholder="Ej. 80.2"
              value={weightToday}
              onChange={(e) => setWeightToday(e.target.value)}
            />
          </div>
          <div className="rtn-actions">
            <button className="btn" onClick={registerWeightToday}>
              Guardar peso de hoy
            </button>
          </div>

          <div className="divider" />
          <p className="profile-note">
            Tip: Actualizar tu peso seguido ayuda a ver mejor la tendencia en el
            Dashboard 📈
          </p>
        </div>
      </section>
    </div>
  );
}
