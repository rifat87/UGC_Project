import os
import cv2
import numpy as np
import joblib
from sklearn.linear_model import SGDClassifier
from collections import defaultdict
from insightface.app import FaceAnalysis

# CONFIGURATION
DATA_DIR = "dataset"
MODEL_PATH = "face_encodings.pkl"

# Initialize InsightFace
model = FaceAnalysis(name='buffalo_l')
model.prepare(ctx_id=-1)

def get_embeddings_for_ids(voter_ids, data_dir=DATA_DIR):
    X, y = [], []
    for vid in voter_ids:
        folder = os.path.join(data_dir, vid)
        if not os.path.isdir(folder):
            continue
        for fname in os.listdir(folder):
            if not fname.lower().endswith(('.jpg', '.jpeg', '.png')):
                continue
            path = os.path.join(folder, fname)
            img = cv2.imread(path)
            if img is None:
                continue
            faces = model.get(img)
            if not faces:
                continue
            X.append(faces[0].embedding)
            y.append(vid)
    return np.array(X), np.array(y)

def update_centroids(existing_centroids, X, y):
    buckets = defaultdict(list)
    for lbl, cent in existing_centroids.items():
        buckets[lbl].append(cent)
    for emb, lbl in zip(X, y):
        buckets[lbl].append(emb)
    return {lbl: np.mean(embs, axis=0) for lbl, embs in buckets.items()}

def train_incrementally():
    # 1. Load existing model (if exists)
    if os.path.exists(MODEL_PATH):
        raw = joblib.load(MODEL_PATH)
        if isinstance(raw, dict):
            clf = raw['clf']
            centroids = raw['centroids']
            previous_classes = raw.get('classes', sorted(centroids.keys()))
            print(f"[INFO] Loaded model with classes: {previous_classes}")
        else:
            clf = raw
            centroids = {}
            previous_classes = sorted(getattr(clf, 'classes_', []))
    else:
        clf = SGDClassifier(loss='log_loss', max_iter=1000)
        centroids = {}
        previous_classes = []

    # 2. Scan current voter folders
    all_ids = sorted([d for d in os.listdir(DATA_DIR)
                      if os.path.isdir(os.path.join(DATA_DIR, d))])
    if not all_ids:
        print("[ERROR] No voter folders found.")
        return

    print(f"[INFO] All IDs on disk: {all_ids}")
    print(f"[INFO] Existing model classes: {previous_classes}")

    # 3. Compare classes
    same_class_set = sorted(previous_classes) == sorted(all_ids)

    if same_class_set and previous_classes:
        # Classes match → safe to use partial_fit
        new_ids = sorted(set(all_ids) - set(previous_classes))
        if not new_ids:
            print("[INFO] No new IDs found. Skipping training.")
            return
        print(f"[INFO] Using incremental training on new IDs: {new_ids}")
        X_new, y_new = get_embeddings_for_ids(new_ids)
        if len(X_new) == 0:
            print("[ERROR] No embeddings found. Aborting.")
            return
        clf.partial_fit(X_new, y_new, classes=np.array(all_ids))
        centroids = update_centroids(centroids, X_new, y_new)
    else:
        # Class set has changed → retrain from scratch
        print("[INFO] Class mismatch. Performing full retraining.")
        X_all, y_all = get_embeddings_for_ids(all_ids)
        if len(X_all) == 0:
            print("[ERROR] No embeddings found. Aborting.")
            return
        clf = SGDClassifier(loss='log_loss', max_iter=1000)
        clf.fit(X_all, y_all)
        centroids = update_centroids({}, X_all, y_all)

    # 4. Save model
    joblib.dump({'clf': clf, 'centroids': centroids, 'classes': all_ids}, MODEL_PATH)
    print(f"[INFO] Model saved with classes: {all_ids}")

if __name__ == "__main__":
    train_incrementally()
