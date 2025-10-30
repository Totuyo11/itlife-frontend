import React, { useMemo, useState } from "react";
import "./Register.css";

// 👉 Demo de ejercicios (reemplaza luego con Firestore)
const ALL_EXERCISES = [
  { id: "p-press-banca", name: "Press de banca", muscle: "pecho", level: "intermedio", equip: "barra", focus: ["fuerza"], img: null },
  { id: "p-aperturas", name: "Aperturas con mancuernas", muscle: "pecho", level: "principiante", equip: "mancuernas", focus: ["hipertrofia"], img: null },
  { id: "e-dominadas", name: "Dominadas", muscle: "espalda", level: "avanzado", equip: "peso corporal", focus: ["fuerza"], img: null },
  { id: "e-remopolea", name: "Remo en polea", muscle: "espalda", level: "principiante", equip: "polea", focus: ["hipertrofia"], img: null },
  { id: "h-sentadilla", name: "Sentadilla", muscle: "pierna", level: "intermedio", equip: "barra", focus: ["fuerza","hipertrofia"], img: null },
  { id: "h-prensa", name: "Prensa", muscle: "pierna", level: "principiante", equip: "máquina", focus: ["hipertrofia"], img: null },
  { id: "h-zancadas", name: "Zancadas", muscle: "pierna", level: "intermedio", equip: "mancuernas", focus: ["resistencia"], img: null },
  { id: "h-curl-biceps", name: "Curl de bíceps", muscle: "brazo", level: "principiante", equip: "mancuernas", focus: ["hipertrofia"], img: null },
  { id: "h-press-militar", name: "Press militar", muscle: "hombro", level: "intermedio", equip: "barra", focus: ["fuerza"], img: null },
  { id: "c-plancha", name: "Plancha", muscle: "core", level: "principiante", equip: "peso corporal", focus: ["estabilidad"], img: null },
];

const MUSCLES = ["pecho", "espalda", "pierna", "hombro", "brazo", "core"];
const LEVELS = ["principiante", "intermedio", "avanzado"];

function Badge({ children, tone = "pink" }) {
  return <span className={`bx-badge bx-${tone}`}>{children}</span>;
}

export default function Ejercicios() {
  const [q, setQ] = useState("");
  const [muscle, setMuscle] = useState("todos");
  const [level, setLevel] = useState("todos");
  const [show, setShow] = useState(null); // guarda id de ejercicio

  const results = useMemo(() => {
    const term = q.trim().toLowerCase();
    return ALL_EXERCISES.filter((e) => {
      const okQ =
        term.length === 0 ||
        e.name.toLowerCase().includes(term) ||
        e.muscle.toLowerCase().includes(term) ||
        e.equip.toLowerCase().includes(term);
      const okM = muscle === "todos" || e.muscle === muscle;
      const okL = level === "todos" || e.level === level;
      return okQ && okM && okL;
    });
  }, [q, muscle, level]);

  // ejercicio seleccionado para el modal
  const selected = show ? ALL_EXERCISES.find((r) => r.id === show) : null;

  return (
    <div className="ex-wrap">
      {/* Header */}
      <header className="ex-head">
        <div>
          <div className="brand-mini">🏋️ FitLife</div>
          <h1 className="ex-title">Explora ejercicios</h1>
          <p className="ex-sub">Filtra por grupo muscular, nivel y equipo. Toca una tarjeta para tips rápidos.</p>
        </div>
        <div className="ex-kpis">
          <div className="ex-kpi">
            <div className="ex-kpi-top">{ALL_EXERCISES.length}</div>
            <div className="ex-kpi-foot">en biblioteca</div>
          </div>
          <div className="ex-kpi">
            <div className="ex-kpi-top">{results.length}</div>
            <div className="ex-kpi-foot">coincidencias</div>
          </div>
        </div>
      </header>

      {/* Filtros */}
      <section className="ex-filters">
        <div className="ex-search">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar: “sentadilla”, “mancuernas”…"
            aria-label="Buscar ejercicios"
          />
        </div>

        <div className="ex-chips" role="tablist" aria-label="Grupos musculares">
          <button className={`chip ${muscle === "todos" ? "chip-active" : ""}`} onClick={() => setMuscle("todos")}>
            Todos
          </button>
          {MUSCLES.map((m) => (
            <button
              key={m}
              className={`chip ${muscle === m ? "chip-active" : ""}`}
              onClick={() => setMuscle(m)}
            >
              {m}
            </button>
          ))}
        </div>

        <div className="ex-levels">
          <label className="sr-only" htmlFor="level">Nivel</label>
          <select id="level" value={level} onChange={(e) => setLevel(e.target.value)}>
            <option value="todos">Todos los niveles</option>
            {LEVELS.map((l) => (
              <option key={l} value={l}>{l[0].toUpperCase() + l.slice(1)}</option>
            ))}
          </select>
        </div>
      </section>

      {/* Grid */}
      <section className="ex-grid">
        {results.map((e) => (
          <article
            key={e.id}
            className="ex-card"
            onClick={() => setShow(e.id)}
            onKeyDown={(ev) => ev.key === "Enter" && setShow(e.id)}
            role="button"
            tabIndex={0}
          >
            <div className="ex-thumb" aria-hidden="true">
              <div className={`ex-thumb-deco m-${e.muscle}`} />
            </div>
            <div className="ex-body">
              <h3 className="ex-name">{e.name}</h3>
              <div className="ex-tags">
                <Badge tone="pink">{e.muscle}</Badge>
                <Badge tone="indigo">{e.level}</Badge>
                <Badge tone="slate">{e.equip}</Badge>
              </div>
            </div>
          </article>
        ))}

        {results.length === 0 && (
          <div className="ex-empty">
            <div className="ex-empty-ico">🧐</div>
            <p>No encontramos resultados. Prueba otra búsqueda o quita filtros.</p>
          </div>
        )}
      </section>

      {/* Modal detalle (sin IIFE, sin non-null) */}
      {selected && (
        <div className="modal-backdrop" onClick={() => setShow(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3 className="modal-title">{selected.name}</h3>
            <div className="modal-body">
              <div className="ex-tags">
                <Badge tone="pink">{selected.muscle}</Badge>
                <Badge tone="indigo">{selected.level}</Badge>
                <Badge tone="slate">{selected.equip}</Badge>
                {selected.focus.map((f) => (
                  <Badge key={f} tone="emerald">{f}</Badge>
                ))}
              </div>
              <ul className="ex-tips">
                <li>Calienta 5–10 min antes.</li>
                <li>Controla el rango de movimiento.</li>
                <li>Respira: esfuerzo al exhalar.</li>
                <li>Empieza ligero y progresa.</li>
              </ul>
            </div>
            <div className="modal-actions">
              <button className="btn-secondary" onClick={() => setShow(null)}>Cerrar</button>
              <button className="btn">Agregar a rutina (próximamente)</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

