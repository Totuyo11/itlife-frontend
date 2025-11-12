import React, { useMemo, useState } from "react";
import "./Register.css";

/**
 * 🧩 Cómo usar este archivo
 * 1) Pega tu segunda lista (la tuya) dentro de USER_EXERCISES abajo (mismo formato).
 * 2) El componente hace merge automático por `id` y elimina duplicados.
 * 3) Soporta campos extra: `desc` (descripción corta) e `img` (URL de imagen).
 * 4) Si más adelante migras a Firestore, puedes reemplazar `ALL_SOURCES` con datos remotos.
 */

// 👉 Lista de tu compañero (la que nos pasaste)
const COMPANION_EXERCISES = [
  { id: "p-press-banca", name: "Press de banca", muscle: "Pecho", level: "intermedio", equip: "barra", focus: ["fuerza"], img: null },
  { id: "p-press-mancuerna", name: "Press con mancuerna", muscle: "Pecho", level: "principiante", equip: "mancuerna", focus: ["fuerza"], img: null },
  { id: "p-press-over-mancuerna", name: "Pull over con mancuerna", muscle: "Pecho", level: "principiante", equip: "mancuerna", focus: ["fuerza"], img: null },
  { id: "p-aperturas", name: "Aperturas con mancuernas", muscle: "Pecho", level: "principiante", equip: "mancuernas", focus: ["hipertrofia"], img: null },
  { id: "p-press-banca-inclinado", name: "Press de banca inclinado", muscle: "Pecho", level: "avanzado", equip: "barra", focus: ["fuerza"], img: null },

  { id: "e-remoconbarra", name: "Remo con barra", muscle: "Espalda", level: "avanzado", equip: "barra", focus: ["fuerza"], img: null },
  { id: "e-remoenpunta", name: "Remo en punta", muscle: "Espalda", level: "principiante", equip: "barra", focus: ["hipertrofia"], img: null },
  { id: "e-jalonpolea", name: "Jalon de polea al pecho", muscle: "Espalda", level: "principiante", equip: "polea", focus: ["hipertrofia"], img: null },
  { id: "e-remopolea", name: "Remo con polea", muscle: "Espalda", level: "principiante", equip: "polea", focus: ["hipertrofia"], img: null },

  { id: "h-sentadilla", name: "Sentadilla", muscle: "Pierna", level: "principiante", equip: "barra", focus: ["fuerza","hipertrofia"], img: null },
  { id: "h-prensa", name: "Prensa", muscle: "Pierna", level: "principiante", equip: "máquina", focus: ["hipertrofia"], img: null },
  { id: "h-pesomuerto", name: "Peso muerto", muscle: "Pierna", level: "intermedio", equip: "barra", focus: ["resistencia"], img: null },
  { id: "h-aductores", name: "Aductores", muscle: "Pierna", level: "principiante", equip: "máquina", focus: ["hipertrofia"], img: null },
  { id: "h-elevacionpierna", name: "Elevación pierna lateral", muscle: "Pierna", level: "principiante", equip: "polea", focus: ["hipertrofia"], img: null },

  { id: "b-curl-biceps", name: "Curl de bíceps", muscle: "Brazo", level: "principiante", equip: "mancuernas", focus: ["hipertrofia"], img: null },
  { id: "b-curl-concentrado", name: "Curl concentrado", muscle: "Brazo", level: "principiante", equip: "mancuernas", focus: ["hipertrofia"], img: null },
  { id: "b-curl-barra", name: "Curl con barra", muscle: "Brazo", level: "principiante", equip: "barra", focus: ["hipertrofia"], img: null },
  { id: "b-predicador", name: "Predicador", muscle: "Brazo", level: "principiante", equip: "mancuernas", focus: ["hipertrofia"], img: null },

  { id: "o-press-militar", name: "Press militar", muscle: "Hombro", level: "intermedio", equip: "barra", focus: ["fuerza"], img: null },
  { id: "o-press-mancuernas", name: "Press con mancuernas", muscle: "Hombro", level: "intermedio", equip: "mancuernas", focus: ["fuerza"], img: null },
  { id: "o-elevacion-frontal", name: "Elevacion frontal", muscle: "Hombro", level: "principiante", equip: "mancuernas", focus: ["fuerza"], img: null },
  { id: "o-press-frontal", name: "Press frontal con mancuernas", muscle: "Hombro", level: "intermedio", equip: "mancuernas", focus: ["fuerza"], img: null },

  { id: "c-plancha", name: "Plancha", muscle: "Abdomen", level: "principiante", equip: "peso corporal", focus: ["estabilidad"], img: null },
  { id: "c-elevacion-vertical", name: "Elevacion vertical de piernas", muscle: "Abdomen", level: "principiante", equip: "peso corporal", focus: ["estabilidad"], img: null },
  { id: "c-tijeras", name: "Tijeras", muscle: "Abdomen", level: "principiante", equip: "peso corporal", focus: ["estabilidad"], img: null },
  { id: "c-Elevacion-pelvis", name: "Elevacion de pelvis en banco vertical", muscle: "Abdomen", level: "principiante", equip: "peso corporal", focus: ["estabilidad"], img: null },
];

