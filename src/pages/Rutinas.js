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

function parseItemsFromText(text) {
  return text
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean)
    .map((name) => ({ name }));
}

function itemsToText(items = []) {
  return items.map((it) => it.name || "").join("\n");
}

export default function Rutinas() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [routines, setRoutines] = useState([]);

  // Crear
  const [name, setName] = useState("");
  const [rawItems, setRawItems] = useState("");

  // Edit modal
  const [editing, setEditing] = useState(null); // {id, name, items}

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

  async function onCreate(e) {
    e.preventDefault();
    if (!user) return;
    const cleanName = name.trim();
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
      name: editing.name.trim() || "Rutina",
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

  return (
    <div className="rtn-wrap">
      <header className="rtn-hero">
        <h1 className="rtn-title">🧠 Rutinas</h1>
        <p className="rtn-sub">
          Crea planes enfocados y organízalos por ejercicios.{" "}
          <span className="pill">Uno por línea</span>
        </p>
      </header>

      {/* Crear nueva rutina */}
      <section className="rtn-section">
        <div className="rtn-card form-deco">
          <div className="rtn-head">
            <h2>Crear rutina</h2>
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
                    <span className="pill">{(rt.items || []).length} ejercicios</span>
                  </div>
                </div>

                <ul className="rtn-items">
                  {(rt.items || []).slice(0, 5).map((it, idx) => (
                    <li key={idx} className="rtn-item">
                      <span className="rtn-bullet">•</span>
                      <span>{it.name}</span>
                    </li>
                  ))}
                  {(rt.items || []).length > 5 && (
                    <li className="rtn-more">… y {(rt.items || []).length - 5} más</li>
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
