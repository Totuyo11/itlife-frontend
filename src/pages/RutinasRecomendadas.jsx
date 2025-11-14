// src/pages/RutinasRecomendadas.js
import React, { useState } from "react";
import "../Register.css";
import { useAuth } from "../AuthContext";
import { toast } from "react-toastify";

// Solo usamos validarInputs (ya no recommendRoutines aquí)
import { validarInputs } from "../recommender";

// Usa tus 52 ejercicios para construir la rutina
import { buildDynamicRoutinesFromML } from "../services/dynamicGenerator";

// === Opciones de selects ===
const OBJETIVOS = [
  { value: 1, label: "Perder peso" },
  { value: 2, label: "Ganar músculo" },
  { value: 3, label: "HIIT" },
  { value: 4, label: "Recomposición" },
];

const EXPERIENCIA = [
  { value: 0, label: "Novato" },
  { value: 1, label: "Intermedio" },
  { value: 2, label: "Avanzado" },
  { value: 3, label: "Pro" },
];

const TIEMPO = [
  { value: 1, label: "10-20 min" },
  { value: 2, label: "20-30 min" },
  { value: 3, label: "30-45 min" },
  { value: 4, label: "45-60 min" },
];

// === Cliente API ML ===
const LS_API = (localStorage.getItem("fitlife_api_url") || "").trim();
const API =
  LS_API ||
  process.env.REACT_APP_API_URL ||
  `http://${window.location.hostname}:8000`;

async function predictDayBasedPlan(payload) {
  try {
    const res = await fetch(`${API}/predict`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) return null;
    return await res.json();
  } catch (err) {
    console.warn("Error llamando a /predict", err);
    return null;
  }
}

