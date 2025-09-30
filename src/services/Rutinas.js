// src/pages/Rutinas.js
import React, { useEffect, useState } from "react";
import "../Register.css";
import { useAuth } from "../AuthContext";
import { validarInputs, generarRutina } from "../recommender";
import {
  listenRoutines,
  createRoutine,
  updateRoutine,
  deleteRoutine,
} from "../services/routines"; // ✅ ruta correcta

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
// Permite override desde localStorage y usa el hostname actual como fallback.
const LS_API = (localStorage.getItem("fitlife_api_url") || "").trim();
const API =
  LS_API ||
  process.env.REACT_APP_API_URL ||
  `http://${window.location.hostname}:8000`;

async function predictRoutineAPI(payload) {
  const res = await fetch(`${API}/predict`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const msg = await res.text().catch(() => "");
    throw new Error(`API error ${res.status} ${msg}`);
  }
  return res.json(); // { focus_plan, scheme, metadata }
}

// ---------- Opciones de selects ----------
const OBJETIVOS = {
  1: "bajar peso",
  2: "subir peso",
  3: "entrenamiento HIIT",
  4: "recomposición muscular",
};
const DIFICULTADES = { 1: "principiante", 2: "intermedio", 3: "avanzado" };
const LIMITACIONES = { 1: "articulares", 2: "muscular", 3: "enfermedad", 4: "ninguna" };
const TIEMPOS = { 1: "30-45min", 2: "60-90min", 3: "120-180min" };
const FRECUENCIAS = { 1: "1-2 días", 2: "3-4 días", 3: "5-6 días" };

