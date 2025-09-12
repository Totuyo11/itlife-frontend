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
} from "firebase/firestore";
import { db } from "../firebase"; // ← corregido (antes ../../firebase)

// ------- Helpers de fecha -------
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

/**
 * Construye array de últimos N días con labels "dd MMM"
 * y rellena pesoSerie / volumen usando documentos traídos.
 */
export function buildSeries(lastNDays, weightsDocs, sessionsDocs) {
  const out = [];
  const today = startOfDay(new Date());

  const byDayWeight = new Map();
  weightsDocs.forEach((w) => {
    const at = w.at?.toDate ? w.at.toDate() : w.at;
    if (!at) return;
    const key = startOfDay(at).toISOString();
    byDayWeight.set(key, w.kg);
  });

  const byDayVolume = new Map();
  sessionsDocs.forEach((s) => {
    const at = s.at?.toDate ? s.at.toDate() : s.at;
    if (!at) return;
    const key = startOfDay(at).toISOString();
    const prev = byDayVolume.get(key) || 0;
    byDayVolume.set(key, prev + (s.volume || 0) + 1); // +1 como “marcador” de sesión
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

/**
 * Calcula estadísticas: sesiones últimos 7d, racha activa, último peso.
 */
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

/**
 * Suscripción realtime a pesos/sesiones (últimos 30d) + achievements doc.
 */
export function listenUserDashboard(uid, onData) {
  const startOf = startOfDay(new Date());
  const fromDate = addDays(startOf, -29); // 30 días
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

    if (!achievementsDoc) {
      const snap = await getDoc(aRef);
      achievementsDoc = snap.exists() ? snap.data() : null;
    }
    onData({ series, stats, achievementsDoc });
  };

  const unsubW = onSnapshot(qW, (snap) => {
    weights = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    sync();
  });

  const unsubS = onSnapshot(qS, (snap) => {
    sessions = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    sync();
  });

  const unsubA = onSnapshot(aRef, (snap) => {
    achievementsDoc = snap.exists() ? snap.data() : null;
    sync();
  });

  return () => {
    unsubW();
    unsubS();
    unsubA();
  };
}

/**
 * Sincroniza logros con Firestore (merge).
 */
export async function syncAchievements(uid, stats) {
  if (!uid) return;
  const aRef = doc(db, "users", uid, "achievements", "meta");

  const defs = [
    { id: "first-session", test: (s) => s.sesiones7d > 0 },
    { id: "streak-7", test: (s) => s.rachaActiva >= 7 },
    { id: "ten-workouts", test: (s) => s.sesiones7d >= 10 },
    // "goal-weight" depende de meta de usuario.
  ];

  const now = Timestamp.now();
  const payload = {};
  defs.forEach((d) => {
    if (d.test(stats)) payload[d.id] = now;
  });
  if (Object.keys(payload).length === 0) return;

  await setDoc(aRef, payload, { merge: true });
}

/**
 * Convierte achievementsDoc + stats a array de badges.
 */
export function buildBadges(stats, achievementsDoc) {
  const nowUnlocked = new Set(Object.keys(achievementsDoc || {}));

  return [
    {
      id: "first-session",
      icon: "🥇",
      title: "Primer entrenamiento",
      desc: "Registra tu primera sesión",
      unlockedAt: nowUnlocked.has("first-session")
        ? (achievementsDoc["first-session"]?.toDate
            ? achievementsDoc["first-session"].toDate().getTime()
            : Date.now())
        : stats.sesiones7d > 0
        ? Date.now()
        : null,
    },
    {
      id: "streak-7",
      icon: "🔥",
      title: "Racha de 7 días",
      desc: "Entrena 7 días seguidos",
      unlockedAt: nowUnlocked.has("streak-7")
        ? (achievementsDoc["streak-7"]?.toDate
            ? achievementsDoc["streak-7"].toDate().getTime()
            : Date.now())
        : stats.rachaActiva >= 7
        ? Date.now()
        : null,
    },
    {
      id: "ten-workouts",
      icon: "💪",
      title: "10 sesiones",
      desc: "Completa 10 entrenamientos",
      unlockedAt: nowUnlocked.has("ten-workouts")
        ? (achievementsDoc["ten-workouts"]?.toDate
            ? achievementsDoc["ten-workouts"].toDate().getTime()
            : Date.now())
        : stats.sesiones7d >= 10
        ? Date.now()
        : null,
    },
    {
      id: "goal-weight",
      icon: "🎯",
      title: "Meta de peso",
      desc: "Alcanza tu peso objetivo",
      unlockedAt: null,
    },
  ];
}
