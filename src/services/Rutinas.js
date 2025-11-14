// src/pages/Rutinas.js
import React, { useEffect, useState } from "react";
import "../Register.css";
import { useAuth } from "../AuthContext";

// Servicios
import { recomendarRutinas } from "../services/recommenderService";
import { validarInputs } from "../recommender";
import {
  listenRoutines,
  createRoutineWithToast,
  updateRoutineWithToast,
  deleteRoutineWithToast,
} from "../services/routines";
import { buildDynamicRoutinesFromML } from "../services/dynamicGenerator";

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
  const timeout = setTimeout(() => controller.abort(), 1500);

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

// ---------- Componente principal ----------
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
  const [viewer, setViewer] = useState(null); // { id, name, itemsText }

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
      }
    );
    return () => unsub && unsub();
  }, [user]);

  // Crear manual (con toast)
  async function onCreate(e) {
    e.preventDefault();
    if (!user) return;
    const cleanName = (name || "").trim();
    const items = parseItemsFromText(rawItems);
    if (!cleanName || items.length === 0) return;
    try {
      await createRoutineWithToast(user.uid, { name: cleanName, items });
      setName("");
      setRawItems("");
    } catch (err) {
      console.error(err);
    }
  }

  // 🔥 Generar con IA + ejercicios dinámicos
  async function onGenerateAI(e) {
    e.preventDefault();
    if (!user) return;

    const norm = validarInputs(genInputs); // normaliza objetivo, dificultad, etc.
    setGenLoading(true);

    try {
      // 1) Reglas (recomendarRutinas) → lo seguimos usando como apoyo/fallback
      const ranked = await recomendarRutinas(norm);

      // 2) Intentar usar el modelo de ML real
      let mlResponse = null;
      const pred = await predictRoutineAPI(norm);

      if (pred && Array.isArray(pred.focus_plan) && pred.focus_plan.length > 0) {
        mlResponse = pred;
      } else {
        // 3) Fallback: construir focus_plan en base a las rutinas rankeadas
        const fallbackFocusPlan = ranked
          .slice(0, norm.frecuencia || 3)
          .map((r) => {
            const foco = r.foco || r.focus || r.focusPlan;
            if (Array.isArray(foco)) return foco;
            if (typeof foco === "string") {
              return foco
                .split(/[,+/]/)
                .map((s) => s.trim())
                .filter(Boolean);
            }
            return ["Full body"];
          });

        mlResponse = {
          focus_plan:
            fallbackFocusPlan.length > 0 ? fallbackFocusPlan : [["Full body"]],
          metadata: { model_version: "rules-fallback" },
        };
      }

      // 4) Traducir categoría de tiempo a minutos aproximados
      const minutosMap = { 1: 40, 2: 75, 3: 150 };
      const minutos = minutosMap[norm.tiempo] || 40;
      const nivelLabel = DIFICULTADES[norm.dificultad] || "intermedio";
      const objetivoLabel = OBJETIVOS[norm.objetivo] || "general";

      // 5) Construir rutinas dinámicas a partir del plan + tus 52 ejercicios
      const dynamicRoutines = buildDynamicRoutinesFromML(mlResponse, {
        minutos,
        nivel: nivelLabel.toLowerCase(),
        objetivo: objetivoLabel,
      });

      if (!dynamicRoutines.length) {
        throw new Error("No se pudieron generar rutinas dinámicas");
      }

      // 6) Convertir esas rutinas dinámicas a formato de "items" (uno por línea)
      const items = [];
      dynamicRoutines.forEach((r, idx) => {
        const focusText = (r.focus || []).join(" + ") || "Full body";
        items.push({
          name: `Día ${idx + 1}: ${focusText} · ${r.minutes} min`,
        });

        (r.exercises || []).forEach((ex, j) => {
          items.push({
            name: `  ${j + 1}. ${ex.name} — ${ex.sets}x${ex.reps} · descanso ${ex.restSeconds}s`,
          });
        });

        items.push({ name: "" }); // línea en blanco entre días
      });
      if (items.length && items[items.length - 1].name === "") items.pop();

      // 7) Nombre bonito de la rutina
      const genName = `Rutina ${objetivoLabel} · ${
        FRECUENCIAS[norm.frecuencia]
      } · ${TIEMPOS[norm.tiempo]}`;

      // 8) Guardar en Firestore con metadatos de IA
      await createRoutineWithToast(user.uid, {
        name: genName,
        items,
        _meta: {
          fuente: mlResponse?.metadata?.model_version
            ? "ML_DYNAMIC"
            : "rules-fallback",
          modelVersion:
            mlResponse?.metadata?.model_version || "rules-fallback",
          ...norm,
        },
      });
    } catch (err) {
      console.error(err);
    } finally {
      setGenLoading(false);
    }
  }

  // Editar / eliminar / ver contenido
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
      await updateRoutineWithToast(user.uid, editing.id, payload);
      setEditing(null);
    } catch (err) {
      console.error(err);
    }
  }
  function openViewer(rt) {
    setViewer({
      id: rt.id,
      name: rt.name || "Rutina",
      itemsText: itemsToText(rt.items || []),
    });
  }
  async function onDelete(rt) {
    if (!user) return;
    try {
      await deleteRoutineWithToast(user.uid, rt.id, rt.name);
    } catch (err) {
      console.error(err);
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
                options={mapObj(OBJETIVOS)}
              />
              <Select
                label="Dificultad"
                value={genInputs.dificultad}
                onChange={(v) =>
                  setGenInputs((s) => ({ ...s, dificultad: Number(v) }))
                }
                options={mapObj(DIFICULTADES)}
              />
              <Select
                label="Limitación"
                value={genInputs.limitacion}
                onChange={(v) =>
                  setGenInputs((s) => ({ ...s, limitacion: Number(v) }))
                }
                options={mapObj(LIMITACIONES)}
              />
              <Select
                label="Tiempo"
                value={genInputs.tiempo}
                onChange={(v) =>
                  setGenInputs((s) => ({ ...s, tiempo: Number(v) }))
                }
                options={mapObj(TIEMPOS)}
              />
              <Select
                label="Frecuencia"
                value={genInputs.frecuencia}
                onChange={(v) =>
                  setGenInputs((s) => ({ ...s, frecuencia: Number(v) }))
                }
                options={mapObj(FRECUENCIAS)}
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
                  <button
                    className="btn-secondary"
                    onClick={() => openViewer(rt)}
                  >
                    👁️ Ver contenido
                  </button>
                  <button
                    className="btn-secondary"
                    onClick={() => openEdit(rt)}
                  >
                    ✏️ Editar
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
                rows={8}
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

      {/* Modal visor grande */}
      {viewer && (
        <div className="modal-backdrop" onClick={() => setViewer(null)}>
          <div
            className="modal modal--xl"
            onClick={(e) => e.stopPropagation()}
            aria-modal="true"
            role="dialog"
          >
            <div className="modal-title">{viewer.name}</div>
            <div className="modal-body modal-body--scroll">
              <pre className="viewer-pre">
{viewer.itemsText}
              </pre>
            </div>
            <div className="modal-actions">
              <button className="btn-secondary" onClick={() => setViewer(null)}>
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

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
function mapObj(obj) {
  return Object.entries(obj).map(([v, t]) => ({
    value: Number(v),
    label: t,
  }));
}
