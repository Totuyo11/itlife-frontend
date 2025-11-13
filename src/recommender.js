// src/recommender.js — versión PRO (reglas + ML + explicabilidad)

/* =========================================================
 * Config
 * =======================================================*/
export const WEIGHTS = {
  objetivo: 0.35,
  nivel: 0.20,
  minutos: 0.15,
  foco: 0.15,
  diversidad: 0.05, // pequeño empujón si el foco cambia vs última vez
  biasCatálogo: 0.10, // si tienes score base del ejercicio/catálogo
};

export const PENALTY = {
  repeated48h: 0.30, // resta hasta 0.30 si se repite < 48h
  windowMs: 1000 * 60 * 60 * 48,
};

export const BOOSTS = {
  mlFocusMatch: 0.12, // boost si coincide foco con la IA
  mlSchemeMatch: 0.08, // boost si coincide esquema/plan con la IA
};

/* =========================================================
 * URL de la API /predict
 *
 * LOCAL:
 *   - Usa FastAPI en http://127.0.0.1:8000/predict
 *
 * PRODUCCIÓN (Vercel, etc.):
 *   - SOLO usa ML si defines VITE_ML_API_BASE o REACT_APP_ML_API_BASE
 *   - Si no hay variable → PREDICT_URL = null → se salta ML.
 * =======================================================*/
const IS_BROWSER = typeof window !== "undefined";
const IS_LOCALHOST =
  IS_BROWSER &&
  (window.location.hostname === "localhost" ||
    window.location.hostname === "127.0.0.1");

let API_BASE = null;

// 1) Si hay VITE_ML_API_BASE / REACT_APP_ML_API_BASE, siempre manda ahí
if (typeof import.meta !== "undefined" && import.meta.env) {
  if (import.meta.env.VITE_ML_API_BASE) {
    API_BASE = String(import.meta.env.VITE_ML_API_BASE);
  } else if (import.meta.env.REACT_APP_ML_API_BASE) {
    API_BASE = String(import.meta.env.REACT_APP_ML_API_BASE);
  }
}

// 2) Si NO hay variable pero estás en localhost, usa FastAPI local
if (!API_BASE && IS_LOCALHOST) {
  API_BASE = "http://127.0.0.1:8000";
}

// 3) Si estás en prod y no definiste nada → sin ML (solo reglas)
const PREDICT_URL = API_BASE ? `${API_BASE.replace(/\/$/, "")}/predict` : null;

const PREDICT_TIMEOUT_MS = 1200; // timeout corto → UX ágil
const PREDICT_CACHE_MS = 5 * 60 * 1000; // cache 5 min

/* =========================================================
 * Utils
 * =======================================================*/
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function normalizedMinutesScore(minutos, wishBucket) {
  // buckets de tiempo: 1=10-20, 2=20-30, 3=30-45, 4=45-60
  const ranges = {
    1: [10, 20],
    2: [20, 30],
    3: [30, 45],
    4: [45, 60],
  };
  const [lo, hi] = ranges[wishBucket] || [20, 30];
  if (minutos == null) return 0.5;
  if (minutos <= lo) return Math.max(0, 1 - (lo - minutos) / 20);
  if (minutos >= hi) return Math.max(0, 1 - (minutos - hi) / 30);
  // dentro del rango preferido
  return 1.0;
}

/* =========================================================
 * Fetch predict (IA) con timeout, reintento y caché
 * =======================================================*/
const _predictCache = new Map(); // key-> {ts, data}

