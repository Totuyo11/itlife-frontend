// src/components/QuickSession.jsx
import React, { useState } from "react";
import { addQuickSession } from "../services/sessions";
import { toast } from "react-toastify";
import { liveKpiBus } from "../state/liveKpiBus"; // ⬅️ Nuevo: actualiza el Home en tiempo real

export default function QuickSession({ uid, onSaved, onError }) {
  const [minutes, setMinutes] = useState("");
  const [volume, setVolume] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [ok, setOk] = useState("");
  const [err, setErr] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setOk("");
    setErr("");

    if (!uid) {
      toast.warn("Debes iniciar sesión.");
      setLoading(false);
      return;
    }

    try {
      await addQuickSession(uid, {
        minutes: minutes ? Number(minutes) : 0,
        volume: volume ? Number(volume) : 0,
        notes: notes.trim(),
      });

      // 🧠 Actualización en vivo para el Home
      liveKpiBus.bumpWeekSessions(1);
      liveKpiBus.bumpStreakForToday();

      setOk("Sesión registrada ✅");
      setMinutes("");
      setVolume("");
      setNotes("");
      toast.success("✅ Sesión registrada correctamente");
      if (onSaved) onSaved();
    } catch (error) {
      console.error(error);
      setErr("No se pudo registrar la sesión. Intenta de nuevo.");
      toast.error("❌ No se pudo registrar la sesión");
      if (onError) onError(error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="mv-grid form-deco"
      style={{
        marginTop: 16,
        padding: 16,
        borderRadius: "1rem",
        background: "var(--card-bg, rgba(255,255,255,0.05))",
      }}
    >
      <h3 className="card-title" style={{ gridColumn: "1 / -1" }}>
        ⚡ Sesión rápida
      </h3>

      <div className="mv-item">
        <div className="mv-label">Minutos</div>
        <input
          type="number"
          min="0"
          step="1"
          placeholder="30"
          value={minutes}
          onChange={(e) => setMinutes(e.target.value)}
          className="rtn-input"
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
          className="rtn-input"
        />
      </div>

      <div className="mv-item" style={{ gridColumn: "1 / -1" }}>
        <div className="mv-label">Notas</div>
        <input
          type="text"
          placeholder="Pecho/espalda, buen pump 💪"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className="rtn-input"
        />
      </div>

      <div
        style={{
          gridColumn: "1 / -1",
          display: "flex",
          gap: 8,
          alignItems: "center",
        }}
      >
        <button
          className={`btn ${loading ? "loading" : ""}`}
          type="submit"
          disabled={loading}
        >
          {loading ? "Guardando..." : "Guardar sesión"}
        </button>

        {ok && (
          <span className="mensaje ok" style={{ color: "#00ff99" }}>
            {ok}
          </span>
        )}
        {err && (
          <span className="mensaje error" style={{ color: "#ff3366" }}>
            {err}
          </span>
        )}
      </div>
    </form>
  );
}
