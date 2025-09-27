import React, { useState } from "react";
import { useAuth } from "../AuthContext";
import { recommendRoutines, logSession } from "../services/recommender";
import { useToast } from "../useToast"; // si no tienes toasts, comenta estas 2 líneas
// import { useToast } from "../useToast";

export default function RutinasRecomendadas() {
  const { user } = useAuth() || {};
  const { toast } = useToast ? useToast() : { toast: () => {} };

  const [form, setForm] = useState({
    sex: "any",            // male | female | any
    age: 22,
    experience: "novato",  // novato | intermedio | avanzado
    minutes: 30,
    goal: "salud"          // salud | perder_peso | ganar_musculo
  });

  const [loading, setLoading] = useState(false);
  const [routines, setRoutines] = useState([]);
  const [error, setError] = useState("");

  const onChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({
      ...f,
      [name]: name === "age" || name === "minutes" ? Number(value) : value,
    }));
  };

  const onRecommend = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await recommendRoutines({
        uid: user?.uid,
        ...form,
      });
      setRoutines(res);
      if (!res.length) setError("No se encontraron rutinas con esos parámetros. Ajusta los filtros o agrega más rutinas.");
    } catch (e) {
      console.error(e);
      setError("Ocurrió un error al calcular recomendaciones.");
      setRoutines([]);
    } finally {
      setLoading(false);
    }
  };

  const onUseRoutine = async (r) => {
    try {
      await logSession({ uid: user?.uid, routine: r });
      toast?.({ title: "Rutina guardada", description: `Se registró "${r.name}" en tu historial.` });
    } catch (e) {
      toast?.({ title: "Error", description: "No se pudo guardar la sesión.", variant: "destructive" });
    }
  };

  return (
    <div className="registro-container">
      <div className="form-box">
        <h2 className="titulo-login" style={{marginBottom:12}}>Recomendador de Rutinas</h2>
        <p className="mensaje" style={{opacity:.8, marginBottom:16}}>
          Ajusta tus parámetros y genera recomendaciones personalizadas.
        </p>

        {/* Filtros */}
        <div
          className="grid"
          style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))" }}
        >
          <div>
            <label>Sexo</label>
            <select name="sex" value={form.sex} onChange={onChange}>
              <option value="any">Prefiero no decir</option>
              <option value="male">Masculino</option>
              <option value="female">Femenino</option>
            </select>
          </div>

          <div>
            <label>Edad</label>
            <input type="number" name="age" min={12} max={99} value={form.age} onChange={onChange} />
          </div>

          <div>
            <label>Experiencia</label>
            <select name="experience" value={form.experience} onChange={onChange}>
              <option value="novato">Novato</option>
              <option value="intermedio">Intermedio</option>
              <option value="avanzado">Avanzado</option>
            </select>
          </div>

          <div>
            <label>Minutos disponibles</label>
            <input type="number" name="minutes" min={10} max={120} value={form.minutes} onChange={onChange} />
          </div>

          <div>
            <label>Objetivo</label>
            <select name="goal" value={form.goal} onChange={onChange}>
              <option value="salud">Salud</option>
              <option value="perder_peso">Perder peso</option>
              <option value="ganar_musculo">Ganar músculo</option>
            </select>
          </div>
        </div>

        <button style={{ marginTop: 14 }} onClick={onRecommend} disabled={loading}>
          {loading ? "Calculando..." : "Recomendar"}
        </button>

        {/* Mensajes */}
        {!!error && (
          <p style={{ marginTop: 10, color: "#ff7b7b" }}>
            {error}
          </p>
        )}

        {/* Resultados */}
        {routines.length > 0 && (
          <div style={{ marginTop: 18 }}>
            <h3 style={{ marginBottom: 8 }}>Top recomendaciones</h3>

            {routines.map((r) => (
              <div
                key={r.id}
                className="card"
                style={{
                  border: "1px solid rgba(255,255,255,0.08)",
                  background: "rgba(0,0,0,0.25)",
                  borderRadius: 14,
                  padding: 14,
                  marginTop: 12,
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center" }}>
                  <div>
                    <strong style={{ fontSize: 16 }}>{r.name}</strong>
                    <div style={{ opacity: 0.85, fontSize: 13, marginTop: 2 }}>
                      Objetivo: <b>{r.goal}</b> • Nivel: <b>{r.level}</b> • Tiempo: {r.minMinutes}-{r.maxMinutes} min
                      {r.focus?.length ? <> • Foco: {r.focus.join(", ")}</> : null}
                    </div>
                    <div style={{ opacity: 0.6, fontSize: 12, marginTop: 2 }}>
                      Compatibilidad: {Math.round((r._score ?? 0) * 10) / 10}
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    <button onClick={() => onUseRoutine(r)}>Usar esta rutina</button>
                  </div>
                </div>

                {/* Bloques */}
                <ul style={{ marginTop: 8, paddingLeft: 16 }}>
                  {r.blocks?.map((b, i) => (
                    <li key={i} style={{ opacity: 0.95 }}>
                      <b>{b.bodyPart}</b>: {b.exercise} &nbsp;
                      {b.sets ? <>• {b.sets} series</> : null}
                      {b.reps ? <> • x {b.reps}</> : null}
                      {b.time ? <> • {b.time}</> : null}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}

        {!loading && routines.length === 0 && !error && (
          <p style={{ marginTop: 10, opacity: 0.8 }}>
            Aún no hay recomendaciones. Ajusta filtros o añade más rutinas a <code>/routines</code>.
          </p>
        )}
      </div>
    </div>
  );
}
