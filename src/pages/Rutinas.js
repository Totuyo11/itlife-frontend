// src/pages/Rutinas.js
import React, { useEffect, useMemo, useState } from "react";
import "../Register.css";
import { useAuth } from "../AuthContext";
import {
  listenRoutines,
  createRoutine,
  updateRoutine,
  deleteRoutine,
} from "../services/routines";

// Sugerencias de ejercicios por si no quieres depender de ALL_EXERCISES
const SUGGESTED = [
  { name: "Sentadilla", muscle: "Piernas" },
  { name: "Peso muerto", muscle: "Espalda" },
  { name: "Press banca", muscle: "Pectoral" },
  { name: "Press militar", muscle: "Hombro" },
  { name: "Dominadas", muscle: "Espalda" },
  { name: "Remo con barra", muscle: "Espalda" },
  { name: "Curl bíceps", muscle: "Bíceps" },
  { name: "Extensión tríceps", muscle: "Tríceps" },
];

const WEEK_DAYS = ["lun", "mar", "mié", "jue", "vie", "sáb", "dom"];
const GOALS = ["Hipertrofia", "Fuerza", "Resistencia"];

function Tag({ children }) {
  return <span className="chip">{children}</span>;
}

function DaysPicker({ value = [], onChange }) {
  const toggle = (d) =>
    onChange(value.includes(d) ? value.filter((x) => x !== d) : [...value, d]);
  return (
    <div className="chip-list" style={{ justifyContent: "flex-start" }}>
      {WEEK_DAYS.map((d) => (
        <button
          key={d}
          type="button"
          className={`chip ${value.includes(d) ? "nav-active" : ""}`}
          onClick={() => toggle(d)}
        >
          {d}
        </button>
      ))}
    </div>
  );
}

