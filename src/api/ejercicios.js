// src/api/ejercicios.js
import {
  addDoc, collection, deleteDoc, doc, onSnapshot,
  query, updateDoc, serverTimestamp
} from "firebase/firestore";
import { db } from "../firebase";

const colEjercicios = (uid) => collection(db, "ejercicios", uid, "items");

export function listenEjercicios(uid, cb) {
  const q = query(colEjercicios(uid));
  return onSnapshot(q, (snap) => {
    const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    cb(data);
  });
}

export async function crearEjercicio(uid, { nombre, descripcion, grupo }) {
  return await addDoc(colEjercicios(uid), {
    nombre,
    descripcion,
    grupo,
    createdAt: serverTimestamp(),
  });
}

export async function actualizarEjercicio(uid, id, patch) {
  await updateDoc(doc(db, "ejercicios", uid, "items", id), patch);
}

export async function borrarEjercicio(uid, id) {
  await deleteDoc(doc(db, "ejercicios", uid, "items", id));
}
