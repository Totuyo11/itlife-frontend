// src/services/recommenderService.js
// Orquesta recomendación con fallback de catálogo para que no truene

import { recommendRoutines, validarInputs } from "../recommender";

// Catálogo mínimo: ajusta los campos que usa el recomendador
const CATALOGO_MIN = [
  { id: "hiit20_a", name: "HIIT 20 A", foco: "HIIT", minutos: 20, nivel: 2, scheme: "fatloss", objetivoId: 1, baseScore: 0.7 },
  { id: "hiit20_b", name: "HIIT 20 B", foco: "HIIT", minutos: 20, nivel: 2, scheme: "fatloss", objetivoId: 1, baseScore: 0.65 },
  { id: "fuerza45", name: "Fuerza 45", foco: "Fuerza", minutos: 45, nivel: 2, scheme: "muscle", objetivoId: 2, baseScore: 0.6 },
];

async function loadCatalogoSeguro() {
  try {
    // TODO: sustituye por tu fuente real (Firestore / JSON / etc.)
    // const resp = await fetch("/data/catalogo.json");
    // if (!resp.ok) throw new Error("catalog_not_ok");
    // const data = await resp.json();
    // return Array.isArray(data) ? data : CATALOGO_MIN;
    return CATALOGO_MIN;
  } catch (e) {
    console.warn("[catalog] usando fallback:", e);
    return CATALOGO_MIN;
  }
}

/**
 * Recomienda rutinas (reglas + ML si disponible)
 * @param {object} inputsRaw  {objetivo,dificultad,limitacion,tiempo,frecuencia}
 * @param {object} opts       {sessions,lastFocus,topK}
 * @returns {Promise<Array>}  [{...routine, score, explain}, ...]
 */
export async function recomendarRutinas(inputsRaw, opts = {}) {
  const inputs = validarInputs(inputsRaw);
  const catalogo = await loadCatalogoSeguro();
  const res = await recommendRoutines(inputs, catalogo, { topK: 6, ...opts });
  return Array.isArray(res) ? res : [];
}
