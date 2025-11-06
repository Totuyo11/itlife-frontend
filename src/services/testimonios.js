// src/services/testimonios.js
import {
  collection,
  onSnapshot,
  query,
  orderBy,
  limit as qLimit,
  addDoc,
  deleteDoc,
  doc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../firebase"; // ajusta si tu firebase.js está en otra ruta

/**
 * Escucha en tiempo real los testimonios del usuario autenticado.
 * Estructura: users/{uid}/testimonios/{tid} -> { nombre, texto, creado }
 *
 * @param {string} uid
 * @param {(arr: any[]) => void} setTestimonials
 * @param {number} [maxCount=30]
 * @returns {() => void} unsubscribe
 */
export function listenUserTestimonials(uid, setTestimonials, maxCount = 30) {
  if (!uid || typeof setTestimonials !== "function") return () => {};
  const ref = collection(db, "users", uid, "testimonios");
  // Orden por fecha (desc) + límite
  const q = query(ref, orderBy("creado", "desc"), qLimit(maxCount));

  return onSnapshot(q, (snap) => {
    const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    setTestimonials(list);
  });
}

/**
 * Crea un testimonio en la subcolección privada del usuario.
 *
 * @param {string} uid
 * @param {{nombre?: string, texto: string}} payload
 */
export async function addUserTestimonial(uid, { nombre, texto }) {
  if (!uid) throw new Error("Falta uid");
  const t = (texto || "").trim();
  const n = (nombre || "").trim();
  if (!t) throw new Error("El texto del testimonio es requerido");
  if (t.length > 500) throw new Error("Máximo 500 caracteres");
  if (n.length > 80) throw new Error("Nombre demasiado largo (máx 80)");

  const ref = collection(db, "users", uid, "testimonios");
  await addDoc(ref, {
    nombre: n || "Usuario",
    texto: t,
    creado: serverTimestamp(),
  });
}

/**
 * Elimina un testimonio por ID en la subcolección privada del usuario.
 *
 * @param {string} uid
 * @param {string} tid
 */
export async function deleteUserTestimonial(uid, tid) {
  if (!uid || !tid) throw new Error("Faltan uid o tid");
  const ref = doc(db, "users", uid, "testimonios", tid);
  await deleteDoc(ref);
}
