// src/pages/Dashboard.jsx
import React, { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../AuthContext';
import {
  getFirestore, collection, doc, getDocs, query, orderBy, limit, setDoc, documentId
} from 'firebase/firestore';
import {
  ResponsiveContainer,
  LineChart, Line, XAxis, YAxis, Tooltip as RTooltip, CartesianGrid,
  BarChart, Bar,
} from 'recharts';
import '../Register.css';

/**
 * FitLife — Dashboard (v2 + mejoras)
 * - KPIs + Heatmap semanal
 * - Peso (30d) con Registrar peso (modal) + Historial (últimos 5)
 * - Volumen por músculo (14d)
 * - Mejoras: 🔄 Refrescar, 🔥 Motivación por racha, 📉 Promedio y Δ de peso
 */

const fmtShort = (d) => d.toLocaleDateString(undefined, { month: 'short', day: '2-digit' });
// YYYY-MM-DD local
const todayKey = () =>
  new Date(Date.now() - new Date().getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 10);

// Firestore -> mapa por día
function normalizeProgress(docs) {
  const byDay = {};
  docs.forEach((d) => {
    const id = d.id; // YYYY-MM-DD
    const data = d.data();
    byDay[id] = {
      date: id,
      sessions: data.sesiones ?? 0,
      minutes: data.minutos ?? 0,
      volumeByMuscle: data.volumenPorMusculo ?? {},
      weight: data.peso ?? null,
    };
  });
  return byDay;
}

function computeStreak(byDay) {
  const base = new Date(); base.setHours(0,0,0,0);
  let cursor = new Date(base);
  let streak = 0;
  for (let i = 0; i < 400; i++) {
    const key = cursor.toISOString().slice(0,10);
    const hit = byDay[key]?.sessions > 0;
    if (hit) { streak++; } else {
      if (i === 0) { cursor.setDate(cursor.getDate() - 1); continue; }
      break;
    }
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

function last7DaysHeat(byDay) {
  const out = [];
  const base = new Date(); base.setHours(0,0,0,0);
  for (let i = 6; i >= 0; i--) {
    const d = new Date(base); d.setDate(base.getDate() - i);
    const key = d.toISOString().slice(0,10);
    out.push({
      date: key,
      label: d.toLocaleDateString(undefined, { weekday: 'short' }),
      value: byDay[key]?.sessions ?? 0
    });
  }
  return out;
}

function weightSeries(byDay, days = 30) {
  const out = [];
  const base = new Date(); base.setHours(0,0,0,0);
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(base); d.setDate(base.getDate() - i);
    const key = d.toISOString().slice(0,10);
    const w = byDay[key]?.weight ?? null;
    out.push({ date: key, label: fmtShort(d), weight: w });
  }
  return out;
}

function volumeByMuscleAggregate(byDay, days = 14) {
  const agg = {};
  const base = new Date(); base.setHours(0,0,0,0);
  for (let i = 0; i < days; i++) {
    const d = new Date(base); d.setDate(base.getDate() - i);
    const key = d.toISOString().slice(0,10);
    const m = byDay[key]?.volumeByMuscle ?? {};
    for (const k of Object.keys(m)) agg[k] = (agg[k] || 0) + (m[k] || 0);
  }
  return Object.entries(agg)
    .map(([name, total]) => ({ name, total }))
    .sort((a,b) => b.total - a.total)
    .slice(0, 8);
}

// UI
function KpiCard({ title, value, foot }) {
  return (
    <div className="dash-card">
      <div className="dash-kpi-title">{title}</div>
      <div className="dash-kpi-value">{value}</div>
      {foot && <div className="dash-kpi-foot">{foot}</div>}
    </div>
  );
}
function HeatCell({ v }) {
  const clamped = Math.min(4, v);
  return <div className={`heat-cell heat-${clamped}`} title={`${v} sesión(es)`} />
}

export default function Dashboard() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [byDay, setByDay] = useState({});
  const [err, setErr] = useState('');

  // Modal peso
  const [showWeight, setShowWeight] = useState(false);
  const [pesoInput, setPesoInput] = useState('');
  const [savingW, setSavingW] = useState(false);
  const [msgW, setMsgW] = useState('');
  const [errW, setErrW] = useState('');

  // Carga progreso
  async function load() {
    if (!user) return;
    try {
      setLoading(true);
      const db = getFirestore();
      // orderBy(documentId()) para compatibilidad de versiones
      const ref = collection(doc(collection(db, 'progreso'), user.uid), 'dias');
      const q = query(ref, orderBy(documentId(), 'desc'), limit(120));
      const snap = await getDocs(q);
      setByDay(normalizeProgress(snap.docs));
      setErr('');
    } catch (e) {
      console.error(e);
      setErr('No pudimos cargar tu progreso.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [user]);

  const streak   = useMemo(() => computeStreak(byDay), [byDay]);
  const heat     = useMemo(() => last7DaysHeat(byDay), [byDay]);
  const weight30 = useMemo(() => weightSeries(byDay, 30), [byDay]);
  const vol14    = useMemo(() => volumeByMuscleAggregate(byDay, 14), [byDay]);

  const lastWeights = useMemo(() => {
    const arr = Object.entries(byDay)
      .filter(([, v]) => v && v.weight != null)
      .map(([date, v]) => ({ date, weight: v.weight }))
      .sort((a, b) => (a.date < b.date ? 1 : -1));
    return arr.slice(0, 5);
  }, [byDay]);

  const weekSessions = heat.reduce((sum, d) => sum + (d.value || 0), 0);
  const weekMinutes  = Object.keys(byDay).slice(-7).reduce((s, k) => s + (byDay[k]?.minutes || 0), 0);
  const empty        = Object.keys(byDay).length === 0;

  // 📉 Promedio y Δ de peso (30 días)
  const { avgWeight, diffWeight } = useMemo(() => {
    const vals = (weight30 || []).filter(w => w.weight != null).map(w => Number(w.weight));
    if (vals.length === 0) return { avgWeight: null, diffWeight: null };
    const avg = vals.reduce((a,b)=>a+b,0) / vals.length;
    const diff = vals.length > 1 ? (vals[vals.length - 1] - vals[0]) : 0;
    return { avgWeight: Number(avg.toFixed(1)), diffWeight: Number(diff.toFixed(1)) };
  }, [weight30]);

  // Guardar peso
  async function saveWeight() {
    setMsgW(''); setErrW('');
    const num = parseFloat(String(pesoInput).replace(',', '.'));
    if (Number.isNaN(num) || num < 20 || num > 400) {
      setErrW('Ingresa un peso válido (20–400 kg).');
      return;
    }
    try {
      setSavingW(true);
      const db = getFirestore();
      const key = todayKey();
      const ref = doc(collection(doc(collection(db, 'progreso'), user.uid), 'dias'), key);
      await setDoc(ref, { peso: num }, { merge: true });
      setByDay((prev) => ({
        ...prev,
        [key]: { ...(prev[key] || { date: key, sessions: 0, minutes: 0, volumeByMuscle: {} }), weight: num }
      }));
      setMsgW('Peso guardado ✅');
      setTimeout(() => setShowWeight(false), 650);
    } catch (e) {
      console.error(e);
      setErrW('No pudimos guardar tu peso. Intenta de nuevo.');
    } finally {
      setSavingW(false);
    }
  }

  return (
    <div className="dash-wrap">
      <h1 className="dash-title">Tu progreso</h1>
      {err && <div className="dash-alert">{err}</div>}

      {/* KPIs */}
      <div className="dash-grid">
        <KpiCard title="Racha activa"   value={`${streak} días`} foot="Días seguidos con sesión" />
        <KpiCard title="Sesiones (7d)"  value={weekSessions}      foot="Total de entrenos en la semana" />
        <KpiCard title="Minutos (7d)"   value={weekMinutes}       foot="Tiempo acumulado" />
      </div>

      {/* 🔥 Motivación por racha */}
      {streak > 0 && (
        <p className="dash-empty">🚀 Llevas {streak} día(s) seguidos. ¡No rompas la racha!</p>
      )}

      {/* Heatmap semanal */}
      <section className="dash-section">
        <div className="dash-sec-head">
          <h2>Asistencia semanal</h2>
          <span className="dash-sec-note">Sesiones por día (últimos 7 días)</span>
        </div>
        <div className="heat-grid">
          {heat.map((d) => (
            <div key={d.date} className="heat-item">
              <div className="heat-label">{d.label}</div>
              <HeatCell v={d.value} />
            </div>
          ))}
        </div>
        {empty && <div className="dash-empty">Aún no hay sesiones registradas. ¡Tu racha empieza hoy! 💪</div>}
      </section>

      {/* Tendencia de peso */}
      <section className="dash-section">
        <div className="dash-sec-head">
          <h2>Tendencia de peso (30 días)</h2>
          <span className="dash-sec-note">
            Actualiza tu peso al finalizar sesión
            {avgWeight !== null && (
              <> • 📉 Promedio: {avgWeight} kg {diffWeight !== null && `(Δ ${diffWeight > 0 ? '+' : ''}${diffWeight} kg)`}</>
            )}
          </span>
          <div className="dash-actions">
            <button
              className="btn btn-secondary"
              onClick={() => window.location.reload()}
              title="Volver a consultar datos"
            >
              🔄 Refrescar
            </button>
            <button
              className="btn btn-primary"
              onClick={() => { setPesoInput(byDay[todayKey()]?.weight ?? ''); setShowWeight(true); }}
            >
              Registrar peso
            </button>
          </div>
        </div>
        <div className="chart-box">
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={weight30} margin={{ top: 10, right: 16, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,.08)" />
              <XAxis dataKey="label" tick={{ fill: '#e5e7eb', fontSize: 12 }} tickMargin={6} />
              <YAxis width={36} tick={{ fill: '#e5e7eb', fontSize: 12 }} domain={['auto', 'auto']} />
              <RTooltip contentStyle={{ background: 'rgba(0,0,0,.85)', border: '1px solid rgba(255,64,129,.35)', borderRadius: 10, color: '#fff' }} />
              <Line type="monotone" dataKey="weight" stroke="#ff4081" strokeWidth={2.5} dot={false} connectNulls />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Historial rápido (últimos 5 registros) */}
        <div className="dash-weight-history">
          <h3 className="dwh-title">Últimos registros</h3>
          {lastWeights.length === 0 ? (
            <p className="dash-empty">Aún no registras tu peso. ¡Empieza hoy!</p>
          ) : (
            <ul className="dwh-list">
              {lastWeights.map((it) => {
                const d = new Date(it.date + 'T00:00:00');
                const human = d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: '2-digit' });
                return (
                  <li key={it.date} className="dwh-item">
                    <span className="dwh-date">{human}</span>
                    <span className="dwh-dot" />
                    <span className="dwh-kg">{Number(it.weight).toFixed(1)} kg</span>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </section>

      {/* Volumen por músculo (14 días) */}
      <section className="dash-section">
        <div className="dash-sec-head">
          <h2>Volumen por músculo (14 días)</h2>
          <span className="dash-sec-note">Suma de volumen (kg) por grupo</span>
        </div>
        <div className="chart-box">
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={vol14} margin={{ top: 10, right: 16, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,.08)" />
              <XAxis dataKey="name" tick={{ fill: '#e5e7eb', fontSize: 12 }} tickMargin={6} />
              <YAxis width={40} tick={{ fill: '#e5e7eb', fontSize: 12 }} />
              <RTooltip contentStyle={{ background: 'rgba(0,0,0,.85)', border: '1px solid rgba(255,64,129,.35)', borderRadius: 10, color: '#fff' }} />
              <Bar dataKey="total" fill="#ff4081" radius={[6,6,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>

      {/* Modal Peso */}
      {showWeight && (
        <div className="modal-backdrop" role="dialog" aria-modal="true" onClick={() => setShowWeight(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3 className="modal-title">Registrar peso de hoy</h3>
            <div className="modal-body">
              <label htmlFor="peso" className="sr-only">Peso (kg)</label>
              <input
                id="peso" type="number" step="0.1" min="20" max="400" placeholder="Ej. 72.8"
                value={pesoInput} onChange={(e) => setPesoInput(e.target.value)} disabled={savingW}
              />
              {msgW && <p className="mensaje ok" role="status">{msgW}</p>}
              {errW && <p className="mensaje error" role="alert">{errW}</p>}
            </div>
            <div className="modal-actions">
              <button className="btn-secondary" onClick={() => setShowWeight(false)} disabled={savingW}>Cancelar</button>
              <button className={savingW ? 'btn loading' : 'btn btn-primary'} onClick={saveWeight} disabled={savingW}>Guardar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
