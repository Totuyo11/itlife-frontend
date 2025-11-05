// src/services/routines.js
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";
import { db } from "../firebase";

/**
 * Estructura en Firestore:
 * users/{uid}/routines/{routineId}
 *  - name: string
 *  - items: [{ name: string }]
 *  - _meta: {...}
 *  - createdAt: serverTimestamp
 */
const colRef = (uid) => collection(db, "users", uid, "routines");

export function listenRoutines(uid, onData, onError) {
  const q = query(colRef(uid), orderBy("createdAt", "desc"));
  return onSnapshot(
    q,
    (snap) => {
      const rows = snap.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      }));
      onData(rows);
    },
    (err) => {
      console.error("[listenRoutines] onSnapshot error:", err);
      onError && onError(err);
    }
  );
}

export async function createRoutine(uid, { name, items = [], _meta = {} }) {
  if (!uid) throw new Error("Missing uid");
  const payload = {
    name: name || "Rutina",
    items: Array.isArray(items) ? items : [],
    _meta: _meta || {},
    createdAt: serverTimestamp(),
  };
  const ref = await addDoc(colRef(uid), payload);
  return ref.id;
}

export async function updateRoutine(uid, routineId, payload) {
  if (!uid || !routineId) throw new Error("Missing uid/routineId");
  const ref = doc(db, "users", uid, "routines", routineId);
  const safe = {};
  if (payload.name != null) safe.name = String(payload.name);
  if (payload.items != null) safe.items = Array.isArray(payload.items) ? payload.items : [];
  if (payload._meta != null) safe._meta = payload._meta;
  // Si quieres actualizar createdAt, coméntalo; normalmente no.
  await updateDoc(ref, safe);
}

export async function deleteRoutine(uid, routineId) {
  if (!uid || !routineId) throw new Error("Missing uid/routineId");
  const ref = doc(db, "users", uid, "routines", routineId);
  await deleteDoc(ref);
}
