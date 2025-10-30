// src/services/sessions.js
import { addDoc, collection, Timestamp } from "firebase/firestore";
import { db } from "../firebase";

/**
 * Crea una sesión rápida.
 * @param {string} uid
 * @param {{ at?:Date, minutes?:number, volume?:number, notes?:string }} data
 */
export async function addQuickSession(uid, data) {
  if (!uid) throw new Error("No hay usuario");
  const at = data.at instanceof Date ? Timestamp.fromDate(data.at) : Timestamp.now();
  const payload = {
    at,
    minutes: Number(data.minutes || 0),
    volume: Number(data.volume || 0),
    notes: (data.notes || "").slice(0, 200),
    source: "quick", // marca de origen
  };
  await addDoc(collection(db, "users", uid, "sessions"), payload);
}

