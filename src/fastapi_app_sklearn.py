# src/fastapi_app_sklearn.py
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
from pathlib import Path
import os, pickle, joblib
import numpy as np
import pandas as pd

# =========================
# App + CORS
# =========================
app = FastAPI(title="FitLife API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],   # en producción: pon tus dominios
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# =========================
# Rutas de modelos (env-friendly)
# =========================
BASE_DIR = Path(__file__).resolve().parent
PKL_PATH = Path(os.getenv("FITLIFE_SK_MODEL", str(BASE_DIR / "fitlife_sklearn_model.pkl")))
KNN_PATH = Path(os.getenv("FITLIFE_KNN_MODEL", str(BASE_DIR / "fitlife_knn_model.pkl")))

# =========================
# Carga MODELO SKLEARN (paquete con 3 modelos + mapas)
# =========================
if not PKL_PATH.exists():
    raise RuntimeError(f"No se encontró el modelo sklearn en: {PKL_PATH}")

bundle = joblib.load(PKL_PATH)
focus_clf  = bundle.get("focus_clf")
scheme_clf = bundle.get("scheme_clf")
series_reg = bundle.get("series_reg")
GRUPOS     = bundle.get("GRUPOS", {})
SCHEMES    = bundle.get("SCHEMES", {})
VERSION    = bundle.get("version", "NA")

if any(m is None for m in [focus_clf, scheme_clf, series_reg]):
    raise RuntimeError("El paquete sklearn está incompleto: faltan modelos.")

# =========================
# Esquema /predict FLEXIBLE
#  - Acepta {objetivo,dificultad,limitacion,tiempo,frecuencia}
#  - y también {goal,experience,minutes,sex,age}
# =========================
class PredictReqFlexible(BaseModel):
    # formato "clásico"
    objetivo: Optional[int] = None
    dificultad: Optional[int] = None
    limitacion: Optional[int] = None
    tiempo: Optional[int] = None
    frecuencia: Optional[int] = None
    # formato "UI" alterno
    sex: Optional[str] = None
    age: Optional[int] = None
    experience: Optional[str] = None
    minutes: Optional[int] = None
    goal: Optional[str] = None

    class Config:
        extra = "allow"  # ignora campos extra sin tronar

def _minutes_to_bucket(m: Optional[int]) -> int:
    # 1=10-20, 2=20-30, 3=30-45, 4=45-60
    if m is None: return 2
    if m < 20: return 1
    if m < 30: return 2
    if m < 45: return 3
    return 4

def _map_goal(g: Optional[str]) -> int:
    if not g: return 1
    g = g.lower()
    if "mus" in g: return 2          # ganar_musculo
    if "hiit" in g or "cardio" in g: return 3
    if "recomp" in g: return 4
    return 1                          # salud

def _map_experience(x: Optional[str]) -> int:
    if not x: return 1
    x = x.lower()
    if "avan" in x: return 3
    if "inter" in x: return 2
    return 1  # novato

def _coerce_int(v, default):
    try:
        if v is None: return default
        return int(v)
    except Exception:
        return default

def _normalize(req: PredictReqFlexible):
    """
    Regresa un dict con las 5 features que el modelo necesita,
    usando cualquiera de los formatos y con defaults sanos.
    """
    objetivo = req.objetivo if req.objetivo is not None else _map_goal(req.goal)
    dificultad = req.dificultad if req.dificultad is not None else _map_experience(req.experience)
    limitacion = _coerce_int(req.limitacion, 4)  # default razonable en tu dataset
    tiempo = req.tiempo if req.tiempo is not None else _minutes_to_bucket(req.minutes)
    frecuencia = _coerce_int(req.frecuencia, 3)

    # coerción final por si llegaron strings numéricas
    objetivo = _coerce_int(objetivo, 1)
    dificultad = _coerce_int(dificultad, 1)
    tiempo = _coerce_int(tiempo, 2)

    return {
        "objetivo": objetivo,
        "dificultad": dificultad,
        "limitacion": limitacion,
        "tiempo": tiempo,
        "frecuencia": frecuencia,
    }

# =========================
# Recommender KNN (opcional)
# =========================
class RecommendReq(BaseModel):
    sex: str = "any"
    age: int = 25
    experience: str = "novato"
    minutes: int = 30
    goal: str = "salud"
    topN: int = 5

_reco_bundle = None

def get_recommender():
    global _reco_bundle
    if _reco_bundle is None:
        if not KNN_PATH.exists():
            raise RuntimeError(f"No se encontró el modelo KNN en {KNN_PATH}")
        with open(KNN_PATH, "rb") as f:
            _reco_bundle = pickle.load(f)
        for key in ["knn", "meta", "df"]:
            if key not in _reco_bundle:
                raise RuntimeError(f"El paquete KNN no contiene la clave requerida: {key}")
    return _reco_bundle

# =========================
# Endpoints
# =========================
@app.get("/")
def root():
    return {"ok": True, "version": VERSION, "services": ["predict", "recommend"]}

@app.get("/health")
def health():
    ok = all([focus_clf, scheme_clf, series_reg])
    knn_ok = KNN_PATH.exists()
    return {"status": "ok" if ok else "error", "version": VERSION, "knn_present": knn_ok}

# --------- /predict (flexible) ----------
@app.post("/predict")
def predict(req: PredictReqFlexible):
    try:
        feats = _normalize(req)
        X_df = pd.DataFrame([feats])[["objetivo","dificultad","limitacion","tiempo","frecuencia"]]

        # Predicciones
        f_id = str(focus_clf.predict(X_df)[0])       # A | B | C | C_HIIT
        s_id = str(scheme_clf.predict(X_df)[0])      # fatloss | muscle | hiit | recomp
        ser_pred = int(np.rint(series_reg.predict(X_df))[0])

        # Construcción de reps dinámicas para HIIT
        base = dict(SCHEMES.get(s_id, {}))  # copia
        reps = base.get("reps", "10-12")
        if s_id == "hiit":
            reps = f"AMRAP { '30s' if feats['tiempo']==1 else ('40s' if feats['tiempo']==2 else '45s') }"

        # Respuesta compatible con el frontend
        resp = {
            "focus_plan_label": s_id,
            "scheme_label": s_id,

            "focus_plan": GRUPOS.get(f_id, [["fullbody"]]),
            "scheme": {
                "series": ser_pred,
                "reps": reps,
                "descanso": base.get("descanso", "60s"),
                "nota": base.get("nota", ""),
            },

            "series": ser_pred,
            "scheme_meta": base,
            "blocks": [
                {
                    "block": i + 1,
                    "focus": focos,
                    "series": ser_pred,
                    "scheme_hint": s_id
                } for i, focos in enumerate(GRUPOS.get(f_id, [["fullbody"]]))
            ],
            "metadata": {
                "model_version": VERSION,
                "focus_id": f_id,
                "scheme_id": s_id,
                "focusBoost": [s_id],
                "priorityIds": [],
            },
        }
        print("[/predict]", feats, "->", resp["metadata"])
        return resp

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error interno en predict: {type(e).__name__}: {e}")

# --------- /recommend (KNN opcional) ----------
@app.post("/recommend")
def recommend(req: RecommendReq):
    try:
        # Carga tolerante del KNN
        try:
            art = get_recommender()
        except RuntimeError as e:
            return {"items": [], "meta": {"model": "knn-cosine", "k": 0, "warning": str(e)}}

        knn = art["knn"]
        meta = art["meta"]
        df = art["df"]

        try:
            from src.train_recommender import vector_from_query
        except Exception as ie:
            raise RuntimeError(f"No se pudo importar vector_from_query desde src.train_recommender: {ie}")

        qv = vector_from_query(req.dict(), meta)
        n = min(max(1, req.topN), len(df))
        dists, idxs = knn.kneighbors(qv, n_neighbors=n)
        idxs = idxs[0].tolist()
        dists = dists[0].tolist()

        results = []
        for i, d in zip(idxs, dists):
            row = df.iloc[i]
            score = float(max(0.0, 1.0 - d)) * 5.0  # 0..5
            results.append({
                "name": row.get("name", f"Routine-{i}"),
                "goal": row.get("goal"),
                "level": row.get("level"),
                "sex": row.get("sex"),
                "minAge": int(row.get("minAge", 14)),
                "maxAge": int(row.get("maxAge", 65)),
                "minMinutes": int(row.get("minMinutes", 20)),
                "maxMinutes": int(row.get("maxMinutes", 45)),
                "focus": str(row.get("focus","")).split("|") if isinstance(row.get("focus"), str) else [],
                "_score": round(score, 1),
            })

        return {"items": results, "meta": {"model": "knn-cosine", "k": len(idxs)}}

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error interno en recommend: {e}")
