// src/pages/Rutinas.js
import React, { useEffect, useState } from "react";
import "../Register.css";
import { useAuth } from "../AuthContext";
import { toast } from "react-toastify";

// Servicios
import { recomendarRutinas } from "../services/recommenderService";
import { validarInputs } from "../recommender";
import { postProcessPlan } from "../services/planPostProcessor";
import {
  listenRoutines,
  createRoutineWithToast,
  updateRoutineWithToast,
  deleteRoutineWithToast,
} from "../services/routines";

// ---------- Utils texto <-> items ----------
function parseItemsFromText(text) {
  return (text || "")
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean)
    .map((name) => ({ name }));
}
function itemsToText(items = []) {
  return (items || []).map((it) => it?.name || "").join("\n");
}

// ---------- Cliente API ML (seguro para prod) ----------
const IS_BROWSER = typeof window !== "undefined";
const IS_LOCALHOST =
  IS_BROWSER &&
  (window.location.hostname === "localhost" ||
    window.location.hostname === "127.0.0.1");

// Permitimos que el usuario sobreescriba la URL desde localStorage
const LS_API =
  (IS_BROWSER && (localStorage.getItem("fitlife_api_url") || "").trim()) || "";

// Soportamos también la env clásica de CRA
const ENV_API =
  (typeof process !== "undefined" &&
    process.env &&
    process.env.REACT_APP_API_URL &&
    process.env.REACT_APP_API_URL.trim()) ||
  "";

// Elegimos la primera URL válida evitando contenido mixto en producción
function pickPredictUrl() {
  const candidates = [];

  if (LS_API) candidates.push(LS_API);
  if (ENV_API) candidates.push(ENV_API);

  // En localhost, si no se definió nada, usamos FastAPI local
  if (IS_LOCALHOST) {
    candidates.push("http://127.0.0.1:8000");
  }

  if (!candidates.length) return null;

  for (const base of candidates) {
    if (!base) continue;
    const clean = base.replace(/\/$/, "");

    // Si estamos en HTTPS (Vercel, etc.) solo aceptamos backends HTTPS
    if (
      IS_BROWSER &&
      window.location.protocol === "https:" &&
      !IS_LOCALHOST &&
      clean.startsWith("http://")
    ) {
      // esto provocaría Mixed Content → lo saltamos
      continue;
    }

    return `${clean}/predict`;
  }

  return null;
}

const PREDICT_URL = pickPredictUrl();