// 👉 Pega aquí tu lista (misma estructura). Si aún no la tienes a la mano, déjalo vacío y vuelve luego.
const USER_EXERCISES = [
  // === TUS ORIGINALES (con desc + img) ===
  { id: "p-press-banca", name: "Press de banca", muscle: "pecho", level: "intermedio", equip: "barra", focus: ["fuerza"], img: "/img/exercises/press-banca.jpg", desc: "Tumbado en banco plano, baja la barra al pecho con codos ~45° y empuja controlado. Escápulas retraídas y pies firmes." },
  { id: "p-aperturas", name: "Aperturas con mancuernas", muscle: "pecho", level: "principiante", equip: "mancuernas", focus: ["hipertrofia"], img: "/img/exercises/aperturas-mancuernas.jpg", desc: "Abre en semicurva hasta estirar pectoral; codos ligeramente flexionados. Cierra sin chocar mancuernas." },
  { id: "e-dominadas", name: "Dominadas", muscle: "espalda", level: "avanzado", equip: "peso corporal", focus: ["fuerza"], img: "/img/exercises/dominadas.jpg", desc: "Tira hasta pasar mentón, baja controlado. Activa dorsales y core; evita balanceo." },
  { id: "e-remopolea", name: "Remo en polea", muscle: "espalda", level: "principiante", equip: "polea", focus: ["hipertrofia"], img: "/img/exercises/remo-polea.jpg", desc: "Espalda neutra; tira al ombligo llevando hombros atrás. Controla el retorno." },
  { id: "h-sentadilla", name: "Sentadilla", muscle: "pierna", level: "intermedio", equip: "barra", focus: ["fuerza","hipertrofia"], img: "/img/exercises/sentadilla.jpg", desc: "Baja con cadera atrás y rodillas alineadas. Talones apoyados; columna neutra." },
  { id: "h-prensa", name: "Prensa", muscle: "pierna", level: "principiante", equip: "máquina", focus: ["hipertrofia"], img: "/img/exercises/prensa.jpg", desc: "Desciende sin despegar cadera del respaldo. Extiende sin bloquear rodillas." },
  { id: "h-zancadas", name: "Zancadas", muscle: "pierna", level: "intermedio", equip: "mancuernas", focus: ["resistencia"], img: "/img/exercises/zancadas.jpg", desc: "Paso largo al frente; baja controlado con tronco erguido. Empuja con el talón para volver." },
  { id: "h-curl-biceps", name: "Curl de bíceps", muscle: "brazo", level: "principiante", equip: "mancuernas", focus: ["hipertrofia"], img: "/img/exercises/curl-biceps.jpg", desc: "Codos pegados; flexiona y extiende sin balancear. Control en la bajada." },
  { id: "h-press-militar", name: "Press militar", muscle: "hombro", level: "intermedio", equip: "barra", focus: ["fuerza"], img: "/img/exercises/press-militar.jpg", desc: "Empuja la barra por encima de la cabeza con core firme; evita arquear lumbar." },
  { id: "c-plancha", name: "Plancha", muscle: "core", level: "principiante", equip: "peso corporal", focus: ["estabilidad"], img: "/img/exercises/plancha.jpg", desc: "Alinea hombros–cadera–tobillos; abdomen y glúteo activos. No hundas la lumbar." },

  // === NUEVOS PARA LLEGAR ~30 (IDs únicos) ===
  { id: "p-press-mancuernas-plano", name: "Press con mancuernas plano", muscle: "pecho", level: "principiante", equip: "mancuernas", focus: ["hipertrofia"], img: "/img/exercises/press-mancuernas-plano.jpg", desc: "Similar al press, recorrido estable y controlado; mancuernas permiten mayor rango y estabilidad bilateral." },
  { id: "p-cruces-polea", name: "Cruces en polea", muscle: "pecho", level: "intermedio", equip: "polea", focus: ["hipertrofia"], img: "/img/exercises/cruces-polea.jpg", desc: "Desde poleas altas, junta manos frente al pecho con ligera flexión de codos. Mantén tensión constante." },
  { id: "p-flexiones", name: "Flexiones (lagartijas)", muscle: "pecho", level: "principiante", equip: "peso corporal", focus: ["resistencia"], img: "/img/exercises/flexiones.jpg", desc: "Cuerpo alineado; baja pecho cercano al suelo y empuja fuerte. Manos al ancho de hombros." },
  { id: "p-press-declinado", name: "Press declinado", muscle: "pecho", level: "intermedio", equip: "barra", focus: ["fuerza"], img: "/img/exercises/press-declinado.jpg", desc: "Banco declinado; baja controlado a la parte baja del pecho, empuja vertical. Enfatiza pectoral inferior." },

  { id: "e-jalon-cerrado", name: "Jalón agarre cerrado", muscle: "espalda", level: "principiante", equip: "polea", focus: ["hipertrofia"], img: "/img/exercises/jalon-cerrado.jpg", desc: "Agarre neutro/cerrado; tira al esternón llevando codos pegados. Controla la subida." },
  { id: "e-face-pull", name: "Face pull", muscle: "espalda", level: "intermedio", equip: "polea", focus: ["estabilidad"], img: "/img/exercises/face-pull.jpg", desc: "Con cuerda a cara, tira separando manos y llevando codos altos. Activa deltoide posterior y escápulas." },
  { id: "e-pull-over-polea", name: "Pull-over en polea (dorsal)", muscle: "espalda", level: "intermedio", equip: "polea", focus: ["hipertrofia"], img: "/img/exercises/pull-over-polea.jpg", desc: "Brazos casi extendidos, lleva la barra de arriba hacia los muslos con dorsales. Evita flexionar codos en exceso." },
  { id: "e-remo-mancuerna", name: "Remo con mancuerna a una mano", muscle: "espalda", level: "principiante", equip: "mancuernas", focus: ["hipertrofia"], img: "/img/exercises/remo-mancuerna-una-mano.jpg", desc: "Apoya rodilla y mano en banco; tira la mancuerna al costado del torso sin rotar tronco." },

  { id: "h-bulgara", name: "Sentadilla búlgara", muscle: "pierna", level: "intermedio", equip: "mancuernas", focus: ["hipertrofia","estabilidad"], img: "/img/exercises/sentadilla-bulgara.jpg", desc: "Pie trasero elevado; baja vertical controlado y empuja con el talón delantero. Gran estímulo de glúteo y cuádriceps." },
  { id: "h-extension-cuadriceps", name: "Extensión de cuádriceps", muscle: "pierna", level: "principiante", equip: "máquina", focus: ["hipertrofia"], img: "/img/exercises/extension-cuadriceps.jpg", desc: "Extiende la pierna en máquina manteniendo cadera pegada al asiento. Pausa arriba; baja controlado." },
  { id: "h-curl-femoral", name: "Curl femoral tumbado", muscle: "pierna", level: "principiante", equip: "máquina", focus: ["hipertrofia"], img: "/img/exercises/curl-femoral.jpg", desc: "Flexiona rodillas llevando el rodillo hacia glúteos; controla el retorno sin despegar cadera." },
  { id: "h-abduccion-polea", name: "Abducción en polea", muscle: "pierna", level: "intermedio", equip: "polea", focus: ["estabilidad"], img: "/img/exercises/abduccion-polea.jpg", desc: "Tobillera en polea baja; aleja la pierna hacia fuera controlando tronco. Activa glúteo medio." },
  { id: "h-step-up", name: "Step-up en banco", muscle: "pierna", level: "principiante", equip: "mancuernas", focus: ["resistencia"], img: "/img/exercises/step-up.jpg", desc: "Sube al banco con una pierna empujando desde el talón y baja controlado. Alterna piernas." },

  { id: "o-press-arnold", name: "Press Arnold", muscle: "hombro", level: "intermedio", equip: "mancuernas", focus: ["hipertrofia"], img: "/img/exercises/press-arnold.jpg", desc: "Inicia con palmas hacia ti, rota durante el empuje hasta llevarlas al frente arriba. Controla la bajada." },
  { id: "o-pajaros", name: "Pájaros (deltoide posterior)", muscle: "hombro", level: "principiante", equip: "mancuernas", focus: ["hipertrofia"], img: "/img/exercises/pajaros.jpg", desc: "Tronco inclinado; abre brazos en arco activando deltoide posterior. Evita encoger trapecios." },
  { id: "o-remo-menton", name: "Remo al mentón con barra", muscle: "hombro", level: "intermedio", equip: "barra", focus: ["hipertrofia"], img: "/img/exercises/remo-menton.jpg", desc: "Tira la barra hacia el pecho/mentón con codos altos. Rango cómodo; evita dolor en hombro." },

  { id: "b-triceps-polea", name: "Extensión de tríceps en polea", muscle: "brazo", level: "principiante", equip: "polea", focus: ["hipertrofia"], img: "/img/exercises/triceps-polea.jpg", desc: "Codos pegados; extiende hacia abajo y bloquea suave, sube controlado sin despegar codos." },
  { id: "b-press-frances", name: "Press francés", muscle: "brazo", level: "intermedio", equip: "barra EZ", focus: ["hipertrofia"], img: "/img/exercises/press-frances.jpg", desc: "Acostado, baja la barra hacia la frente y extiende. Codos fijos apuntando arriba." },
  { id: "b-martillo", name: "Curl martillo", muscle: "brazo", level: "principiante", equip: "mancuernas", focus: ["hipertrofia"], img: "/img/exercises/curl-martillo.jpg", desc: "Agarre neutro; sube y baja controlado para trabajar braquial y braquiorradial." },
  { id: "b-fondos-triceps", name: "Fondos en paralelas (tríceps)", muscle: "brazo", level: "intermedio", equip: "peso corporal", focus: ["fuerza"], img: "/img/exercises/fondos-triceps.jpg", desc: "Tronco más vertical, codos pegados. Desciende controlado y empuja extendiendo codos." },

  { id: "c-hollow-hold", name: "Hollow hold", muscle: "core", level: "intermedio", equip: "peso corporal", focus: ["estabilidad"], img: "/img/exercises/hollow-hold.jpg", desc: "Boca arriba, despega hombros y piernas manteniendo zona lumbar pegada al suelo. Respira sin perder tensión." },
  { id: "c-rueda-abdominal", name: "Rueda abdominal (ab wheel)", muscle: "core", level: "intermedio", equip: "rueda", focus: ["estabilidad"], img: "/img/exercises/rueda-abdominal.jpg", desc: "Desde rodillas, rueda hacia delante manteniendo core firme sin colapsar la lumbar; regresa con control." }
];

