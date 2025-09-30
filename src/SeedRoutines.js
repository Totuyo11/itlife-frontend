// src/SeedRoutines.js
import React, { useState } from "react";
import { db } from "./firebase";
import { collection, addDoc } from "firebase/firestore";
import { useAuth } from "./AuthContext";

const samples = [
  {
    name: "Full Body Express",
    goal: "salud",
    level: "novato",
    sex: "any",
    minAge: 14, maxAge: 60,
    minMinutes: 20, maxMinutes: 35,
    focus: ["fullbody"],
    blocks: [
      { bodyPart: "upper", exercise: "Lagartijas", sets: 3, reps: "8-12" },
      { bodyPart: "lower", exercise: "Sentadillas", sets: 3, reps: "12-15" },
      { bodyPart: "core",  exercise: "Plancha",    sets: 3, time: "30s" }
    ]
  },
  {
    name: "Lower Power 30",
    goal: "ganar_musculo",
    level: "intermedio",
    sex: "any",
    minAge: 16, maxAge: 55,
    minMinutes: 25, maxMinutes: 35,
    focus: ["lower","glutes"],
    blocks: [
      { bodyPart: "lower", exercise: "Peso muerto rumano", sets: 4, reps: "6-10" },
      { bodyPart: "glutes",exercise: "Hip thrust",         sets: 4, reps: "8-12" },
      { bodyPart: "core",  exercise: "Plancha lateral",    sets: 3, time: "30s" }
    ]
  },
  {
    name: "Upper Push 25",
    goal: "ganar_musculo",
    level: "intermedio",
    sex: "any",
    minAge: 16, maxAge: 60,
    minMinutes: 20, maxMinutes: 30,
    focus: ["upper","push"],
    blocks: [
      { bodyPart: "upper", exercise: "Press banca", sets: 4, reps: "6-10" },
      { bodyPart: "upper", exercise: "Press militar", sets: 3, reps: "6-10" },
      { bodyPart: "core",  exercise: "Crunch", sets: 3, reps: "12-15" }
    ]
  },
  {
    name: "HIIT Quema 20",
    goal: "perder_peso",
    level: "novato",
    sex: "any",
    minAge: 18, maxAge: 50,
    minMinutes: 15, maxMinutes: 25,
    focus: ["cardio","fullbody"],
    blocks: [
      { bodyPart: "cardio", exercise: "Burpees", sets: 4, time: "30s ON / 30s OFF" },
      { bodyPart: "lower",  exercise: "Zancadas", sets: 3, reps: "12-12" },
      { bodyPart: "core",   exercise: "Mountain climbers", sets: 3, time: "30s" }
    ]
  },
  {
    name: "Glutes Focus 40",
    goal: "ganar_musculo",
    level: "intermedio",
    sex: "female",
    minAge: 18, maxAge: 45,
    minMinutes: 30, maxMinutes: 45,
    focus: ["glutes","lower"],
    blocks: [
      { bodyPart: "glutes", exercise: "Hip thrust", sets: 5, reps: "8-12" },
      { bodyPart: "lower",  exercise: "Sentadilla goblet", sets: 4, reps: "10-12" },
      { bodyPart: "core",   exercise: "Abducciones banda", sets: 3, reps: "15-20" }
    ]
  },
  {
    name: "Pull Back 35",
    goal: "ganar_musculo",
    level: "avanzado",
    sex: "any",
    minAge: 18, maxAge: 60,
    minMinutes: 30, maxMinutes: 40,
    focus: ["upper","pull"],
    blocks: [
      { bodyPart: "upper", exercise: "Dominadas", sets: 4, reps: "6-10" },
      { bodyPart: "upper", exercise: "Remo con barra", sets: 4, reps: "6-10" },
      { bodyPart: "core",  exercise: "Hollow hold", sets: 3, time: "30s" }
    ]
  }
];

export default function SeedRoutines() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const seed = async () => {
    if (!user) {
      alert("Inicia sesión primero");
      return;
    }
    setLoading(true);
    try {
      const col = collection(db, "users", user.uid, "routines");
      for (const r of samples) {
        await addDoc(col, r);
      }
      setDone(true);
    } catch (err) {
      console.error(err);
      alert("Error al cargar ejemplos");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="registro-container">
      <div className="form-box">
        <h2>Seed Routines</h2>
        <button disabled={loading} onClick={seed}>
          {loading ? "Cargando..." : "Cargar ejemplos"}
        </button>
        {done && <p>✅ Listo: rutinas cargadas en tu cuenta.</p>}
      </div>
    </div>
  );
}
