// src/pages/Dashboard.js
import React, { useEffect, useMemo, useState } from "react";
import "./../Register.css";

import {
  ResponsiveContainer,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  RadialBarChart,
  RadialBar,
  PolarAngleAxis,
  LineChart,
  Line,
} from "recharts";

import { useAuth } from "../AuthContext";
import Achievements from "../components/Achievements";
import QuickSession from "../components/QuickSession";
import GoalWeightCard from "../components/GoalWeightCard";
import { toast } from "react-toastify";

import {
  listenUserDashboard,
  syncAchievements,
  buildBadges,
  addWeight,
} from "../services/stats";
import { subscribeGoalWeight } from "../services/userProfile";

// Mock inicial por si no hay usuario
function makeLastNDays(n = 14) {
  const out = [];
  const now = new Date();
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(now.getDate() - i);
    out.push({
      fecha: d.toLocaleDateString("es-MX", { day: "2-digit", month: "short" }),
      peso: null,
    });
  }
  return out;
}

export default function Dashboard() {
  const { user } = useAuth();

  // KPIs
  const [stats, setStats] = useState({
    sesiones7d: 0,
    rachaActiva: 0,
    ultimoPeso: null,
  });

  // Logros
  const [achDoc, setAchDoc] = useState(null);
  const [badges, setBadges] = useState([]);

  // Meta de peso
  const [goalWeight, setGoalWeight] = useState(null);

  // Datasets para gráficas solicitadas
  const [todayMinutes, setTodayMinutes] = useState(0);
  const [weightLineDaily, setWeightLineDaily] = useState(makeLastNDays(14));

  // Form para registrar peso de hoy
  const [pesoHoy, setPesoHoy] = useState("");
  const [savingPeso, setSavingPeso] = useState(false);

  // Tema
  const readTheme = () =>
    document.documentElement.getAttribute("data-theme") || "dark";
  const [theme, setTheme] = useState(readTheme());

  const chartColors = useMemo(() => {
    if (theme === "light") {
      return {
        text: "#1e293b",
        grid: "#cbd5e1",
        line: "#ff4081",
        tooltipBg: "#f8fafc",
        tooltipBorder: "#94a3b8",
      };
    }
    return {
      text: "#e2e8f0",
      grid: "#334155",
      line: "#ff4081",
      tooltipBg: "#0f172a",
      tooltipBorder: "#475569",
    };
  }, [theme]);

  useEffect(() => {
    const el = document.documentElement;
    const mo = new MutationObserver(() => setTheme(readTheme()));
    mo.observe(el, { attributes: true, attributeFilter: ["data-theme"] });
    return () => mo.disconnect();
  }, []);

  useEffect(() => {
    if (!user) {
      setStats({ sesiones7d: 0, rachaActiva: 0, ultimoPeso: null });
      setAchDoc(null);
      setBadges([]);
      setGoalWeight(null);
      setTodayMinutes(0);
      setWeightLineDaily(makeLastNDays(14));
      return;
    }

    const unsub = listenUserDashboard(user.uid, (payload) => {
      const { stats, achievementsDoc, todayMinutes, weightLineDaily } = payload;
      setStats(stats || { sesiones7d: 0, rachaActiva: 0, ultimoPeso: null });
      setAchDoc(achievementsDoc || null);
      setTodayMinutes(todayMinutes ?? 0);
      setWeightLineDaily(weightLineDaily || makeLastNDays(14));

      setBadges(buildBadges(stats || {}, achievementsDoc, goalWeight));
      syncAchievements(user.uid, stats || {}, goalWeight).catch(() => {});
    });

    const unsubGoal = subscribeGoalWeight(user.uid, ({ goalWeight }) => {
      setGoalWeight(goalWeight ?? null);
      setBadges((prev) => buildBadges(stats, achDoc, goalWeight ?? null));
      syncAchievements(user.uid, stats, goalWeight ?? null).catch(() => {});
    });

    return () => {
      if (unsub) unsub();
      if (unsubGoal) unsubGoal();
    };
  }, [user, goalWeight, stats, achDoc]);

  async function handleSavePeso(e) {
    e.preventDefault();
    if (!user || !pesoHoy) return;
    try {
      setSavingPeso(true);
      await addWeight(user.uid, Number(pesoHoy), new Date());
      setPesoHoy("");
      toast.success("✅ Peso guardado correctamente");
    } catch (err) {
      console.error(err);
      toast.error("❌ No se pudo guardar el peso");
    } finally {
      setSavingPeso(false);
    }
  }

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
          <div className="dash-kpi-foot">
            {goalWeight ? `Meta: ${goalWeight} kg` : "Define tu meta"}
          </div>
        </div>
      </section>

      {/* Objetivo de peso */}
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

      {/* Minutos de HOY (Gauge) */}
      <section className="dash-section">
        <div className="dash-sec-head">
          <h2>Minutos de hoy</h2>
          <div className="dash-sec-note">Objetivo diario: 60 min</div>
        </div>

        <div className="chart-box" style={{ height: 260 }}>
          <ResponsiveContainer width="100%" height="100%">
            <RadialBarChart
              innerRadius="60%"
              outerRadius="100%"
              startAngle={180}
              endAngle={0}
              data={[
                { name: "meta", value: 60 },
                { name: "hoy", value: Math.min(todayMinutes, 60) },
              ]}
            >
              <PolarAngleAxis type="number" domain={[0, 60]} tick={false} />
              <RadialBar dataKey="value" cornerRadius={14} />
              <Tooltip
                contentStyle={{
                  background: chartColors.tooltipBg,
                  border: `1px solid ${chartColors.tooltipBorder}`,
                  borderRadius: 8,
                }}
              />
            </RadialBarChart>
          </ResponsiveContainer>
        </div>

        <div className="dash-kpi-value" style={{ textAlign: "center", marginTop: 8 }}>
          {todayMinutes} / 60 min
        </div>
      </section>

      {/* Peso diario (línea 14 días) + formulario */}
      <section className="dash-section">
        <div className="dash-sec-head">
          <h2>Peso diario (14 días)</h2>
          <div className="dash-sec-note">Registra tu peso para ver la tendencia</div>
        </div>

        <div className="chart-box" style={{ height: 260 }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={weightLineDaily}>
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
              <Line type="monotone" dataKey="peso" stroke={chartColors.line} strokeWidth={2} dot />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {user ? (
          <form
            onSubmit={handleSavePeso}
            className="quick-card"
            style={{ marginTop: 12, display: "flex", gap: 8 }}
          >
            <input
              type="number"
              min="1"
              step="0.1"
              placeholder="Peso de hoy (kg)"
              value={pesoHoy}
              onChange={(e) => setPesoHoy(e.target.value)}
              style={{
                flex: 1,
                padding: 10,
                borderRadius: 10,
                border: "none",
                background: "rgba(255,255,255,.1)",
                color: "#fff",
              }}
            />
            <button
              className="btn"
              disabled={savingPeso || !pesoHoy}
              style={{ padding: "10px 14px", borderRadius: 10, border: "none", fontWeight: 700 }}
            >
              {savingPeso ? "Guardando..." : "Guardar peso"}
            </button>
          </form>
        ) : (
          <div className="dash-alert">Inicia sesión para registrar tu peso.</div>
        )}
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

      {/* Logros */}
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
