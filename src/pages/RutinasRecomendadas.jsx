// src/pages/Recomendadas.js
import React, { useState } from "react";
import { useAuth } from "../AuthContext";
import { recommendRoutines } from "../recommender";
import { createRoutine } from "../services/routines";
import "../Register.css";

const API = process.env.REACT_APP_API_URL || "http://127.0.0.1:8000";

// -------- Helpers de mapeo (form -> ints que espera el modelo) ----------
function mapObjetivo(goal) {
  // backend: 1 perder_peso, 2 ganar_musculo, 3 hiit, 4 recomposición/salud
  return { perder_peso: 1, ganar_musculo: 2, hiit: 3, salud: 4 }[goal] ?? 4;
}
function mapDificultad(exp) {
  // 1 novato, 2 intermedio, 3 avanzado
  return { novato: 1, intermedio: 2, avanzado: 3 }[exp] ?? 1;
}
function mapTiempo(minutes) {
  // 1: 30-45, 2: 60-90, 3: 120-180
  if (minutes <= 45) return 1;
  if (minutes <= 90) return 2;
  return 3;
}
// quick default frequency/limitacion (ajústalo cuando agregues controles)
const mapFrecuencia = () => 2; // 3-4 días
const mapLimitacion = () => 4; // ninguna

async function callMLAPI({ objetivo, dificultad, limitacion, tiempo, frecuencia }) {
  const res = await fetch(`${API}/predict`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ objetivo, dificultad, limitacion, tiempo, frecuencia }),
  });
  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    throw new Error(`ML API ${res.status} ${txt}`);
  }
  return res.json(); // { focus_plan, scheme, metadata }
}

