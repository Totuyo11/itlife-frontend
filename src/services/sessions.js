// src/services/sessions.js
import { addDoc, collection, Timestamp } from "firebase/firestore";
import { db } from "../firebase";
import { liveKpiBus } from "../state/liveKpiBus";

/**
 * Crea una sesión rápida y actualiza los KPIs del héroe en vivo.
 * @param {string} uid - ID del usuario autenticado.
 * @param {{ at?: Date, minutes?: number, volume?: number, notes?: string }} data - Datos opcionales de la sesión.
 */
export async function addQuickSession(uid, data = {}) {
  if (!uid) throw new Error("No hay usuario autenticado.");

  const at = data.at instanceof Date ? Timestamp.fromDate(data.at) : Timestamp.now();

  const payload = {
    at,
    minutes: Number(data.minutes || 0),
    volume: Number(data.volume || 0),
    notes: (data.notes || "").slice(0, 200),
    source: "quick", // marca de origen
  };

  await addDoc(collection(db, "users", uid, "sessions"), payload);

  // 🔥 Actualiza el bus en vivo para reflejar cambios en Home.jsx
  liveKpiBus.bumpWeekSessions(1);
  liveKpiBus.bumpStreakForToday();
}

/**
 * Marca manualmente un incremento de sesión sin guardar en Firestore (opcional).
 * Útil si quieres simular o reflejar en UI sin registrar datos.
 */
export function simulateSessionIncrement() {
  liveKpiBus.bumpWeekSessions(1);
  liveKpiBus.bumpStreakForToday();
}
