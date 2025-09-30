import joblib, numpy as np, pandas as pd

bundle = joblib.load("fitlife_sklearn_model.pkl")
focus_clf, scheme_clf, series_reg = bundle["focus_clf"], bundle["scheme_clf"], bundle["series_reg"]
GRUPOS, SCHEMES = bundle["GRUPOS"], bundle["SCHEMES"]

X = [{
    "objetivo": 1, "dificultad": 2, "limitacion": 4, "tiempo": 2, "frecuencia": 2
}]
X_df = pd.DataFrame(X)[["objetivo","dificultad","limitacion","tiempo","frecuencia"]]

f_ids = focus_clf.predict(X_df)
s_ids = scheme_clf.predict(X_df)
ser_pred = np.rint(series_reg.predict(X_df)).astype(int)

out = []
for i in range(len(X_df)):
    base = SCHEMES[s_ids[i]].copy()
    reps = base["reps"]
    if s_ids[i]=="hiit":
        reps = f"AMRAP { '30s' if X_df.iloc[i]['tiempo']==1 else ('40s' if X_df.iloc[i]['tiempo']==2 else '45s') }"
    out.append({
        "focus_plan": GRUPOS[f_ids[i]],
        "scheme": {"series": int(ser_pred[i]), "reps": reps, "descanso": base["descanso"], "nota": base["nota"]},
        "metadata": {"model_version": bundle["version"], "focus_id": f_ids[i], "scheme_id": s_ids[i]},
    })

print(out)