export default function Recomendadas() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [recs, setRecs] = useState([]);
  const [selected, setSelected] = useState(null);
  const [saving, setSaving] = useState(false);

  const [params, setParams] = useState({
    sex: "any",
    age: 22,
    experience: "novato",
    minutes: 30,
    goal: "salud",
  });

  async function onRecommend(e) {
    e.preventDefault();
    if (!user) {
      alert("Inicia sesión primero");
      return;
    }
    setLoading(true);
    try {
      // 1) Algoritmo local
      const localRows = await recommendRoutines({
        uid: user.uid,
        ...params,
        topN: 5,
      });

      // 2) Modelo IA (FastAPI)
      let mlCard = null;
      try {
        const payload = {
          objetivo: mapObjetivo(params.goal),
          dificultad: mapDificultad(params.experience),
          limitacion: mapLimitacion(),
          tiempo: mapTiempo(params.minutes),
          frecuencia: mapFrecuencia(),
        };
        const ml = await callMLAPI(payload);

        // Aplanamos el focus_plan (por si viene como [[...],[...]])
        const focusFlat = Array.isArray(ml?.focus_plan)
          ? ml.focus_plan.flat()
          : [];

        // Construimos blocks para mostrar ejercicios/resumen por día/foco
        const blocks =
          Array.isArray(ml?.focus_plan) && ml.scheme
            ? ml.focus_plan.map((grupo, i) => ({
                bodyPart: `Día ${i + 1}`,
                exercise: Array.isArray(grupo) ? grupo.join(" + ") : String(grupo || ""),
                sets: ml.scheme.series ?? "?",
                reps: ml.scheme.reps ?? "?",
              }))
            : [];

        // Tarjeta IA enriquecida con datos reales del modelo
        mlCard = {
          id: `ml-${Date.now()}`,
          name: "Rutina Recomendada (modelo)",
          goal: params.goal, // lo que eligió el usuario
          level: params.experience, // lo que eligió el usuario
          minMinutes: params.minutes,
          maxMinutes: params.minutes + 15,
          focus: focusFlat,
          blocks,
          _score: 5.0,
          _meta: {
            fuente: "IA-sklearn",
            ...ml?.metadata,
            scheme: ml?.scheme,
          },
        };
      } catch (mlErr) {
        console.warn("ML API falló (se muestra solo algoritmo local):", mlErr?.message || mlErr);
      }

      // 3) Mezcla resultados
      setRecs(mlCard ? [...(localRows || []), mlCard] : (localRows || []));
    } catch (err) {
      console.error(err);
      alert("Error al recomendar rutinas");
    } finally {
      setLoading(false);
    }
  }

  // Convierte la recomendación (con blocks) al formato items {name}
  function recommendedToItems(rt) {
    const items = [];
    items.push({
      name: `${rt.name} · ${rt.minMinutes || "?"}-${rt.maxMinutes || "?"} min`,
    });

    if (Array.isArray(rt.focus) && rt.focus.length) {
      items.push({ name: `Foco: ${rt.focus.join(" · ")}` });
    }
    items.push({ name: "" });

    if (Array.isArray(rt.blocks)) {
      let currentGroup = "";
      rt.blocks.forEach((b, i) => {
        const group = String(b?.bodyPart || "").toUpperCase();
        if (group && group !== currentGroup) {
          items.push({ name: `• ${group}` });
          currentGroup = group;
        }
        const main = b?.exercise || b?.name || "Ejercicio";
        const detail = b?.sets
          ? `${b.sets}x${b.reps || b.time || "?"}`
          : b?.reps || b?.time || "";
        items.push({
          name: `   ${i + 1}. ${main}${detail ? ` — ${detail}` : ""}`,
        });
      });
    }

    return items;
  }

  // Guarda la recomendación como rutina del usuario
  async function onSaveSelected() {
    if (!user || !selected) return;
    setSaving(true);
    try {
      const items = recommendedToItems(selected);
      const name =
        selected.name ||
        `Rutina ${selected.goal || ""} · ${selected.minMinutes || ""}-${selected.maxMinutes || ""} min`.trim();

      await createRoutine(user.uid, {
        name,
        items,
        _meta: {
          fuente: selected._meta?.fuente || "recomendador-local",
          score: typeof selected._score === "number" ? selected._score : null,
          goal: selected.goal || null,
          level: selected.level || null,
          minMinutes: selected.minMinutes || null,
          maxMinutes: selected.maxMinutes || null,
          focus: Array.isArray(selected.focus) ? selected.focus : null,
          scheme: selected._meta?.scheme || null,
          modelVersion: selected._meta?.model_version || null,
        },
      });

      alert("✅ Guardada en tus rutinas");
      setSelected(null);
    } catch (e) {
      console.error(e);
      alert("No se pudo guardar la rutina.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="rtn-wrap">
      <header className="rtn-hero">
        <h1 className="rtn-title">✨ Recomendador de Rutinas</h1>
        <p className="rtn-sub">Ajusta tus parámetros y obtén rutinas personalizadas</p>
      </header>

      {/* Formulario */}
      <form className="rtn-form form-deco" onSubmit={onRecommend}>
        <div className="rtn-grid-compact">
          <Select
            label="Sexo"
            value={params.sex}
            onChange={(v) => setParams((s) => ({ ...s, sex: v }))}
            options={[
              { value: "any", label: "Prefiero no decir" },
              { value: "male", label: "Masculino" },
              { value: "female", label: "Femenino" },
            ]}
          />
          <label className="rtn-row">
            Edad
            <input
              type="number"
              className="rtn-input"
              value={params.age}
              onChange={(e) => setParams((s) => ({ ...s, age: Number(e.target.value) }))}
            />
          </label>
          <Select
            label="Experiencia"
            value={params.experience}
            onChange={(v) => setParams((s) => ({ ...s, experience: v }))}
            options={[
              { value: "novato", label: "Novato" },
              { value: "intermedio", label: "Intermedio" },
              { value: "avanzado", label: "Avanzado" },
            ]}
          />
          <label className="rtn-row">
            Minutos disponibles
            <input
              type="number"
              className="rtn-input"
              value={params.minutes}
              onChange={(e) => setParams((s) => ({ ...s, minutes: Number(e.target.value) }))}
            />
          </label>
          <Select
            label="Objetivo"
            value={params.goal}
            onChange={(v) => setParams((s) => ({ ...s, goal: v }))}
            options={[
              { value: "salud", label: "Salud" },
              { value: "perder_peso", label: "Perder peso" },
              { value: "ganar_musculo", label: "Ganar músculo" },
              { value: "hiit", label: "HIIT" },
            ]}
          />
        </div>
        <div className="rtn-actions">
          <button className="btn" type="submit" disabled={loading}>
            {loading ? "Buscando..." : "🔍 Recomendar"}
          </button>
        </div>
      </form>

      {/* Resultados */}
      <section className="rtn-section">
        <h2>Resultados</h2>
        {loading ? (
          <div className="rtn-grid">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="rtn-card skeleton" style={{ height: 140 }} />
            ))}
          </div>
        ) : recs.length === 0 ? (
          <div className="rtn-empty">
            <div className="rtn-empty-ico">🗂️</div>
            <div className="rtn-empty-title">Aún no hay recomendaciones</div>
            <div className="rtn-empty-sub">Ajusta filtros o añade más rutinas</div>
          </div>
        ) : (
          <div className="rtn-grid">
            {recs.map((rt) => (
              <article key={rt.id || rt.name} className="rtn-card">
                <div className="rtn-card-head">
                  <h3 className="rtn-card-title">{rt.name}</h3>
                  {typeof rt._score === "number" && (
                    <span className="pill">⭐ {rt._score.toFixed(1)}</span>
                  )}
                </div>
                <div className="rtn-badges">
                  {rt.goal && <span className="pill">{rt.goal}</span>}
                  {rt.level && <span className="pill">{rt.level}</span>}
                  {(rt.minMinutes || rt.maxMinutes) && (
                    <span className="pill">
                      {rt.minMinutes ?? "?"}-{rt.maxMinutes ?? "?"} min
                    </span>
                  )}
                  {rt._meta?.model_version && (
                    <span className="pill">ML v{rt._meta.model_version}</span>
                  )}
                </div>
                {Array.isArray(rt.focus) && rt.focus.length > 0 && (
                  <ul className="rtn-items">
                    {rt.focus.slice(0, 3).map((f, i) => (
                      <li key={i} className="rtn-item">
                        <span className="rtn-bullet">•</span>
                        <span>{f}</span>
                      </li>
                    ))}
                    {rt.focus.length > 3 && (
                      <li className="rtn-more">… y {rt.focus.length - 3} más</li>
                    )}
                  </ul>
                )}
                <div className="rtn-card-actions">
                  <button
                    className="btn-secondary"
                    type="button"
                    onClick={() => setSelected(rt)}
                  >
                    Ver detalles
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      {/* Modal detalle */}
      {selected && (
        <div className="modal-backdrop" onClick={() => setSelected(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-title">
              {selected.name} · {selected.minMinutes || "—"}-{selected.maxMinutes || "—"}min
            </div>
            <div className="modal-body">
              <p>
                <b>Meta:</b> {selected.goal || "—"}
              </p>
              <p>
                <b>Nivel:</b> {selected.level || "—"}
              </p>
              <p>
                <b>Foco:</b>{" "}
                {Array.isArray(selected.focus) && selected.focus.length
                  ? selected.focus.join(", ")
                  : "—"}
              </p>

              {Array.isArray(selected.blocks) && selected.blocks.length > 0 && (
                <>
                  <h4 style={{ marginTop: 12 }}>Ejercicios / Bloques</h4>
                  <ul style={{ lineHeight: 1.5 }}>
                    {selected.blocks.map((b, i) => (
                      <li key={i}>
                        <b>{(b?.bodyPart || "").toUpperCase()}</b>: {b?.exercise || "Ejercicio"}
                        {b?.sets
                          ? ` (${b.sets}x${b.reps || b.time || "?"})`
                          : b?.reps || b?.time
                          ? ` (${b.reps || b.time})`
                          : ""}
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </div>

            <div className="modal-actions">
              <button className="btn-secondary" onClick={() => setSelected(null)}>
                Cerrar
              </button>
              <button className="btn" onClick={onSaveSelected} disabled={saving}>
                {saving ? "Guardando..." : "💾 Guardar en mis rutinas"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ---------- Componente Select ----------
function Select({ label, value, onChange, options }) {
  return (
    <label className="rtn-row" style={{ minWidth: 220 }}>
      <span>{label}</span>
      <select className="rtn-input" value={value} onChange={(e) => onChange(e.target.value)}>
        {options.map((op) => (
          <option key={op.value} value={op.value}>
            {op.label}
          </option>
        ))}
      </select>
    </label>
  );
}
