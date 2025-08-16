// src/Dashboard.js
import React, { useEffect, useMemo, useState } from "react";
import { collection, doc, getDocs, setDoc, serverTimestamp } from "firebase/firestore";
import { db } from "./firebase";
import { useAuth } from "./AuthContext";
import "./Login.css";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts";

const dateKey = (d = new Date()) => d.toISOString().slice(0, 10);
const weekDay = (s) => ["Dom","Lun","Mar","Mié","Jue","Vie","Sáb"][new Date(s).getDay()];

export default function Dashboard() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [dias, setDias] = useState({}); // {'YYYY-MM-DD': {done, ts}}

  const hoy = dateKey();

  useEffect(() => {
    if (!user) return;
    (async () => {
      setLoading(true);
      const snap = await getDocs(collection(db, "progreso", user.uid, "dias"));
      const map = {};
      snap.forEach((d) => (map[d.id] = d.data()));
      setDias(map);
      setLoading(false);
    })();
  }, [user]);

  const toggleHoy = async () => {
    if (!user) return;
    const current = dias[hoy]?.done ?? false;
    const next = { done: !current, ts: serverTimestamp() };
    await setDoc(doc(db, "progreso", user.uid, "dias", hoy), next);
    setDias((prev) => ({ ...prev, [hoy]: { ...prev[hoy], done: !current } }));
  };

  const streak = useMemo(() => {
    let count = 0;
    let d = new Date();
    const has = (key) => !!dias[key]?.done;
    while (true) {
      const k = dateKey(d);
      if (has(k)) { count += 1; d.setDate(d.getDate() - 1); }
      else break;
    }
    return count;
  }, [dias]);

  const chartData = useMemo(() => {
    const counts = { Dom:0,Lun:0,Mar:0,Mié:0,Jue:0,Vie:0,Sáb:0 };
    Object.entries(dias).forEach(([k, v]) => { if (v.done) counts[weekDay(k)]++; });
    return Object.entries(counts).map(([dia, cantidad]) => ({ dia, cantidad }));
  }, [dias]);

  const ultimos14 = useMemo(() => {
    const arr = [];
    const d = new Date();
    for (let i = 0; i < 14; i++) {
      const k = dateKey(d);
      arr.unshift({ k, done: !!dias[k]?.done });
      d.setDate(d.getDate() - 1);
    }
    return arr;
  }, [dias]);

  if (!user) return <div className="login-container"><div className="login-card">Inicia sesión</div></div>;
  if (loading) return <div className="login-container"><div className="login-card">Cargando…</div></div>;

  const hoyDone = !!dias[hoy]?.done;

  return (
    <div className="login-container">
      <div className="login-card rutina-card" style={{ maxWidth: 720 }}>
        <h2 className="rutina-title">📊 Tu Dashboard</h2>

        <div style={{ display:"flex", gap:16, alignItems:"center", marginBottom:12 }}>
          <button onClick={toggleHoy} className="login-button">
            {hoyDone ? "Quitar completado de hoy" : "Marcar hoy como completado"}
          </button>
          <div style={{ fontWeight:600 }}>🔥 Streak: {streak} día(s)</div>
        </div>

        <div className="calendario" style={{ display:"grid", gridTemplateColumns:"repeat(14, 1fr)", gap:6, marginBottom:18 }}>
          {ultimos14.map(({k, done}) => (
            <div
              key={k}
              title={k}
              className={`dia ${done ? "completado" : ""}`}
              style={{
                padding:"10px 0",
                borderRadius:8,
                textAlign:"center",
                border:"1px solid #e5e7eb",
                fontSize:12,
              }}
            >
              {k.slice(5)}
            </div>
          ))}
        </div>

        <div style={{ height: 260 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="dia" />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="cantidad" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
