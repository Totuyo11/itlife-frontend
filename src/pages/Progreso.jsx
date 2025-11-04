// src/pages/Progreso.jsx
import React, { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext"; // tu contexto existente
import { listenUserDashboard, getUserGoal } from "../services/stats";

import {
  ResponsiveContainer,
  ComposedChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid,
  AreaChart, Area,
  PieChart, Pie, Cell, Legend
} from "recharts";

const COLORS = ["#ff3c3c", "#7c3aed", "#22d3ee", "#34d399", "#f59e0b", "#e879f9"];

export default function Progreso() {
  const { user } = useAuth();
  const [goal, setGoal] = useState(null);
  const [data, setData] = useState({
    stats: { rachaActiva: 0, sesiones7d: 0, ultimoPeso: null },
    dayBars14: [],
    volume7: [],
    focusPie: [],
  });

  useEffect(() => {
    if (!user) return;
    let unsub = () => {};
    (async () => {
      const g = await getUserGoal(user.uid);
      setGoal(g);
      unsub = listenUserDashboard(user.uid, (d) => {
        setData({
          stats: d.stats,
          dayBars14: d.dayBars14,
          volume7: d.volume7,
          focusPie: d.focusPie,
        });
      });
    })();
    return () => unsub && unsub();
  }, [user]);

  return (
    <div className="page page-progreso">
      <header className="page-header">
        <h1>Tu progreso</h1>
        <p className="muted">Racha, sesiones y distribución de enfoques.</p>
      </header>

      {/* KPIs */}
      <section className="kpi-grid">
        <div className="kpi-card">
          <div className="kpi-label">Racha activa</div>
          <div className="kpi-big">{data.stats.rachaActiva} <span>días</span></div>
          <div className="kpi-foot">Días seguidos con sesión</div>
        </div>

        <div className="kpi-card">
          <div className="kpi-label">Sesiones (7d)</div>
          <div className="kpi-big">{data.stats.sesiones7d}</div>
          <div className="kpi-foot">Entrenos en la semana</div>
        </div>

        <div className="kpi-card">
          <div className="kpi-label">Último peso</div>
          <div className="kpi-big">
            {data.stats.ultimoPeso != null ? `${data.stats.ultimoPeso} kg` : "—"}
          </div>
          <div className="kpi-foot">{goal ? `Meta: ${goal} kg` : "Define una meta"}</div>
        </div>
      </section>

      {/* 1) Barras apiladas: Minutos vs Volumen últimos 14 días */}
      <section className="chart-card">
        <h3>Minutos vs Volumen (14 días)</h3>
        <ResponsiveContainer width="100%" height={280}>
          <ComposedChart data={data.dayBars14}>
            <CartesianGrid vertical={false} strokeDasharray="3 3" />
            <XAxis dataKey="fecha" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="minutos" stackId="a" radius={[6,6,0,0]} />
            <Bar dataKey="volumen" stackId="a" radius={[6,6,0,0]} />
          </ComposedChart>
        </ResponsiveContainer>
      </section>

      {/* 2) Tendencia de volumen 7 días */}
      <section className="chart-card">
        <h3>Tendencia de volumen (7 días)</h3>
        <ResponsiveContainer width="100%" height={240}>
          <AreaChart data={data.volume7}>
            <CartesianGrid vertical={false} strokeDasharray="3 3" />
            <XAxis dataKey="fecha" />
            <YAxis />
            <Tooltip />
            <Area type="monotone" dataKey="volumen" strokeWidth={2} />
          </AreaChart>
        </ResponsiveContainer>
      </section>

      {/* 3) Distribución por foco (30 días) */}
      <section className="chart-card">
        <h3>Distribución por foco</h3>
        <ResponsiveContainer width="100%" height={260}>
          <PieChart>
            <Pie
              data={data.focusPie}
              dataKey="value"
              nameKey="name"
              outerRadius={95}
              label
            >
              {data.focusPie?.map((_, i) => (
                <Cell key={i} fill={COLORS[i % COLORS.length]} />
              ))}
            </Pie>
            <Legend />
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      </section>
    </div>
  );
}
