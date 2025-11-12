// src/SeedRoutines.js
import React, { useState } from "react";
import { useAuth } from "./AuthContext";
import { createRoutineAdvanced } from "./services/routines";

// ---- Tus muestras originales (sin tocar) ----
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
      { bodyPart: "upper", exercise: "Press banca",   sets: 4, reps: "6-10" },
      { bodyPart: "upper", exercise: "Press militar", sets: 3, reps: "6-10" },
      { bodyPart: "core",  exercise: "Crunch",        sets: 3, reps: "12-15" }
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
      { bodyPart: "cardio", exercise: "Burpees",             sets: 4, time: "30s ON / 30s OFF" },
      { bodyPart: "lower",  exercise: "Zancadas",            sets: 3, reps: "12-12" },
      { bodyPart: "core",   exercise: "Mountain climbers",   sets: 3, time: "30s" }
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
      { bodyPart: "glutes", exercise: "Hip thrust",          sets: 5, reps: "8-12" },
      { bodyPart: "lower",  exercise: "Sentadilla goblet",   sets: 4, reps: "10-12" },
      { bodyPart: "core",   exercise: "Abducciones banda",   sets: 3, reps: "15-20" }
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
      { bodyPart: "upper", exercise: "Dominadas",        sets: 4, reps: "6-10" },
      { bodyPart: "upper", exercise: "Remo con barra",   sets: 4, reps: "6-10" },
      { bodyPart: "core",  exercise: "Hollow hold",      sets: 3, time: "30s" }
    ]
  }
];

// ---- Mapeos a los códigos que usa el recomendador ----
const mapGoalToObjetivoId = (g) => {
  switch ((g || "").toLowerCase()) {
    case "perder_peso":
    case "salud":
      return 1; // perder grasa / cardio-salud
    case "ganar_musculo":
      return 2; // hipertrofia/fuerza
    case "resistencia":
      return 3;
    case "movilidad":
      return 4;
    default:
      return 1;
  }
};

const mapLevelToNivel = (lvl) => {
  switch ((lvl || "").toLowerCase()) {
    case "novato": return 1;
    case "intermedio": return 2;
    case "avanzado": return 3;
    default: return 1;
  }
};

// Escoge foco “principal” a partir de la lista
const pickFoco = (focusArr = []) => {
  if (!Array.isArray(focusArr) || focusArr.length === 0) return "fullbody";
  if (focusArr.includes("fullbody")) return "fullbody";
  if (focusArr.includes("cardio")) return "cardio";
  if (focusArr.includes("glutes")) return "glutes";
  if (focusArr.includes("upper")) return "upper";
  if (focusArr.includes("lower")) return "lower";
  if (focusArr.includes("push")) return "push";
  if (focusArr.includes("pull")) return "pull";
  return String(focusArr[0]);
};

// Construye `items` con minutos repartidos y `_meta` compatible
function transformSampleToRoutine(sample) {
  const minutos =
    Math.round(((sample.minMinutes ?? 20) + (sample.maxMinutes ?? 30)) / 2);

  // Reparto de minutos por bloque (aprox. iguales)
  const blocks = Array.isArray(sample.blocks) ? sample.blocks : [];
  const perBlock = blocks.length > 0 ? Math.max(5, Math.round(minutos / blocks.length)) : minutos;

  const items = blocks.map((b) => ({
    name: `${(b.bodyPart || "").toUpperCase()} — ${b.exercise}`,
    mins: perBlock,
    sets: b.sets ?? null,
    reps: b.reps ?? null,
    time: b.time ?? null,
  }));

  const _meta = {
    objetivoId: mapGoalToObjetivoId(sample.goal),
    nivel: mapLevelToNivel(sample.level),
    foco: pickFoco(sample.focus),
    minutos,
    baseScore:
      sample.goal === "perder_peso" || sample.focus?.includes("cardio") ? 0.8 :
      sample.level === "avanzado" ? 0.7 : 0.6,
    scheme: sample.focus?.includes("fullbody")
      ? "fullbody-circuit"
      : sample.focus?.includes("cardio")
      ? "hiit-intervals"
      : sample.focus?.includes("upper")
      ? "upper-pushpull"
      : sample.focus?.includes("lower")
      ? "lower-strength"
      : "generic",
    tags: Array.isArray(sample.focus) ? sample.focus : [],
    // Guarda el original por si lo quieres mostrar en la UI
    original: { ...sample },
  };

  return {
    name: sample.name || "Rutina",
    items,
    _meta,
  };
}

export default function SeedRoutines() {
  const { user } = useAuth(); // respetamos tu AuthContext con { user }
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const seed = async () => {
    if (!user) {
      alert("Inicia sesión primero");
      return;
    }
    setLoading(true);
    try {
      for (const r of samples) {
        const payload = transformSampleToRoutine(r);
        await createRoutineAdvanced(user.uid, payload);
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
        <p style={{marginTop: 12, fontSize: 12, opacity: 0.8}}>
          Se crean con <code>items.mins</code> y <code>_meta</code> (objetivoId, nivel, foco, minutos, tags).
        </p>
      </div>
    </div>
  );
}