// Convierte plan semanal a items para tu CRUD
function planToItems(planSemanal = [], schemeOverride = null) {
  const items = [];
  for (const dia of planSemanal) {
    const foco = Array.isArray(dia?.foco) ? dia.foco : [];
    items.push({
      name: `Día ${dia?.dia ?? "?"}: ${foco.join(" + ")} · ${dia?.duracionEstimadaMin ?? "?"} min`,
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

export default function Rutinas() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [routines, setRoutines] = useState([]);

  // Crear (manual)
  const [name, setName] = useState("");
  const [rawItems, setRawItems] = useState("");

  // Generador IA
  const [genLoading, setGenLoading] = useState(false);
  const [genInputs, setGenInputs] = useState({
    objetivo: 1,
    dificultad: 1,
    limitacion: 4,
    tiempo: 1,
    frecuencia: 2,
  });

  // Edit modal
  const [editing, setEditing] = useState(null);

  useEffect(() => {
    if (!user) {
      setRoutines([]);
      setLoading(false);
      return;
    }
    const unsub = listenRoutines(user.uid, (rows) => {
      setRoutines(rows);
      setLoading(false);
    });
    return () => unsub && unsub();
  }, [user]);

  // ---------- Crear manual ----------
  async function onCreate(e) {
    e.preventDefault();
    if (!user) return;
    const cleanName = (name || "").trim();
    const items = parseItemsFromText(rawItems);
    if (!cleanName || items.length === 0) return;
    try {
      await createRoutine(user.uid, { name: cleanName, items });
      setName("");
      setRawItems("");
    } catch (err) {
      console.error(err);
      alert("No se pudo crear la rutina");
    }
  }

  // ---------- Generar con IA ----------
  async function onGenerateAI(e) {
    e.preventDefault();
    if (!user) {
      alert("Inicia sesión para guardar tu rutina.");
      return;
    }
    const errs = validarInputs(genInputs);
    if (errs.length) {
      alert(`Datos inválidos: ${errs.join(" · ")}`);
      return;
    }

    setGenLoading(true);
    try {
      const pred = await predictRoutineAPI(genInputs);

      const base = generarRutina({ ...genInputs, userId: user.uid }) || {};
      const planBase = Array.isArray(base.planSemanal) ? base.planSemanal : [];

      const focoModeloTotal = Array.isArray(pred?.focus_plan) ? pred.focus_plan : [];
      const planAjustado = planBase.map((dia, i) => {
        const focoModelo = Array.isArray(focoModeloTotal[i]) ? focoModeloTotal[i] : (dia?.foco || []);
        const bloques = Array.isArray(dia?.bloques) ? dia.bloques : [];

        const bloquesAjustados = bloques.map((b) => {
          const aplicarEsquema = Array.isArray(focoModelo) ? focoModelo.includes(b?.grupo) : false;
          const ejercicios = Array.isArray(b?.ejercicios) ? b.ejercicios : [];
          return {
            ...b,
            ejercicios: ejercicios.map((ex) => ({
              ...ex,
              esquema: aplicarEsquema ? (pred?.scheme || ex?.esquema) : ex?.esquema,
            })),
          };
        });

        return { ...dia, foco: focoModelo, bloques: bloquesAjustados };
      });

      const items = planToItems(planAjustado);
      if (items.length === 0) throw new Error("No se pudo construir el plan (items vacíos).");

      const genName = `Rutina ${OBJETIVOS[genInputs.objetivo]} · ${FRECUENCIAS[genInputs.frecuencia]} · ${TIEMPOS[genInputs.tiempo]}`;
      await createRoutine(user.uid, {
        name: genName,
        items,
        _meta: {
          fuente: "ML+rules",
          modelVersion: pred?.metadata?.model_version || "NA",
          ...genInputs,
        },
      });

      alert("Rutina generada (expandida con ejercicios) ✅");
    } catch (err) {
      console.error(err);
      alert(`No se pudo generar con la IA. ¿Está corriendo la API en ${API}?`);
    } finally {
      setGenLoading(false);
    }
  }

  // ---------- Editar / duplicar / eliminar ----------
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
      await createRoutine(user.uid, { name: `${rt.name} (copia)`, items: rt.items || [] });
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
        <h1 className="rtn-title">🧠 Rutinas</h1>
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
              <Select label="Objetivo" value={genInputs.objetivo} onChange={(v) => setGenInputs((s) => ({ ...s, objetivo: Number(v) }))} options={Object.entries(OBJETIVOS).map(([v, t]) => ({ value: v, label: t }))} />
              <Select label="Dificultad" value={genInputs.dificultad} onChange={(v) => setGenInputs((s) => ({ ...s, dificultad: Number(v) }))} options={Object.entries(DIFICULTADES).map(([v, t]) => ({ value: v, label: t }))} />
              <Select label="Limitación" value={genInputs.limitacion} onChange={(v) => setGenInputs((s) => ({ ...s, limitacion: Number(v) }))} options={Object.entries(LIMITACIONES).map(([v, t]) => ({ value: v, label: t }))} />
              <Select label="Tiempo" value={genInputs.tiempo} onChange={(v) => setGenInputs((s) => ({ ...s, tiempo: Number(v) }))} options={Object.entries(TIEMPOS).map(([v, t]) => ({ value: v, label: t }))} />
              <Select label="Frecuencia" value={genInputs.frecuencia} onChange={(v) => setGenInputs((s) => ({ ...s, frecuencia: Number(v) }))} options={Object.entries(FRECUENCIAS).map(([v, t]) => ({ value: v, label: t }))} />
            </div>

            <div className="rtn-actions">
              <button className="btn" type="submit" disabled={genLoading}>
                {genLoading ? "Generando..." : " Generar rutina"}
              </button>
            </div>
          </form>
        </div>
      </section>

      {/* Crear nueva rutina */}
      <section className="rtn-section">
        <div className="rtn-card form-deco">
          <div className="rtn-head"><h2>Crear rutina (manual)</h2></div>
        </div>
        <div className="rtn-card form-deco">
          <form className="rtn-form" onSubmit={onCreate}>
            <div className="rtn-row">
              <label>Nombre</label>
              <input className="rtn-input" placeholder="Ej. Full Body 45min" value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="rtn-row">
              <label>Ejercicios (uno por línea)</label>
              <textarea className="rtn-textarea" rows={5} placeholder={`Sentadilla\nPress banca\nRemo con barra`} value={rawItems} onChange={(e) => setRawItems(e.target.value)} />
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
            <div className="rtn-empty-sub">Crea una arriba para empezar a planificar tus sesiones.</div>
          </div>
        ) : (
          <div className="rtn-grid">
            {routines.map((rt) => (
              <article key={rt.id} className="rtn-card">
                <div className="rtn-card-head">
                  <h3 className="rtn-card-title">{rt.name}</h3>
                  <div className="rtn-badges">
                    <span className="pill">{(rt.items || []).length} ejercicios</span>
                  </div>
                </div>
                <ul className="rtn-items">
                  {(rt.items || []).slice(0, 5).map((it, idx) => (
                    <li key={idx} className="rtn-item"><span className="rtn-bullet">•</span><span>{it.name}</span></li>
                  ))}
                  {(rt.items || []).length > 5 && <li className="rtn-more">… y {(rt.items || []).length - 5} más</li>}
                </ul>
                <div className="rtn-card-actions">
                  <button className="btn-secondary" onClick={() => openEdit(rt)}>✏️ Editar</button>
                  <button className="btn-secondary" onClick={() => onDuplicate(rt)}>🧬 Duplicar</button>
                  <button className="btn-danger" onClick={() => onDelete(rt)}>🗑️ Eliminar</button>
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
              <input className="rtn-input" value={editing.name} onChange={(e) => setEditing((s) => ({ ...s, name: e.target.value }))} />
              <label>Ejercicios (uno por línea)</label>
              <textarea className="rtn-textarea" rows={6} value={editing.itemsText} onChange={(e) => setEditing((s) => ({ ...s, itemsText: e.target.value }))} />
            </div>
            <div className="modal-actions">
              <button className="btn-secondary" onClick={() => setEditing(null)}>Cancelar</button>
              <button className="btn" onClick={onSaveEdit}>Guardar cambios</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ---------- Pequeño Select ----------
function Select({ label, value, onChange, options }) {
  return (
    <label className="rtn-row" style={{ minWidth: 220 }}>
      <span>{label}</span>
      <select className="rtn-input" value={value} onChange={(e) => onChange(e.target.value)}>
        {options.map((op) => (
          <option key={op.value} value={op.value}>{op.label}</option>
        ))}
      </select>
    </label>
  );
}
