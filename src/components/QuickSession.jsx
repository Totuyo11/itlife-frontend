// src/components/QuickSession.jsx
import React, { useState } from "react";
import { addQuickSession } from "../services/sessions";

export default function QuickSession({ uid }) {
  const [minutes, setMinutes] = useState("");
  const [volume, setVolume] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [ok, setOk] = useState("");
  const [err, setErr] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true); setOk(""); setErr("");
    try {
      await addQuickSession(uid, {
        minutes: minutes ? Number(minutes) : 0,
        volume: volume ? Number(volume) : 0,
        notes,
      });
      setOk("Sesión registrada ✅");
      setMinutes(""); setVolume(""); setNotes("");
      // El dashboard se actualizará vía onSnapshot
    } catch (error) {
      setErr("No se pudo registrar la sesión. Intenta de nuevo.");
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mv-grid" style={{ marginTop: 8 }}>
      <div className="mv-item">
        <div className="mv-label">Minutos</div>
        <input
          type="number"
          min="0"
          step="1"
          placeholder="30"
          value={minutes}
          onChange={(e) => setMinutes(e.target.value)}
        />
      </div>
      <div className="mv-item">
        <div className="mv-label">Volumen</div>
        <input
          type="number"
          min="0"
          step="1"
          placeholder="120"
          value={volume}
          onChange={(e) => setVolume(e.target.value)}
        />
      </div>
      <div className="mv-item" style={{ gridColumn: "1 / -1" }}>
        <div className="mv-label">Notas</div>
        <input
          type="text"
          placeholder="Pecho/espalda, buen pump 💪"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
      </div>
      <div style={{ gridColumn: "1 / -1", display: "flex", gap: 8 }}>
        <button className={`btn ${loading ? "loading" : ""}`} type="submit" disabled={loading}>
          Guardar sesión
        </button>
        {ok && <span className="mensaje ok" style={{ alignSelf: "center" }}>{ok}</span>}
        {err && <span className="mensaje error" style={{ alignSelf: "center" }}>{err}</span>}
      </div>
    </form>
  );
}
