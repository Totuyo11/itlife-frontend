/**
 * Pruebas del recomendador (reglas + penalización + fusión con ML)
 * Corre con: npm test -- recommender
 */

import {
  recommendRoutines,
  recentUsedPenaltyMap,
} from "../recommender";

// 🔧 mock de fetch para NO depender del backend en estos tests.
// Si tu recommendRoutines llama al backend, simula una respuesta compatible.
global.fetch = jest.fn(() =>
  Promise.resolve({
    ok: true,
    json: () =>
      Promise.resolve({
        // ejemplo de la IA: sugiere foco HIIT y esquema "fatloss"
        focus_plan: "HIIT",
        scheme: "fatloss",
        metadata: { confidence: 0.78 },
      }),
  })
);

function makeCatalogo() {
  return [
    { id: "A", name: "HIIT 20", foco: "HIIT", minutos: 20, nivel: 2, scheme: "fatloss" },
    { id: "B", name: "Fuerza 45", foco: "Fuerza", minutos: 45, nivel: 2, scheme: "muscle" },
    { id: "C", name: "HIIT 20 B", foco: "HIIT", minutos: 20, nivel: 2, scheme: "fatloss" },
  ];
}

describe("Recomendador FitLife", () => {
  test("favorece foco/tiempo sugeridos por IA y penaliza repetidas (<48h)", async () => {
    const inputs = { objetivo: 1, dificultad: 2, limitacion: 0, tiempo: 2, frecuencia: 3 };

    // A fue usada hoy → penalizada
    const recently = new Map([["A", Date.now()]]);

    const out = await recommendRoutines(inputs, makeCatalogo(), {
      recentMap: recently,
      topK: 3,
    });

    // Esperado: C arriba (cumple HIIT + 20 + fatloss, sin penalización)
    expect(out[0].id).toBe("C");
    // A no debe quedar por encima de C (por penalización)
    const posA = out.findIndex((x) => x.id === "A");
    const posC = out.findIndex((x) => x.id === "C");
    expect(posA).toBeGreaterThan(posC);
  });

  test("penalización cae al pasar 48h", () => {
    const twoDaysAgo = Date.now() - 1000 * 60 * 60 * 49; // 49h
    const map = recentUsedPenaltyMap([{ id: "A", at: twoDaysAgo }]);
    // No debería penalizar si ya pasaron >48h
    // (depende de tu implementación: que devuelva 0 o no reste)
    expect(map.get("A") || 0).toBe(0);
  });
});
