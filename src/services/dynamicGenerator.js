// src/services/dynamicGenerator.js
import { ALL_EXERCISES } from "../data/exercises";

// 🧩 Escoge ejercicios para un día según músculos + nivel + minutos
export function pickExercisesForDay(dayFocusMuscles, userLevel, targetMinutes) {
  const focusSet = new Set(
    (dayFocusMuscles || []).map((m) => (m || "").toLowerCase())
  );

  // 1) Filtrar candidatos por músculo y nivel
  let candidates = ALL_EXERCISES.filter((ex) => {
    const primary = (ex.muscle || "").toLowerCase();
    const secondary = (ex.secondary || []).map((m) => (m || "").toLowerCase());

    const primaryMatch = focusSet.has(primary);
    const secondaryMatch = secondary.some((m) => focusSet.has(m));

    // si no matchea músculo principal ni secundarios, fuera
    if (!primaryMatch && !secondaryMatch) return false;

    // filtrar un poco por nivel
    const level = (ex.level || "").toLowerCase();
    if (userLevel === "novato" || userLevel === "principiante") {
      return level === "principiante" || level === "novato";
    }
    if (userLevel === "avanzado") {
      return level === "intermedio" || level === "avanzado";
    }
    // intermedio u otros → aceptamos todos
    return true;
  });

  // fallback por si no encuentra nada
  if (candidates.length === 0) {
    candidates = [...ALL_EXERCISES];
  }

  // 2) Elegir ejercicios hasta aproximar el tiempo objetivo
  const routineExercises = [];
  let totalMinutes = 0;

  // mezclar un poco para variar
  candidates = candidates.sort(() => Math.random() - 0.5);

  for (const ex of candidates) {
    const exMinutes = ex.approxMinutes || ex.duration || 4; // usa lo que tengas, si no, 4 min

    if (totalMinutes + exMinutes > targetMinutes + 5) continue;

    routineExercises.push({
      id: ex.id,
      name: ex.name,
      muscle: ex.muscle,
      level: ex.level,
      equip: ex.equip,
      focus: ex.focus,
      img: ex.img,
      desc: ex.desc,
      sets: 3,
      reps: 10,
      restSeconds: 60,
      approxMinutes: exMinutes,
    });

    totalMinutes += exMinutes;

    if (totalMinutes >= targetMinutes - 3) break;
  }

  return { exercises: routineExercises, totalMinutes };
}

// 🧠 Construye rutinas dinámicas a partir de la respuesta de ML
export function buildDynamicRoutinesFromML(mlResponse, userFilters) {
  const { focus_plan = [], metadata = {} } = mlResponse || {};
  const { minutos = 30, nivel = "intermedio", objetivo = "general" } = userFilters;

  return focus_plan.map((dayMuscles, idx) => {
    const { exercises, totalMinutes } = pickExercisesForDay(
      dayMuscles,
      nivel,
      Number(minutos) || 30
    );

    return {
      id: `ml_day_${idx + 1}`,
      name: `Día ${idx + 1} - ${dayMuscles.join(" / ")}`,
      objective: objetivo,
      level: nivel,
      minutes: totalMinutes,
      source: "ml_dynamic",
      mlVersion: metadata.model_version || "desconocida",
      focus: dayMuscles,
      exercises,
    };
  });
}
