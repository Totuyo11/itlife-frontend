// src/recommender.js
import {
  collection, getDocs, addDoc, serverTimestamp,
  query, where, orderBy, limit, Timestamp
} from "firebase/firestore";
import { db } from "./firebase";

/* =========================================================
   🔌 Resolver de API (útil para otras pantallas)
   Prioridad:
   1) localStorage.fitlife_api_url
   2) process.env.REACT_APP_API_URL
   3) http://<hostname>:8000
   ========================================================= */
export const API_URL = (() => {
  try {
    const ls = (localStorage.getItem("fitlife_api_url") || "").trim();
    if (ls) return ls;
  } catch {}
  if (process.env.REACT_APP_API_URL) return process.env.REACT_APP_API_URL;
  if (typeof window !== "undefined" && window.location?.hostname) {
    return `http://${window.location.hostname}:8000`;
  }
  // fallback final
  return "http://127.0.0.1:8000";
})();

// Permite cambiar la URL sin recompilar (se guarda en localStorage)
export function setApiUrl(url) {
  if (!url || typeof url !== "string") return API_URL;
  try {
    localStorage.setItem("fitlife_api_url", url.trim());
  } catch {}
  return url.trim();
}

/* ============== Helpers ============== */
function normStr(v, d = "") { return typeof v === "string" ? v : d; }
function normNum(v, d = null) { return typeof v === "number" ? v : d; }
function normArr(a, d = []) { return Array.isArray(a) ? a : d; }

/* Asegura que cada rutina tenga los campos que usamos en UI/score */
function normalizeRoutine(r) {
  return {
    id: r.id,
    name: normStr(r.name, "Rutina"),
    goal: normStr(r.goal, r._goal || ""),          // perder_peso | ganar_musculo | salud | hiit
    level: normStr(r.level, r._level || ""),       // novato | intermedio | avanzado
    sex: normStr(r.sex, "any"),
    minAge: normNum(r.minAge, 14),
    maxAge: normNum(r.maxAge, 65),
    minMinutes: normNum(r.minMinutes, 30),
    maxMinutes: normNum(r.maxMinutes, 45),
    focus: normArr(r.focus, []),
    blocks: normArr(r.blocks, []),
    _global: !!r._global,
    _score: typeof r._score === "number" ? r._score : undefined,
  };
}

/** Lee rutinas del usuario; si no hay, usa /routines global (seed) */
async function fetchRoutines(uid) {
  if (!uid) return [];

  try {
    const snap = await getDocs(collection(db, "users", uid, "routines"));
    let rows = snap.docs.map(d => normalizeRoutine({ id: d.id, ...d.data() }));
    if (rows.length > 0) return rows;
  } catch (e) {
    console.warn("fetchRoutines(user):", e?.message || e);
  }

  try {
    const snap = await getDocs(collection(db, "routines"));
    let rows = snap.docs.map(d => normalizeRoutine({ id: d.id, _global: true, ...d.data() }));
    return rows;
  } catch (e) {
    console.warn("fetchRoutines(global):", e?.message || e);
    return [];
  }
}

/** Penaliza rutinas repetidas en las últimas 48h */
async function recentUsedPenaltyMap(uid) {
  if (!uid) return new Map();
  try {
    const twoDaysAgo = Timestamp.fromDate(new Date(Date.now() - 48 * 3600 * 1000));
    const qy = query(
      collection(db, "users", uid, "sessions"),
      where("createdAt", ">=", twoDaysAgo),
      orderBy("createdAt", "desc"),
      limit(20)
    );
    const snap = await getDocs(qy);
    const counts = new Map();
    snap.forEach(doc => {
      const rId = doc.data()?.routineId;
      if (rId) counts.set(rId, (counts.get(rId) || 0) + 1);
    });
    return counts;
  } catch (e) {
    console.warn("recentUsedPenaltyMap:", e?.message || e);
    return new Map();
  }
}

/** Score sencillo con tolerancias */
function scoreRoutine(r, prefs, recentPenaltyCount = 0) {
  const { sex, age, experience, minutes, goal } = prefs;

  if (age < (r.minAge ?? 0) - 2 || age > (r.maxAge ?? 120) + 2) return -Infinity;
  if (minutes < (r.minMinutes ?? 0) - 10 || minutes > (r.maxMinutes ?? 999) + 10) return -Infinity;

  let s = 0;

  if (r.goal && goal && r.goal === goal) s += 3;

  const order = ["novato", "intermedio", "avanzado"];
  const iWant = order.indexOf((experience || "").toLowerCase());
  const iHave = order.indexOf((r.level || "").toLowerCase());
  if (iWant > -1 && iHave > -1) {
    if (iWant === iHave) s += 3;
    else if (Math.abs(iWant - iHave) === 1) s += 1;
  }

  if (!r.sex || r.sex === "any" || r.sex === sex) s += 1;

  if (age >= (r.minAge ?? 0) && age <= (r.maxAge ?? 120)) s += 2;

  const minM = r.minMinutes ?? 0;
  const maxM = r.maxMinutes ?? 0;
  if (minutes >= minM && minutes <= maxM) {
    s += 2;
    const center = (minM + maxM) / 2;
    const half = Math.max(1, (maxM - minM) / 2);
    s += 1 - Math.min(1, Math.abs(minutes - center) / half);
  }

  if (Array.isArray(r.focus) && r.focus.length) {
    if (goal === "perder_peso" && r.focus.includes("cardio")) s += 0.5;
    if (goal === "ganar_musculo" && (r.focus.includes("upper") || r.focus.includes("lower") || r.focus.includes("glutes"))) s += 0.5;
  }

  if (recentPenaltyCount > 0) s -= 2.5 * recentPenaltyCount;

  return s;
}

