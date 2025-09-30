from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, ValidationError
from fastapi.middleware.cors import CORSMiddleware
import joblib, numpy as np, pandas as pd
import os, pickle
from pathlib import Path

# --------- App + CORS ---------
app = FastAPI(title="FitLife API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # en prod pon tu dominio
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --------- MODELO SKLEARN (predict clásico) ---------
PKL_PATH = os.path.join(os.path.dirname(__file__), "fitlife_sklearn_model.pkl")
if not os.path.exists(PKL_PATH):
    raise RuntimeError(f"No se encontró el modelo en: {PKL_PATH}")

bundle = joblib.load(PKL_PATH)
focus_clf, scheme_clf, series_reg = bundle["focus_clf"], bundle["scheme_clf"], bundle["series_reg"]
GRUPOS, SCHEMES = bundle["GRUPOS"], bundle["SCHEMES"]
VERSION = bundle.get("version", "NA")

class InputItem(BaseModel):
    objetivo: int
    dificultad: int
    limitacion: int
    tiempo: int
    frecuencia: int

@app.post("/predict")
def predict(item: InputItem):
    try:
        X_df = pd.DataFrame([item.dict()])[["objetivo","dificultad","limitacion","tiempo","frecuencia"]]
        f_id = focus_clf.predict(X_df)[0]
        s_id = scheme_clf.predict(X_df)[0]
        ser_pred = int(np.rint(series_reg.predict(X_df))[0])

        base = SCHEMES[s_id].copy()
        reps = base["reps"]
        if s_id == "hiit":
            reps = f"AMRAP { '30s' if item.tiempo==1 else ('40s' if item.tiempo==2 else '45s') }"

        resp = {
            "focus_plan": GRUPOS[f_id],
            "scheme": {"series": ser_pred, "reps": reps, "descanso": base["descanso"], "nota": base["nota"]},
            "metadata": {"model_version": VERSION, "focus_id": f_id, "scheme_id": s_id},
        }
        print("[/predict]", item.dict(), "->", resp["metadata"])
        return resp

    except ValidationError as ve:
        raise HTTPException(status_code=422, detail=str(ve))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error interno: {type(e).__name__}: {e}")

# --------- MODELO KNN (recommend híbrido) ---------
MODEL_PATH = Path(__file__).resolve().parent / "fitlife_knn_model.pkl"
_reco = None

def get_recommender():
    global _reco
    if _reco is None:
        if not MODEL_PATH.exists():
            raise RuntimeError(f"No se encontró el modelo KNN en {MODEL_PATH}")
        with open(MODEL_PATH, "rb") as f:
            _reco = pickle.load(f)
    return _reco

class RecommendReq(BaseModel):
    sex: str = "any"
    age: int = 25
    experience: str = "novato"
    minutes: int = 30
    goal: str = "salud"
    topN: int = 5

@app.post("/recommend")
def recommend(req: RecommendReq):
    try:
        art = get_recommender()
        knn = art["knn"]
        meta = art["meta"]
        df = art["df"]

        # usamos la función de train_recommender
        from src.train_recommender import vector_from_query
        qv = vector_from_query(req.dict(), meta)

        dists, idxs = knn.kneighbors(qv, n_neighbors=min(req.topN, len(df)))
        idxs = idxs[0].tolist()
        dists = dists[0].tolist()

        results = []
        for i, d in zip(idxs, dists):
            row = df.iloc[i]
            score = float(max(0.0, 1.0 - d)) * 5.0  # 0..5
            results.append({
                "name": row["name"],
                "goal": row["goal"],
                "level": row["level"],
                "sex": row["sex"],
                "minAge": int(row["minAge"]),
                "maxAge": int(row["maxAge"]),
                "minMinutes": int(row["minMinutes"]),
                "maxMinutes": int(row["maxMinutes"]),
                "focus": str(row["focus"]).split("|") if isinstance(row["focus"], str) else [],
                "_score": round(score, 1),
            })
        return {"items": results, "meta": {"model": "knn-cosine", "k": 20}}

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error interno en recommend: {e}")

# --------- ENDPOINTS BÁSICOS ---------
@app.get("/")
def root():
    return {"ok": True, "version": VERSION, "services": ["predict", "recommend"]}

@app.get("/health")
def health():
    return {"status": "ok", "version": VERSION}
