// src/services/planPostProcessor.js
// Post-procesa un plan semanal: descanso por grupo, progresión, perfil e integridad.

//// -------------------- Helpers --------------------
function clamp(n, min, max) { return Math.min(max, Math.max(min, n)); }

// Evita trabajar el mismo grupo si no han pasado 2 días (48h)
// Si un día se queda vacío, lo marcamos como MOBILITY (movilidad/estiramientos)
function espaciarGrupos(plan) {
  const lastDay = {}; // { PECHO: 0, ESPALDA: 1, ... }
  const touch = (g, d) => { lastDay[g] = d; };

  return plan.map((dia, dIdx) => {
    const bloques = Array.isArray(dia.bloques) ? dia.bloques.slice() : [];
    const kept = [];

    for (const b of bloques) {
      const g = (b?.grupo || "").toUpperCase();
      const prev = lastDay[g];
      const ok = prev == null || (dIdx - prev) >= 2; // 0,1 bloquea; 2 o más ok
      if (ok) {
        kept.push(b);
        touch(g, dIdx);
      }
    }

    // Si por descanso se quedó sin bloques, agrega movilidad
    const safeBlocks = kept.length
      ? kept
      : [{ grupo: "MOBILITY", ejercicios: [{ nombre: "Movilidad general 20-30min", esquema: { series: 1, reps: "fluido", descanso: "-" } }] }];

    return { ...dia, bloques: safeBlocks };
  });
}

// Progresión: si el histórico de un grupo dice okUltimaVez -> +1 serie
// historicoPorGrupo: { PECHO: { okUltimaVez: true }, ESPALDA: { okUltimaVez: false } }
function aplicarProgresion(plan, historicoPorGrupo = {}) {
  return plan.map(d => ({
    ...d,
    bloques: d.bloques.map(b => {
      const g = (b?.grupo || "").toUpperCase();
      const hist = historicoPorGrupo[g] || {};
      const deltaSeries = hist.okUltimaVez ? 1 : 0;

      const ejercicios = (b.ejercicios || []).map(ej => {
        const s = ej.esquema || {};
        const series = clamp((s.series ?? 3) + deltaSeries, 2, 8);
        return { ...ej, esquema: { ...s, series } };
      });

      return { ...b, ejercicios };
    })
  }));
}

// Ajusta intensidad por perfil: experiencia, IMC y lesión/limitación
// experiencia: 1(principiante) 2(intermedio) 3(avanzado)
// limitacion: 1/2/3 = tiene; 4 = ninguna
function ajustarIntensidadPorPerfil(plan, { experiencia = 2, imc = 22, limitacion = 4 } = {}) {
  const multExp = experiencia === 1 ? 0.85 : experiencia === 3 ? 1.1 : 1.0;
  const multIMC = imc >= 30 ? 0.92 : (imc < 18.5 ? 0.95 : 1.0);
  const multInjury = (limitacion && limitacion !== 4) ? 0.92 : 1.0;

  const mult = +(multExp * multIMC * multInjury).toFixed(2);

  return {
    plan: plan.map(d => ({
      ...d,
      bloques: d.bloques.map(b => ({
        ...b,
        ejercicios: (b.ejercicios || []).map(ej => {
          const s = ej.esquema || {};
          const series = clamp(Math.round((s.series ?? 3) * mult), 2, 8);
          return { ...ej, esquema: { ...s, series } };
        })
      }))
    })),
    mult
  };
}

// Validación básica de calidad: mínimo 5 ejercicios por día.
// Si hay menos, añade accesorios “core/estabilidad”.
function validarPlan(plan) {
  const FIX = { nombre: "Core/estabilidad 10-12min", esquema: { series: 1, reps: "controlado", descanso: "-" } };
  const nuevo = plan.map(d => {
    const total = d.bloques.reduce((acc, b) => acc + (b.ejercicios?.length || 0), 0);
    if (total >= 5) return d;

    // añade accesorios al primer bloque o crea uno
    const blocks = d.bloques.length ? d.bloques.slice() : [{ grupo: "ACCESORIOS", ejercicios: [] }];
    blocks[0] = {
      ...blocks[0],
      ejercicios: [...(blocks[0].ejercicios || []), FIX, FIX].slice(0, 6) // no más de 6 añadidos
    };
    return { ...d, bloques: blocks };
  });

  return { ok: true, plan: nuevo };
}

//// -------------------- Export principal --------------------
/**
 * postProcessPlan
 * @param {Array} planBase  Plan semanal [{ dia, foco, duracionEstimadaMin, bloques:[{grupo, ejercicios:[{nombre, esquema}]}] }]
 * @param {Object} ctx
 *  - perfil: { experiencia, imc, limitacion }
 *  - historicoPorGrupo: { PECHO:{okUltimaVez:true}, ... }
 * @returns {{ plan:Array, resumen:Object }}
 */
export function postProcessPlan(planBase = [], ctx = {}) {
  // 1) Descanso por grupo (48h)
  const planDescansado = espaciarGrupos(planBase);

  // 2) Progresión
  const planProgresado = aplicarProgresion(planDescansado, ctx.historicoPorGrupo);

  // 3) Ajuste por perfil
  const { plan: planAjustado, mult } = ajustarIntensidadPorPerfil(planProgresado, ctx.perfil);

  // 4) Validación
  const { ok, plan: planFinal } = validarPlan(planAjustado);

  const resumen = {
    ok,
    perfil: ctx.perfil || {},
    multAplicado: mult,
    reglas: {
      descanso48h: true,
      progresionSeries: true,
      ajustePerfil: true,
      minEjerciciosDia: 5
    }
  };

  return { plan: planFinal, resumen };
}