// ========= Utilidades =========
const DEFAULT_EX = { focus: [], equip: "", level: "principiante", muscle: "Otro" };

function normalize(e) {
  const x = { ...DEFAULT_EX, ...e };
  // corrige valores escritos con mayúsculas/minúsculas variadas
  x.muscle = capitalizeWords(String(x.muscle || "Otro"));
  x.level = String(x.level || "principiante").toLowerCase();
  if (!Array.isArray(x.focus)) x.focus = x.focus ? [String(x.focus)] : [];
  return x;
}

function mergeExercises(...lists) {
  const map = new Map();
  lists.flat().forEach((raw) => {
    if (!raw || !raw.id) return;
    const cur = map.get(raw.id);
    const next = normalize(raw);
    // preferir el que tenga más campos (desc, img, focus con mayor longitud)
    if (!cur) {
      map.set(raw.id, next);
    } else {
      const merged = {
        ...cur,
        ...next,
        focus: (cur.focus?.length || 0) >= (next.focus?.length || 0) ? cur.focus : next.focus,
      };
      map.set(raw.id, merged);
    }
  });
  return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name));
}

function capitalizeWords(s) {
  return s.replace(/\p{L}+/gu, (t) => t[0].toUpperCase() + t.slice(1).toLowerCase());
}

