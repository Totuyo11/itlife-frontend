import React, { useState } from "react";
import { db } from "./firebase";
import { collection, addDoc } from "firebase/firestore";
import routines from "./assets/routines.json"; // 👈 importa el JSON

export default function SeedRoutinesFromJSON() {
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  const seed = async () => {
    try {
      setLoading(true);
      setError("");
      const col = collection(db, "routines");

      // Validación básica por si editas el JSON en el futuro
      const required = ["name","goal","level","sex","minAge","maxAge","minMinutes","maxMinutes","focus","blocks"];
      for (const r of routines) {
        for (const k of required) {
          if (r[k] === undefined) throw new Error(`Falta el campo "${k}" en: ${r.name || "una rutina"}`);
        }
        await addDoc(col, r);
      }

      setDone(true);
    } catch (e) {
      console.error(e);
      setError(e.message || "Error al cargar rutinas");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="registro-container">
      <div className="form-box">
        <h2>Seed de Rutinas (JSON)</h2>
        <button onClick={seed} disabled={loading || done}>
          {loading ? "Cargando..." : done ? "✅ Listo" : "Cargar 5 rutinas"}
        </button>
        {error && <p style={{color:"#f66", marginTop:8}}>⚠️ {error}</p>}
        {done && <p style={{opacity:.8, marginTop:8}}>Se agregaron {routines.length} rutinas a <code>/routines</code>.</p>}
      </div>
    </div>
  );
}
