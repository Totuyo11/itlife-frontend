// src/components/GoalWeightCard.jsx
import React, { useState } from "react";
import { updateGoalWeight } from "../services/userProfile";

export default function GoalWeightCard({ uid, goalWeight, ultimoPeso }) {
  const [val, setVal] = useState(goalWeight ?? "");
  const [loading, setLoading] = useState(false);
  const [ok, setOk] = useState("");
  const [err, setErr] = useState("");

  const reached =
    typeof goalWeight === "number" &&
    goalWeight > 0 &&
    ultimoPeso != null &&
    ultimoPeso <= goalWeight + 0.2;

  async function save() {
    setOk(""); setErr(""); setLoading(true);
    try {
      await updateGoalWeight(uid, val);
      setOk("Meta guardada ✅");
    } catch (e) {
      console.error(e);
      setErr("No se pudo guardar la meta");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="dash-card" style={{ display: "grid", gap: 10 }}>
      <div className="dash-kpi-title">Meta de peso</div>
      <div className="dash-kpi-value">
        {goalWeight ? `${goalWeight} kg` : "—"}
      </div>
      <div className="dash-kpi-foot">
        {ultimoPeso != null ? `Último: ${ultimoPeso} kg` : "Actualiza tu peso para ver el progreso"}
      </div>

      {reached && (
        <div className="dash-alert" style={{ marginTop: 8 }}>
          🎯 ¡Meta alcanzada! Excelente trabajo.
        </div>
      )}

      <div className="mv-grid" style={{ marginTop: 6 }}>
        <div className="mv-item" style={{ gridColumn: "1 / -1" }}>
          <div className="mv-label">Editar meta (kg)</div>
          <input
            type="number"
            min="1"
            step="0.1"
            placeholder="Ej. 70.0"
            value={val}
            onChange={(e) => setVal(e.target.value)}
          />
        </div>
        <div style={{ gridColumn: "1 / -1", display: "flex", gap: 8 }}>
          <button className={`btn ${loading ? "loading" : ""}`} disabled={loading} onClick={save}>
            Guardar meta
          </button>
          {ok && <span className="mensaje ok" style={{ alignSelf: "center" }}>{ok}</span>}
          {err && <span className="mensaje error" style={{ alignSelf: "center" }}>{err}</span>}
        </div>
      </div>
    </div>
  );
}
