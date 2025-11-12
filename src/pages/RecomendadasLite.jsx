// src/pages/RecomendadasLite.jsx
import React, { useEffect, useState } from "react";
import { useAuth } from "../AuthContext";
import { listenRoutines, listenRecentSessions, addSessionLog } from "../services/routines";
import { rankFromFirestoreCatalog, validarInputs } from "../recommender";

/* ===========================
 * Badge IA (sin Tailwind)
 * =========================*/
function PlanBadge({ label }) {
  const l = String(label || "").toLowerCase();
  const palette = {
    fatloss: { bg: "#ffe4e6", text: "#9f1239", border: "#fecdd3", icon: "🔥" },
    muscle:  { bg: "#d1fae5", text: "#065f46", border: "#a7f3d0", icon: "💪" },
    hiit:    { bg: "#fef3c7", text: "#92400e", border: "#fde68a", icon: "⚡" },
    recomp:  { bg: "#e0e7ff", text: "#3730a3", border: "#c7d2fe", icon: "🔁" },
    default: { bg: "#e2e8f0", text: "#334155", border: "#cbd5e1", icon: "✨" },
  }[l] || (label ? {} : null) || {
    bg: "#e2e8f0", text: "#334155", border: "#cbd5e1", icon: "✨",
  };

  if (!label) return null;

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        padding: "2px 8px",
        borderRadius: 999,
        fontSize: 12,
        fontWeight: 700,
        background: palette.bg,
        color: palette.text,
        border: `1px solid ${palette.border}`,
      }}
      title="Plan sugerido por IA"
    >
      <span>{palette.icon}</span>
      <span style={{ letterSpacing: 0.5, textTransform: "uppercase" }}>{label}</span>
    </span>
  );
}

export default function RecomendadasLite() {
  const { currentUser } = useAuth();
  const [catalog, setCatalog] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  // Carga catálogo y sesiones
  useEffect(() => {
    if (!currentUser) return;
    const unsubR = listenRoutines(currentUser.uid, setCatalog);
    const unsubS = listenRecentSessions(currentUser.uid, setSessions);
    return () => {
      unsubR && unsubR();
      unsubS && unsubS();
    };
  }, [currentUser]);

  // Rankear
  useEffect(() => {
    async function run() {
      if (!currentUser) return;
      setLoading(true);
      const inputs = validarInputs({
        objetivo: 2, dificultad: 2, limitacion: 0, tiempo: 2, frecuencia: 3,
      });
      const ranked = await rankFromFirestoreCatalog(inputs, catalog, {
        sessions: sessions.map((s) => ({
          id: s.routineId,
          at: s.at?.toMillis ? s.at.toMillis() : s.at,
        })),
        lastFocus: sessions?.[0]?.focus || null,
        topK: 5,
      });
      setItems(ranked);
      setLoading(false);
    }
    run();
  }, [currentUser, catalog, sessions]);

  if (!currentUser) return <p>Inicia sesión para ver recomendaciones.</p>;
  if (loading) return <p>Cargando recomendaciones…</p>;

  return (
    <div className="container">
      <h1 className="title neon-text">🔥 Recomendadas</h1>
      {items.length === 0 ? (
        <p className="text-center">No hay recomendaciones por ahora.</p>
      ) : (
        <div className="routines-grid">
          {items.map((r) => {
            const ml = r?.explain?.mlSuggest || null;
            const mlPlan = ml?.focus_plan_label || ml?.scheme_label || null;
            const mlSeries = Number.isFinite(ml?.series) ? ml.series : null;
            const mlReps = ml?.scheme?.reps || null;
            const mlDesc = ml?.scheme?.descanso || null;
            const sML = typeof r?.explain?.s_ml === "number" ? r.explain.s_ml : 0;

            return (
              <div className="card" key={r.id}>
                <h3 style={{ marginBottom: 6 }}>{r.name}</h3>

                {/* Badge de IA + boost */}
                {mlPlan && (
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                    <PlanBadge label={mlPlan} />
                    <span style={{ fontSize: 12, color: "#64748b" }}>
                      boost IA: <strong>{sML.toFixed(2)}</strong>
                    </span>
                  </div>
                )}

                <p><strong>Foco:</strong> {r.foco}</p>
                <p><strong>Minutos:</strong> {r.minutos ?? 30}</p>
                <p><strong>Score:</strong> {r.score.toFixed(3)}</p>

                {/* Meta de esquema de IA (reps/descanso/series) */}
                {(mlReps || mlDesc || mlSeries) && (
                  <div style={{ marginTop: 8, fontSize: 14, color: "#334155" }}>
                    <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
                      {mlReps && (
                        <span>
                          <span style={{ opacity: 0.7 }}>📈 Reps:</span>{" "}
                          <strong>{mlReps}</strong>
                        </span>
                      )}
                      {mlDesc && (
                        <span>
                          <span style={{ opacity: 0.7 }}>🕒 Descanso:</span>{" "}
                          <strong>{mlDesc}</strong>
                        </span>
                      )}
                      {mlSeries != null && (
                        <span>
                          <span style={{ opacity: 0.7 }}>🔢 Series:</span>{" "}
                          <strong>{mlSeries}</strong>
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {/* Bloques sugeridos por IA */}
                {Array.isArray(ml?.blocks) && ml.blocks.length > 0 && (
                  <details style={{ marginTop: 10 }}>
                    <summary style={{ cursor: "pointer", color: "#475569" }}>
                      Ver bloques sugeridos
                    </summary>
                    <ul style={{ marginTop: 8, paddingLeft: 16 }}>
                      {ml.blocks.map((b) => (
                        <li key={b.block} style={{ marginBottom: 4 }}>
                          <span
                            style={{
                              background: "#f1f5f9",
                              color: "#334155",
                              fontSize: 12,
                              padding: "2px 6px",
                              borderRadius: 6,
                              marginRight: 8,
                              border: "1px solid #e2e8f0",
                            }}
                          >
                            Bloque {b.block}
                          </span>
                          Foco: <strong>{Array.isArray(b.focus) ? b.focus.join(", ") : String(b.focus)}</strong>
                          <span style={{ color: "#94a3b8" }}> · </span>
                          Series: <strong>{b.series}</strong>
                        </li>
                      ))}
                    </ul>
                  </details>
                )}

                {/* Explicabilidad cruda (debug) */}
                <details style={{ marginTop: 10 }}>
                  <summary>¿Por qué esta rutina?</summary>
                  <pre style={{ whiteSpace: "pre-wrap" }}>
                    {JSON.stringify(r.explain, null, 2)}
                  </pre>
                </details>

                <button
                  onClick={async () => {
                    await addSessionLog(currentUser.uid, {
                      routineId: r.id,
                      minutes: r.minutos || 30,
                      focus: r.foco || null,
                      note: "start",
                    });
                    alert("Sesión registrada (penalización activa por 48h).");
                  }}
                >
                  Empezar
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
