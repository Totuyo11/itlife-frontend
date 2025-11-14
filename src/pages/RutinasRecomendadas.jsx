// src/pages/RutinasRecomendadas.js
import React, { useState } from "react";
import "../Register.css";
import { useAuth } from "../AuthContext";
import { toast } from "react-toastify";

import { validarInputs, recommendRoutines } from "../recommender";
import { createRoutineWithToast } from "../services/routines";

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
      const catalogo = buildSmallCatalogForDemo();
      const ranked = await recommendRoutines(norm, catalogo, { topK: 8 });
      setResults(ranked);
      if (!ranked.length) toast.info("No hubo coincidencias. Ajusta los filtros.");
    } catch (err) {
      console.error(err);
      toast.error("Error al recomendar. Revisa la consola.");
    } finally {
      setLoading(false);
    }
  }

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
              { name: `Nivel: ${prettyNivel(rec.nivel)}` },
            ];

      await createRoutineWithToast(user.uid, {
        name,
        items,
        _meta: {
          objetivoId: rec?.objetivoId ?? null,
          nivel: rec?.nivel ?? null,
          foco: rec?.foco ?? null,
          minutos: rec?.minutos ?? null,
          baseScore: rec?.baseScore ?? undefined,
          scheme: rec?.scheme ?? undefined,
          fuente: "recomendadas",
          score: rec?.score ?? undefined,
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
        const rec = top[i];
        const name =
          rec?.name ||
          `Recomendación #${i + 1} — ${prettyFoco(rec.foco)} · ${rec.minutos || 30} min`;

        const items =
          Array.isArray(rec?.items) && rec.items.length
            ? rec.items
            : [
                { name: `Foco: ${prettyFoco(rec.foco)}` },
                { name: `Duración estimada: ${rec.minutos || 30} min` },
                { name: `Nivel: ${prettyNivel(rec.nivel)}` },
              ];

        await createRoutineWithToast(user.uid, {
          name,
          items,
          _meta: {
            objetivoId: rec?.objetivoId ?? null,
            nivel: rec?.nivel ?? null,
            foco: rec?.foco ?? null,
            minutos: rec?.minutos ?? null,
            baseScore: rec?.baseScore ?? undefined,
            scheme: rec?.scheme ?? undefined,
            fuente: "recomendadas_top3",
            rankIndex: i,
            score: rec?.score ?? undefined,
          },
        });
      }
      toast.success("Top 3 guardado.");
    } catch (e) {
      console.error(e);
      toast.error("No se pudo guardar el Top 3.");
    } finally {
      setSaving3(false);
    }
  }

  function openDetails(rec, index) {
    setDetail({ ...rec, index });
    setOpen(true);
  }

  return (
    <div className="rtn-wrap">
      <header className="rtn-hero">
        <h1 className="rtn-title">✨ Recomendador de Rutinas</h1>
        <p className="rtn-sub">Elige y guarda hasta tres opciones 💪</p>
      </header>

      <section className="rtn-section">
        <div className="rtn-card form-deco">
          <form className="rtn-form" onSubmit={onRecommend}>
            <div className="rtn-grid-compact">
              <Select label="Sexo" value={form.sexo}
                onChange={(v) => setForm((s) => ({ ...s, sexo: Number(v) }))}
                options={[
                  { value: 0, label: "Prefiero no decir" },
                  { value: 1, label: "Femenino" },
                  { value: 2, label: "Masculino" },
                ]}
              />
              <Input label="Edad" type="number" min={12} max={90} value={form.edad}
                onChange={(v) => setForm((s) => ({ ...s, edad: Number(v) || 18 }))}
              />
              <Select label="Experiencia" value={form.dificultad}
                onChange={(v) => setForm((s) => ({ ...s, dificultad: Number(v) }))}
                options={EXPERIENCIA}
              />
              <Select label="Minutos" value={form.tiempo}
                onChange={(v) => setForm((s) => ({ ...s, tiempo: Number(v) }))}
                options={TIEMPO}
              />
              <Select label="Objetivo" value={form.objetivo}
                onChange={(v) => setForm((s) => ({ ...s, objetivo: Number(v) }))}
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

      <section className="rtn-section">
        <div className="rtn-head">
          <h2>Resultados</h2>
          {!!results.length && <div className="rtn-sec-note">{results.length} opciones</div>}
        </div>

        {results.length === 0 ? (
          <div className="rtn-empty">
            <div className="rtn-empty-ico">🔎</div>
            <div className="rtn-empty-title">Aún no hay recomendaciones</div>
            <div className="rtn-empty-sub">Ajusta los filtros y presiona “Recomendar”.</div>
          </div>
        ) : (
          <div className="rec-grid">
            {results.map((r, i) => (
              <article key={i} className="rec-card">
                <div className="rec-card-head">
                  <div>
                    <h3 className="rec-title">{r.name || "Rutina"}</h3>
                    <span className="rec-rank">#{i + 1}</span>
                  </div>
                  <div className="rec-badges">
                    {r.objetivoId != null && <span className="pill">{labelObjetivo(r.objetivoId)}</span>}
                    {r.nivel != null && <span className="pill">{prettyNivel(r.nivel)}</span>}
                    {r.minutos != null && <span className="pill">{r.minutos} min</span>}
                    {r.explain?.mlSuggest?.metadata?.model_version && (
                      <span className="pill">ML v{r.explain.mlSuggest.metadata.model_version}</span>
                    )}
                    {Number.isFinite(r.score) && <span className="pill">⭐ {r.score.toFixed(2)}</span>}
                  </div>
                </div>

                <div className="rec-body">
                  <ul className="rec-list">
                    <li>Foco: {prettyFoco(r.foco)}</li>
                    <li>Nivel: {prettyNivel(r.nivel)}</li>
                    <li>Duración estimada: {r.minutos || 30} min</li>
                  </ul>
                </div>

                <div className="rec-actions">
                  <button className="btn" onClick={() => saveOne(r)}>Guardar esta</button>
                  <button className="btn-secondary" onClick={() => openDetails(r, i + 1)}>
                    Ver contenido
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      {open && detail && (
        <div className="modal-backdrop" onClick={() => setOpen(false)}>
          <div className="modal modal--xl" onClick={(e) => e.stopPropagation()}>
            <div className="modal-title">
              <strong>#{detail.index}</strong> {detail.name || "Rutina"}
            </div>
            <div className="modal-body modal-body--scroll">
              <div className="rec-badges" style={{ marginBottom: 12 }}>
                {detail.objetivoId != null && <span className="pill">{labelObjetivo(detail.objetivoId)}</span>}
                {detail.nivel != null && <span className="pill">{prettyNivel(detail.nivel)}</span>}
                {detail.minutos != null && <span className="pill">{detail.minutos} min</span>}
                {detail.scheme && <span className="pill">{detail.scheme}</span>}
              </div>
              <ul className="rec-list">
                <li>Foco: {prettyFoco(detail.foco)}</li>
                <li>Duración estimada: {detail.minutos || 30} min</li>
                <li>Score: {Number.isFinite(detail.score) ? detail.score.toFixed(3) : "—"}</li>
                {detail.explain?.mlSuggest?.metadata?.model_version && (
                  <li>Modelo: v{detail.explain.mlSuggest.metadata.model_version}</li>
                )}
              </ul>
            </div>
            <div className="modal-actions">
              <button className="btn" onClick={() => saveOne(detail)}>Guardar esta</button>
              <button className="btn-secondary" onClick={() => setOpen(false)}>Cerrar</button>
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
      <select className="rtn-input" value={value} onChange={(e) => onChange(e.target.value)}>
        {options.map((op) => (
          <option key={op.value} value={op.value}>{op.label}</option>
        ))}
      </select>
    </label>
  );
}
function Input({ label, value, onChange, type = "text", ...rest }) {
  return (
    <label className="rtn-row" style={{ minWidth: 220 }}>
      <span>{label}</span>
      <input className="rtn-input" type={type} value={value} onChange={(e) => onChange(e.target.value)} {...rest} />
    </label>
  );
}
function labelObjetivo(id) {
  const found = OBJETIVOS.find((o) => o.value === id);
  return found ? found.label : "Objetivo";
}
function prettyNivel(n) {
  const map = { 0: "Novato", 1: "Intermedio", 2: "Avanzado", 3: "Pro" };
  return map[n] ?? "—";
}
function prettyFoco(f) {
  if (!f) return "general";
  return String(f).replaceAll("_", " ").toLowerCase();
}
function buildSmallCatalogForDemo() {
  return [
    { id: "c1", name: "Full Body 30", objetivoId: 1, nivel: 0, foco: "fullbody", minutos: 30, baseScore: 0.6, scheme: "fatloss" },
    { id: "c2", name: "Pecho / Espalda 45", objetivoId: 2, nivel: 1, foco: "pecho", minutos: 45, baseScore: 0.7, scheme: "muscle" },
    { id: "c5", name: "Espalda / Bíceps 40", objetivoId: 2, nivel: 1, foco: "espalda", minutos: 40, baseScore: 0.68, scheme: "muscle" },
    { id: "c3", name: "HIIT explosivo", objetivoId: 3, nivel: 1, foco: "hiit", minutos: 20, baseScore: 0.65, scheme: "hiit" },
    { id: "c4", name: "Pierna 60", objetivoId: 4, nivel: 2, foco: "pierna", minutos: 60, baseScore: 0.72, scheme: "recomp" },
  ];
}
