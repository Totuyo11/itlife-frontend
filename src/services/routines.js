// src/services/routines.js
// Servicio de Rutinas (Firestore)
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";
import { db } from "../firebase";
import { toast } from "react-toastify";

/**
 * Estructura en Firestore:
 * users/{uid}/routines/{routineId}
 *  - name: string
 *  - items: [{ name: string, mins?: number, minutes?: number }]
 *  - _meta: {
 *      objetivoId?: number,
 *      nivel?: number,
 *      foco?: string,
 *      minutos?: number,
 *      baseScore?: number,   // 0..1
 *      scheme?: string,
 *      tags?: string[]
 *    }
 *  - createdAt: serverTimestamp()
 */

const routinesCol = (uid) => collection(db, "users", uid, "routines");
const sessionsCol = (uid) => collection(db, "users", uid, "sessions");

/* ─────────────────────────────────────────────────────────────
 * Helpers de notificación (toast)
 * ────────────────────────────────────────────────────────────*/

function fmtMinutos(meta) {
  const m =
    (meta && (meta.minutos ?? meta.minutes ?? meta.mins)) != null
      ? Number(meta.minutos ?? meta.minutes ?? meta.mins)
      : null;
  return Number.isFinite(m) && m > 0 ? `${m} min` : "—";
}

function toastOk(title, subtitle) {
  toast.success(
    <div className="fitlife-toast-body">
      <div className="row" style={{ display: "flex", gap: 8, alignItems: "center" }}>
        <span style={{ fontSize: 18 }}>✅</span>
        <strong>{title}</strong>
      </div>
      {subtitle ? <div style={{ opacity: 0.85, marginTop: 2 }}>{subtitle}</div> : null}
    </div>,
    {
      // Puedes personalizar estas opciones globales
      autoClose: 3000,
      closeOnClick: true,
    }
  );
}

