// src/services/recommender.js
import {
  collection, getDocs, addDoc, serverTimestamp,
  query, where, orderBy, limit, Timestamp
} from "firebase/firestore";
import { db } from "../firebase";

/** Lee todas las rutinas de /routines */
async function fetchRoutines() {
  const snap = await getDocs(collection(db, "routines"));
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

/** Penaliza rutinas repetidas en las últimas 48h */
async function recentUsedPenaltyMap(uid) {
  if (!uid) return new Map();
  const twoDaysAgo = Timestamp.fromDate(new Date(Date.now() - 48 * 3600 * 1000));
  const q = query(
    collection(db, `users/${uid}/sessions`),
    where("createdAt", ">=", twoDaysAgo),
    orderBy("createdAt", "desc"),
    limit(20)
  );
  const snap = await getDocs(q);
  const counts = new Map();
  snap.forEach(doc => {
    const rId = doc.data()?.routineId;
    if (rId) counts.set(rId, (counts.get(rId) || 0) + 1);
  });
  return counts; // routineId -> veces usadas en 48h
}

/** Calcula score según preferencias del usuario */
function scoreRoutine(r, prefs, recentPenaltyCount = 0) {
  const { sex, age, experience, minutes, goal } = prefs;

  // Filtros duros suaves (con tolerancia)
  if (age < (r.minAge ?? 0) - 2 || age > (r.maxAge ?? 120) + 2) return -Infinity;
  if (minutes < (r.minMinutes ?? 0) - 10 || minutes > (r.maxMinutes ?? 999) + 10) return -Infinity;

  let s = 0;

  // Objetivo
  if (r.goal === goal) s += 3;

  // Nivel (exacto o adyacente)
  const levelOrder = ["novato", "intermedio", "avanzado"];
  const iWant = levelOrder.indexOf((experience || "").toLowerCase());
  const iHave = levelOrder.indexOf((r.level || "").toLowerCase());
  if (iWant === iHave) s += 3;
  else if (Math.abs(iWant - iHave) === 1) s += 1;

  // Sexo (any = neutro)
  if (!r.sex || r.sex === "any" || r.sex === sex) s += 1;
  else s -= 2;

  // Edad dentro de rango
  if (age >= (r.minAge ?? 0) && age <= (r.maxAge ?? 120)) s += 2;

  // Minutos dentro del rango + bonus por cercanía al centro
  const minM = r.minMinutes ?? 0;
  const maxM = r.maxMinutes ?? 0;
  if (minutes >= minM && minutes <= maxM) {
    s += 2;
    const center = (minM + maxM) / 2;
    const half = Math.max(1, (maxM - minM) / 2);
    const closeness = 1 - Math.min(1, Math.abs(minutes - center) / half); // 0..1
    s += closeness; // bonus 0..1
  }

  // Pequeño bonus por matching de foco (si definiste focus[])
  if (Array.isArray(r.focus) && r.focus.length) {
    if (goal === "perder_peso" && r.focus.includes("cardio")) s += 0.5;
    if (goal === "ganar_musculo" && (r.focus.includes("upper") || r.focus.includes("lower") || r.focus.includes("glutes"))) s += 0.5;
  }

  // Penalización por uso reciente (48h)
  if (recentPenaltyCount > 0) s -= 2.5 * recentPenaltyCount;

  return s;
}

/** Public API: devuelve top-N rutinas con _score */
export async function recommendRoutines({
  uid, sex = "any", age = 20, experience = "novato", minutes = 30, goal = "salud", topN = 5,
} = {}) {
  const [routines, penaltyMap] = await Promise.all([
    fetchRoutines(),
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

/** Guarda una sesión simple en users/{uid}/sessions */
export async function logSession({ uid, routine, minutes }) {
  if (!uid || !routine) throw new Error("uid y routine son obligatorios");
  const ref = collection(db, `users/${uid}/sessions`);
  await addDoc(ref, {
    routineId: routine.id,
    routineName: routine.name,
    goal: routine.goal,
    level: routine.level,
    minutes: minutes ?? routine.minMinutes ?? null,
    createdAt: serverTimestamp(),
  });
}
