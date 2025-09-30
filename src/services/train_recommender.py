# src/train_recommender.py
import pandas as pd
import numpy as np
import pickle
from pathlib import Path
from sklearn.preprocessing import OneHotEncoder, StandardScaler
from sklearn.neighbors import NearestNeighbors

DATA_PATH = Path(__file__).resolve().parents[1] / "data" / "routines.csv"
OUT_PATH  = Path(__file__).resolve().parents[0] / "fitlife_knn_model.pkl"

# ---------------- Utils ----------------
def split_focus(f):
    if pd.isna(f) or not str(f).strip():
        return []
    return [x.strip() for x in str(f).split("|") if x.strip()]

def build_feature_matrix(df: pd.DataFrame):
    # Categóricas
    cat = df[["goal","level","sex"]].astype(str).fillna("any")
    oh = OneHotEncoder(sparse_output=False, handle_unknown="ignore")
    X_cat = oh.fit_transform(cat)

    # Numéricas
    num = df[["minAge","maxAge","minMinutes","maxMinutes"]].copy()
    num = num.fillna(num.median(numeric_only=True))
    scaler = StandardScaler()
    X_num = scaler.fit_transform(num)

    # Focus bag-of-words sencillo
    all_focus = sorted({f for row in df["focus_list"] for f in row})
    focus_cols = []
    for f in all_focus:
        focus_cols.append(df["focus_list"].apply(lambda lst: 1 if f in lst else 0).values.reshape(-1,1))
    X_focus = np.hstack(focus_cols) if focus_cols else np.zeros((len(df),0))

    X = np.hstack([X_cat, X_num, X_focus])
    meta = {
        "oh": oh,
        "scaler": scaler,
        "focus_vocab": all_focus,
        "cat_cols": ["goal","level","sex"],
        "num_cols": ["minAge","maxAge","minMinutes","maxMinutes"],
    }
    return X, meta

def vector_from_query(params, meta):
    # params: {sex, age, experience, minutes, goal}
    goal = params.get("goal","salud")
    level = params.get("experience","novato")
    sex = params.get("sex","any")
    age = int(params.get("age",25))
    minutes = int(params.get("minutes",30))

    # Mapeamos la "consulta" a un vector del mismo espacio:
    # Para minutes y age haremos una banda (min=max +/- tolerancia)
    row = pd.DataFrame([{
        "goal": goal,
        "level": level,
        "sex": sex,
        "minAge": max(age-2, 10),
        "maxAge": min(age+2, 100),
        "minMinutes": max(minutes-10, 5),
        "maxMinutes": minutes+10,
    }])

    # categóricas
    Xc = meta["oh"].transform(row[meta["cat_cols"]])

    # numéricas
    Xn = meta["scaler"].transform(row[meta["num_cols"]])

    # focus de la consulta: lo dejamos cero (el match de focus viene del set),
    # aunque podrías inferir por goal, etc.
    Xf = np.zeros((1, len(meta["focus_vocab"])))

    return np.hstack([Xc, Xn, Xf])

# ---------------- Train ----------------
def main():
    df = pd.read_csv(DATA_PATH)
    df["focus_list"] = df["focus"].apply(split_focus)

    X, meta = build_feature_matrix(df)

    # KNN (similitud)
    knn = NearestNeighbors(n_neighbors=20, metric="cosine")
    knn.fit(X)

    artifact = {
        "knn": knn,
        "meta": meta,
        "df": df,   # guardamos el dataframe para recuperar campos
    }

    with open(OUT_PATH, "wb") as f:
        pickle.dump(artifact, f)

    print(f"✅ Modelo guardado en {OUT_PATH}")

if __name__ == "__main__":
    main()
