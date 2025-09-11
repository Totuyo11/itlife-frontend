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

function makeLastNDays(n = 14) {
  const out = [];
  const now = new Date();
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(now.getDate() - i);
    out.push({
      fecha: d.toLocaleDateString("es-MX", { day: "2-digit", month: "short" }),
      peso: null,
      volumen: Math.random() > 0.6 ? Math.floor(Math.random() * 100) + 20 : null, // demo
    });
  }
  return out;
}

export default function Dashboard() {
  const [pesoSerie, setPesoSerie] = useState(() => makeLastNDays(14));

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

  useEffect(() => {
    const el = document.documentElement;
    const mo = new MutationObserver(() => setTheme(readTheme()));
    mo.observe(el, { attributes: true, attributeFilter: ["data-theme"] });
    return () => mo.disconnect();
  }, []);

  return (
    <div className="dash-wrap">
      <h1 className="dash-title">Tu progreso</h1>

      {/* KPIs */}
      <section className="dash-grid">
        <div className="dash-card">
          <div className="dash-kpi-title">Racha activa</div>
          <div className="dash-kpi-value">0 días</div>
        </div>
        <div className="dash-card">
          <div className="dash-kpi-title">Sesiones (7d)</div>
          <div className="dash-kpi-value">0</div>
        </div>
        <div className="dash-card">
          <div className="dash-kpi-title">Último peso</div>
          <div className="dash-kpi-value">—</div>
        </div>
      </section>

      {/* Heatmap semanal */}
      <section className="dash-section">
        <div className="dash-sec-head">
          <h2>Asistencia semanal</h2>
        </div>
        <div className="heat-grid">
          {["lun", "mar", "mié", "jue", "vie", "sáb", "dom"].map(
            (dia, i) => (
              <div key={dia} className="heat-item">
                <div className="heat-label">{dia}</div>
                <div
                  className="heat-cell"
                  style={{ background: chartColors.heat[(i % 5)] }}
                />
              </div>
            )
          )}
        </div>
      </section>

      {/* Línea de peso */}
      <section className="dash-section">
        <h2>Tendencia de peso (14 días)</h2>
        <div className="chart-box" style={{ height: 260 }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={pesoSerie}>
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
        <h2>Volumen de entrenamiento (14 días)</h2>
        <div className="chart-box" style={{ height: 260 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={pesoSerie}>
              <CartesianGrid stroke={chartColors.grid} strokeDasharray="3 3" />
              <XAxis dataKey="fecha" stroke={chartColors.text} />
              <YAxis stroke={chartColors.text} />
              <Tooltip
                contentStyle={{
                  background: chartColors.tooltipBg,
                  border: `1px solid ${chartColors.tooltipBorder}`,
                }}
              />
              <Bar dataKey="volumen" fill={chartColors.barFill} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>
    </div>
  );
}
