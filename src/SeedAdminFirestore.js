import React from "react";
import { auth, db } from "./firebase";
import { doc, setDoc } from "firebase/firestore";

export default function SeedAdminFirestore() {
  const go = async () => {
    if (!auth.currentUser) return alert("Inicia sesión primero");
    await setDoc(doc(db, "roles", auth.currentUser.uid), { admin: true });
    alert("Listo rey, eres admin ✅");
  };
  return (
    <div style={{padding:24}}>
      <p>UID: {auth.currentUser?.uid || "(sin login)"}</p>
      <button onClick={go} style={{padding:"10px 14px",borderRadius:8,background:"#ef4444",color:"#fff",border:0}}>
        Hacerme admin (Firestore)
      </button>
    </div>
  );
}