async function fetchPredict(inputs) {
  // Si PREDICT_URL es null → ML desactivado (ej. en producción sin API)
  if (!PREDICT_URL) {
    if (IS_BROWSER && !IS_LOCALHOST) {
      console.info(
        "[Predict] ML desactivado en este entorno (sin VITE_ML_API_BASE / REACT_APP_ML_API_BASE). Usando solo el algoritmo de reglas."
      );
    }
    return null;
  }

  const key = JSON.stringify(inputs);
  const now = Date.now();
  const cached = _predictCache.get(key);
  if (cached && now - cached.ts < PREDICT_CACHE_MS) return cached.data;

  const controller = new AbortController();
  const to = setTimeout(() => controller.abort(), PREDICT_TIMEOUT_MS);

  try {
    const res = await fetch(PREDICT_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(inputs),
      signal: controller.signal,
    });
    clearTimeout(to);
    if (!res.ok) throw new Error("predict_not_ok");
    const data = await res.json();
    _predictCache.set(key, { ts: now, data });
    return data;
  } catch (err) {
    clearTimeout(to);
    console.warn("[Predict] primer intento falló:", err?.message || err);
    // un reintento breve
    await sleep(120);
    try {
      const res2 = await fetch(PREDICT_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(inputs),
      });
      if (!res2.ok) throw new Error("predict_retry_not_ok");
      const data2 = await res2.json();
      _predictCache.set(key, { ts: now, data: data2 });
      return data2;
    } catch (err2) {
      console.warn("[Predict] fallback: failed to fetch:", err2?.message || err2);
      return null; // fallback a reglas
    }
  }
}

/* =========================================================
 * Penalización por repetición <48h
 * =======================================================*/
export function recentUsedPenaltyMap(sessions = [], now = Date.now()) {
  // sessions: [{id: 'routineId', at: timestamp}, ...]
  const map = new Map();
  for (const s of sessions) {
    const t = typeof s.at === "number" ? s.at : new Date(s.at).getTime();
    if (now - t <= PENALTY.windowMs) {
      const curr = map.get(s.id) || 0;
      map.set(s.id, Math.max(curr, PENALTY.repeated48h));
    }
  }
  return map;
}

/* =========================================================
 * Scoring + explicabilidad
 * =======================================================*/
export function scoreRoutine(inputs, r, ctx) {
  const { objetivo, dificultad, tiempo } = inputs;
  const { lastFocus, penaltyMap, mlSuggest } = ctx || {};

  // componentes
  const w = { ...WEIGHTS };
  let s_obj = 0,
    s_lvl = 0,
    s_min = 0,
    s_focus = 0,
    s_div = 0,
    s_bias = 0,
    s_pen = 0,
    s_ml = 0;

  // objetivo
  if (r.objetivoId != null) {
    s_obj = r.objetivoId === objetivo ? 1 : 0.2;
  }

  // dificultad / nivel
  if (r.nivel != null) {
    const diff = Math.abs((r.nivel || 0) - (dificultad || 0));
    s_lvl = diff === 0 ? 1 : diff === 1 ? 0.6 : 0.1;
  }

  // minutos vs bucket deseado
  s_min = normalizedMinutesScore(r.minutos, tiempo);

  // foco (pecho/espalda/hiit/etc.) base
  if (r.foco && inputs) {
    s_focus = 0.6;
  }

  // === BOOSTS por IA (acepta labels nuevos o nombres antiguos) ===
  const mlFocusStr =
    mlSuggest?.focus_plan_label ?? mlSuggest?.focus_plan; // "fatloss"|"muscle"|...
  const mlSchemeStr =
    mlSuggest?.scheme_label ?? mlSuggest?.scheme; // "fatloss"|"muscle"|...

  if (mlFocusStr && r.foco) {
    if (String(r.foco).toLowerCase() === String(mlFocusStr).toLowerCase()) {
      s_ml += BOOSTS.mlFocusMatch;
    }
  }
  if (mlSchemeStr && r.scheme) {
    if (String(r.scheme).toLowerCase() === String(mlSchemeStr).toLowerCase()) {
      s_ml += BOOSTS.mlSchemeMatch;
    }
  }

  // diversidad (pequeño boost si cambias de foco vs la última sesión)
  if (lastFocus && r.foco && r.foco !== lastFocus) {
    s_div = 1.0;
  }

  // bias por metadatos del catálogo (opcional)
  if (typeof r.baseScore === "number") {
    s_bias = Math.max(0, Math.min(1, r.baseScore));
  }

  // penalización por repetición
  if (penaltyMap && penaltyMap.has(r.id)) {
    s_pen = penaltyMap.get(r.id);
  }

  // score total
  const base =
    w.objetivo * s_obj +
    w.nivel * s_lvl +
    w.minutos * s_min +
    w.foco * s_focus +
    w.diversidad * s_div +
    w.biasCatálogo * s_bias;

  const total = Math.max(0, base + s_ml - s_pen);

  return {
    score: total,
    explain: {
      base,
      s_obj,
      s_lvl,
      s_min,
      s_focus,
      s_div,
      s_bias,
      s_ml,
      s_pen,
      weights: w,
      boosts: BOOSTS,
      mlSuggest: mlSuggest || null,
    },
  };
}