export default function Rutinas() {
  const { user } = useAuth();
  const [items, setItems] = useState([]);      // rutinas del usuario
  const [loading, setLoading] = useState(true);
  const [sel, setSel] = useState(null);        // rutina seleccionada para editar (obj)
  const [showNew, setShowNew] = useState(false);

  // form nueva rutina
  const [newName, setNewName] = useState("");
  const [newGoal, setNewGoal] = useState("Hipertrofia");
  const [newDays, setNewDays] = useState(["lun", "mié", "vie"]);

  // form añadir ejercicio a la rutina
  const [fxName, setFxName] = useState("");
  const [fxMuscle, setFxMuscle] = useState("");
  const [fxSets, setFxSets] = useState(4);
  const [fxReps, setFxReps] = useState("8-12");
  const [fxRest, setFxRest] = useState(90);

  useEffect(() => {
    if (!user) return;
    const unsub = listenRoutines(user.uid, (rows) => {
      setItems(rows);
      setLoading(false);
      if (sel) {
        const updated = rows.find((r) => r.id === sel.id);
        if (updated) setSel(updated);
      }
    });
    return () => unsub && unsub();
  }, [user]); // eslint-disable-line

  async function handleCreate() {
    if (!user) return;
    const id = await createRoutine(user.uid, {
      name: newName,
      goal: newGoal,
      days: newDays,
      items: [],
    });
    setShowNew(false);
    setNewName("");
    setSel({ id, name: newName || "Nueva rutina", goal: newGoal, days: newDays, items: [] });
  }

  async function handleDelete(r) {
    if (!user) return;
    if (!window.confirm(`¿Eliminar la rutina "${r.name}"?`)) return;
    await deleteRoutine(user.uid, r.id);
    if (sel?.id === r.id) setSel(null);
  }

  async function handleDuplicate(r) {
    if (!user) return;
    const id = await createRoutine(user.uid, {
      name: `${r.name} (copia)`,
      goal: r.goal,
      days: r.days || [],
      items: r.items || [],
    });
    const newSel = { ...r, id, name: `${r.name} (copia)` };
    setSel(newSel);
  }

  async function addExercise() {
    if (!user || !sel) return;
    const clean = (s) => String(s || "").trim();
    if (!clean(fxName)) return;

    const next = [
      ...(sel.items || []),
      {
        id: crypto.randomUUID(),
        name: clean(fxName),
        muscle: clean(fxMuscle),
        sets: Number(fxSets) || 4,
        reps: clean(fxReps) || "8-12",
        rest: Number(fxRest) || 90, // segundos
      },
    ];
    await updateRoutine(user.uid, sel.id, { items: next });
    setFxName("");
    setFxMuscle("");
    setFxSets(4);
    setFxReps("8-12");
    setFxRest(90);
  }

  async function removeExercise(id) {
    if (!user || !sel) return;
    const next = (sel.items || []).filter((x) => x.id !== id);
    await updateRoutine(user.uid, sel.id, { items: next });
  }

  async function saveHeader(patch) {
    if (!user || !sel) return;
    await updateRoutine(user.uid, sel.id, patch);
  }

  const left = useMemo(() => items, [items]);

  return (
    <div className="dash-wrap" style={{ maxWidth: 1080 }}>
      <h1 className="dash-title">Rutinas</h1>

      {/* grid: lista de rutinas + editor */}
      <div className="dash-grid" style={{ gridTemplateColumns: "320px 1fr" }}>
        {/* ===== Columna izquierda: lista ===== */}
        <aside className="dash-card">
          <div className="dash-sec-head">
            <h2>Mis rutinas</h2>
            <button className="btn" onClick={() => setShowNew(true)}>Nueva</button>
          </div>

          {loading && <div className="skeleton" style={{ height: 140 }} />}
          {!loading && left.length === 0 && (
            <div className="dash-empty">Aún no tienes rutinas. Crea la primera 👇</div>
          )}

          <ul className="dwh-list">
            {left.map((r) => (
              <li key={r.id} className="dwh-item" style={{ alignItems: "center" }}>
                <div>
                  <div className="dwh-date" style={{ fontSize: "1rem" }}>{r.name}</div>
                  <div className="dash-sec-note">
                    {r.goal} · {r.days?.length || 0} días · {r.items?.length || 0} ejercicios
                  </div>
                </div>
                <div style={{ display: "flex", gap: 6 }}>
                  <button className="btn-secondary" onClick={() => setSel(r)}>Editar</button>
                  <button className="btn-secondary" onClick={() => handleDuplicate(r)}>Duplicar</button>
                  <button className="menu-item danger" onClick={() => handleDelete(r)}>Borrar</button>
                </div>
              </li>
            ))}
          </ul>
        </aside>

        {/* ===== Derecha: editor ===== */}
        <main className="dash-card">
          {!sel ? (
            <div className="dash-empty">Selecciona una rutina para editarla.</div>
          ) : (
            <>
              <div className="dash-sec-head">
                <h2>Editar rutina</h2>
              </div>

              {/* Encabezado */}
              <div className="mv-grid" style={{ gridTemplateColumns: "1fr 180px" }}>
                <div className="mv-item">
                  <label className="mv-label">Nombre</label>
                  <input
                    value={sel.name || ""}
                    onChange={(e) => setSel({ ...sel, name: e.target.value })}
                    onBlur={() => saveHeader({ name: sel.name })}
                  />
                </div>
                <div className="mv-item">
                  <label className="mv-label">Objetivo</label>
                  <select
                    value={sel.goal || "Hipertrofia"}
                    onChange={(e) => {
                      const goal = e.target.value;
                      setSel({ ...sel, goal });
                      saveHeader({ goal });
                    }}
                    style={{ padding: 10, borderRadius: 10, background: "var(--input-bg)", color: "#fff", border: "1px solid var(--border)" }}
                  >
                    {GOALS.map((g) => (
                      <option key={g} value={g}>{g}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="dash-section">
                <div className="dash-sec-head">
                  <h2>Días</h2>
                </div>
                <DaysPicker
                  value={sel.days || []}
                  onChange={(days) => {
                    setSel({ ...sel, days });
                    saveHeader({ days });
                  }}
                />
              </div>

              {/* Añadir ejercicio */}
              <div className="dash-section">
                <div className="dash-sec-head">
                  <h2>Agregar ejercicio</h2>
                  <div className="dash-sec-note">Puedes elegir de sugeridos o escribir el nombre</div>
                </div>

                {/* Sugerencias */}
                <div className="chip-list" style={{ justifyContent: "flex-start" }}>
                  {SUGGESTED.slice(0, 6).map((s) => (
                    <button
                      key={s.name}
                      type="button"
                      className="chip"
                      onClick={() => {
                        setFxName(s.name);
                        setFxMuscle(s.muscle);
                      }}
                    >
                      {s.name}
                    </button>
                  ))}
                </div>

                <div className="mv-grid" style={{ gridTemplateColumns: "2fr 1fr 90px 90px 90px auto" }}>
                  <div className="mv-item">
                    <label className="mv-label">Ejercicio</label>
                    <input value={fxName} onChange={(e) => setFxName(e.target.value)} placeholder="p. ej. Press banca" />
                  </div>
                  <div className="mv-item">
                    <label className="mv-label">Músculo</label>
                    <input value={fxMuscle} onChange={(e) => setFxMuscle(e.target.value)} placeholder="Pectoral" />
                  </div>
                  <div className="mv-item">
                    <label className="mv-label">Sets</label>
                    <input type="number" value={fxSets} onChange={(e) => setFxSets(e.target.value)} />
                  </div>
                  <div className="mv-item">
                    <label className="mv-label">Reps</label>
                    <input value={fxReps} onChange={(e) => setFxReps(e.target.value)} placeholder="8-12" />
                  </div>
                  <div className="mv-item">
                    <label className="mv-label">Descanso (s)</label>
                    <input type="number" value={fxRest} onChange={(e) => setFxRest(e.target.value)} />
                  </div>
                  <div className="mv-item" style={{ alignItems: "stretch" }}>
                    <button className="btn" onClick={addExercise}>Añadir</button>
                  </div>
                </div>
              </div>

              {/* Lista de ejercicios */}
              <div className="dash-section">
                <div className="dash-sec-head">
                  <h2>Ejercicios de la rutina</h2>
                </div>
                {(sel.items?.length || 0) === 0 ? (
                  <div className="dash-empty">Añade tu primer ejercicio 👆</div>
                ) : (
                  <ul className="dwh-list">
                    {sel.items.map((it) => (
                      <li key={it.id} className="dwh-item" style={{ alignItems: "center" }}>
                        <div>
                          <div className="dwh-date" style={{ fontSize: "1rem" }}>{it.name}</div>
                          <div className="dash-sec-note">
                            {it.muscle ? <Tag>{it.muscle}</Tag> : null} · {it.sets}×{it.reps} · {it.rest}s
                          </div>
                        </div>
                        <div style={{ display: "flex", gap: 6 }}>
                          <button className="menu-item danger" onClick={() => removeExercise(it.id)}>Quitar</button>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </>
          )}
        </main>
      </div>

      {/* Modal nueva rutina */}
      {showNew && (
        <div className="modal-backdrop" onClick={() => setShowNew(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-title">Crear rutina</div>
            <div className="modal-body">
              <input
                placeholder="Nombre (p. ej. Push/Pull/Legs)"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
              />
              <div>
                <div className="dash-sec-note" style={{ marginBottom: 6 }}>Objetivo</div>
                <div className="chip-list" style={{ justifyContent: "flex-start" }}>
                  {GOALS.map((g) => (
                    <button
                      key={g}
                      type="button"
                      className={`chip ${newGoal === g ? "nav-active" : ""}`}
                      onClick={() => setNewGoal(g)}
                    >
                      {g}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <div className="dash-sec-note" style={{ marginBottom: 6 }}>Días</div>
                <DaysPicker value={newDays} onChange={setNewDays} />
              </div>
            </div>
            <div className="modal-actions">
              <button className="btn-secondary" onClick={() => setShowNew(false)}>Cancelar</button>
              <button className="btn" onClick={handleCreate}>Crear</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
