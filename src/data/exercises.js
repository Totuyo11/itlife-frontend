// src/data/exercises.js
// Lista combinada y normalizada de ejercicios para usarse
// tanto en la pantalla de Ejercicios como en el recomendador con IA.

// 👉 Lista de tu compañero (versión completa que ya tenías)
const COMPANION_EXERCISES = [
  { id: "p-press-banca", name: "Press de banca", muscle: "Pecho", level: "intermedio", equip: "barra", focus: ["fuerza"], img: null },
  { id: "p-press-mancuerna", name: "Press con mancuerna", muscle: "Pecho", level: "principiante", equip: "mancuerna", focus: ["fuerza"], img: null },
  { id: "p-press-over-mancuerna", name: "Pull over con mancuerna", muscle: "Pecho", level: "principiante", equip: "mancuerna", focus: ["fuerza"], img: null },
  { id: "p-aperturas", name: "Aperturas con mancuernas", muscle: "Pecho", level: "principiante", equip: "mancuernas", focus: ["hipertrofia"], img: null },

  { id: "e-remoconbarra", name: "Remo con barra", muscle: "Espalda", level: "avanzado", equip: "barra", focus: ["fuerza"], img: null },
  { id: "e-remoenpunta", name: "Remo en punta", muscle: "Espalda", level: "principiante", equip: "barra", focus: ["hipertrofia"], img: null },
  { id: "e-jalonpolea", name: "Jalon de polea al pecho", muscle: "Espalda", level: "principiante", equip: "polea", focus: ["hipertrofia"], img: null },
  { id: "e-remopolea", name: "Remo con polea", muscle: "Espalda", level: "principiante", equip: "polea", focus: ["hipertrofia"], img: null },

  { id: "h-sentadilla", name: "Sentadilla", muscle: "Pierna", level: "principiante", equip: "barra", focus: ["fuerza", "hipertrofia"], img: null },
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

// 👉 Lista extendida (la que pegaste con imágenes + descripciones)
const USER_EXERCISES = [
  { id: "p-aperturas", name: "Aperturas con mancuernas", muscle: "pecho", level: "principiante", equip: "mancuernas", focus: ["hipertrofia"], img: "/img/exercises/apertura-mancuerna.png", desc: "Abre en semicurva hasta estirar pectoral; codos ligeramente flexionados. Cierra sin chocar mancuernas." },
  { id: "p-cruces-polea", name: "Cruces en polea", muscle: "pecho", level: "intermedio", equip: "polea", focus: ["hipertrofia"], img: "/img/exercises/cruce-polea.png", desc: "Hay que situarse de pie entre las dos poleas, con las piernas semiflexionadas, con el tronco ligeramente flexionado y con la fijación de los músculos abdominales. Se parte de los brazos en cruz y los codos semiflexionados, se juntan cerrándose a modo de abrazo, al frente y abajo sin variar la flexión del codo en todo el recorrido. Se inspira al abrir y se espira al terminar de cerrar." },
  { id: "p-flexiones", name: "Flexiones", muscle: "pecho", level: "principiante", equip: "peso corporal", focus: ["resistencia"], img: "/img/exercises/flexiones.png", desc: "Tumbados mirando al suelo (decúbito prono)... La cadera no debe doblarse, el cuerpo baja rígido y alineado como una tabla. Se inspira en la bajada y se espira en la subida." },
  { id: "p-press-mancuerna", name: "Press con mancuerna", muscle: "Pecho", level: "principiante", equip: "mancuerna", focus: ["fuerza"], img: "/img/exercises/p-press-mancuerna.png", desc: "Tumbado sobre un banco plano... Se inspira en la bajada y se espira al terminar de subir." },
  { id: "p-press-mancuernas-plano", name: "Press con mancuernas plano", muscle: "pecho", level: "principiante", equip: "mancuernas", focus: ["hipertrofia"], img: "/img/exercises/p-press-mancuerna.png", desc: "Tumbado sobre un banco plano... recorrido estable, controlado y simétrico." },
  { id: "p-press-banca", name: "Press de banca", muscle: "pecho", level: "intermedio", equip: "barra", focus: ["fuerza"], img: "/img/exercises/p-press-banca.png", desc: "Tumbado sobre un banco plano... baja la barra al pecho y empuja verticalmente de forma controlada." },
  { id: "p-press-declinado", name: "Press inclinado", muscle: "pecho", level: "intermedio", equip: "barra", focus: ["fuerza"], img: "/img/exercises/p-press-banca-inclinado.png", desc: "Tumbado sobre un banco inclinado 30º–45º... enfatiza la parte superior del pectoral." },
  { id: "p-press-over-mancuerna", name: "Pull over con mancuerna", muscle: "Pecho", level: "principiante", equip: "mancuerna", focus: ["fuerza"], img: "/img/exercises/p-press-over-mancuerna.png", desc: "Tumbado sobre un banco, baja la mancuerna por detrás de la cabeza con codos semiflexionados, sintiendo el estiramiento del pectoral." },

  { id: "h-abduccion-polea", name: "Elevación de talones sentado", muscle: "pierna", level: "intermedio", equip: "polea", focus: ["estabilidad"], img: "/img/exercises/talon.png", desc: "Sentado con las rodillas flexionadas en 90º, apoya sólo el metatarso en un escalón y eleva talones al máximo recorrido." },
  { id: "h-aductores", name: "Aductores", muscle: "Pierna", level: "principiante", equip: "máquina", focus: ["hipertrofia"], img: "/img/exercises/aductores.png", desc: "Sentado en la máquina de aductores, abre hasta tu rango cómodo y cierra en aducción controlada." },
  { id: "h-curl-femoral", name: "Curl femoral", muscle: "pierna", level: "principiante", equip: "máquina", focus: ["hipertrofia"], img: "/img/exercises/curl.png", desc: "En decúbito prono, flexiona las rodillas llevando el rodillo hacia los talones sin despegar la cadera del banco." },
  { id: "h-elevacionpierna", name: "Elevación pierna lateral", muscle: "Pierna", level: "principiante", equip: "polea", focus: ["hipertrofia"], img: "/img/exercises/pierna-lateral.png", desc: "De pie, lleva la pierna en abducción sin mover el tronco. Controla tanto la subida como la bajada." },
  { id: "h-extension-cuadriceps", name: "Extensión de cuádriceps", muscle: "pierna", level: "principiante", equip: "máquina", focus: ["hipertrofia"], img: "/img/exercises/extension-cuadri.png", desc: "En máquina, extiende la pierna desde 90º hasta casi la extensión completa en control excéntrico." },
  { id: "h-pesomuerto", name: "Peso muerto", muscle: "Pierna", level: "intermedio", equip: "barra", focus: ["resistencia"], img: "/img/exercises/peso-muerto.png", desc: "De pie, flexiona la cadera manteniendo la barra cerca del cuerpo y la espalda neutra." },
  { id: "h-prensa", name: "Prensa", muscle: "pierna", level: "principiante", equip: "máquina", focus: ["hipertrofia"], img: "/img/exercises/prensa.png", desc: "En prensa inclinada, baja sin despegar la cadera y empuja hasta casi extender rodillas." },
  { id: "h-sentadilla", name: "Sentadilla", muscle: "pierna", level: "intermedio", equip: "barra", focus: ["fuerza", "hipertrofia"], img: "/img/exercises/sentadilla.png", desc: "De pie, pies ligeramente abiertos, baja flexionando rodillas sin levantar talones y manteniendo abdomen activo." },
  { id: "h-bulgara", name: "Patadas de glúteo", muscle: "pierna", level: "intermedio", equip: "mancuernas", focus: ["hipertrofia", "estabilidad"], img: "/img/exercises/patadas.png", desc: "En posición cuadrúpeda, lanza patadas hacia arriba con la rodilla flexionada, activando glúteos." },
  { id: "h-step-up", name: "Elevación de talones en máquina", muscle: "pierna", level: "principiante", equip: "mancuernas", focus: ["resistencia"], img: "/img/exercises/talones.png", desc: "De pie, metatarso en el borde de un escalón, eleva y desciende talones de forma controlada." },
  { id: "h-zancadas", name: "Zancadas", muscle: "pierna", level: "intermedio", equip: "mancuernas", focus: ["resistencia"], img: "/img/exercises/zancada.png", desc: "Da un paso largo al frente, baja con control y regresa impulsando con la pierna adelantada." },

  { id: "b-curl-barra", name: "Curl con barra", muscle: "Brazo", level: "principiante", equip: "barra", focus: ["hipertrofia"], img: "/img/exercises/b-curl-barra.png", desc: "De pie, con tronco fijo, flexiona los codos llevando la barra hacia los hombros sin balancear." },
  { id: "b-curl-concentrado", name: "Curl concentrado", muscle: "Brazo", level: "principiante", equip: "mancuernas", focus: ["hipertrofia"], img: "/img/exercises/b-curl-concentrado.png", desc: "Sentado, apoya el codo en la cara interna del muslo y realiza el curl de forma estricta." },
  { id: "b-curl-biceps", name: "Curl en polea", muscle: "Brazo", level: "principiante", equip: "mancuernas", focus: ["hipertrofia"], img: "/img/exercises/curl-polea.png", desc: "De pie, de lado a la polea, tira del mango hacia el cuello manteniendo el codo fijo." },
  { id: "b-martillo", name: "Extensiones en polea", muscle: "brazo", level: "principiante", equip: "mancuernas", focus: ["hipertrofia"], img: "/img/exercises/extension-polea.png", desc: "Frente a la polea alta, baja la barra en extensión manteniendo codos pegados al tronco." },
  { id: "b-triceps-polea", name: "Extensión de mancuerna a dos manos", muscle: "brazo", level: "principiante", equip: "polea", focus: ["hipertrofia"], img: "/img/exercises/copa.png", desc: "De pie o sentado, baja la mancuerna por detrás de la cabeza y extiende sin abrir los codos." },
  { id: "b-fondos-triceps", name: "Fondos en paralelas (tríceps)", muscle: "brazo", level: "intermedio", equip: "peso corporal", focus: ["fuerza"], img: "/img/exercises/fondos.png", desc: "En paralelas, desciende en vertical con codos pegados y extiende hasta arriba." },
  { id: "b-predicador", name: "Predicador", muscle: "Brazo", level: "principiante", equip: "mancuernas", focus: ["hipertrofia"], img: "/img/exercises/b-predicador.png", desc: "Con tríceps apoyado en el banco, baja casi a extensión completa y sube sin perder tensión." },
  { id: "b-press-frances", name: "Press francés", muscle: "brazo", level: "intermedio", equip: "barra EZ", focus: ["hipertrofia"], img: "/img/exercises/press-francess.png", desc: "Acostado, baja la barra hacia la frente manteniendo codos fijos y extiende sin bloquear." },
  { id: "b-extension-polea-cuerda", name: "Extensiones en polea con cuerda", muscle: "brazo", level: "intermedio", equip: "poleas", focus: ["hipertrofia"], img: "/img/exercises/cuerda.png", desc: "Frente a la polea, extiende los codos hacia abajo separando ligeramente las puntas de la cuerda." },

  { id: "e-dominadas", name: "Dominadas", muscle: "espalda", level: "avanzado", equip: "peso corporal", focus: ["fuerza"], img: "/img/exercises/dominadas.png", desc: "En barra fija, tira hasta acercar el pecho a la barra y baja controlado." },
  { id: "e-jalonpolea", name: "Jalon de polea al pecho", muscle: "Espalda", level: "principiante", equip: "polea", focus: ["hipertrofia"], img: "/img/exercises/jalon-polea-pecho.png", desc: "Sentado, tira de la barra hacia la parte superior del pectoral arqueando ligeramente la espalda." },
  { id: "e-pull-over-polea", name: "Pull-over en polea (dorsal)", muscle: "espalda", level: "intermedio", equip: "polea", focus: ["hipertrofia"], img: "/img/exercises/polea-espalda.png", desc: "De pie, baja la barra desde arriba hacia los muslos manteniendo codos casi extendidos." },
  { id: "e-remoconbarra", name: "Remo con barra", muscle: "Espalda", level: "avanzado", equip: "barra", focus: ["fuerza"], img: "/img/exercises/remo-barra.png", desc: "Con tronco inclinado, tira de la barra hacia el abdomen manteniendo espalda recta." },
  { id: "e-remo-mancuerna", name: "Remo con mancuerna a una mano", muscle: "espalda", level: "principiante", equip: "mancuernas", focus: ["hipertrofia"], img: "/img/exercises/remo-mancuerna.png", desc: "Apoya una mano y rodilla en el banco y tira la mancuerna hacia la cadera sin rotar tronco." },
  { id: "e-remopolea", name: "Remo en polea", muscle: "espalda", level: "principiante", equip: "polea", focus: ["hipertrofia"], img: "/img/exercises/remo-polea.png", desc: "Sentado frente a la polea, tira el mango al abdomen ensanchando el pecho." },
  { id: "e-remoenpunta", name: "Remo en punta", muscle: "Espalda", level: "principiante", equip: "barra", focus: ["hipertrofia"], img: "/img/exercises/remo-punta.png", desc: "Con barra T, tira hacia el abdomen con codos abiertos y tronco inclinado." },

  { id: "c-Elevacion-pelvis", name: "Elevacion de pelvis en banco vertical", muscle: "Abdomen", level: "principiante", equip: "peso corporal", focus: ["estabilidad"], img: "/img/exercises/elevacion-pelvis.png", desc: "En banco vertical, eleva piernas y enrolla la pelvis hacia el esternón." },
  { id: "c-elevacion-vertical", name: "Elevacion vertical de piernas", muscle: "Abdomen", level: "principiante", equip: "peso corporal", focus: ["estabilidad"], img: "/img/exercises/piernas.png", desc: "Boca arriba, eleva piernas en vertical y realiza pequeños impulsos levantando zona lumbar." },
  { id: "c-tijeras", name: "Tijeras", muscle: "Abdomen", level: "principiante", equip: "peso corporal", focus: ["estabilidad"], img: "/img/exercises/tijeras.png", desc: "Sentado en banco, extiende y flexiona piernas y tronco manteniendo tensión en el core." },

  { id: "o-elevacion-frontal", name: "Elevacion frontal", muscle: "Hombro", level: "principiante", equip: "mancuernas", focus: ["fuerza"], img: "/img/exercises/elevacion-frontal.png", desc: "De pie, eleva mancuernas al frente hasta altura de la cabeza sin balancear." },
  { id: "o-pajaros", name: "Pájaros", muscle: "hombro", level: "principiante", equip: "mancuernas", focus: ["hipertrofia"], img: "/img/exercises/pajaros.png", desc: "Con pecho apoyado o tronco inclinado, abre brazos en cruz activando deltoide posterior." },
  { id: "o-press-arnold", name: "Elevacion frontales en polea baja", muscle: "hombro", level: "intermedio", equip: "mancuernas", focus: ["hipertrofia"], img: "/img/exercises/polea-baja.png", desc: "De espaldas a la polea baja, eleva el agarre al frente manteniendo codo casi fijo." },
  { id: "o-press-mancuernas", name: "Press con mancuernas", muscle: "Hombro", level: "intermedio", equip: "mancuernas", focus: ["fuerza"], img: "/img/exercises/press-mancuerna.png", desc: "Sentado, empuja mancuernas sobre la cabeza y baja hasta altura de orejas." },
  { id: "o-press-frontal", name: "Press frontal con mancuernas", muscle: "Hombro", level: "intermedio", equip: "mancuernas", focus: ["fuerza"], img: "/img/exercises/press-frontal.png", desc: "Con mancuernas frente a la cabeza, empuja hacia arriba y baja hasta clavículas." },
  { id: "o-press-militar", name: "Press militar", muscle: "Hombro", level: "intermedio", equip: "barra", focus: ["fuerza"], img: "/img/exercises/militar.png", desc: "Sentado, baja la barra a zona clavicular y empuja hasta casi extender codos." },
  { id: "o-remo-menton", name: "Elevaciones laterales en polea baja", muscle: "hombro", level: "intermedio", equip: "barra", focus: ["hipertrofia"], img: "/img/exercises/polea-lateral.png", desc: "De lado a la polea, eleva el brazo en abducción hasta altura de hombro." },

  { id: "c-hollow-hold", name: "Hollow hold", muscle: "core", level: "intermedio", equip: "peso corporal", focus: ["estabilidad"], img: "/img/exercises/hollow.png", desc: "Boca arriba, despega hombros y piernas manteniendo zona lumbar pegada al suelo." },
  { id: "c-plancha", name: "Plancha", muscle: "core", level: "principiante", equip: "peso corporal", focus: ["estabilidad"], img: "/img/exercises/plancha.png", desc: "Alinea hombros, cadera y tobillos, con abdomen y glúteos activos." },
  { id: "c-rueda-abdominal", name: "Rueda abdominal (ab wheel)", muscle: "core", level: "intermedio", equip: "rueda", focus: ["estabilidad"], img: "/img/exercises/rueda.png", desc: "Desde rodillas, rueda hacia delante sin colapsar la zona lumbar y regresa con control." }
];

// ========= Utilidades de normalización =========
const DEFAULT_EX = { focus: [], equip: "", level: "principiante", muscle: "Otro" };

function capitalizeWords(s) {
  return String(s || "").replace(/\p{L}+/gu, (t) => t[0].toUpperCase() + t.slice(1).toLowerCase());
}

function normalize(e) {
  const x = { ...DEFAULT_EX, ...e };
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
    if (!cur) {
      map.set(raw.id, next);
    } else {
      const merged = {
        ...cur,
        ...next,
        focus:
          (cur.focus?.length || 0) >= (next.focus?.length || 0)
            ? cur.focus
            : next.focus,
      };
      map.set(raw.id, merged);
    }
  });
  return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name));
}

function uniqueValues(xs, key) {
  return Array.from(new Set(xs.map((x) => x[key])));
}

// ========= Dataset combinado exportado =========
const ALL_SOURCES = [COMPANION_EXERCISES, USER_EXERCISES];

export const ALL_EXERCISES = mergeExercises(...ALL_SOURCES);
export const MUSCLES = uniqueValues(ALL_EXERCISES, "muscle");
export const LEVELS = ["principiante", "intermedio", "avanzado"];
