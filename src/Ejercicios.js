// src/Ejercicios.js (sin Storage, con preview local)
import React, { useEffect, useState } from "react";
import { collection, getDocs, addDoc, deleteDoc, doc } from "firebase/firestore";
import { db, auth } from "./firebase";

export default function Ejercicios() {
  const [ejercicios, setEjercicios] = useState([]);
  const [nombre, setNombre] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState("");     // preview del form
  const [tempPreviews, setTempPreviews] = useState({}); // {id: objectUrl}
  const [loading, setLoading] = useState(true);

  async function fetchEjercicios() {
    const user = auth.currentUser;
    if (!user) return;
    setLoading(true);
    try {
      const snap = await getDocs(collection(db, "ejercicios", user.uid, "items"));
      setEjercicios(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    } finally { setLoading(false); }
  }

  useEffect(() => {
    const unsub = auth.onAuthStateChanged(() => fetchEjercicios());
    return () => {
      // limpia objectURLs
      Object.values(tempPreviews).forEach(u => URL.revokeObjectURL(u));
      unsub && unsub();
    };
    // eslint-disable-next-line
  }, []);

  const onPickFile = (e) => {
    const f = e.target.files?.[0] || null;
    setFile(f);
    if (f) setPreview(URL.createObjectURL(f));
    else setPreview("");
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    const user = auth.currentUser;
    if (!user) return alert("Inicia sesión primero.");
    if (!nombre || !descripcion) return alert("Falta nombre/descr.");

    // Guarda solo texto en Firestore
    const ref = await addDoc(collection(db, "ejercicios", user.uid, "items"), {
      nombre,
      descripcion,
      // no guardamos imageUrl ni nada
      createdAt: Date.now(),
    });

    // Si eligió imagen, la “pegamos” solo en memoria para esta sesión
    if (file && preview) {
      setTempPreviews(prev => ({ ...prev, [ref.id]: preview }));
    }

    setNombre(""); setDescripcion(""); setFile(null); setPreview("");
    await fetchEjercicios();
  };

  const handleDelete = async (id) => {
    const user = auth.currentUser;
    if (!user) return;
    await deleteDoc(doc(db, "ejercicios", user.uid, "items", id));
    // limpia preview local si había
    if (tempPreviews[id]) {
      URL.revokeObjectURL(tempPreviews[id]);
      setTempPreviews(prev => {
        const copy = { ...prev };
        delete copy[id];
        return copy;
      });
    }
    await fetchEjercicios();
  };

  // estilos
  const S = {
    c: { padding: 24, maxWidth: 1080, margin: "0 auto", color: "#e5e7eb" },
    t: { fontSize: 28, fontWeight: 800, marginBottom: 18 },
    f: {
      display: "grid", gap: 12, gridTemplateColumns: "1fr 1fr 1fr auto",
      alignItems: "center", background: "#0f172a", padding: 16, borderRadius: 16,
      border: "1px solid #1f2937", boxShadow: "0 10px 30px rgba(0,0,0,.25)", marginBottom: 20,
    },
    i: {
      padding: "10px 12px", borderRadius: 10, border: "1px solid #374151",
      background: "#111827", color: "#e5e7eb", outline: "none",
    },
    b: {
      padding: "10px 14px", borderRadius: 10, border: "none",
      background: "#ef4444", color: "white", fontWeight: 700, cursor: "pointer",
    },
    g: { display: "grid", gap: 18, gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))" },
    card: {
      background: "linear-gradient(180deg,#0b1220,#0b1220 60%,#0e1628)",
      border: "1px solid #1f2937", borderRadius: 16, overflow: "hidden",
      boxShadow: "0 10px 30px rgba(0,0,0,.25)",
    },
    img: { width: "100%", height: 160, objectFit: "cover" },
    body: { padding: 14 },
    name: { fontSize: 16, fontWeight: 700, margin: "0 0 6px" },
    desc: { fontSize: 14, color: "#9ca3af", minHeight: 40, margin: 0 },
    del: { marginTop: 10, width: "100%", padding: "8px 10px", background: "#b91c1c", color: "white", border: 0, borderRadius: 10, cursor: "pointer" },
    note: { marginTop: 8, color: "#9ca3af", fontSize: 14 },
    previewWrap: { gridColumn: "1 / -1", display: "flex", alignItems: "center", gap: 12 },
    previewImg: { width: 120, height: 120, objectFit: "cover", borderRadius: 10, border: "1px solid #374151" },
  };

  return (
    <div style={S.c}>
      <h2 style={S.t}>🏋️ Ejercicios</h2>

      {!auth.currentUser && <div style={S.note}>Inicia sesión para ver y crear tus ejercicios.</div>}

      <form onSubmit={handleAdd} style={S.f}>
        <input style={S.i} placeholder="Nombre del ejercicio" value={nombre} onChange={(e) => setNombre(e.target.value)} />
        <input style={S.i} placeholder="Descripción" value={descripcion} onChange={(e) => setDescripcion(e.target.value)} />
        <input style={{ ...S.i, padding: 8 }} type="file" accept="image/*" onChange={onPickFile} />
        <button type="submit" style={S.b}>Agregar</button>

        {/* Preview local del archivo seleccionado (no se guarda) */}
        {preview && (
          <div style={S.previewWrap}>
            <img src={preview} alt="preview" style={S.previewImg} />
            <span style={S.note}>La imagen solo se mostrará en esta sesión (no se guarda).</span>
          </div>
        )}
      </form>

      {loading ? (
        <div style={S.note}>Cargando…</div>
      ) : ejercicios.length === 0 ? (
        <div style={S.note}>No hay ejercicios aún.</div>
      ) : (
        <div style={S.g}>
          {ejercicios.map((e) => (
            <div key={e.id} style={S.card}>
              {/* Si fue creado en esta sesión y tenía imagen, muéstrala desde memoria */}
              {tempPreviews[e.id] && <img src={tempPreviews[e.id]} alt={e.nombre} style={S.img} />}
              <div style={S.body}>
                <h3 style={S.name}>{e.nombre}</h3>
                <p style={S.desc}>{e.descripcion}</p>
                <button style={S.del} onClick={() => handleDelete(e.id)}>Eliminar</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
