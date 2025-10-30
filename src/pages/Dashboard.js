// src/pages/Dashboard.js
import React, { useEffect, useMemo, useState } from "react";
import "./../Register.css";
import {
  ResponsiveContainer,
  LineChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Line,
  BarChart,
  Bar,
} from "recharts";
import { useAuth } from "../AuthContext";
import Achievements from "../components/Achievements";
import QuickSession from "../components/QuickSession";
import GoalWeightCard from "../components/GoalWeightCard";               // ✅ NUEVO

// servicios
import {
  listenUserDashboard,
  syncAchievements,
  buildBadges,
} from "../services/stats";
import { subscribeGoalWeight } from "../services/userProfile";          // ✅ NUEVO

// --- helpers para mock inicial ---
function makeLastNDays(n = 14) {
  const out = [];
  const now = new Date();
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(now.getDate() - i);
    out.push({
      fecha: d.toLocaleDateString("es-MX", { day: "2-digit", month: "short" }),
      peso: null,
      volumen: Math.random() > 0.6 ? Math.floor(Math.random() * 100) + 20 : null,
    });
  }
  return out;
}

export default function Dashboard() {
  const { user } = useAuth();

  // estado principal
  const [serie, setSerie] = useState(() => makeLastNDays(14));
  const [stats, setStats] = useState({ sesiones7d: 0, rachaActiva: 0, ultimoPeso: null });
  const [achDoc, setAchDoc] = useState(null);
  const [badges, setBadges] = useState([]);

  // ✅ meta de peso
  const [goalWeight, setGoalWeight] = useState(null);

  // tema para colores del chart
  const readTheme = () =>
    document.documentElement.getAttribute("data-theme") || "dark";
  const [theme, setTheme] = useState(readTheme());

  const chartColors = useMemo(() => {
    if (theme === "light") {
      return {
        text: "#1e293b",
        grid: "#cbd5e1",
        line: "#ff4081",
        barFill: "#6366f1",
        tooltipBg: "#f8fafc",
        tooltipBorder: "#94a3b8",
        heat: [
          "rgba(255,255,255,.3)",
          "rgba(255,64,129,.25)",
          "rgba(255,64,129,.45)",
          "rgba(255,64,129,.65)",
          "rgba(255,64,129,.85)",
        ],
      };
    }
    return {
      text: "#e2e8f0",
      grid: "#334155",
      line: "#ff4081",
      barFill: "#60a5fa",
      tooltipBg: "#0f172a",
      tooltipBorder: "#475569",
      heat: [
        "rgba(255,255,255,.15)",
        "rgba(255,64,129,.25)",
        "rgba(255,64,129,.45)",
        "rgba(255,64,129,.65)",
        "rgba(255,64,129,.85)",
      ],
    };
  }, [theme]);

  // observa cambio de tema
  useEffect(() => {
    const el = document.documentElement;
    const mo = new MutationObserver(() => setTheme(readTheme()));
    mo.observe(el, { attributes: true, attributeFilter: ["data-theme"] });
    return () => mo.disconnect();
  }, []);

  // suscripción realtime si hay usuario; si no, mock
  useEffect(() => {
    if (!user) {
      // mock local
      setSerie(makeLastNDays(14));
      setStats({ sesiones7d: 0, rachaActiva: 0, ultimoPeso: null });
      setAchDoc(null);
      setBadges([]);
      setGoalWeight(null);
      return;
    }

    // 1) dashboard (weights/sessions/achievements)
    const unsub = listenUserDashboard(user.uid, ({ series, stats, achievementsDoc }) => {
      setSerie(series);
      setStats(stats);
      setAchDoc(achievementsDoc || null);

      // ⚠️ usa goalWeight más reciente del estado
      setBadges(buildBadges(stats, achievementsDoc, goalWeight));
      // sincroniza logros (incluye meta si aplica)
      syncAchievements(user.uid, stats, goalWeight).catch(() => {});
    });

    // 2) meta de peso
    const unsubGoal = subscribeGoalWeight(user.uid, ({ goalWeight }) => {
      setGoalWeight(goalWeight ?? null);
      // recalcula badges con meta actual
      setBadges((prev) => buildBadges(stats, achDoc, goalWeight ?? null));
      // re-sincroniza logro de meta si aplica
      syncAchievements(user.uid, stats, goalWeight ?? null).catch(() => {});
    });

    return () => { unsub && unsub(); unsubGoal && unsubGoal(); };
    // ✅ dependencia en goalWeight para que el callback use la meta vigente
  }, [user, goalWeight]); 

  return (
    <div className="dash-wrap">
      <h1 className="dash-title">Tu progreso</h1>

      {/* KPIs */}
      <section className="dash-grid">
        <div className="dash-card">
          <div className="dash-kpi-title">Racha activa</div>
          <div className="dash-kpi-value">{stats.rachaActiva || 0} días</div>
          <div className="dash-kpi-foot">Días seguidos con sesión</div>
        </div>
        <div className="dash-card">
          <div className="dash-kpi-title">Sesiones (7d)</div>
          <div className="dash-kpi-value">{stats.sesiones7d || 0}</div>
          <div className="dash-kpi-foot">Entrenos en la semana</div>
        </div>
        <div className="dash-card">
          <div className="dash-kpi-title">Último peso</div>
          <div className="dash-kpi-value">
            {stats.ultimoPeso != null ? `${stats.ultimoPeso} kg` : "—"}
          </div>
          <div className="dash-kpi-foot">Actualiza al finalizar sesión</div>
        </div>
      </section>

      {/* ✅ Objetivo de peso */}
      <section className="dash-section">
        <div className="dash-sec-head">
          <h2>Objetivo</h2>
          <div className="dash-sec-note">Define tu meta de peso y desbloquea el logro 🎯</div>
        </div>
        {user ? (
          <div className="dash-grid">
            <GoalWeightCard
              uid={user.uid}
              goalWeight={goalWeight}
              ultimoPeso={stats.ultimoPeso}
            />
          </div>
        ) : (
          <div className="dash-alert">Inicia sesión para definir tu meta.</div>
        )}
      </section>

      {/* Heatmap semanal (decorativo por ahora) */}
      <section className="dash-section">
        <div className="dash-sec-head">
          <h2>Asistencia semanal</h2>
        </div>
        <div className="heat-grid">
          {["lun", "mar", "mié", "jue", "vie", "sáb", "dom"].map((dia, i) => (
            <div key={dia} className="heat-item">
              <div className="heat-label">{dia}</div>
              <div
                className="heat-cell"
                style={{ background: chartColors.heat[i % 5] }}
              />
            </div>
          ))}
        </div>
      </section>

      {/* Registrar sesión rápida */}
      <section className="dash-section">
        <div className="dash-sec-head">
          <h2>Registrar sesión rápida</h2>
          <div className="dash-sec-note">Minutos, volumen y una nota — listo en 10s</div>
        </div>
        {user ? (
          <QuickSession uid={user.uid} />
        ) : (
          <div className="dash-alert">Inicia sesión para registrar tus entrenos.</div>
        )}
      </section>

      {/* Línea de peso */}
      <section className="dash-section">
        <div className="dash-sec-head">
          <h2>Tendencia de peso (14 días)</h2>
        </div>
        <div className="chart-box" style={{ height: 260 }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={serie}>
              <CartesianGrid stroke={chartColors.grid} strokeDasharray="3 3" />
              <XAxis dataKey="fecha" stroke={chartColors.text} />
              <YAxis stroke={chartColors.text} />
              <Tooltip
                contentStyle={{
                  background: chartColors.tooltipBg,
                  border: `1px solid ${chartColors.tooltipBorder}`,
                  borderRadius: 8,
                }}
              />
              <Line
                type="monotone"
                dataKey="peso"
                stroke={chartColors.line}
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </section>

      {/* Barras de volumen */}
      <section className="dash-section">
        <div className="dash-sec-head">
          <h2>Volumen de entrenamiento (14 días)</h2>
        </div>
        <div className="chart-box" style={{ height: 260 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={serie}>
              <CartesianGrid stroke={chartColors.grid} strokeDasharray="3 3" />
              <XAxis dataKey="fecha" stroke={chartColors.text} />
              <YAxis stroke={chartColors.text} />
              <Tooltip
                contentStyle={{
                  background: chartColors.tooltipBg,
                  border: `1px solid ${chartColors.tooltipBorder}`,
                  borderRadius: 8,
                }}
              />
              <Bar dataKey="volumen" fill={chartColors.barFill} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>

      {/* ===== Logros (abajo) ===== */}
      <section className="dash-section">
        <div className="dash-sec-head">
          <h2>Logros</h2>
          <div className="dash-sec-note">Desbloquea metas conforme entrenas</div>
        </div>
        <Achievements badges={badges} />
      </section>
    </div>
  );
}

