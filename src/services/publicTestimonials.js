// src/services/publicTestimonials.js
import { collection, onSnapshot, query, orderBy, limit, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../firebase";

/**
 * Escucha testimonios públicos (de todos los usuarios).
 * Tip: puedes pasar maxCount para limitar cuántos traes.
 */
export function listenPublicTestimonials(setList, maxCount = 20) {
  const ref = collection(db, "public_testimonials");
  const q = query(ref, orderBy("creado", "desc"), limit(maxCount));
  return onSnapshot(q, (snap) => {
    const xs = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    setList(xs);
  });
}

/**
 * Publica un testimonio en la colección pública.
 * Requiere usuario autenticado. Reglas forzan userId == auth.uid.
 */
export async function addPublicTestimonial({ userId, nombre, texto, approved = true }) {
  const ref = collection(db, "public_testimonials");
  return addDoc(ref, {
    userId,
    nombre,
    texto,
    creado: serverTimestamp(),
    approved, // opcional (si luego quieres moderación asegúrate de filtrar por approved === true)
  });
}
