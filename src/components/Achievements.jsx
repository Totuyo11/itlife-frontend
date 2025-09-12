import React from "react";
import "../Register.css";

/**
 * Achievements
 * - props:
 *    - badges: array de { id, icon, title, desc, unlockedAt? }
 * - Si unlockedAt existe, se pinta como desbloqueado; si no, como bloqueado.
 */
export default function Achievements({ badges = [] }) {
  return (
    <section className="dash-section">
      <div className="dash-sec-head">
        <h2>Logros</h2>
        <span className="dash-sec-note">Gánalos entrenando y registrando tu progreso</span>
      </div>

      <div className="ach-grid">
        {badges.map((b) => {
          const unlocked = Boolean(b.unlockedAt);
          return (
            <article
              key={b.id}
              className={`ach-card ${unlocked ? "ach-unlocked" : "ach-locked"}`}
              title={unlocked ? `Desbloqueado el ${new Date(b.unlockedAt).toLocaleDateString("es-MX")}` : "Aún bloqueado"}
            >
              <div className="ach-icon" aria-hidden="true">{b.icon}</div>
              <div className="ach-body">
                <h3 className="ach-title">{b.title}</h3>
                <p className="ach-desc">{b.desc}</p>
                <div className="ach-foot">
                  {unlocked ? (
                    <span className="ach-tag ok">Desbloqueado</span>
                  ) : (
                    <span className="ach-tag">Pendiente</span>
                  )}
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
