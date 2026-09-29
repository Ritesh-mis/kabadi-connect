"""Train the on-device e-waste classifier -> public/model.json (~30 KB, runs offline in the browser).
Data sources (merged):  1) real photos: ml/dataset/<category_id>/*.jpg   2) field lots: backend/kabadi.db (lots.image + category)
                        3) synthetic bootstrap images (ml/synth.py) - ONLY to make the pipeline work before real data exists.
Usage: python ml/train.py [--no-synth] [--synth-n 150]"""
import argparse, base64, io, json, os, sqlite3, glob
import numpy as np
from PIL import Image
from sklearn.linear_model import LogisticRegression
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report

S = 64  # input size; MUST match src/classifier.ts

def features(img):
    a = np.asarray(img.convert("RGB").resize((S, S), Image.BILINEAR), dtype=np.float32) / 255
    q = np.minimum((a * 4).astype(int), 3)
    h = np.bincount((q[..., 0] * 16 + q[..., 1] * 4 + q[..., 2]).ravel(), minlength=64) / (S * S)   # 64 colour bins
    g = a.mean(2); gx = np.abs(np.diff(g, axis=1))[:-1]; gy = np.abs(np.diff(g, axis=0))[:, :-1]
    e = (gx + gy)[:S - 1, :S - 1][:60, :60].reshape(4, 15, 4, 15).mean((1, 3)).ravel() * 4          # 4x4 edge-density grid
    return np.concatenate([h, e, [g.mean(), g.std()]]).astype(np.float32)                        # 82 dims

def load_real(root):
    X, y = [], []
    for d in sorted(glob.glob(os.path.join(root, "*/"))):
        c = os.path.basename(d.rstrip("/"))
        for f in glob.glob(d + "*"):
            try: X.append(features(Image.open(f))); y.append(c)
            except Exception: pass
    return X, y

def load_db(path):
    X, y = [], []
    if not os.path.exists(path): return X, y
    for img, c in sqlite3.connect(path).execute("SELECT image,category_id FROM lots WHERE image LIKE 'data:image%'"):
        try: X.append(features(Image.open(io.BytesIO(base64.b64decode(img.split(",", 1)[1]))))); y.append(c)
        except Exception: pass
    return X, y

if __name__ == "__main__":
    ap = argparse.ArgumentParser(); ap.add_argument("--no-synth", action="store_true"); ap.add_argument("--synth-n", type=int, default=150)
    a = ap.parse_args(); root = os.path.dirname(os.path.abspath(__file__))
    X, y = load_real(os.path.join(root, "dataset")); n_real = len(X)
    Xd, yd = load_db(os.path.join(root, "..", "backend", "kabadi.db")); X += Xd; y += yd; n_db = len(Xd)
    src = ["real"] * n_real + ["field"] * n_db
    if not a.no_synth:
        from synth import make
        for c, im in make(a.synth_n): X.append(features(im)); y.append(c); src.append("synthetic")
    X, y = np.array(X), np.array(y)
    print("samples:", {s: src.count(s) for s in set(src)}, "classes:", sorted(set(y)))
    Xtr, Xte, ytr, yte = train_test_split(X, y, test_size=0.2, stratify=y, random_state=1)
    m = LogisticRegression(C=5, max_iter=3000).fit(Xtr, ytr)
    print(classification_report(yte, m.predict(Xte), zero_division=0))
    m = LogisticRegression(C=5, max_iter=3000).fit(X, y)
    json.dump({"size": S, "classes": list(m.classes_), "W": np.round(m.coef_, 4).tolist(), "b": np.round(m.intercept_, 4).tolist(),
               "meta": {"samples": {s: src.count(s) for s in set(src)}, "holdout_acc": round(float(m.score(Xte, yte)), 3),
                        "note": "synthetic samples only bootstrap the pipeline; retrain on real field photos"}},
              open(os.path.join(root, "..", "public", "model.json"), "w"))
    print("wrote public/model.json")