/** API pública */
export async function recommendRoutines({
  uid, sex = "any", age = 20, experience = "novato", minutes = 30, goal = "salud", topN = 5,
} = {}) {
  const [routines, penaltyMap] = await Promise.all([
    fetchRoutines(uid),
    recentUsedPenaltyMap(uid),
  ]);

  const scored = [];
  for (const r of routines) {
    const penaltyTimes = penaltyMap.get(r.id) || 0;
    const _score = scoreRoutine(r, { sex, age, experience, minutes, goal }, penaltyTimes);
    if (_score !== -Infinity) scored.push({ ...r, _score });
  }

  scored.sort((a, b) => b._score - a._score);
  return scored.slice(0, topN);
}

/** Registra sesión en users/{uid}/sessions */
export async function logSession({ uid, routine, minutes }) {
  if (!uid || !routine) return;
  try {
    const ref = collection(db, "users", uid, "sessions");
    await addDoc(ref, {
      routineId: routine.id,
      routineName: routine.name,
      goal: routine.goal,
      level: routine.level,
      minutes: minutes ?? routine.minMinutes ?? null,
      createdAt: serverTimestamp(),
    });
  } catch (e) {
    console.warn("logSession:", e?.message || e);
  }
}

/* ---------- Validación para la página /Rutinas ---------- */
export function validarInputs(inp = {}) {
  const errs = [];
  const isInt = (v) => Number.isInteger(v);
  if (!isInt(inp.objetivo)   || inp.objetivo   < 1 || inp.objetivo   > 4) errs.push("objetivo (1-4)");
  if (!isInt(inp.dificultad) || inp.dificultad < 1 || inp.dificultad > 3) errs.push("dificultad (1-3)");
  if (!isInt(inp.limitacion) || inp.limitacion < 1 || inp.limitacion > 4) errs.push("limitación (1-4)");
  if (!isInt(inp.tiempo)     || inp.tiempo     < 1 || inp.tiempo     > 3) errs.push("tiempo (1-3)");
  if (!isInt(inp.frecuencia) || inp.frecuencia < 1 || inp.frecuencia > 3) errs.push("frecuencia (1-3)");
  return errs;
}

/* ==========================================================
   Genera un planSemanal base (con ejercicios y esquemas)
   ========================================================== */
export function generarRutina({
  objetivo = 1,
  dificultad = 1,
  limitacion = 4,
  tiempo = 1,
  frecuencia = 2,
} = {}) {
  const dur = tiempo === 1 ? 40 : tiempo === 2 ? 70 : 120;
  const dias = ({ 1: 2, 2: 4, 3: 6 }[frecuencia]) || 3;

  const catalogo = {
    pecho: [
      { nombre: "Press banca", esquema: { series: 3, reps: "10-12", descanso: "60s" } },
      { nombre: "Aperturas con mancuernas", esquema: { series: 3, reps: "12-15", descanso: "45s" } },
    ],
    tricep: [
      { nombre: "Fondos en paralelas asistidos", esquema: { series: 3, reps: "8-12", descanso: "60s" } },
    ],
    espalda: [
      { nombre: "Remo con barra", esquema: { series: 3, reps: "8-10", descanso: "90s" } },
      { nombre: "Jalón al pecho", esquema: { series: 3, reps: "10-12", descanso: "60s" } },
    ],
    bicep: [
      { nombre: "Curl con barra", esquema: { series: 3, reps: "10-12", descanso: "60s" } },
    ],
    pierna: [
      { nombre: "Sentadilla", esquema: { series: 4, reps: "6-10", descanso: "120s" } },
      { nombre: "Prensa", esquema: { series: 3, reps: "10-12", descanso: "90s" } },
    ],
    gluteo: [
      { nombre: "Hip thrust", esquema: { series: 4, reps: "8-12", descanso: "90s" } },
    ],
    hombro: [
      { nombre: "Press militar", esquema: { series: 3, reps: "8-10", descanso: "90s" } },
      { nombre: "Elevaciones laterales", esquema: { series: 3, reps: "12-15", descanso: "45s" } },
    ],
    core: [
      { nombre: "Plancha", esquema: { series: 3, reps: "30-45s", descanso: "45s" } },
      { nombre: "Crunch en máquina", esquema: { series: 3, reps: "12-15", descanso: "45s" } },
    ],
  };

  const focosPorDia = [
    ["pecho", "tricep"],
    ["espalda", "bicep"],
    ["pierna", "gluteo", "core"],
    ["hombro", "core"],
    ["pecho", "bicep"],
    ["pierna", "core"],
  ];

  const planSemanal = Array.from({ length: dias }).map((_, i) => {
    const foco = focosPorDia[i % focosPorDia.length];
    const bloques = foco.map((grupo) => ({
      grupo,
      ejercicios: (catalogo[grupo] || []).map((x) => ({ ...x })),
    }));
    return {
      dia: i + 1,
      foco,
      duracionEstimadaMin: dur,
      bloques,
    };
  });

  return { planSemanal };
}