async function predictRoutineAPI(payload) {
  // Si no hay URL segura → ML desactivado, solo reglas
  if (!PREDICT_URL) {
    return null;
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 1500);

  try {
    const res = await fetch(PREDICT_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });
    if (!res.ok) {
      const msg = await res.text().catch(() => "");
      throw new Error(`API error ${res.status} ${msg}`);
    }
    return await res.json();
  } catch (err) {
    console.warn("Predict fallback:", err.message || err);
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

// ---------- Opciones ----------
const OBJETIVOS = {
  1: "bajar peso",
  2: "subir peso",
  3: "entrenamiento HIIT",
  4: "recomposición muscular",
};
const DIFICULTADES = { 1: "principiante", 2: "intermedio", 3: "avanzado" };
const LIMITACIONES = {
  1: "articulares",
  2: "muscular",
  3: "enfermedad",
  4: "ninguna",
};
const TIEMPOS = { 1: "30-45min", 2: "60-90min", 3: "120-180min" };
const FRECUENCIAS = { 1: "1-2 días", 2: "3-4 días", 3: "5-6 días" };

// ---------- Utils plan ----------
function planToItems(planSemanal = [], schemeOverride = null) {
  const items = [];
  for (const dia of planSemanal) {
    const foco = Array.isArray(dia?.foco) ? dia.foco : [];
    items.push({
      name: `Día ${dia?.dia ?? "?"}: ${foco.join(" + ")} · ${
        dia?.duracionEstimadaMin ?? "?"
      } min`,
    });
    const bloques = Array.isArray(dia?.bloques) ? dia.bloques : [];
    for (const b of bloques) {
      const grupo = (b?.grupo || "").toUpperCase();
      items.push({ name: `  • ${grupo}` });
      const ejercicios = Array.isArray(b?.ejercicios) ? b.ejercicios : [];
      ejercicios.forEach((ex, idx) => {
        const sch = schemeOverride || ex?.esquema || {};
        const series = sch.series ?? "?";
        const reps = sch.reps ?? "?";
        const descanso = sch.descanso ?? "?";
        items.push({
          name: `    ${idx + 1}. ${ex?.nombre || "Ejercicio"} — ${
            series
          } series · ${reps} · descanso ${descanso}`,
        });
      });
    }
    items.push({ name: "" });
  }
  if (items.length && items[items.length - 1].name === "") items.pop();
  return items;
}

// ---------- Página ----------
export default function Rutinas() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [routines, setRoutines] = useState([]);
  const [name, setName] = useState("");
  const [rawItems, setRawItems] = useState("");
  const [genLoading, setGenLoading] = useState(false);
  const [genInputs, setGenInputs] = useState({
    objetivo: 1,
    dificultad: 1,
    limitacion: 4,
    tiempo: 1,
    frecuencia: 2,
  });
  const [editing, setEditing] = useState(null);
  const [confirmDel, setConfirmDel] = useState(null);

  useEffect(() => {
    if (!user) {
      setRoutines([]);
      setLoading(false);
      return;
    }
    const unsub = listenRoutines(
      user.uid,
      (rows) => {
        setRoutines(rows);
        setLoading(false);
      },
      (err) => {
        console.error("[listenRoutines] error:", err);
        setLoading(false);
        toast.error("No se pudieron leer tus rutinas.");
      }
    );
    return () => unsub && unsub();
  }, [user]);

  // Crear manual
  async function onCreate(e) {
    e.preventDefault();
    if (!user) return;
    const cleanName = (name || "").trim();
    const items = parseItemsFromText(rawItems);
    if (!cleanName || items.length === 0) return;
    try {
      await createRoutineWithToast(user.uid, {
        name: cleanName,
        items,
        _meta: { minutos: 0, fuente: "manual" },
      });
      setName("");
      setRawItems("");
    } catch (err) {
      console.error(err);
    }
  }

  function buildPlanFromFocus(focusPlan = [], ranked = []) {
    return focusPlan.map((focoDia, i) => ({
      dia: i + 1,
      foco: Array.isArray(focoDia) ? focoDia : [],
      duracionEstimadaMin: ranked[i]?.minutos ?? 30,
      bloques: (Array.isArray(focoDia) ? focoDia : []).map((g) => ({
        grupo: g,
        ejercicios: [],
      })),
    }));
  }

  // Generar con IA (reglas + ML si está disponible)
  async function onGenerateAI(e) {
    e.preventDefault();
    if (!user) return toast.info("Inicia sesión para guardar tu rutina.");

    const norm = validarInputs(genInputs);
    setGenLoading(true);

    try {
      // 1) Algoritmo de reglas (recomendarRutinas)
      const ranked = await recomendarRutinas(norm);

      // 2) Intentar modelo ML solo si hay backend configurado
      const pred = await predictRoutineAPI(norm);

      // Si la API responde, usamos su focus_plan; si no, derivamos del ranking
      const focusPlan =
        pred?.focus_plan && Array.isArray(pred.focus_plan)
          ? pred.focus_plan
          : ranked.slice(0, 3).map((r) => [r.foco || "General"]);

      const plan = buildPlanFromFocus(focusPlan, ranked);

      const { plan: planPP, resumen } = postProcessPlan(plan, {
        perfil: {
          experiencia: norm.dificultad,
          imc: 22,
          limitacion: norm.limitacion,
        },
      });

      const items = planToItems(planPP, pred?.scheme);
      const totalMin = planPP.reduce(
        (a, d) => a + (Number(d?.duracionEstimadaMin) || 0),
        0
      );
      const genName = `Rutina ${OBJETIVOS[norm.objetivo]} · ${
        FRECUENCIAS[norm.frecuencia]
      } · ${TIEMPOS[norm.tiempo]}`;

      await createRoutineWithToast(user.uid, {
        name: genName,
        items,
        _meta: {
          minutos: totalMin,
          fuente: pred ? "ML+rules" : "rules-only",
          postProcess: resumen,
          ...norm,
        },
      });
    } catch (err) {
      console.error(err);
      toast.error("Error al generar la rutina.");
    } finally {
      setGenLoading(false);
    }
  }

  function openEdit(rt) {
    setEditing({
      id: rt.id,
      name: rt.name || "",
      itemsText: itemsToText(rt.items || []),
    });
  }

  async function onSaveEdit() {
    if (!user || !editing) return;
    try {
      await updateRoutineWithToast(user.uid, editing.id, {
        name: editing.name,
        items: parseItemsFromText(editing.itemsText),
      });
      setEditing(null);
    } catch (err) {
      console.error(err);
    }
  }

  async function onDuplicate(rt) {
    if (!user) return;
    try {
      await createRoutineWithToast(user.uid, {
        name: `${rt.name} (copia)`,
        items: rt.items || [],
        _meta: { ...(rt._meta || {}) },
      });
    } catch (err) {
      console.error(err);
    }
  }

  function onDelete(rt) {
    if (!user) return;
    setConfirmDel({ id: rt.id, name: rt.name || "Rutina" });
  }

  // ---------- Render ----------
  return (
    <div className="rtn-wrap">
      <header className="rtn-hero">
        <h1 className="rtn-title">Rutinas</h1>
        <p className="rtn-sub">
          Crea planes enfocados y organízalos por ejercicios.{" "}
          <span className="pill">Uno por línea</span>
        </p>
      </header>

      {/* Generador con IA */}
      <section className="rtn-section">
        <div className="rtn-card form-deco">
          <h2>Generar Rutina</h2>
          <form className="rtn-form" onSubmit={onGenerateAI}>
            <div className="rtn-grid-compact">
              {[
                ["Objetivo", "objetivo", OBJETIVOS],
                ["Dificultad", "dificultad", DIFICULTADES],
                ["Limitación", "limitacion", LIMITACIONES],
                ["Tiempo", "tiempo", TIEMPOS],
                ["Frecuencia", "frecuencia", FRECUENCIAS],
              ].map(([lbl, key, opts]) => (
                <Select
                  key={key}
                  label={lbl}
                  value={genInputs[key]}
                  onChange={(v) =>
                    setGenInputs((s) => ({ ...s, [key]: Number(v) }))
                  }
                  options={Object.entries(opts).map(([v, t]) => ({
                    value: v,
                    label: t,
                  }))}
                />
              ))}
            </div>
            <div className="rtn-actions">
              <button className="btn" type="submit" disabled={genLoading}>
                {genLoading ? "Generando..." : "Generar rutina"}
              </button>
            </div>
          </form>
        </div>
      </section>

      {/* Crear manual */}
      <section className="rtn-section">
        <div className="rtn-card form-deco">
          <h2>Crear rutina (manual)</h2>
          <form className="rtn-form" onSubmit={onCreate}>
            <label className="rtn-row">
              Nombre
              <input
                className="rtn-input"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </label>
            <label className="rtn-row">
              Ejercicios (uno por línea)
              <textarea
                className="rtn-textarea"
                rows={5}
                value={rawItems}
                onChange={(e) => setRawItems(e.target.value)}
              />
            </label>
            <div className="rtn-actions">
              <button className="btn" disabled={!name || !rawItems}>
                + Guardar rutina
              </button>
            </div>
          </form>
        </div>
      </section>

      {/* Lista */}
      <section className="rtn-section">
        <h2>Tus rutinas</h2>
        <div className="rtn-sec-note">{routines.length} en total</div>
        {loading ? (
          <div className="rtn-grid">
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="rtn-card skeleton"
                style={{ height: 160 }}
              />
            ))}
          </div>
        ) : routines.length === 0 ? (
          <div className="rtn-empty">
            <div className="rtn-empty-ico">🗂️</div>
            <div className="rtn-empty-title">Aún no tienes rutinas</div>
            <div className="rtn-empty-sub">
              Crea una arriba para empezar a planificar tus sesiones.
            </div>
          </div>
        ) : (
          <div className="rtn-grid">
            {routines.map((rt) => (
              <article key={rt.id} className="rtn-card">
                <div className="rtn-card-head">
                  <h3>{rt.name}</h3>
                  <span className="pill">
                    {(rt.items || []).length} ejercicios
                  </span>
                </div>
                <ul className="rtn-items">
                  {(rt.items || [])
                    .slice(0, 5)
                    .map((it, idx) => (
                      <li key={idx}>
                        <span className="rtn-bullet">•</span>
                        {it.name}
                      </li>
                    ))}
                  {(rt.items || []).length > 5 && (
                    <li className="rtn-more">
                      … y {(rt.items || []).length - 5} más
                    </li>
                  )}
                </ul>
                <div className="rtn-card-actions">
                  <button
                    className="btn-secondary"
                    onClick={() => openEdit(rt)}
                  >
                    ✏️ Editar
                  </button>
                  <button
                    className="btn-secondary"
                    onClick={() => onDuplicate(rt)}
                  >
                    🧬 Duplicar
                  </button>
                  <button
                    className="btn-danger"
                    onClick={() => onDelete(rt)}
                  >
                    🗑️ Eliminar
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      {/* Modal editar */}
      {editing && (
        <div className="modal-backdrop" onClick={() => setEditing(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-title">Editar rutina</div>
            <div className="modal-body">
              <label>Nombre</label>
              <input
                className="rtn-input"
                value={editing.name}
                onChange={(e) =>
                  setEditing((s) => ({ ...s, name: e.target.value }))
                }
              />
              <label>Ejercicios (uno por línea)</label>
              <textarea
                className="rtn-textarea"
                rows={6}
                value={editing.itemsText}
                onChange={(e) =>
                  setEditing((s) => ({ ...s, itemsText: e.target.value }))
                }
              />
            </div>
            <div className="modal-actions">
              <button
                className="btn-secondary"
                onClick={() => setEditing(null)}
              >
                Cancelar
              </button>
              <button className="btn" onClick={onSaveEdit}>
                Guardar cambios
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal eliminar */}
      {confirmDel && (
        <div className="modal-backdrop" onClick={() => setConfirmDel(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-title">Eliminar rutina</div>
            <div className="modal-body">
              <p>
                ¿Seguro que deseas eliminar{" "}
                <strong>{confirmDel.name}</strong>?
              </p>
              <p style={{ opacity: 0.8, marginTop: 6 }}>
                Esta acción no se puede deshacer.
              </p>
            </div>
            <div className="modal-actions">
              <button
                className="btn-secondary"
                onClick={() => setConfirmDel(null)}
              >
                Cancelar
              </button>
              <button
                className="btn-danger"
                onClick={async () => {
                  try {
                    await deleteRoutineWithToast(
                      user.uid,
                      confirmDel.id,
                      confirmDel.name
                    );
                  } finally {
                    setConfirmDel(null);
                  }
                }}
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ---------- Select ----------
function Select({ label, value, onChange, options }) {
  return (
    <label className="rtn-row" style={{ minWidth: 220 }}>
      <span>{label}</span>
      <select
        className="rtn-input"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        {options.map((op) => (
          <option key={op.value} value={op.value}>
            {op.label}
          </option>
        ))}
      </select>
    </label>
  );
}
