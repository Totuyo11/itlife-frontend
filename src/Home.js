import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./Register.css"; // reusar variables y estilos base

export default function Home() {
  const navigate = useNavigate();

  // === Reveal on scroll (sin dependencias) ===
  useEffect(() => {
    const els = Array.from(document.querySelectorAll(".reveal"));
    if (!("IntersectionObserver" in window) || els.length === 0) {
      // Fallback: si no hay IO, mostrar todo
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

  return (
    <div className="home">
      {/* ===== HERO con SVG decorativos ===== */}
      <section className="hero hero--svg hero--offset">
        {/* capas decorativas */}
        <div className="hero-deco">
          {/* Glow elíptico superior izq */}
          <svg className="glow glow-a" viewBox="0 0 600 600" aria-hidden="true">
            <defs>
              <radialGradient id="gA" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="rgba(255,64,129,0.75)" />
                <stop offset="100%" stopColor="rgba(255,64,129,0)" />
              </radialGradient>
            </defs>
            <circle cx="300" cy="300" r="300" fill="url(#gA)" />
          </svg>
          {/* Glow elíptico inferior der */}
          <svg className="glow glow-b" viewBox="0 0 600 600" aria-hidden="true">
            <defs>
              <radialGradient id="gB" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="rgba(109,40,217,0.7)" />
                <stop offset="100%" stopColor="rgba(109,40,217,0)" />
              </radialGradient>
            </defs>
            <circle cx="300" cy="300" r="300" fill="url(#gB)" />
          </svg>

          {/* Olas */}
          <svg className="wave wave-top" viewBox="0 0 1440 320" preserveAspectRatio="none" aria-hidden="true">
            <path
              d="M0,64L48,96C96,128,192,192,288,202.7C384,213,480,171,576,149.3C672,128,768,128,864,149.3C960,171,1056,213,1152,213.3C1248,213,1344,171,1392,149.3L1440,128L1440,0L1392,0C1344,0,1248,0,1152,0C1056,0,960,0,864,0C768,0,672,0,576,0C480,0,384,0,288,0C192,0,96,0,48,0L0,0Z"
              fill="rgba(255,255,255,0.06)"
            />
          </svg>

          <svg className="wave wave-bottom" viewBox="0 0 1440 320" preserveAspectRatio="none" aria-hidden="true">
            <path
              d="M0,256L48,229.3C96,203,192,149,288,128C384,107,480,117,576,138.7C672,160,768,192,864,186.7C960,181,1056,139,1152,122.7C1248,107,1344,117,1392,122.7L1440,128L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"
              fill="rgba(255,255,255,0.04)"
            />
          </svg>
        </div>

        <div className="hero-grid">
          <div className="hero-content reveal">
            <div className="brand-mini">🏋️ FitLife</div>
            <h1 className="hero-title">
              Entrena mejor, <span className="hero-focus">mide tu progreso</span>, alcanza tus metas.
            </h1>
            <p className="hero-sub">
              FitLife te ayuda a crear rutinas, registrar entrenamientos y seguir tu avance con métricas claras.
            </p>
            <div className="hero-actions">
              <button className="btn-primary" onClick={() => navigate("/register")}>
                Empieza ahora
              </button>
              <button className="btn-secondary" onClick={() => navigate("/rutina")}>
                Ver más
              </button>
            </div>

            <div className="chip-list">
              <span className="chip">📈 Gráficas</span>
              <span className="chip">🔥 Rachas</span>
              <span className="chip">🔒 Seguro</span>
            </div>
          </div>

          {/* Ilustración con tarjetas flotantes */}
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

      {/* ===== Beneficios ===== */}
      <section className="benefits">
        <div className="benefit-card reveal">
          <h3>🏋️ Rutinas personalizadas</h3>
          <p>Entrena según tu objetivo: perder peso, ganar masa o mantenerte saludable.</p>
        </div>
        <div className="benefit-card reveal" style={{ transitionDelay: "100ms" }}>
          <h3>📈 Seguimiento de progreso</h3>
          <p>Registra tus entrenamientos y visualiza cómo mejoras día a día.</p>
        </div>
        <div className="benefit-card reveal" style={{ transitionDelay: "200ms" }}>
          <h3>📊 Gráficas y métricas</h3>
          <p>Obtén estadísticas claras y motívate con tu propio avance.</p>
        </div>
      </section>

      {/* ===== CTA final ===== */}
      <section className="cta-final reveal">
        <h2>¿Listo para empezar?</h2>
        <button className="btn-primary" onClick={() => navigate("/register")}>
          Crear cuenta gratis
        </button>
      </section>

      {/* ===== Footer ===== */}
      <footer className="footer">
        <p>© 2025 FitLife — Todos los derechos reservados.</p>
        <a href="/privacidad">Política de privacidad</a>
        <a href="/terminos">Términos y condiciones</a>
      </footer>
    </div>
  );
}
