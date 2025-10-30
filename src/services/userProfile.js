// src/services/userProfile.js
import { doc, onSnapshot, setDoc } from "firebase/firestore";
import { db } from "../firebase";

/** Se suscribe a users/{uid} y devuelve { goalWeight: number|null } */
export function subscribeGoalWeight(uid, cb) {
  if (!uid) return () => {};
  const ref = doc(db, "users", uid);
  const unsub = onSnapshot(ref, (snap) => {
    const data = snap.exists() ? snap.data() : {};
    cb({ goalWeight: typeof data.goalWeight === "number" ? data.goalWeight : null });
  });
  return unsub;
}

/** Actualiza/crea users/{uid}.goalWeight con merge */
export async function updateGoalWeight(uid, kg) {
  if (!uid) throw new Error("No hay usuario");
  const ref = doc(db, "users", uid);
  const val = typeof kg === "string" ? Number(kg) : kg;
  if (Number.isNaN(val) || val <= 0) throw new Error("Meta inválida");
  await setDoc(ref, { goalWeight: val }, { merge: true });
}