function uniqueValues(xs, key) {
  return Array.from(new Set(xs.map((x) => x[key])));
}

function Badge({ children, tone = "pink" }) {
  return <span className={`bx-badge bx-${tone}`}>{children}</span>;
}

// ========= Dataset combinado =========
const ALL_SOURCES = [COMPANION_EXERCISES, USER_EXERCISES];
const ALL_EXERCISES = mergeExercises(...ALL_SOURCES);

const MUSCLES = uniqueValues(ALL_EXERCISES, "muscle");
const LEVELS = ["principiante", "intermedio", "avanzado"]; // catálogo fijo

export default function Ejercicios() {
  const [q, setQ] = useState("");
  const [muscle, setMuscle] = useState("todos");
  const [level, setLevel] = useState("todos");
  const [show, setShow] = useState(null); // id de ejercicio

  const results = useMemo(() => {
    const term = q.trim().toLowerCase();
    return ALL_EXERCISES.filter((e) => {
      const okQ =
        term.length === 0 ||
        e.name.toLowerCase().includes(term) ||
        e.muscle.toLowerCase().includes(term) ||
        String(e.equip).toLowerCase().includes(term);
      const okM = muscle === "todos" || e.muscle === muscle;
      const okL = level === "todos" || e.level === level;
      return okQ && okM && okL;
    });
  }, [q, muscle, level]);

  const selected = show ? ALL_EXERCISES.find((r) => r.id === show) : null;

  return (
    <div className="ex-wrap">
      {/* Header */}
      <header className="ex-head">
        <div>
          <div className="brand-mini">🏋 FitLife</div>
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
              {e.img ? (
                <img src={e.img} alt={`Ilustración de ${e.name}`} />
              ) : (
                <div className={`ex-thumb-deco m-${e.muscle}`} />
              )}
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

      {/* Modal detalle */}
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

              {selected.img && (
                <div className="modal-figure">
                  <img src={selected.img} alt={`Demostración de ${selected.name}`} />
                </div>
              )}

              <ul className="ex-tips">
                {selected.desc ? (
                  <li>{selected.desc}</li>
                ) : null}
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
