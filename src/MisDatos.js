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
  getDocs,
  query,
  orderBy,
  limit,
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

// --- helpers IMC ---
function calcBMI(kg, m) {
  if (!kg || !m || m <= 0) return null;
  return +(kg / (m * m)).toFixed(1);
}
function bmiCategory(bmi) {
  if (bmi == null) return { label: "—", cls: "" };
  if (bmi < 18.5) return { label: "Bajo peso", cls: "bmi-low" };
  if (bmi < 25) return { label: "Saludable", cls: "bmi-ok" };
  if (bmi < 30) return { label: "Sobrepeso", cls: "bmi-mid" };
  return { label: "Obesidad", cls: "bmi-high" };
}

export default function MisDatos() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);

  // Perfil
  const [displayName, setDisplayName] = useState("");
  const [goalWeight, setGoalWeight] = useState("");
  const [heightM, setHeightM] = useState(""); // altura en metros (ej. 1.75)
  const [createdAt, setCreatedAt] = useState(null);

  // Pesos
  const [lastWeight, setLastWeight] = useState(null); // último peso guardado
  const [weightToday, setWeightToday] = useState(""); // entrada de hoy (preview IMC)

  // Tema
  const [theme, setTheme] = useState(
    () => localStorage.getItem("fitlife:theme") || "dark"
  );

  // Cargar perfil + último peso
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
        setHeightM(typeof d.heightM === "number" ? String(d.heightM) : "");
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

      // último peso (si hay)
      const qW = query(
        collection(db, "users", user.uid, "weights"),
        orderBy("at", "desc"),
        limit(1)
      );
      const wsnap = await getDocs(qW);
      if (!wsnap.empty) {
        const d = wsnap.docs[0].data();
        if (typeof d.kg === "number") setLastWeight(d.kg);
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

      const hm = Number(heightM);
      if (!Number.isNaN(hm) && hm > 0 && hm < 3) payload.heightM = hm; // 0–3 m por seguridad

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
      setLastWeight(kg); // actualiza base para IMC
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

  // ---- IMC (usa weightToday si hay, si no lastWeight) ----
  const currentWeight = weightToday ? Number(weightToday) : lastWeight;
  const bmi = calcBMI(currentWeight, Number(heightM));
  const bmiInfo = bmiCategory(bmi);

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

            <div className="rtn-row">
              <label>Altura (m)</label>
              <input
                className="rtn-input"
                type="number"
                step="0.01"
                min="0.3"
                max="3"
                placeholder="Ej. 1.75"
                value={heightM}
                onChange={(e) => setHeightM(e.target.value)}
              />
              <small className="profile-hint">
                Ejemplos: 1.60, 1.75. Usamos altura para calcular tu IMC.
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

        {/* Card de progreso rápido + IMC */}
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

          {/* IMC */}
          <div className="divider" />
          <div className="bmi-card">
            <div className="bmi-top">
              <span className="bmi-title">IMC</span>
              <span className={`bmi-chip ${bmiInfo.cls}`}>{bmiInfo.label}</span>
            </div>
            <div className="bmi-number">{bmi ?? "—"}</div>
            <div className="bmi-foot">
              {heightM
                ? currentWeight
                  ? `Cálculo con ${currentWeight} kg y ${heightM} m`
                  : `Ingresa tu peso para calcular con ${heightM} m`
                : "Ingresa tu altura para calcular IMC"}
            </div>

            <ul className="bmi-scale">
              <li><span className="dot low" /> &lt; 18.5 Bajo peso</li>
              <li><span className="dot ok" /> 18.5–24.9 Saludable</li>
              <li><span className="dot mid" /> 25–29.9 Sobrepeso</li>
              <li><span className="dot high" /> ≥ 30 Obesidad</li>
            </ul>
          </div>
        </div>
      </section>
    </div>
  );
}
