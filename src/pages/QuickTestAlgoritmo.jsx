import React, { useState } from "react";
import { recommendRoutines } from "../recommender";

export default function QuickTestAlgoritmo() {
  const [loading, setLoading] = useState(false);
  const [out, setOut] = useState([]);
  const [inputs, setInputs] = useState({
    objetivo: 1, dificultad: 2, limitacion: 0, tiempo: 2, frecuencia: 3
  });

  const catalogo = [
    { id: "A", name: "HIIT 20", foco: "HIIT", minutos: 20, nivel: 2, scheme: "fatloss" },
    { id: "B", name: "Fuerza 45", foco: "Fuerza", minutos: 45, nivel: 2, scheme: "muscle" },
    { id: "C", name: "HIIT 20 B", foco: "HIIT", minutos: 20, nivel: 2, scheme: "fatloss" },
  ];

  async function run() {
    setLoading(true);
    try {
      const ranked = await recommendRoutines(inputs, catalogo, { topK: 3 });
      setOut(ranked);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ padding: 20 }}>
      <h2>Quick Test Algoritmo</h2>

      <div style={{ display: "grid", gap: 8, maxWidth: 420 }}>
        <label>Objetivo
          <input type="number" value={inputs.objetivo}
            onChange={e => setInputs({ ...inputs, objetivo: Number(e.target.value) })}/>
        </label>
        <label>Dificultad
          <input type="number" value={inputs.dificultad}
            onChange={e => setInputs({ ...inputs, dificultad: Number(e.target.value) })}/>
        </label>
        <label>Limitación
          <input type="number" value={inputs.limitacion}
            onChange={e => setInputs({ ...inputs, limitacion: Number(e.target.value) })}/>
        </label>
        <label>Tiempo (bucket)
          <input type="number" value={inputs.tiempo}
            onChange={e => setInputs({ ...inputs, tiempo: Number(e.target.value) })}/>
        </label>
        <label>Frecuencia
          <input type="number" value={inputs.frecuencia}
            onChange={e => setInputs({ ...inputs, frecuencia: Number(e.target.value) })}/>
        </label>

        <button onClick={run} disabled={loading}>
          {loading ? "Calculando..." : "Probar ranking"}
        </button>
      </div>

      <pre style={{ marginTop: 16, background: "#111", color: "#0f0", padding: 12, borderRadius: 8 }}>
        {JSON.stringify(out, null, 2)}
      </pre>
    </div>
  );
}