/* =========================================================
 * Orquestación principal
 * =======================================================*/
export async function recommendRoutines(inputs, catalogo, opts = {}) {
  const {
    recentMap = new Map(),
    lastFocus = null,
    topK = 5,
    sessions = [], // por si no pasas recentMap
  } = opts;

  const penaltyMap = recentMap.size ? recentMap : recentUsedPenaltyMap(sessions);

  // 1) pedir sugerencia ML (con timeout + fallback)
  const ml = await fetchPredict(inputs); // puede traer {focus_plan_label, scheme_label, ...}

  // 2) score por reglas (+ boosts de ML + penalización)
  const ranked = catalogo.map((r) => {
    const { score, explain } = scoreRoutine(inputs, r, {
      lastFocus,
      penaltyMap,
      mlSuggest: ml,
    });
    return { ...r, score, explain };
  });

  // 3) ordenar y cortar
  ranked.sort((a, b) => b.score - a.score);
  return ranked.slice(0, topK);
}

/* =========================================================
 * Log de sesión (placeholder)
 * =======================================================*/
export async function logSession(uid, routineId, extra = {}) {
  console.debug("logSession()", { uid, routineId, extra });
}

/* =========================================================
 * Validación / normalización inputs
 * =======================================================*/
export function validarInputs(x) {
  const out = { ...x };
  const clamp = (v, lo, hi, def) =>
    Number.isFinite(v) ? Math.min(hi, Math.max(lo, v)) : def;
  out.objetivo = clamp(out.objetivo, 0, 4, 1);
  out.dificultad = clamp(out.dificultad, 0, 3, 1);
  out.limitacion = clamp(out.limitacion, 0, 5, 0);
  out.tiempo = clamp(out.tiempo, 1, 4, 2);
  out.frecuencia = clamp(out.frecuencia, 1, 7, 3);
  return out;
}

/* =========================================================
 * Adapter del catálogo Firestore -> formato scorable
 * =======================================================*/
export function toScorable(rDoc) {
  // rDoc: { id, name, items, _meta, ... }
  const m = rDoc?._meta || {};

  // minutos: _meta.minutos || suma de items.mins/minutes || null
  let minutos = Number.isFinite(m.minutos) ? m.minutos : null;
  if (!minutos && Array.isArray(rDoc?.items)) {
    minutos = rDoc.items.reduce((acc, it) => {
      const v = it?.mins ?? it?.minutes ?? 0;
      return acc + (Number.isFinite(v) ? v : 0);
    }, 0);
    if (!minutos) minutos = null;
  }

  // foco: _meta.foco || primer tag || 'fullbody'
  const foco =
    m.foco ||
    (Array.isArray(m.tags) && m.tags.length ? m.tags[0] : null) ||
    "fullbody";

  // nivel/objetivo/baseScore/scheme con defaults
  const objetivoId = Number.isFinite(m.objetivoId) ? m.objetivoId : 1;
  const nivel = Number.isFinite(m.nivel) ? m.nivel : 1;
  const baseScore =
    typeof m.baseScore === "number"
      ? Math.max(0, Math.min(1, m.baseScore))
      : 0;
  // Para que el boost de esquema aplique, usa uno de: "fatloss" | "muscle" | "hiit" | "recomp"
  const scheme = typeof m.scheme === "string" ? m.scheme : null;

  return {
    id: rDoc.id,
    name: rDoc.name || "Rutina",
    objetivoId,
    nivel,
    foco,
    minutos,
    baseScore,
    scheme,
    _raw: rDoc,
  };
}

/* =========================================================
 * Envoltura: rankear catálogo Firestore "tal cual"
 * =======================================================*/
export async function rankFromFirestoreCatalog(
  inputs,
  firestoreCatalog,
  opts = {}
) {
  const sanitized = validarInputs({ ...inputs });
  const scorable = firestoreCatalog.map(toScorable);
  return await recommendRoutines(sanitized, scorable, opts);
}
