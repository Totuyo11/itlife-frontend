// src/services/routines.js
import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  orderBy,
  doc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../firebase";

/**
 * Escucha en tiempo real las rutinas del usuario
 * users/{uid}/routines
 */
export const listenRoutines = (uid, cb) => {
  const q = query(
    collection(db, "users", uid, "routines"),
    orderBy("createdAt", "desc")
  );
  return onSnapshot(q, (snap) => {
    const items = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    cb(items);
  });
};

/**
 * Crea una rutina
 * payload: { name: string, items?: Array<{name: string, reps?:string, note?:string}> }
 */
export const createRoutine = async (uid, payload) => {
  const ref = await addDoc(collection(db, "users", uid, "routines"), {
    name: payload.name || "Nueva rutina",
    items: Array.isArray(payload.items) ? payload.items : [],
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return ref.id;
};

/**
 * Actualiza una rutina
 */
export const updateRoutine = (uid, routineId, payload) => {
  return updateDoc(doc(db, "users", uid, "routines", routineId), {
    ...payload,
    updatedAt: serverTimestamp(),
  });
};

/**
 * Elimina una rutina
 */
export const deleteRoutine = (uid, routineId) => {
  return deleteDoc(doc(db, "users", uid, "routines", routineId));
};
