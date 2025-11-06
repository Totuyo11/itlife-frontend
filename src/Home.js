// src/Home.jsx
import React, { useEffect, useState } from "react";
import "./Register.css";
import { useAuth } from "./AuthContext";
import { listenUserTestimonials } from "./services/testimonios";
import { listenPublicTestimonials } from "./services/publicTestimonials";
import { listenHeroKpis } from "./services/metrics";
import { liveKpiBus } from "./state/liveKpiBus";

export default function Home() {
  const { currentUser } = useAuth();

  // Animación reveal
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

  // Logros mock
  const sampleHomeBadges = [
    { id: "first-session", icon: "🥇", title: "1er entreno", unlocked: true },
    { id: "streak-7", icon: "🔥", title: "Racha 7d", unlocked: false },
    { id: "ten-workouts", icon: "💪", title: "10 sesiones", unlocked: false },
    { id: "goal-weight", icon: "🎯", title: "Meta peso", unlocked: false },
  ];

  // Testimonios
  const defaultTestimonials = [
    { nombre: "Andrea · 27 años", texto: "Con FitLife por fin veo mi avance semana a semana. Me motiva cañón." },
    { nombre: "Luis · 31 años", texto: "El dashboard es claro y las gráficas me ayudan a ajustar mis rutinas." },
    { nombre: "Sofía · 24 años", texto: "Me encanta el modo oscuro y registrar mi peso súper rápido." },
    { nombre: "Carlos · 29 años", texto: "Creo mis rutinas personalizadas y veo resultados en tiempo real." },
    { nombre: "Valeria · 22 años", texto: "La interfaz neón está preciosa y amo ver mis rachas activas." },
  ];

  const [publicTestimonials, setPublicTestimonials] = useState([]);
  const [userTestimonials, setUserTestimonials] = useState([]);
  const [tIndex, setTIndex] = useState(0);

  useEffect(() => {
    const unsub = listenPublicTestimonials(setPublicTestimonials, 30);
    return () => unsub && unsub();
  }, []);

  useEffect(() => {
    if (!currentUser) return;
    const unsub = listenUserTestimonials(currentUser.uid, setUserTestimonials);
    return () => unsub && unsub();
  }, [currentUser]);

  const pool =
    (publicTestimonials && publicTestimonials.filter(t => t.approved !== false).length > 0)
      ? publicTestimonials.filter(t => t.approved !== false)
      : (userTestimonials.length > 0 ? userTestimonials : defaultTestimonials);

  useEffect(() => {
    const id = setInterval(() => setTIndex((i) => (i + 1) % pool.length), 6000);
    return () => clearInterval(id);
  }, [pool.length]);

  // KPIs desde Firestore
  const [kpis, setKpis] = useState({
    weightKg: null,
    weekSessions: 0,
    streakDays: 0,
  });
  useEffect(() => {
    if (!currentUser) return;
    const unsub = listenHeroKpis(currentUser.uid, setKpis);
    return () => unsub && unsub();
  }, [currentUser]);

  // Live bus (prioriza lo que el usuario está editando/registrando)
  const [live, setLive] = useState({
    weightKg: null,
    weekSessions: null,
    streakDays: null,
  });
  useEffect(() => {
    const unsub = liveKpiBus.subscribe(setLive);
    return () => unsub();
  }, []);

  return (
    <div className="home">
      {/* ===== HERO ===== */}
      <section className="hero hero--svg hero--offset">
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
              <button className="btn-primary">Empieza ahora</button>
              <button className="btn-secondary">Ver más</button>
            </div>
            <div className="chip-list">
              <span className="chip">📈 Gráficas</span>
              <span className="chip">🔥 Rachas</span>
              <span className="chip">🔒 Seguro</span>
            </div>
          </div>

          {/* KPIs dinámicos */}
          <div className="hero-illustration">
            <div className="illus-card illus-a reveal">
              <div className="illus-kpi">
                {(live.weightKg ?? kpis.weightKg) != null
                  ? `${(live.weightKg ?? kpis.weightKg)}kg`
                  : "—"}
              </div>
              <div className="illus-caption">Peso actual</div>
            </div>

            <div className="illus-card illus-b reveal" style={{ transitionDelay: "90ms" }}>
              <div className="illus-kpi">
                +{(live.weekSessions ?? kpis.weekSessions) ?? 0}
              </div>
              <div className="illus-caption">Sesiones esta semana</div>
            </div>

            <div className="illus-card illus-c reveal" style={{ transitionDelay: "180ms" }}>
              <div className="illus-kpi">
                {(live.streakDays ?? kpis.streakDays) ?? 0} días
              </div>
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
            <div className="show-content">
              <h4>📈 Visión general</h4>
              <p>Consulta métricas clave: peso, racha y sesiones activas. Monitorea tu progreso semanal y logros recientes.</p>
            </div>
          </div>

          <div className="show-box reveal" style={{ transitionDelay: "100ms" }}>
            <div className="show-tag">Rutinas</div>
            <div className="show-fig show-fig-2" aria-hidden="true" />
            <div className="show-content">
              <h4>💪 Planes personalizados</h4>
              <p>Genera rutinas por objetivo y nivel. Ajusta series, repeticiones y peso conforme avances.</p>
            </div>
          </div>

          <div className="show-box reveal" style={{ transitionDelay: "200ms" }}>
            <div className="show-tag">Progreso</div>
            <div className="show-fig show-fig-3" aria-hidden="true" />
            <div className="show-content">
              <h4>📊 Análisis detallado</h4>
              <p>Gráficos de peso y volumen para detectar tendencias, romper estancamientos y celebrar mejoras.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ===== TESTIMONIOS ===== */}
      <section className="section container testimonials">
        <header className="section-head reveal">
          <h2>Lo que dicen los usuarios</h2>
        </header>
        <div className="testi-rotator reveal">
          <figure key={tIndex} className="testi-card fade-in">
            <blockquote>“{pool[tIndex].texto}”</blockquote>
            <figcaption>— {pool[tIndex].nombre}</figcaption>
          </figure>
        </div>
      </section>

      {/* ===== LOGROS ===== */}
      <section className="section container ach-band">
        <header className="ach-band-head">
          <h2>Logros recientes</h2>
          <p className="ach-band-sub">Sigue entrenando para desbloquear más insignias</p>
        </header>
        <div className="ach-mini-row">
          {sampleHomeBadges.map((b) => (
            <div key={b.id} className={`ach-mini ${b.unlocked ? "mini-unlocked" : "mini-locked"}`}>
              <div className="mini-icon">{b.icon}</div>
              <div className="mini-title">{b.title}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ===== CTA ===== */}
      <section className="cta-final reveal">
        <h2>¿Listo para empezar?</h2>
        <button className="btn-primary">Crear cuenta gratis</button>
      </section>

      <footer className="footer">
        <p>© 2025 FitLife — Todos los derechos reservados.</p>
      </footer>
    </div>
  );
}