export default function RutinasRecomendadas() {
  const { user } = useAuth();

  const [form, setForm] = useState({
    sexo: 0,
    edad: 25,
    dificultad: 0,
    tiempo: 3,
    objetivo: 1,
  });

  const [loading, setLoading] = useState(false);
  const [saving3, setSaving3] = useState(false);
  const [results, setResults] = useState([]);

  const [open, setOpen] = useState(false);
  const [detail, setDetail] = useState(null);

  // ================== GENERAR RECOMENDACIONES ==================
  async function onRecommend(e) {
    e?.preventDefault?.();

    const norm = validarInputs({
      objetivo: form.objetivo,
      dificultad: form.dificultad,
      limitacion: 0,
      tiempo: form.tiempo,
      frecuencia: 3,
    });

    setLoading(true);
    try {
      // 1) Llamar al modelo ML
      const ml = await predictDayBasedPlan(norm);

      // IMPORTANTE: aquí NO usamos una variable "focus_plan", solo la propiedad del objeto:
      const focusPlan =
        ml && Array.isArray(ml.focus_plan) && ml.focus_plan.length
          ? ml.focus_plan
          : [["pecho"], ["espalda"], ["pierna"]];

      // 2) Traducir categoría de tiempo → minutos aproximados
      const minutosMap = { 1: 15, 2: 25, 3: 40, 4: 55 };
      const minutos = minutosMap[form.tiempo] || 40;

      const nivelLabel =
        EXPERIENCIA.find((x) => x.value === form.dificultad)?.label.toLowerCase() ||
        "intermedio";
      const objetivoLabel =
        OBJETIVOS.find((x) => x.value === form.objetivo)?.label || "General";

      // 3) Generar rutinas dinámicas usando tus ejercicios
      const dyn = buildDynamicRoutinesFromML(
        { focus_plan: focusPlan, metadata: ml?.metadata || {} },
        { minutos, nivel: nivelLabel, objetivo: objetivoLabel }
      );

      // 4) Adaptar al formato de tarjetas para la UI
      const final = dyn.map((r, index) => ({
        ...r,
        index: index + 1,
        name: r.name,
        foco: r.focus,
        nivel: nivelLabel,
        minutos: r.minutes,
        esquema: r.mlVersion || "ML",
        items: (r.exercises || []).map((ex, idx) => ({
          name: `${idx + 1}. ${ex.name} — ${ex.sets}x${ex.reps} (${ex.muscle})`,
        })),
        // un score dummy mientras no haya score real
        score: Math.random() * 1.0 + 4.0,
      }));

      setResults(final);

      if (!final.length) {
        toast.info("No hubo coincidencias. Ajusta los filtros.");
      }
    } catch (err) {
      console.error(err);
      toast.error("Error al recomendar. Revisa la consola.");
    } finally {
      setLoading(false);
    }
  }

  // ================== GUARDAR RUTINAS ==================
  async function saveOne(rec) {
    if (!user) return toast.info("Inicia sesión para guardar tus rutinas.");
    try {
      const name =
        rec?.name || `Rutina — ${prettyFoco(rec.foco)} · ${rec.minutos || 30} min`;

      const items =
        Array.isArray(rec?.items) && rec.items.length
          ? rec.items
          : [
              { name: `Foco: ${prettyFoco(rec.foco)}` },
              { name: `Duración estimada: ${rec.minutos || 30} min` },
              { name: `Nivel: ${rec.nivel}` },
            ];

      await createRoutineWithToast(user.uid, {
        name,
        items,
        _meta: {
          fuente: "recomendadas_dynamic",
          minutos: rec?.minutos ?? null,
          nivel: rec?.nivel ?? null,
          foco: rec?.foco ?? null,
          modelVersion: rec?.esquema ?? null,
          score: rec?.score ?? null,
        },
      });
    } catch (e) {
      console.error(e);
    }
  }

  async function saveTop3() {
    if (!user) return toast.info("Inicia sesión para guardar tus rutinas.");
    const top = results.slice(0, 3);
    if (!top.length) return toast.info("Primero genera recomendaciones.");

    setSaving3(true);
    try {
      for (let i = 0; i < top.length; i++) {
        await saveOne(top[i]);
      }
      toast.success("Top 3 guardado.");
    } catch (e) {
      console.error(e);
      toast.error("No se pudo guardar el Top 3.");
    } finally {
      setSaving3(false);
    }
  }

  function openDetails(rec) {
    setDetail(rec);
    setOpen(true);
  }

  // ================== RENDER ==================
  return (
    <div className="rtn-wrap">
      <header className="rtn-hero">
        <h1 className="rtn-title">✨ Recomendador de Rutinas (IA)</h1>
        <p className="rtn-sub">Elige y guarda tus mejores recomendaciones 💪</p>
      </header>

      {/* Formulario */}
      <section className="rtn-section">
        <div className="rtn-card form-deco">
          <form className="rtn-form" onSubmit={onRecommend}>
            <div className="rtn-grid-compact">
              <Select
                label="Sexo"
                value={form.sexo}
                onChange={(v) => setForm((s) => ({ ...s, sexo: Number(v) }))}
                options={[
                  { value: 0, label: "Prefiero no decir" },
                  { value: 1, label: "Femenino" },
                  { value: 2, label: "Masculino" },
                ]}
              />
              <Input
                label="Edad"
                type="number"
                min={12}
                max={90}
                value={form.edad}
                onChange={(v) =>
                  setForm((s) => ({ ...s, edad: Number(v) || 18 }))
                }
              />
              <Select
                label="Experiencia"
                value={form.dificultad}
                onChange={(v) =>
                  setForm((s) => ({ ...s, dificultad: Number(v) }))
                }
                options={EXPERIENCIA}
              />
              <Select
                label="Minutos"
                value={form.tiempo}
                onChange={(v) =>
                  setForm((s) => ({ ...s, tiempo: Number(v) }))
                }
                options={TIEMPO}
              />
              <Select
                label="Objetivo"
                value={form.objetivo}
                onChange={(v) =>
                  setForm((s) => ({ ...s, objetivo: Number(v) }))
                }
                options={OBJETIVOS}
              />
            </div>

            <div className="rtn-actions">
              <button className="btn" type="submit" disabled={loading}>
                {loading ? "Buscando..." : "Recomendar"}
              </button>
              <button
                type="button"
                className="btn-secondary"
                disabled={!results.length || saving3}
                onClick={saveTop3}
                style={{ marginLeft: 8 }}
              >
                {saving3 ? "Guardando..." : "Guardar Top 3"}
              </button>
            </div>
          </form>
        </div>
      </section>

      {/* Resultados */}
      <section className="rtn-section">
        <div className="rtn-head">
          <h2>Resultados</h2>
          {!!results.length && (
            <div className="rtn-sec-note">{results.length} opciones</div>
          )}
        </div>

        {results.length === 0 ? (
          <div className="rtn-empty">
            <div className="rtn-empty-ico">🔎</div>
            <div className="rtn-empty-title">Aún no hay recomendaciones</div>
            <div className="rtn-empty-sub">
              Ajusta los filtros y presiona “Recomendar”.
            </div>
          </div>
        ) : (
          <div className="rec-grid">
            {results.map((r) => (
              <article key={r.id} className="rec-card">
                <div className="rec-card-head">
                  <div>
                    <h3 className="rec-title">{r.name}</h3>
                    <span className="rec-rank">#{r.index}</span>
                  </div>
                  <div className="rec-badges">
                    <span className="pill">{r.nivel}</span>
                    <span className="pill">{r.minutos} min</span>
                    <span className="pill">ML {r.esquema}</span>
                    <span className="pill">⭐ {r.score.toFixed(2)}</span>
                  </div>
                </div>

                <div className="rec-body">
                  <ul className="rec-list">
                    <li>Foco: {prettyFoco(r.foco)}</li>
                    <li>Duración estimada: {r.minutos} min</li>
                  </ul>
                </div>

                <div className="rec-actions">
                  <button className="btn" onClick={() => saveOne(r)}>
                    Guardar esta
                  </button>
                  <button
                    className="btn-secondary"
                    onClick={() => openDetails(r)}
                  >
                    Ver contenido
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      {/* Modal detalles */}
      {open && detail && (
        <div className="modal-backdrop" onClick={() => setOpen(false)}>
          <div
            className="modal modal--xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-title">
              <strong>#{detail.index}</strong> {detail.name}
            </div>
            <div className="modal-body modal-body--scroll">
              <div className="rec-badges" style={{ marginBottom: 12 }}>
                <span className="pill">{detail.nivel}</span>
                <span className="pill">{detail.minutos} min</span>
                <span className="pill">ML {detail.esquema}</span>
                <span className="pill">⭐ {detail.score.toFixed(2)}</span>
              </div>

              <ul className="rec-list">
                <li>Foco: {prettyFoco(detail.foco)}</li>
                <li>Duración estimada: {detail.minutos} min</li>
              </ul>

              <h3>Ejercicios</h3>
              <ul className="rec-list">
                {(detail.items || []).map((it, idx) => (
                  <li key={idx}>{it.name}</li>
                ))}
              </ul>
            </div>
            <div className="modal-actions">
              <button className="btn" onClick={() => saveOne(detail)}>
                Guardar esta
              </button>
              <button
                className="btn-secondary"
                onClick={() => setOpen(false)}
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ================== COMPONENTES DE FORM ==================
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

function Input({ label, value, onChange, type = "text", ...rest }) {
  return (
    <label className="rtn-row" style={{ minWidth: 220 }}>
      <span>{label}</span>
      <input
        className="rtn-input"
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        {...rest}
      />
    </label>
  );
}

// ================== HELPERS ==================
function prettyFoco(f) {
  if (!f) return "general";
  if (Array.isArray(f)) return f.join(" / ");
  return String(f).replaceAll("_", " ").toLowerCase();
}
