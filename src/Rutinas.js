// src/Rutinas.js
import React, { useEffect, useMemo, useState } from "react";
import { useAuth } from "./AuthContext";
import {
  listenRutinas, crearRutina, actualizarRutina,
  borrarRutina, asignarRutinaADia
} from "./api/rutinas";
import "./Login.css";

const hoyISO = () => new Date().toISOString().slice(0,10);

export default function Rutinas() {
  const { user } = useAuth();
  const [rutinas, setRutinas] = useState([]);
  const [nombre, setNombre] = useState("");
  const [ejerciciosText, setEjerciciosText] = useState(""); // 1 por línea
  const [editId, setEditId] = useState(null);
  const [dia, setDia] = useState(hoyISO());
  const [selRutina, setSelRutina] = useState("");

  useEffect(() => {
    if (!user) return;
    const unsub = listenRutinas(user.uid, setRutinas);
    return () => unsub && unsub();
  }, [user]);

  const enEdicion = useMemo(
    () => rutinas.find(r => r.id === editId) || null,
    [editId, rutinas]
  );

  useEffect(() => {
    if (enEdicion) {
      setNombre(enEdicion.nombre || "");
      setEjerciciosText((enEdicion.ejercicios || []).join("\n"));
    } else {
      setNombre("");
      setEjerciciosText("");
    }
  }, [enEdicion]);

  if (!user) return <div className="login-container"><div className="login-card">Inicia sesión</div></div>;

  const onCrear = async (e) => {
    e.preventDefault();
    const ejercicios = ejerciciosText.split("\n").map(s => s.trim()).filter(Boolean);
    if (!nombre) return;
    await crearRutina(user.uid, { nombre, ejercicios });
    setNombre(""); setEjerciciosText("");
  };

  const onGuardarEdicion = async (e) => {
    e.preventDefault();
    const ejercicios = ejerciciosText.split("\n").map(s => s.trim()).filter(Boolean);
    await actualizarRutina(user.uid, editId, { nombre, ejercicios });
    setEditId(null);
  };

  const onBorrar = async (id) => {
    if (!window.confirm("¿Borrar rutina?")) return;
    await borrarRutina(user.uid, id);
    if (editId === id) setEditId(null);
  };

  const onAsignar = async (e) => {
    e.preventDefault();
    if (!selRutina || !dia) return;
    await asignarRutinaADia(user.uid, dia, selRutina);
    alert("Asignada ✔");
  };

  return (
    <div className="login-container">
      <div className="login-card rutina-card" style={{ maxWidth: 920 }}>
        <h2 className="rutina-title">🏋️ Rutinas</h2>

        {/* Crear / Editar */}
        <form onSubmit={enEdicion ? onGuardarEdicion : onCrear}
              style={{ display:"grid", gap:12, marginBottom:18 }}>
          <input
            className="login-input"
            placeholder="Nombre de la rutina (e.g., Full Body 45min)"
            value={nombre}
            onChange={(e)=>setNombre(e.target.value)}
          />
          <textarea
            className="login-input"
            rows={6}
            placeholder={"Ejercicios, uno por línea\nSentadilla x12\nLagartijas x10\nPlancha 45s"}
            value={ejerciciosText}
            onChange={(e)=>setEjerciciosText(e.target.value)}
          />
          <div style={{ display:"flex", gap:8 }}>
            <button className="login-button" type="submit">
              {enEdicion ? "Guardar cambios" : "Crear rutina"}
            </button>
            {enEdicion && (
              <button type="button" className="login-button"
                      onClick={()=>setEditId(null)}
                      style={{ background:"#6b7280" }}>
                Cancelar
              </button>
            )}
          </div>
        </form>

        {/* Lista */}
        <div style={{ display:"grid", gap:12 }}>
          {rutinas.length === 0 && <div>No hay rutinas aún.</div>}
          {rutinas.map(r => (
            <div key={r.id}
                 style={{ border:"1px solid #e5e7eb", borderRadius:12, padding:12 }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                <h3 style={{ margin:0 }}>{r.nombre}</h3>
                <div style={{ display:"flex", gap:8 }}>
                  <button className="login-button" onClick={()=>setEditId(r.id)}>
                    Editar
                  </button>
                  <button className="login-button" onClick={()=>onBorrar(r.id)}
                          style={{ background:"#ef4444" }}>
                    Borrar
                  </button>
                </div>
              </div>
              <ul style={{ marginTop:8, paddingLeft:18 }}>
                {(r.ejercicios || []).map((e,i)=> <li key={i}>{e}</li>)}
              </ul>
            </div>
          ))}
        </div>

        {/* Asignar a día */}
        <hr style={{ margin:"18px 0" }} />
        <form onSubmit={onAsignar}
              style={{ display:"flex", gap:8, alignItems:"center", flexWrap:"wrap" }}>
          <label>Asignar a día:</label>
          <input type="date" className="login-input" value={dia}
                 onChange={e=>setDia(e.target.value)} />
          <select className="login-input" value={selRutina}
                  onChange={e=>setSelRutina(e.target.value)}>
            <option value="">Selecciona rutina…</option>
            {rutinas.map(r => <option key={r.id} value={r.id}>{r.nombre}</option>)}
          </select>
          <button className="login-button" type="submit">Asignar</button>
        </form>
      </div>
    </div>
  );
}
