// src/AdminEjercicios.js
import React, { useEffect, useMemo, useState } from "react";
import { auth, db } from "./firebase";
import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  onSnapshot,
  query,
  orderBy,
} from "firebase/firestore";

const MUSCULOS = ["pecho","espalda","pierna","hombro","biceps","triceps","core","gluteo"];
const NIVELES  = ["basico","medio","avanzado"];

// ---- dataset demo (URLS libres) ----
const DEMO = [
  { nombre:"Press banca", musculos:["pecho","triceps","hombro"], nivel:"medio", equipo:"barra y banco", urlImg:"https://cdn-icons-png.flaticon.com/512/859/859293.png" },
  { nombre:"Sentadilla", musculos:["pierna","gluteo","core"], nivel:"medio", equipo:"barra", urlImg:"https://cdn-icons-png.flaticon.com/512/1198/1198297.png" },
  { nombre:"Peso muerto", musculos:["espalda","pierna","gluteo"], nivel:"avanzado", equipo:"barra", urlImg:"https://cdn-icons-png.flaticon.com/512/2423/2423588.png" },
  { nombre:"Dominadas", musculos:["espalda","biceps"], nivel:"medio", equipo:"barra fija", urlImg:"https://cdn-icons-png.flaticon.com/512/1660/1660840.png" },
  { nombre:"Plancha", musculos:["core"], nivel:"basico", equipo:"ninguno", urlImg:"https://cdn-icons-png.flaticon.com/512/1087/1087901.png" },
  { nombre:"Curl biceps", musculos:["biceps"], nivel:"basico", equipo:"mancuernas", urlImg:"https://cdn-icons-png.flaticon.com/512/2292/2292285.png" },
  { nombre:"Extensión triceps", musculos:["triceps"], nivel:"basico", equipo:"polea o mancuerna", urlImg:"https://cdn-icons-png.flaticon.com/512/4139/4139985.png" },
  { nombre:"Zancadas", musculos:["pierna","gluteo"], nivel:"basico", equipo:"ninguno", urlImg:"https://cdn-icons-png.flaticon.com/512/2123/2123129.png" },
];

