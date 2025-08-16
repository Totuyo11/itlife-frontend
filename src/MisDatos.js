import React, { useEffect, useState } from "react";
import { auth, db } from "./firebase";
import { onAuthStateChanged } from "firebase/auth";
import {
  collection,
  addDoc,
  query,
  where,
  getDocs,
  Timestamp,
} from "firebase/firestore";

function MisDatos() {
  const [user, setUser] = useState(null);
  const [fechaActual, setFechaActual] = useState("");

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);
      } else {
        setUser(null);
      }
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const fecha = new Date();
    const fechaISO = fecha.toISOString().split("T")[0];
    setFechaActual(fechaISO);
  }, []);

  const guardarProgreso = async () => {
    if (!user || !fechaActual) return;
    try {
      const progresoRef = collection(db, "progreso");
      const progresoQuery = query(
        progresoRef,
        where("uid", "==", user.uid),
        where("fecha", "==", fechaActual)
      );
      const snapshot = await getDocs(progresoQuery);

      if (snapshot.empty) {
        await addDoc(progresoRef, {
          uid: user.uid,
          fecha: fechaActual,
          timestamp: Timestamp.now(),
        });
        alert("Progreso guardado 👌");
      } else {
        alert("Ya se registró el progreso de hoy ✅");
      }
    } catch (error) {
      console.error("❌ Error al guardar progreso:", error);
      alert("Error al guardar progreso.");
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen text-white bg-black px-6">
      <h1 className="text-3xl font-bold mb-6">🧍‍♂️ Mis Datos</h1>
      {user ? (
        <div className="text-center space-y-4">
          <p><strong>Nombre:</strong> {user.displayName || "No disponible"}</p>
          <p><strong>Correo:</strong> {user.email}</p>
          <p><strong>Fecha:</strong> {fechaActual}</p>
          <button
            onClick={guardarProgreso}
            className="bg-red-600 hover:bg-red-800 px-6 py-2 rounded-full mt-4 text-white"
          >
            Guardar progreso de hoy
          </button>
        </div>
      ) : (
        <p>Inicia sesión para ver tus datos</p>
      )}
    </div>
  );
}

export default MisDatos;
