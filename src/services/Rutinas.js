// src/pages/Rutinas.js
import React, { useEffect, useState } from "react";
import "../Register.css";
import { useAuth } from "../AuthContext";

// Servicios
import { recomendarRutinas } from "../services/recommenderService";
import { validarInputs } from "../recommender";
import { postProcessPlan } from "../services/planPostProcessor";

import {
  listenRoutines,
  createRoutine,
  updateRoutine,
  deleteRoutine,
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

// ---------- Cliente API ML ----------
const LS_API = (localStorage.getItem("fitlife_api_url") || "").trim();
const API =
  LS_API ||
  process.env.REACT_APP_API_URL ||
  `http://${window.location.hostname}:8000`;

async function predictRoutineAPI(payload) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 1500); // timeout ML 1.5s

  try {
    const res = await fetch(`${API}/predict`, {
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
    console.warn("Predict fallback:", err.message);
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

// ---------- Utils para plan ----------
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
          name: `    ${idx + 1}. ${ex?.nombre || "Ejercicio"} — ${series} series · ${reps} · descanso ${descanso}`,
        });
      });
    }
    items.push({ name: "" });
  }
  if (items.length && items[items.length - 1].name === "") items.pop();
  return items;
}

// ---------- Página principal ----------
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
        alert("No se pudieron leer tus rutinas (revisa reglas/permiso).");
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
      const id = await createRoutine(user.uid, { name: cleanName, items });
      console.log("[createRoutine manual] id:", id);
      setName("");
      setRawItems("");
    } catch (err) {
      console.error(err);
      alert("No se pudo crear la rutina");
    }
  }

  function buildPlanFromFocus(focusPlan = [], ranked = []) {
    const plan = [];
    for (let i = 0; i < focusPlan.length; i++) {
      const focoDia = Array.isArray(focusPlan[i]) ? focusPlan[i] : [];
      const minutos = ranked[i]?.minutos ?? 30;
      const bloques = focoDia.map((g) => ({ grupo: g, ejercicios: [] }));
      plan.push({
        dia: i + 1,
        foco: focoDia,
        duracionEstimadaMin: minutos,
        bloques,
      });
    }
    return plan;
  }

  // Generar con IA + reglas
  async function onGenerateAI(e) {
    e.preventDefault();
    if (!user) return alert("Inicia sesión para guardar tu rutina.");

    const norm = validarInputs(genInputs);
    setGenLoading(true);
    try {
      const ranked = await recomendarRutinas(norm);
      let focusPlan = null;
      let scheme = null;
      let modelVer = "NA";

      const pred = await predictRoutineAPI(norm);
      if (pred) {
        focusPlan = Array.isArray(pred?.focus_plan) ? pred.focus_plan : null;
        scheme = pred?.scheme || null;
        modelVer = pred?.metadata?.model_version || "NA";
      }

      if (!focusPlan) {
        const top = ranked.slice(0, 3).map((r) => [r.foco || "General"]);
        focusPlan = top.length ? top : [["General"], ["General"], ["General"]];
      }

      let plan = buildPlanFromFocus(focusPlan, ranked);

      // ⚙️ Post-procesamiento avanzado
      const { plan: planPP, resumen } = postProcessPlan(plan, {
        perfil: {
          experiencia: norm.dificultad,
          imc: 22, // si ya lo tienes en Firestore puedes reemplazarlo
          limitacion: norm.limitacion,
        },
      });

      const items = planToItems(planPP, scheme);
      if (items.length === 0) throw new Error("Plan vacío");

      const genName = `Rutina ${OBJETIVOS[norm.objetivo]} · ${FRECUENCIAS[norm.frecuencia]} · ${TIEMPOS[norm.tiempo]}`;
      const newId = await createRoutine(user.uid, {
        name: genName,
        items,
        _meta: {
          fuente: scheme ? "ML+rules" : "rules-only",
          modelVersion: modelVer,
          postProcess: resumen,
          ...norm,
        },
      });
      console.log("[createRoutine ML] id:", newId);
      alert("Rutina generada ✅");
    } catch (err) {
      console.error(err);
      alert("Error al recomendar/generar rutina. Revisa consola.");
    } finally {
      setGenLoading(false);
    }
  }

  // Editar / duplicar / eliminar
  function openEdit(rt) {
    setEditing({
      id: rt.id,
      name: rt.name || "",
      itemsText: itemsToText(rt.items || []),
    });
  }
  async function onSaveEdit() {
    if (!user || !editing) return;
    const payload = {
      name: (editing.name || "").trim() || "Rutina",
      items: parseItemsFromText(editing.itemsText || ""),
    };
    try {
      await updateRoutine(user.uid, editing.id, payload);
      setEditing(null);
    } catch (err) {
      console.error(err);
      alert("No se pudo guardar cambios");
    }
  }
  async function onDuplicate(rt) {
    if (!user) return;
    try {
      await createRoutine(user.uid, {
        name: `${rt.name} (copia)`,
        items: rt.items || [],
      });
    } catch (err) {
      console.error(err);
      alert("No se pudo duplicar");
    }
  }
  async function onDelete(rt) {
    if (!user) return;
    if (!window.confirm(`¿Eliminar la rutina "${rt.name}"?`)) return;
    try {
      await deleteRoutine(user.uid, rt.id);
    } catch (err) {
      console.error(err);
      alert("No se pudo eliminar");
    }
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
          <div className="rtn-head">
            <h2>Generar Rutina</h2>
          </div>
          <form className="rtn-form" onSubmit={onGenerateAI}>
            <div className="rtn-grid-compact">
              <Select
                label="Objetivo"
                value={genInputs.objetivo}
                onChange={(v) =>
                  setGenInputs((s) => ({ ...s, objetivo: Number(v) }))
                }
                options={Object.entries(OBJETIVOS).map(([v, t]) => ({
                  value: v,
                  label: t,
                }))}
              />
              <Select
                label="Dificultad"
                value={genInputs.dificultad}
                onChange={(v) =>
                  setGenInputs((s) => ({ ...s, dificultad: Number(v) }))
                }
                options={Object.entries(DIFICULTADES).map(([v, t]) => ({
                  value: v,
                  label: t,
                }))}
              />
              <Select
                label="Limitación"
                value={genInputs.limitacion}
                onChange={(v) =>
                  setGenInputs((s) => ({ ...s, limitacion: Number(v) }))
                }
                options={Object.entries(LIMITACIONES).map(([v, t]) => ({
                  value: v,
                  label: t,
                }))}
              />
              <Select
                label="Tiempo"
                value={genInputs.tiempo}
                onChange={(v) =>
                  setGenInputs((s) => ({ ...s, tiempo: Number(v) }))
                }
                options={Object.entries(TIEMPOS).map(([v, t]) => ({
                  value: v,
                  label: t,
                }))}
              />
              <Select
                label="Frecuencia"
                value={genInputs.frecuencia}
                onChange={(v) =>
                  setGenInputs((s) => ({ ...s, frecuencia: Number(v) }))
                }
                options={Object.entries(FRECUENCIAS).map(([v, t]) => ({
                  value: v,
                  label: t,
                }))}
              />
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
          <div className="rtn-head">
            <h2>Crear rutina (manual)</h2>
          </div>
          <form className="rtn-form" onSubmit={onCreate}>
            <div className="rtn-row">
              <label>Nombre</label>
              <input
                className="rtn-input"
                placeholder="Ej. Full Body 45min"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div className="rtn-row">
              <label>Ejercicios (uno por línea)</label>
              <textarea
                className="rtn-textarea"
                rows={5}
                placeholder={`Sentadilla\nPress banca\nRemo con barra`}
                value={rawItems}
                onChange={(e) => setRawItems(e.target.value)}
              />
            </div>
            <div className="rtn-actions">
              <button className="btn" type="submit" disabled={!name || !rawItems}>
                + Guardar rutina
              </button>
            </div>
          </form>
        </div>
      </section>

      {/* Lista de rutinas */}
      <section className="rtn-section">
        <div className="rtn-head">
          <h2>Tus rutinas</h2>
          <div className="rtn-sec-note">{routines.length} en total</div>
        </div>

        {loading ? (
          <div className="rtn-grid">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="rtn-card skeleton" style={{ height: 160 }} />
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
                  <h3 className="rtn-card-title">{rt.name}</h3>
                  <div className="rtn-badges">
                    <span className="pill">
                      {(rt.items || []).length} ejercicios
                    </span>
                  </div>
                </div>
                <ul className="rtn-items">
                  {(rt.items || [])
                    .slice(0, 5)
                    .map((it, idx) => (
                      <li key={idx} className="rtn-item">
                        <span className="rtn-bullet">•</span>
                        <span>{it.name}</span>
                      </li>
                    ))}
                  {(rt.items || []).length > 5 && (
                    <li className="rtn-more">
                      … y {(rt.items || []).length - 5} más
                    </li>
                  )}
                </ul>
                <div className="rtn-card-actions">
                  <button className="btn-secondary" onClick={() => openEdit(rt)}>
                    ✏️ Editar
                  </button>
                  <button className="btn-secondary" onClick={() => onDuplicate(rt)}>
                    🧬 Duplicar
                  </button>
                  <button className="btn-danger" onClick={() => onDelete(rt)}>
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
              <button className="btn-secondary" onClick={() => setEditing(null)}>
                Cancelar
              </button>
              <button className="btn" onClick={onSaveEdit}>
                Guardar cambios
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ---------- Select pequeño ----------
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
