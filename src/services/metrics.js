// src/services/metrics.js
import {
  collection,
  onSnapshot,
  orderBy,
  query,
  limit as qLimit,
} from "firebase/firestore";
import { db } from "../firebase";

function toYMD(d) {
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
}
function startOfWeek(d) {
  const x = new Date(d);
  const day = x.getDay(); // 0=Dom
  const diff = (day === 0 ? -6 : 1) - day; // lunes como inicio
  x.setDate(x.getDate() + diff);
  x.setHours(0, 0, 0, 0);
  return x;
}
function computeStreak(sessionDates) {
  if (!sessionDates.length) return 0;
  const set = new Set(sessionDates.map((d) => toYMD(new Date(d))));
  let streak = 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (let i = 0; ; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const key = toYMD(d);
    if (set.has(key)) streak++;
    else break;
  }
  return streak;
}

/**
 * Calcula y escucha:
 * - weightKg (último weight)
 * - weekSessions (desde lunes)
 * - streakDays (días consecutivos con sesión)
 */
export function listenHeroKpis(uid, setKpis) {
  if (!uid) return () => {};

  let latestWeight = null;
  let sessionDates = [];

  const push = () => {
    const sow = startOfWeek(new Date());
    const weekCount = sessionDates.filter((d) => d >= sow).length;
    setKpis({
      weightKg: latestWeight,
      weekSessions: weekCount,
      streakDays: computeStreak(sessionDates),
    });
  };

  const qW = query(
    collection(db, "users", uid, "weights"),
    orderBy("at", "desc"),
    qLimit(1)
  );
  const unsubW = onSnapshot(qW, (snap) => {
    if (!snap.empty) {
      const d = snap.docs[0].data();
      latestWeight = typeof d.kg === "number" ? d.kg : null;
    } else {
      latestWeight = null;
    }
    push();
  });

  const qS = query(
    collection(db, "users", uid, "sessions"),
    orderBy("at", "desc"),
    qLimit(120)
  );
  const unsubS = onSnapshot(qS, (snap) => {
    sessionDates = snap.docs
      .map((doc) => {
        const d = doc.data();
        if (d?.at?.toDate) return d.at.toDate();
        if (typeof d?.at === "number") return new Date(d.at);
        return null;
      })
      .filter(Boolean);
    push();
  });

  return () => {
    unsubW && unsubW();
    unsubS && unsubS();
  };
}
