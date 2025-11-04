// src/services/stats.js
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  Timestamp,
  setDoc,
  doc,
  getDoc,
  updateDoc,
} from "firebase/firestore";
import { db } from "../firebase";

/* ========================
   Config & Helpers
======================== */
const GOAL_TOL_KG = 0.2; // tolerancia para considerar meta alcanzada

const toJSDate = (tsOrDate) => (tsOrDate?.toDate ? tsOrDate.toDate() : tsOrDate);

function startOfDay(d = new Date()) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function addDays(d, n) {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}

function sameDay(a, b) {
  const da = new Date(a),
    db = new Date(b);
  da.setHours(0, 0, 0, 0);
  db.setHours(0, 0, 0, 0);
  return da.getTime() === db.getTime();
}

/* ========================
   Series & Stats
======================== */
export function buildSeries(lastNDays, weightsDocs, sessionsDocs) {
  const out = [];
  const today = startOfDay(new Date());

  const byDayWeight = new Map();
  weightsDocs.forEach((w) => {
    const at = toJSDate(w.at);
    if (!at) return;
    const key = startOfDay(at).toISOString();
    byDayWeight.set(key, w.kg ?? w.value ?? w.peso ?? null);
  });

  const byDayVolume = new Map();
  sessionsDocs.forEach((s) => {
    const at = toJSDate(s.at);
    if (!at) return;
    const key = startOfDay(at).toISOString();
    const prev = byDayVolume.get(key) || 0;
    byDayVolume.set(key, prev + (s.volume ?? s.volumen ?? 0) + 1);
  });

  for (let i = lastNDays - 1; i >= 0; i--) {
    const day = addDays(today, -i);
    const key = startOfDay(day).toISOString();
    out.push({
      fecha: day.toLocaleDateString("es-MX", { day: "2-digit", month: "short" }),
      date: day,
      peso: byDayWeight.has(key) ? byDayWeight.get(key) : null,
      volumen: byDayVolume.has(key) ? byDayVolume.get(key) : null,
    });
  }
  return out;
}

export function computeStats(series) {
  const last7 = series.slice(-7);
  const sesiones7d = last7.reduce((acc, d) => acc + (d.volumen ? 1 : 0), 0);

  let rachaActiva = 0;
  for (let i = series.length - 1; i >= 0; i--) {
    if (series[i].volumen) rachaActiva++;
    else break;
  }

  let ultimoPeso = null;
  for (let i = series.length - 1; i >= 0; i--) {
    if (series[i].peso != null) {
      ultimoPeso = series[i].peso;
      break;
    }
  }
  return { sesiones7d, rachaActiva, ultimoPeso };
}

/* ========================
   NUEVO: datasets para las gráficas
======================== */
export function computeTodayMinutes(sessionsDocs) {
  const today = new Date();
  let total = 0;
  sessionsDocs.forEach((s) => {
    const at = toJSDate(s.at);
    if (!at) return;
    if (sameDay(at, today)) total += Number(s.minutes ?? s.minutos ?? 0);
  });
  return total;
}

export function buildWeightLine(weightsDocs, lastNDays = 14) {
  const sorted = [...weightsDocs].sort((a, b) => toJSDate(a.at) - toJSDate(b.at));
  const out = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  for (let i = lastNDays - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const label = d.toLocaleDateString("es-MX", { day: "2-digit", month: "short" });
    let dayWeight = null;
    for (let j = sorted.length - 1; j >= 0; j--) {
      const w = sorted[j];
      const wDate = toJSDate(w.at);
      if (wDate && sameDay(wDate, d)) {
        dayWeight = w.kg ?? w.value ?? w.peso ?? null;
        break;
      }
    }
    out.push({ fecha: label, peso: dayWeight });
  }
  return out;
}

