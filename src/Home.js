// src/Home.jsx
import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./Register.css";

export default function Home() {
  const navigate = useNavigate();

  // Reveal on scroll
  useEffect(() => {
    const els = Array.from(document.querySelectorAll(".reveal"));
    if (!("IntersectionObserver" in window) || els.length === 0) {
      els.forEach((el) => el.classList.add("reveal--in"));
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("reveal--in");
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15 }
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);

  // === Logros mock para la bandita del Home (muestra 3-4 insignias)
  const sampleHomeBadges = [
    { id: "first-session", icon: "🥇", title: "1er entreno", unlocked: true },
    { id: "streak-7", icon: "🔥", title: "Racha 7d", unlocked: false },
    { id: "ten-workouts", icon: "💪", title: "10 sesiones", unlocked: false },
    { id: "goal-weight", icon: "🎯", title: "Meta peso", unlocked: false },
  ];

  return (
    <div className="home">
      {/* ===== HERO ===== */}
      <section className="hero hero--svg hero--offset">
        <div className="hero-deco">
          <svg className="glow glow-a" viewBox="0 0 600 600" aria-hidden="true">
            <defs>
              <radialGradient id="gA" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="rgba(255,64,129,0.75)" />
                <stop offset="100%" stopColor="rgba(255,64,129,0)" />
              </radialGradient>
            </defs>
            <circle cx="300" cy="300" r="300" fill="url(#gA)" />
          </svg>
          <svg className="glow glow-b" viewBox="0 0 600 600" aria-hidden="true">
            <defs>
              <radialGradient id="gB" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="rgba(109,40,217,0.7)" />
                <stop offset="100%" stopColor="rgba(109,40,217,0)" />
              </radialGradient>
            </defs>
            <circle cx="300" cy="300" r="300" fill="url(#gB)" />
          </svg>
          <svg className="wave wave-top" viewBox="0 0 1440 320" preserveAspectRatio="none" aria-hidden="true">
            <path d="M0,64L48,96C96,128,192,192,288,202.7C384,213,480,171,576,149.3C672,128,768,128,864,149.3C960,171,1056,213,1152,213.3C1248,213,1344,171,1392,149.3L1440,128L1440,0L0,0Z" fill="rgba(255,255,255,0.06)" />
          </svg>
          <svg className="wave wave-bottom" viewBox="0 0 1440 320" preserveAspectRatio="none" aria-hidden="true">
            <path d="M0,256L48,229.3C96,203,192,149,288,128C384,107,480,117,576,138.7C672,160,768,192,864,186.7C960,181,1056,139,1152,122.7C1248,107,1344,117,1392,122.7L1440,128L1440,320L0,320Z" fill="rgba(255,255,255,0.04)" />
          </svg>
        </div>

        <div className="hero-grid">
          <div className="hero-content reveal">
            <div className="brand-mini">🏋️ FitLife</div>
            <h1 className="hero-title">
              Entrena mejor, <span className="hero-focus">mide tu progreso</span>, alcanza tus metas.
            </h1>
            <p className="hero-sub">
              Crea rutinas, registra entrenamientos y visualiza tu avance con métricas claras.
            </p>
            <div className="hero-actions">
              <button className="btn-primary" onClick={() => navigate("/register")}>Empieza ahora</button>
              <button className="btn-secondary" onClick={() => navigate("/rutina")}>Ver más</button>
            </div>
            <div className="chip-list">
              <span className="chip">📈 Gráficas</span>
              <span className="chip">🔥 Rachas</span>
              <span className="chip">🔒 Seguro</span>
            </div>
          </div>

          <div className="hero-illustration">
            <div className="illus-card illus-a reveal">
              <div className="illus-kpi">72kg</div>
              <div className="illus-caption">Peso actual</div>
            </div>
            <div className="illus-card illus-b reveal" style={{ transitionDelay: "90ms" }}>
              <div className="illus-kpi">+4</div>
              <div className="illus-caption">Sesiones esta semana</div>
            </div>
            <div className="illus-card illus-c reveal" style={{ transitionDelay: "180ms" }}>
              <div className="illus-kpi">8 días</div>
              <div className="illus-caption">Racha activa</div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== BENEFICIOS ===== */}
      <section className="section container benefits">
        <header className="section-head reveal">
          <h2>Todo lo que necesitas para avanzar</h2>
          <p>Planifica, registra y analiza tu progreso en un solo lugar.</p>
        </header>
        <div className="features-grid">
          <article className="feature-card reveal">
            <div className="feature-ico">🧠</div>
            <h3>Rutinas personalizadas</h3>
            <p>Elige tu objetivo y crea planes adaptados a tu nivel.</p>
          </article>
          <article className="feature-card reveal" style={{ transitionDelay: "100ms" }}>
            <div className="feature-ico">⏱️</div>
            <h3>Rastrea tus sesiones</h3>
            <p>Registra sets, reps, peso y notas en segundos.</p>
          </article>
          <article className="feature-card reveal" style={{ transitionDelay: "200ms" }}>
            <div className="feature-ico">📊</div>
            <h3>Gráficas y métricas</h3>
            <p>Ve tu tendencia de peso, volumen y rachas activas.</p>
          </article>
        </div>
      </section>

      {/* ===== SHOWCASE ===== */}
      <section className="section container showcase">
        <header className="section-head reveal">
          <h2>Diseño claro y enfoque en tus objetivos</h2>
          <p>Interfaz oscura con acentos neón y versión modo claro con alto contraste.</p>
        </header>
        <div className="showcase-grid">
          <div className="show-box reveal">
            <div className="show-tag">Dashboard</div>
            <div className="show-fig show-fig-1" aria-hidden="true" />
          </div>
          <div className="show-box reveal" style={{ transitionDelay: "100ms" }}>
            <div className="show-tag">Rutinas</div>
            <div className="show-fig show-fig-2" aria-hidden="true" />
          </div>
          <div className="show-box reveal" style={{ transitionDelay: "200ms" }}>
            <div className="show-tag">Progreso</div>
            <div className="show-fig show-fig-3" aria-hidden="true" />
          </div>
        </div>
      </section>

      {/* ===== TESTIMONIOS ===== */}
      <section className="section container testimonials">
        <header className="section-head reveal">
          <h2>Lo que dicen los usuarios</h2>
        </header>
        <div className="testi-grid">
          <figure className="testi-card reveal">
            <blockquote>“Con FitLife por fin veo mi avance semana a semana. Me motiva cañón.”</blockquote>
            <figcaption>— Andrea · 27 años</figcaption>
          </figure>
          <figure className="testi-card reveal" style={{ transitionDelay: "120ms" }}>
            <blockquote>“El dashboard es claro y las gráficas me ayudan a ajustar mis rutinas.”</blockquote>
            <figcaption>— Luis · 31 años</figcaption>
          </figure>
          <figure className="testi-card reveal" style={{ transitionDelay: "240ms" }}>
            <blockquote>“Me encanta el modo oscuro y que pueda registrar mi peso súper rápido.”</blockquote>
            <figcaption>— Sofía · 24 años</figcaption>
          </figure>
        </div>
      </section>

      {/* ===== FAQ / ACCORDION ===== */}
      <section className="section container faq">
        <header className="section-head reveal">
          <h2>Preguntas frecuentes</h2>
        </header>
        <details className="faq-item reveal">
          <summary>¿FitLife es gratuito?</summary>
          <p>Sí, crear cuenta y usar las funciones base es gratis.</p>
        </details>
        <details className="faq-item reveal" style={{ transitionDelay: "80ms" }}>
          <summary>¿Necesito conexión a internet?</summary>
          <p>Para sincronizar tu progreso sí; tu sesión y estado se guardan en la nube.</p>
        </details>
        <details className="faq-item reveal" style={{ transitionDelay: "160ms" }}>
          <summary>¿Tienen modo oscuro y claro?</summary>
          <p>Sí, puedes alternar desde el botón del navbar (☀️/🌙).</p>
        </details>
      </section>

      {/* ===== BANDITA DE LOGROS (NUEVO) ===== */}
      <section className="section container ach-band">
        <header className="ach-band-head">
          <h2>Logros recientes</h2>
          <p className="ach-band-sub">Sigue entrenando para desbloquear más insignias</p>
        </header>

        <div className="ach-mini-row">
          {sampleHomeBadges.slice(0, 4).map((b) => (
            <div
              key={b.id}
              className={`ach-mini ${b.unlocked ? "mini-unlocked" : "mini-locked"}`}
              title={b.unlocked ? "Desbloqueado" : "Pendiente"}
              aria-label={b.title}
            >
              <div className="mini-icon" aria-hidden="true">{b.icon}</div>
              <div className="mini-title">{b.title}</div>
            </div>
          ))}
        </div>

        <div className="ach-band-actions">
          <button className="btn-primary" onClick={() => navigate("/dashboard")}>
            Ver todos los logros
          </button>
        </div>
      </section>

      {/* ===== CTA FINAL ===== */}
      <section className="cta-final reveal">
        <h2>¿Listo para empezar?</h2>
        <button className="btn-primary" onClick={() => navigate("/register")}>
          Crear cuenta gratis
        </button>
      </section>

      {/* ===== FOOTER ===== */}
      <footer className="footer">
        <p>© 2025 FitLife — Todos los derechos reservados.</p>
        <a href="/privacidad">Política de privacidad</a>
        <a href="/terminos">Términos y condiciones</a>
      </footer>
    </div>
  );
}

