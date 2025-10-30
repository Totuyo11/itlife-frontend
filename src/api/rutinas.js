
import {
  addDoc, collection, deleteDoc, doc, onSnapshot,
  query, updateDoc, getDocs, setDoc, serverTimestamp
} from "firebase/firestore";
import { db } from "../firebase";

// colecciones
const colRutinas = (uid) => collection(db, "planes", uid, "rutinas");
const colDias    = (uid) => collection(db, "planes", uid, "dias"); // docs: { id:'YYYY-MM-DD', rutinaId }

export function listenRutinas(uid, cb) {
  const q = query(colRutinas(uid));
  return onSnapshot(q, (snap) => {
    const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    cb(data);
  });
}

export async function crearRutina(uid, { nombre, ejercicios = [] }) {
  return await addDoc(colRutinas(uid), {
    nombre, ejercicios, createdAt: serverTimestamp(),
  });
}

export async function actualizarRutina(uid, id, patch) {
  await updateDoc(doc(db, "planes", uid, "rutinas", id), patch);
}

export async function borrarRutina(uid, id) {
  await deleteDoc(doc(db, "planes", uid, "rutinas", id));
}

export async function asignarRutinaADia(uid, diaISO, rutinaId) {
  // guarda/actualiza en 'planes/{uid}/dias/{diaISO}'
  try {
    await updateDoc(doc(db, "planes", uid, "dias", diaISO), {
      rutinaId, ts: serverTimestamp(),
    });
  } catch {
    // si no existe el doc, lo creamos usando setDoc con id fijo
    await setDoc(doc(db, "planes", uid, "dias", diaISO), {
      rutinaId, ts: serverTimestamp(),
    });
  }
}

export async function getAsignacionesPorRango(uid, startISO, endISO) {
  const snap = await getDocs(colDias(uid));
  return snap.docs.map(d => ({ id: d.id, ...d.data() }))
    .filter(d => d.id >= startISO && d.id <= endISO);
}

