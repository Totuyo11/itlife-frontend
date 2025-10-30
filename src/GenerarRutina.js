// src/GenerarRutina.js
import React, { useEffect, useState } from "react";
import { auth, db } from "./firebase";
import {
  collection,
  getDocs,
  query,
  where,
  addDoc,
  serverTimestamp,
} from "firebase/firestore";

const MUSCULOS = ["pecho","espalda","pierna","hombro","biceps","triceps","core","gluteo"];
const NIVELES  = ["basico","medio","avanzado"];

export default function GenerarRutina() {
  const [musculo, setMusculo] = useState("pecho");
  const [nivel, setNivel]     = useState("basico");
  const [catalogo, setCatalogo] = useState([]);
  const [seleccion, setSeleccion] = useState({}); // id -> {sets,reps,nombre}
  const [nombreRutina, setNombreRutina] = useState("");
  const [loading, setLoading] = useState(false);
  const user = auth.currentUser;

  const estilos = {
    wrap:{padding:24,maxWidth:1100,margin:"0 auto",color:"#e5e7eb"},
    h2:{fontSize:24,fontWeight:800,marginBottom:16},
    form:{display:"flex",gap:10,background:"#0f172a",border:"1px solid #1f2937",padding:12,borderRadius:12,marginBottom:16},
    input:{padding:"10px 12px",borderRadius:10,border:"1px solid #374151",background:"#111827",color:"#e5e7eb"},
    btnPri:{background:"#ef4444",color:"#fff",border:0,borderRadius:10,padding:"10px 14px",fontWeight:700,cursor:"pointer"},
    grid:{display:"grid",gap:16,gridTemplateColumns:"repeat(auto-fill,minmax(240px,1fr))"},
    card:{background:"linear-gradient(180deg,#0b1220,#0e1628)",border:"1px solid #1f2937",borderRadius:16,overflow:"hidden"},
    img:{width:"100%",height:150,objectFit:"cover"},
    body:{padding:12},
    title:{fontWeight:800},
    meta:{fontSize:12,color:"#9ca3af",marginTop:4},
    chips:{display:"flex",flexWrap:"wrap",gap:6,marginTop:8},
    chip:{background:"#111827",border:"1px solid #374151",borderRadius:999,padding:"4px 8px",fontSize:12},
    row:{display:"flex",alignItems:"center",gap:8,marginTop:8},
    num:{width:70,padding:"8px 10px",borderRadius:10,border:"1px solid #374151",background:"#111827",color:"#e5e7eb"},
    btnMini:{background:"#2563eb",color:"#fff",border:0,borderRadius:10,padding:"8px 10px",cursor:"pointer",marginTop:8},
    saveBar:{display:"flex",gap:10,marginTop:16,background:"#0f172a",border:"1px solid #1f2937",padding:12,borderRadius:12},
    note:{color:"#9ca3af",marginTop:8},
  };

  async function buscar(e) {
    e?.preventDefault();
    setLoading(true);
    try {
      // Catálogo: ejercicios_base (creados por ti desde Admin)
      const qy = query(
        collection(db, "ejercicios_base"),
        where("musculos", "array-contains", musculo),
        where("nivel", "==", nivel)
      );
      const snap = await getDocs(qy);
      setCatalogo(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setSeleccion({});
    } catch (err) {
      console.error(err);
      alert("Ocurrió un error buscando ejercicios. Si te pide índice, dale click al enlace que sale en consola y créalo.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { buscar(); }, []); // primera carga

  const toggle = (it) => {
    setSeleccion(s =>
      s[it.id]
        ? (() => { const c = { ...s }; delete c[it.id]; return c; })()
        : ({ ...s, [it.id]: { sets: 3, reps: 12, nombre: it.nombre } })
    );
  };

  const cambiar = (id, key, val) =>
    setSeleccion(s => ({ ...s, [id]: { ...s[id], [key]: val } }));

  async function guardar() {
    if (!user) return alert("Inicia sesión, rey.");
    const items = Object.entries(seleccion).map(([ejercicioId, v]) => ({
      ejercicioId,
      nombre: v.nombre,
      sets: Number(v.sets || 3),
      reps: Number(v.reps || 12),
    }));
    if (!items.length) return alert("Selecciona al menos un ejercicio.");

    const nombre = nombreRutina || `${musculo.toUpperCase()} ${nivel}`;
    await addDoc(collection(db, "rutinas", user.uid), {
      nombre, musculo, nivel, items, createdAt: serverTimestamp(),
    });

    setNombreRutina(""); setSeleccion({});
    alert("Rutina guardada ✅");
  }

  return (
    <div style={estilos.wrap}>
      <h2 style={estilos.h2}>⚡ Generar rutina</h2>

      <form onSubmit={buscar} style={estilos.form}>
        <select style={estilos.input} value={musculo} onChange={(e)=>setMusculo(e.target.value)}>
          {MUSCULOS.map(m => <option key={m} value={m}>{m}</option>)}
        </select>
        <select style={estilos.input} value={nivel} onChange={(e)=>setNivel(e.target.value)}>
          {NIVELES.map(n => <option key={n} value={n}>{n}</option>)}
        </select>
        <button style={estilos.btnPri} disabled={loading}>{loading?"Buscando...":"Buscar"}</button>
      </form>

      {catalogo.length === 0 ? (
        <div style={estilos.note}>
          No hay ejercicios para ese filtro. Pídele al admin que agregue a <b>ejercicios_base</b>.
        </div>
      ) : (
        <div style={estilos.grid}>
          {catalogo.map(it => (
            <div key={it.id} style={{...estilos.card, outline: seleccion[it.id] ? "2px solid #22c55e" : "none"}}>
              {it.urlImg && <img src={it.urlImg} alt={it.nombre} style={estilos.img} />}
              <div style={estilos.body}>
                <div style={estilos.title}>{it.nombre}</div>
                <div style={estilos.meta}>Nivel: {it.nivel}{it.equipo ? ` • ${it.equipo}`: ""}</div>
                <div style={estilos.chips}>{(it.musculos||[]).map(m=><span key={m} style={estilos.chip}>{m}</span>)}</div>

                {seleccion[it.id] ? (
                  <div style={estilos.row}>
                    <input type="number" min={1} style={estilos.num}
                      value={seleccion[it.id].sets} onChange={(e)=>cambiar(it.id,"sets",e.target.value)} />
                    <span style={{opacity:.7}}>sets</span>
                    <input type="number" min={1} style={estilos.num}
                      value={seleccion[it.id].reps} onChange={(e)=>cambiar(it.id,"reps",e.target.value)} />
                    <span style={{opacity:.7}}>reps</span>
                    <button type="button" style={estilos.btnMini} onClick={()=>toggle(it)}>Quitar</button>
                  </div>
                ) : (
                  <button type="button" style={estilos.btnMini} onClick={()=>toggle(it)}>Agregar</button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <div style={estilos.saveBar}>
        <input
          style={estilos.input}
          placeholder="Nombre de la rutina (opcional)"
          value={nombreRutina}
          onChange={(e)=>setNombreRutina(e.target.value)}
        />
        <button style={estilos.btnPri} onClick={guardar}>Guardar rutina</button>
      </div>
    </div>
  );
}