/* ========================
   Firestore listeners
======================== */
export function listenUserDashboard(uid, onData) {
  if (!uid) {
    console.warn("⚠️ listenUserDashboard fue llamado sin uid, se cancela para evitar error de permisos.");
    return () => {};
  }

  const today = startOfDay(new Date());
  const fromDate = addDays(today, -29);
  const fromTs = Timestamp.fromDate(fromDate);

  const wRef = collection(db, "users", uid, "weights");
  const sRef = collection(db, "users", uid, "sessions");
  const aRef = doc(db, "users", uid, "achievements", "meta");

  const qW = query(wRef, where("at", ">=", fromTs), orderBy("at", "asc"));
  const qS = query(sRef, where("at", ">=", fromTs), orderBy("at", "asc"));

  let weights = [];
  let sessions = [];
  let achievementsDoc = null;

  const sync = async () => {
    const series = buildSeries(14, weights, sessions);
    const stats = computeStats(series);
    const todayMinutes = computeTodayMinutes(sessions);
    const weightLineDaily = buildWeightLine(weights, 14);

    if (!achievementsDoc) {
      try {
        const snap = await getDoc(aRef);
        achievementsDoc = snap.exists() ? snap.data() : null;
      } catch (e) {
        console.warn("No se pudo leer achievements (sin permisos o no existe):", e.code);
        achievementsDoc = null;
      }
    }

    onData({
      series,
      stats,
      achievementsDoc,
      todayMinutes,
      weightLineDaily,
    });
  };

  const unsubW = onSnapshot(
    qW,
    (snap) => {
      weights = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      sync();
    },
    (err) => console.warn("❌ Error listener weights:", err.code)
  );

  const unsubS = onSnapshot(
    qS,
    (snap) => {
      sessions = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      sync();
    },
    (err) => console.warn("❌ Error listener sessions:", err.code)
  );

  return () => {
    unsubW();
    unsubS();
  };
}

/* ========================
   Achievements
======================== */
export async function syncAchievements(uid, stats, goalWeight) {
  if (!uid) return;
  const aRef = doc(db, "users", uid, "achievements", "meta");

  const defs = [
    { id: "first-session", test: (s) => s.sesiones7d > 0 },
    { id: "streak-7", test: (s) => s.rachaActiva >= 7 },
    { id: "ten-workouts", test: (s) => s.sesiones7d >= 10 },
  ];

  if (
    typeof goalWeight === "number" &&
    goalWeight > 0 &&
    stats.ultimoPeso != null &&
    stats.ultimoPeso <= goalWeight + GOAL_TOL_KG
  ) {
    defs.push({ id: "goal-weight", test: () => true });
  }

  const now = Timestamp.now();
  const payload = {};
  defs.forEach((d) => {
    if (d.test(stats)) payload[d.id] = now;
  });

  if (Object.keys(payload).length === 0) return;
  await setDoc(aRef, payload, { merge: true });
}

export function buildBadges(stats, achievementsDoc, goalWeight) {
  const unlocked = new Set(Object.keys(achievementsDoc || {}));
  const getTs = (id) => {
    const v = achievementsDoc?.[id];
    return v?.toDate ? v.toDate().getTime() : v ? Date.now() : null;
  };

  const goalReached =
    typeof goalWeight === "number" &&
    goalWeight > 0 &&
    stats.ultimoPeso != null &&
    stats.ultimoPeso <= goalWeight + GOAL_TOL_KG;

  return [
    {
      id: "first-session",
      icon: "🥇",
      title: "Primer entrenamiento",
      desc: "Registra tu primera sesión",
      unlockedAt: unlocked.has("first-session")
        ? getTs("first-session")
        : stats.sesiones7d > 0
        ? Date.now()
        : null,
    },
    {
      id: "streak-7",
      icon: "🔥",
      title: "Racha de 7 días",
      desc: "Entrena 7 días seguidos",
      unlockedAt: unlocked.has("streak-7")
        ? getTs("streak-7")
        : stats.rachaActiva >= 7
        ? Date.now()
        : null,
    },
    {
      id: "ten-workouts",
      icon: "💪",
      title: "10 sesiones",
      desc: "Completa 10 entrenamientos",
      unlockedAt: unlocked.has("ten-workouts")
        ? getTs("ten-workouts")
        : stats.sesiones7d >= 10
        ? Date.now()
        : null,
    },
    {
      id: "goal-weight",
      icon: "🎯",
      title: "Meta de peso",
      desc: goalWeight ? `Alcanza ${goalWeight} kg` : "Define tu meta de peso",
      unlockedAt: unlocked.has("goal-weight")
        ? getTs("goal-weight")
        : goalReached
        ? Date.now()
        : null,
    },
  ];
}

/* ========================
   Meta de peso y registro de peso diario
======================== */
export async function getUserGoal(uid) {
  const userRef = doc(db, "users", uid);
  const snap = await getDoc(userRef);
  if (!snap.exists()) return null;
  const data = snap.data();
  return typeof data.goalWeight === "number" ? data.goalWeight : null;
}

export async function setUserGoal(uid, kg) {
  const userRef = doc(db, "users", uid);
  await updateDoc(userRef, { goalWeight: kg });
}

export async function addWeight(uid, kg, date = new Date()) {
  const ref = collection(db, "users", uid, "weights");
  const day = new Date(date);
  day.setHours(0, 0, 0, 0);
  const id = day.getTime().toString();
  await setDoc(
    doc(ref, id),
    { at: Timestamp.fromDate(date), kg: Number(kg) },
    { merge: true }
  );
}