function toastErr(msg = "No se pudo completar la acción") {
  toast.error(
    <div className="fitlife-toast-body">
      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
        <span style={{ fontSize: 18 }}>⚠️</span>
        <strong>Error</strong>
      </div>
      <div style={{ opacity: 0.85, marginTop: 2 }}>{msg}</div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
 * RUTINAS
 * ────────────────────────────────────────────────────────────*/

/**
 * Escucha en tiempo real las rutinas del usuario.
 */
export function listenRoutines(uid, onData, onError) {
  if (!uid) return () => {};
  // Ordenamos por createdAt (llave plana) para evitar índices compuestos raros
  const q = query(routinesCol(uid), orderBy("createdAt", "desc"));
  return onSnapshot(
    q,
    (snap) => {
      const rows = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      onData(rows);
    },
    (err) => {
      console.error("[listenRoutines] onSnapshot error:", err);
      onError && onError(err);
    }
  );
}

/**
 * Crea una rutina.
 * @returns {Promise<string>} routineId
 */
export async function createRoutine(uid, { name, items = [], _meta = {} }) {
  if (!uid) throw new Error("Missing uid");
  const payload = {
    name: name || "Rutina",
    items: Array.isArray(items) ? items : [],
    _meta: _meta || {},
    createdAt: serverTimestamp(),
  };
  const ref = await addDoc(routinesCol(uid), payload);
  console.log("[createRoutine] id:", ref.id);
  return ref.id;
}

/**
 * Variante con toast.
 */
export async function createRoutineWithToast(uid, { name, items = [], _meta = {} }) {
  try {
    const id = await createRoutine(uid, { name, items, _meta });
    const totalEj = Array.isArray(items) ? items.length : 0;
    const mins = fmtMinutos(_meta);
    toastOk("Rutina guardada", `${name || "Rutina"} · ${totalEj} ejercicios · ${mins}`);
    return id;
  } catch (e) {
    console.error("[createRoutineWithToast]", e);
    toastErr("No se pudo guardar la rutina");
    throw e;
  }
}

/**
 * Actualiza campos de la rutina (name/items/_meta).
 */
export async function updateRoutine(uid, routineId, payload) {
  if (!uid || !routineId) throw new Error("Missing uid/routineId");
  const ref = doc(db, "users", uid, "routines", routineId);
  const safe = {};
  if (payload.name != null) safe.name = String(payload.name);
  if (payload.items != null) safe.items = Array.isArray(payload.items) ? payload.items : [];
  if (payload._meta != null) safe._meta = payload._meta; // sobrescribe _meta
  await updateDoc(ref, safe);
}

/**
 * Variante con toast.
 */
export async function updateRoutineWithToast(uid, routineId, payload) {
  try {
    await updateRoutine(uid, routineId, payload);
    const name = payload?.name;
    const totalEj = Array.isArray(payload?.items) ? payload.items.length : undefined;
    const mins =
      payload?._meta != null
        ? fmtMinutos(payload._meta)
        : undefined;

    const parts = [];
    if (name) parts.push(name);
    if (totalEj != null) parts.push(`${totalEj} ejercicios`);
    if (mins) parts.push(mins);

    toastOk("Rutina actualizada", parts.join(" · ") || undefined);
  } catch (e) {
    console.error("[updateRoutineWithToast]", e);
    toastErr("No se pudo actualizar la rutina");
    throw e;
  }
}

/**
 * Elimina una rutina.
 */
export async function deleteRoutine(uid, routineId) {
  if (!uid || !routineId) throw new Error("Missing uid/routineId");
  const ref = doc(db, "users", uid, "routines", routineId);
  await deleteDoc(ref);
}

/**
 * Variante con toast.
 */
export async function deleteRoutineWithToast(uid, routineId, routineName = "Rutina") {
  try {
    await deleteRoutine(uid, routineId);
    toastOk("Rutina eliminada", routineName);
  } catch (e) {
    console.error("[deleteRoutineWithToast]", e);
    toastErr("No se pudo eliminar la rutina");
    throw e;
  }
}

/* ─────────────────────────────────────────────────────────────
 * SESIONES (para penalización <48h en el recomendador)
 * ────────────────────────────────────────────────────────────*/

export async function addSessionLog(
  uid,
  { routineId, minutes = 0, focus = null, note = "" } = {}
) {
  if (!uid || !routineId) throw new Error("Missing uid/routineId");
  const payload = {
    routineId,
    minutes: Number(minutes) || 0,
    focus: focus || null,
    note: (note || "").slice(0, 200),
    at: serverTimestamp(),
  };
  const ref = await addDoc(sessionsCol(uid), payload);
  return ref.id;
}

/**
 * Variante con toast para registrar una sesión rápida usando una rutina.
 */
export async function addSessionLogWithToast(
  uid,
  { routineId, minutes = 0, focus = null, note = "", routineName = "Rutina" } = {}
) {
  try {
    await addSessionLog(uid, { routineId, minutes, focus, note });
    const tag = focus ? ` · foco: ${focus}` : "";
    toastOk("Sesión registrada", `${routineName} · ${Number(minutes) || 0} min${tag}`);
  } catch (e) {
    console.error("[addSessionLogWithToast]", e);
    toastErr("No se pudo registrar la sesión");
    throw e;
  }
}

export function listenRecentSessions(uid, onData, onError, n = 20) {
  if (!uid) return () => {};
  const q = query(sessionsCol(uid), orderBy("at", "desc"), limit(n));
  return onSnapshot(
    q,
    (snap) => {
      const rows = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      onData(rows);
    },
    (err) => {
      console.error("[listenRecentSessions] error:", err);
      onError && onError(err);
    }
  );
}

/* ─────────────────────────────────────────────────────────────
 * Utilidades
 * ────────────────────────────────────────────────────────────*/

// Actualiza SOLO _meta (no toca name/items)
export async function upsertRoutineMeta(uid, routineId, metaPatch = {}) {
  if (!uid || !routineId) throw new Error("Missing uid/routineId");
  const ref = doc(db, "users", uid, "routines", routineId);
  await updateDoc(ref, { _meta: metaPatch });
}

// Variante explícita igual a createRoutine (por compatibilidad)
export async function createRoutineAdvanced(uid, { name, items = [], _meta = {} }) {
  return createRoutine(uid, { name, items, _meta });
}