export default function AdminEjercicios() {
  const user = auth.currentUser;
  const isAdmin = user?.uid === process.env.REACT_APP_ADMIN_UID;

  const [items, setItems]   = useState([]);
  const [form, setForm]     = useState({ nombre:"", musculos:[], nivel:"basico", equipo:"", urlImg:"" });
  const [editId, setEditId] = useState(null);
  const [seeding, setSeeding] = useState(false);

  // cargar catálogo en vivo
  useEffect(() => {
    const q = query(collection(db, "ejercicios_base"), orderBy("nombre", "asc"));
    const unsub = onSnapshot(q, (snap) =>
      setItems(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
    );
    return () => unsub();
  }, []);

  const enEdicion = useMemo(() => items.find(x => x.id === editId) || null, [editId, items]);

  useEffect(() => {
    if (enEdicion) {
      setForm({
        nombre: enEdicion.nombre || "",
        musculos: enEdicion.musculos || [],
        nivel: enEdicion.nivel || "basico",
        equipo: enEdicion.equipo || "",
        urlImg: enEdicion.urlImg || "",
      });
    } else {
      setForm({ nombre:"", musculos:[], nivel:"basico", equipo:"", urlImg:"" });
    }
  }, [enEdicion]);

  if (!user)     return <Box>Inicia sesión.</Box>;
  if (!isAdmin)  return <Box>No autorizado (solo admin).</Box>;

  const toggleMusculo = (m) =>
    setForm(s =>
      s.musculos.includes(m)
        ? { ...s, musculos: s.musculos.filter(x => x !== m) }
        : { ...s, musculos: [...s.musculos, m] }
    );

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!form.nombre) return alert("Pon un nombre 👀");
    const payload = {
      ...form,
      musculos: [...new Set(form.musculos)].sort(),
      createdAt: Date.now(),
    };
    if (editId) {
      await updateDoc(doc(db, "ejercicios_base", editId), payload);
      setEditId(null);
    } else {
      await addDoc(collection(db, "ejercicios_base"), payload);
    }
  };

  const onDelete = async (id) => {
    if (!window.confirm("¿Borrar ejercicio base?")) return;
    await deleteDoc(doc(db, "ejercicios_base", id));
    if (editId === id) setEditId(null);
  };

  // ---- SEED de ejemplo (evita duplicados por nombre) ----
  const seedDemo = async () => {
    setSeeding(true);
    try {
      const existentes = new Set(items.map(i => (i.nombre || "").trim().toLowerCase()));
      let creados = 0;
      for (const ex of DEMO) {
        const key = (ex.nombre || "").trim().toLowerCase();
        if (existentes.has(key)) continue;
        await addDoc(collection(db, "ejercicios_base"), {
          ...ex,
          musculos: [...new Set(ex.musculos)].sort(),
          createdAt: Date.now(),
        });
        creados++;
      }
      alert(creados ? `✅ ${creados} ejercicios demo agregados` : "Ya tenías todos los demo 😉");
    } catch (e) {
      console.error(e);
      alert("No se pudo cargar el demo. Revisa reglas/permiso.");
    } finally {
      setSeeding(false);
    }
  };

  const S = {
    wrap:{padding:24,maxWidth:1100,margin:"0 auto",color:"#e5e7eb"},
    top:{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12},
    h2:{fontSize:24,fontWeight:800},
    seedBtn:{background:"#22c55e",color:"#0b1220",border:0,borderRadius:10,padding:"8px 12px",cursor:"pointer",fontWeight:800,opacity: seeding? .6:1},
    form:{display:"grid",gap:10,background:"#0f172a",border:"1px solid #1f2937",padding:16,borderRadius:16,marginBottom:18},
    input:{padding:"10px 12px",borderRadius:10,border:"1px solid #374151",background:"#111827",color:"#e5e7eb",outline:"none"},
    tags:{display:"flex",flexWrap:"wrap",gap:8},
    tag:{background:"#111827",border:"1px solid #374151",padding:"6px 10px",borderRadius:999,display:"inline-flex",gap:6,alignItems:"center"},
    row:{display:"flex",gap:8},
    btnPri:{background:"#ef4444",color:"#fff",border:0,borderRadius:10,padding:"10px 14px",fontWeight:700,cursor:"pointer"},
    btnSec:{background:"#6b7280",color:"#fff",border:0,borderRadius:10,padding:"10px 14px",cursor:"pointer"},
    grid:{display:"grid",gap:16,gridTemplateColumns:"repeat(auto-fill,minmax(240px,1fr))"},
    card:{background:"linear-gradient(180deg,#0b1220,#0e1628)",border:"1px solid #1f2937",borderRadius:16,overflow:"hidden"},
    img:{width:"100%",height:150,objectFit:"cover"},
    body:{padding:12},
    title:{fontWeight:800},
    meta:{fontSize:12,color:"#9ca3af",marginTop:4},
    chips:{display:"flex",flexWrap:"wrap",gap:6,marginTop:8},
    chip:{background:"#111827",border:"1px solid #374151",borderRadius:999,padding:"4px 8px",fontSize:12},
    btnMini:{background:"#2563eb",color:"#fff",border:0,borderRadius:10,padding:"8px 10px",cursor:"pointer"},
    btnDel:{background:"#b91c1c",color:"#fff",border:0,borderRadius:10,padding:"8px 10px",cursor:"pointer"},
  };

  return (
    <div style={S.wrap}>
      <div style={S.top}>
        <h2 style={S.h2}>🛠️ Admin · Ejercicios base</h2>
        <button style={S.seedBtn} onClick={seedDemo} disabled={seeding}>
          {seeding ? "Cargando..." : "Cargar ejercicios de ejemplo"}
        </button>
      </div>

      <form onSubmit={onSubmit} style={S.form}>
        <input style={S.input} placeholder="Nombre"
               value={form.nombre} onChange={e=>setForm({...form, nombre:e.target.value})}/>
        <select style={S.input} value={form.nivel} onChange={e=>setForm({...form, nivel:e.target.value})}>
          {NIVELES.map(n => <option key={n} value={n}>{n}</option>)}
        </select>
        <input style={S.input} placeholder="Equipo (opcional)"
               value={form.equipo} onChange={e=>setForm({...form, equipo:e.target.value})}/>
        <input style={S.input} placeholder="URL de imagen (opcional)"
               value={form.urlImg} onChange={e=>setForm({...form, urlImg:e.target.value})}/>

        <div style={S.tags}>
          {MUSCULOS.map(m => (
            <label key={m} style={S.tag}>
              <input type="checkbox"
                     checked={form.musculos.includes(m)}
                     onChange={()=>toggleMusculo(m)}/>
              {m}
            </label>
          ))}
        </div>

        <div style={S.row}>
          <button type="submit" style={S.btnPri}>{editId ? "Guardar cambios" : "Agregar"}</button>
          {editId && <button type="button" style={S.btnSec} onClick={()=>setEditId(null)}>Cancelar</button>}
        </div>
      </form>

      <div style={S.grid}>
        {items.map(it => (
          <div key={it.id} style={S.card}>
            {it.urlImg && <img src={it.urlImg} alt={it.nombre} style={S.img} />}
            <div style={S.body}>
              <div style={S.title}>{it.nombre}</div>
              <div style={S.meta}>Nivel: {it.nivel} {it.equipo && `• ${it.equipo}`}</div>
              <div style={S.chips}>{(it.musculos||[]).map(m => <span key={m} style={S.chip}>{m}</span>)}</div>
              <div style={S.row}>
                <button style={S.btnMini} onClick={()=>setEditId(it.id)}>Editar</button>
                <button style={S.btnDel} onClick={()=>onDelete(it.id)}>Borrar</button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function Box({ children }) {
  return (
    <div style={{padding:24,maxWidth:720,margin:"40px auto",background:"#0f172a",border:"1px solid #1f2937",borderRadius:16,color:"#e5e7eb"}}>
      {children}
    </div>
  );
}
