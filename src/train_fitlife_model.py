# train_fitlife_model.py
import joblib
import pandas as pd
from sklearn.compose import ColumnTransformer
from sklearn.preprocessing import OneHotEncoder
from sklearn.pipeline import Pipeline
from sklearn.ensemble import RandomForestClassifier, RandomForestRegressor

# =======================
# Mapas predefinidos
# =======================
GRUPOS = {
    "A": [["fullbody"], ["fullbody"]],
    "B": [["pecho","tricep"], ["espalda","bicep"], ["pierna","gluteo","core"], ["hombro","core"]],
    "C": [["pecho","tricep"], ["espalda","bicep"], ["pierna","gluteo"], ["hombro","core"], ["fullbody"], ["cardio","core"]],
    "C_HIIT": [["cardio","core"], ["fullbody"], ["cardio","core"], ["fullbody"], ["cardio","core"], ["fullbody"]],
}
SCHEMES = {
    "fatloss": {"reps":"12-15","descanso":"45-60s","nota":"RPE 7-8"},
    "muscle": {"reps":"6-10","descanso":"90-120s","nota":"RPE 8-9"},
    "hiit": {"reps":"AMRAP","descanso":"15-30s","nota":"Circuito HIIT"},
    "recomp": {"reps":"8-12","descanso":"60-90s","nota":"Fuerza + volumen"},
}

# =======================
# 1. Cargar dataset real
# =======================
DATASET_PATH = "fitlife_rutinas_personalizadas.csv"

df = pd.read_csv(DATASET_PATH)

# Validación mínima
required_cols = ["objetivo","dificultad","limitacion","tiempo","frecuencia","focus_id","scheme_id","series"]
missing = [c for c in required_cols if c not in df.columns]
if missing:
    raise ValueError(f"❌ El dataset no tiene todas las columnas necesarias. Faltan: {missing}")

print("✅ Columnas detectadas:", df.columns.tolist())
print("✅ Total de filas cargadas:", len(df))

# =======================
# 2. Features y Targets
# =======================
X = df[["objetivo","dificultad","limitacion","tiempo","frecuencia"]]
y_focus = df["focus_id"].astype(str)
y_scheme = df["scheme_id"].astype(str)
y_series = df["series"].astype(int)

# =======================
# 3. Preprocesamiento
# =======================
categorical = ["objetivo","dificultad","limitacion","tiempo","frecuencia"]
pre = ColumnTransformer([
    ("onehot", OneHotEncoder(handle_unknown="ignore"), categorical)
], remainder="drop")

# =======================
# 4. Modelos
# =======================
focus_clf  = Pipeline([("pre", pre), ("rf", RandomForestClassifier(n_estimators=300, random_state=0))])
scheme_clf = Pipeline([("pre", pre), ("rf", RandomForestClassifier(n_estimators=300, random_state=1))])
series_reg = Pipeline([("pre", pre), ("rf", RandomForestRegressor(n_estimators=300, random_state=2))])

focus_clf.fit(X, y_focus)
scheme_clf.fit(X, y_scheme)
series_reg.fit(X, y_series)

print("✅ Modelos entrenados correctamente")

# =======================
# 5. Guardar modelo
# =======================
OUTPUT_PATH = "fitlife_sklearn_model.pkl"

joblib.dump({
    "version": "3.0.0",
    "focus_clf": focus_clf,
    "scheme_clf": scheme_clf,
    "series_reg": series_reg,
    "GRUPOS": GRUPOS,
    "SCHEMES": SCHEMES
}, OUTPUT_PATH)

print(f"✅ Modelo entrenado y guardado en {OUTPUT_PATH}")
