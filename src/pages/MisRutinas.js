// src/pages/MisRutinas.js
import React, { useEffect, useState } from "react";
import "../Register.css";
import { Link } from "react-router-dom";
import { useAuth } from "../AuthContext";
import { toast } from "react-toastify";

import {
  listenRoutines,
  createRoutineWithToast,
  updateRoutineWithToast,
  deleteRoutineWithToast,
} from "../services/routines";

// Helpers texto <-> items
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

export default function MisRutinas() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [routines, setRoutines] = useState([]);

  // modales
  const [editing, setEditing] = useState(null); // {id, name, itemsText}
  const [confirmDel, setConfirmDel] = useState(null); // {id, name}

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
        console.error("[MisRutinas listenRoutines]", err);
        toast.error("No se pudieron leer tus rutinas.");
        setLoading(false);
      }
    );
    return () => unsub && unsub();
  }, [user]);

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
        name: (editing.name || "").trim() || "Rutina",
        items: parseItemsFromText(editing.itemsText || ""),
      });
      setEditing(null);
    } catch (e) {
      console.error(e);
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
    } catch (e) {
      console.error(e);
    }
  }

  function onDelete(rt) {
    if (!user) return;
    setConfirmDel({ id: rt.id, name: rt.name || "Rutina" });
  }

  return (
    <div className="rtn-wrap">
      <header className="rtn-hero">
        <h1 className="rtn-title">💪 Mis Rutinas</h1>
        <p className="rtn-sub">Tu historial de planes generados y manuales.</p>
      </header>

      {loading ? (
        <section className="rtn-section">
          <div className="rtn-grid">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="rtn-card skeleton" style={{ height: 160 }} />
            ))}
          </div>
        </section>
      ) : routines.length === 0 ? (
        <section className="rtn-section">
          <div className="rtn-empty">
            <div className="rtn-empty-ico">📁</div>
            <div className="rtn-empty-title">Aún no has generado rutinas</div>
            <div className="rtn-empty-sub">
              Ve a <Link to="/rutina" className="pill">Rutinas</Link> y crea tu primera.
            </div>
          </div>
        </section>
      ) : (
        <section className="rtn-section">
          <div className="rtn-head">
            <h2>Tus rutinas</h2>
            <div className="rtn-sec-note">{routines.length} en total</div>
          </div>
          <div className="rtn-grid">
            {routines.map((rt) => (
              <article key={rt.id} className="rtn-card">
                <div className="rtn-card-head">
                  <h3 className="rtn-card-title">{rt.name}</h3>
                  <div className="rtn-badges">
                    <span className="pill">{(rt.items || []).length} ejercicios</span>
                    {rt?._meta?.minutos ? (
                      <span className="pill">{rt._meta.minutos} min</span>
                    ) : null}
                    {rt?._meta?.fuente ? (
                      <span className="pill">{rt._meta.fuente}</span>
                    ) : null}
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
        </section>
      )}

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

      {/* Modal eliminar (sin window.confirm) */}
      {confirmDel && (
        <div className="modal-backdrop" onClick={() => setConfirmDel(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-title">Eliminar rutina</div>
            <div className="modal-body">
              <p>
                ¿Seguro que deseas eliminar <strong>{confirmDel.name}</strong>?
              </p>
              <p style={{ opacity: 0.8, marginTop: 6 }}>
                Esta acción no se puede deshacer.
              </p>
            </div>
            <div className="modal-actions">
              <button className="btn-secondary" onClick={() => setConfirmDel(null)}>
                Cancelar
              </button>
              <button
                className="btn-danger"
                onClick={async () => {
                  try {
                    await deleteRoutineWithToast(user.uid, confirmDel.id, confirmDel.name);
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
