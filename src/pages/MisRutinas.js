// src/pages/MisRutinas.js
import React, { useEffect, useState } from "react";
import "../Register.css";
import { useAuth } from "../AuthContext";
import { listenRoutines, deleteRoutine } from "../services/routines";

function asDate(any) {
  if (!any) return null;
  // Firestore Timestamp
  if (typeof any?.toDate === "function") return any.toDate();
  // string o number
  try {
    const d = new Date(any);
    return isNaN(d.getTime()) ? null : d;
  } catch {
    return null;
  }
}

export default function MisRutinas() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [routines, setRoutines] = useState([]);

  useEffect(() => {
    if (!user) {
      setRoutines([]);
      setLoading(false);
      return;
    }
    const unsub = listenRoutines(user.uid, (rows) => {
      // Ordena por fecha desc si existe
      const sorted = [...(rows || [])].sort((a, b) => {
        const da = asDate(a.createdAt)?.getTime() ?? 0;
        const db = asDate(b.createdAt)?.getTime() ?? 0;
        return db - da;
      });
      setRoutines(sorted);
      setLoading(false);
    });
    return () => unsub && unsub();
  }, [user]);

  async function onDelete(rt) {
    if (!user) return;
    if (!window.confirm(`¿Eliminar la rutina "${rt.name || "Sin título"}"?`)) return;
    try {
      await deleteRoutine(user.uid, rt.id);
    } catch (e) {
      console.error(e);
      alert("No se pudo eliminar");
    }
  }

  if (!user) {
    return (
      <div className="rtn-wrap">
        <header className="rtn-hero">
          <h1 className="rtn-title">Mis Rutinas</h1>
          <p className="rtn-sub">Inicia sesión para ver tus rutinas guardadas.</p>
        </header>
      </div>
    );
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
            <div className="rtn-empty-ico">🗂️</div>
            <div className="rtn-empty-title">Aún no has generado rutinas</div>
            <div className="rtn-empty-sub">
              Ve a <span className="pill">Rutinas</span> y crea tu primera.
            </div>
          </div>
        </section>
      ) : (
        <section className="rtn-section">
          <div className="rtn-grid">
            {routines.map((rt) => {
              const meta = rt._meta || {};
              const when = asDate(rt.createdAt);
              const fecha =
                when ? when.toLocaleString() : "—";

              return (
                <article key={rt.id} className="rtn-card">
                  <div className="rtn-card-head">
                    <h3 className="rtn-card-title">{rt.name || "Rutina sin título"}</h3>
                    <div className="rtn-badges">
                      <span className="pill">{(rt.items || []).length} ejercicios</span>
                      {meta.fuente && <span className="pill">{meta.fuente}</span>}
                    </div>
                  </div>

                  <ul className="rtn-items">
                    <li className="rtn-item">
                      <span className="rtn-bullet">•</span>
                      <span>
                        <strong>Objetivo:</strong>{" "}
                        {meta.objetivo ?? "—"}
                      </span>
                    </li>
                    <li className="rtn-item">
                      <span className="rtn-bullet">•</span>
                      <span>
                        <strong>Dificultad:</strong>{" "}
                        {meta.dificultad ?? "—"}
                      </span>
                    </li>
                    <li className="rtn-item">
                      <span className="rtn-bullet">•</span>
                      <span>
                        <strong>Creada:</strong> {fecha}
                      </span>
                    </li>
                    {meta.modelVersion && (
                      <li className="rtn-item">
                        <span className="rtn-bullet">•</span>
                        <span>
                          <strong>Modelo:</strong> {meta.modelVersion}
                        </span>
                      </li>
                    )}
                  </ul>

                  {/* Vista rápida de ejercicios */}
                  {(rt.items || []).length > 0 && (
                    <details className="rtn-details">
                      <summary>Ver ejercicios</summary>
                      <ul className="rtn-items" style={{ marginTop: 8 }}>
                        {(rt.items || []).slice(0, 50).map((it, i) => (
                          <li key={i} className="rtn-item">
                            <span className="rtn-bullet">•</span>
                            <span>{it?.name || "—"}</span>
                          </li>
                        ))}
                      </ul>
                    </details>
                  )}

                  <div className="rtn-card-actions">
                    <button className="btn-danger" onClick={() => onDelete(rt)}>
                      🗑️ Eliminar
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}
