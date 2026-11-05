"""
KisanSathi AI - PlantVillage Training Engine
Dataset: fatemehENG/plantvillage-full (Hugging Face)
Crops: Apple, Corn (Maize), Grape, Pepper, Potato, Tomato, Strawberry, Cherry, Peach, Orange, etc.
Classes: 38 Crop Health & Pathology Classes
"""

import os
import sys
import json
import time
import argparse
import requests
import io
import numpy as np
from PIL import Image
from collections import Counter
from typing import List, Tuple, Dict, Any

try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass

try:
    import joblib
    from sklearn.ensemble import HistGradientBoostingClassifier, RandomForestClassifier
    from sklearn.model_selection import train_test_split
    from sklearn.metrics import accuracy_score
except ImportError:
    print("Error: 'scikit-learn' or 'joblib' is missing. Install with: pip install scikit-learn joblib", flush=True)
    sys.exit(1)

MODEL_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "models")
os.makedirs(MODEL_DIR, exist_ok=True)
MODEL_SAVE_PATH = os.path.join(MODEL_DIR, "plantvillage_model.joblib")
LABEL_SAVE_PATH = os.path.join(MODEL_DIR, "plantvillage_labels.json")

def extract_features_from_pil(img: Image.Image) -> np.ndarray:
    """
    Extracts a 64-dimensional Computer Vision feature vector from foliage image:
    - RGB & HSV color moments (mean, std, skewness)
    - Vegetation health index (NDVI-proxy, Chlorosis, Necrosis)
    - 16-bin Hue and Saturation histograms
    - 4-quadrant spatial distribution of lesions
    """
    img_rgb = img.convert("RGB").resize((128, 128))
    arr = np.array(img_rgb, dtype=np.float32) / 255.0

    r, g, b = arr[:, :, 0], arr[:, :, 1], arr[:, :, 2]

    # RGB stats
    rgb_means = [np.mean(r), np.mean(g), np.mean(b)]
    rgb_stds = [np.std(r), np.std(g), np.std(b)]

    # Normalized vegetation indices
    ndvi_proxy = np.mean((g - r) / (g + r + 1e-6))
    yellow_ratio = np.mean((r > 0.45) & (g > 0.40) & (b < 0.35))
    brown_ratio = np.mean((r > g) & (g > b) & (b < 0.35))
    white_mold_ratio = np.mean((r > 0.78) & (g > 0.78) & (b > 0.78))

    # HSV color space
    hsv = img_rgb.convert("HSV")
    hsv_arr = np.array(hsv, dtype=np.float32) / 255.0
    h_channel = hsv_arr[:, :, 0]
    s_channel = hsv_arr[:, :, 1]
    v_channel = hsv_arr[:, :, 2]

    h_hist, _ = np.histogram(h_channel, bins=16, range=(0, 1))
    s_hist, _ = np.histogram(s_channel, bins=16, range=(0, 1))
    v_hist, _ = np.histogram(v_channel, bins=16, range=(0, 1))

    # Spatial lesion distribution (4 quadrants)
    h_half, w_half = 64, 64
    quads = [
        arr[:h_half, :w_half, :],
        arr[:h_half, w_half:, :],
        arr[h_half:, :w_half, :],
        arr[h_half:, w_half:, :]
    ]
    quad_greens = [np.mean(q[:, :, 1]) for q in quads]
    quad_browns = [np.mean((q[:, :, 0] > q[:, :, 1])) for q in quads]

    feat = np.concatenate([
        rgb_means,
        rgb_stds,
        [ndvi_proxy, yellow_ratio, brown_ratio, white_mold_ratio],
        h_hist / (np.sum(h_hist) + 1e-6),
        s_hist / (np.sum(s_hist) + 1e-6),
        v_hist / (np.sum(v_hist) + 1e-6),
        quad_greens,
        quad_browns
    ]).astype(np.float32)

    return feat

def train_via_hf_dataset(target_samples: int = 200, use_local_load: bool = False):
    """
    Executes training on PlantVillage dataset.
    """
    print("=" * 65, flush=True)
    print("[PlantVillage] KisanSathi Plant Disease Model Training", flush=True)
    print(f"Dataset : fatemehENG/plantvillage-full (Hugging Face)", flush=True)
    print(f"Target  : ~{target_samples} balanced samples", flush=True)
    print("=" * 65, flush=True)

    start_time = time.time()
    X_list = []
    y_list = []
    class_counts = Counter()

    hf_token = os.getenv("HF_TOKEN") or os.getenv("HUGGINGFACE_API_KEY")
    headers = {"Authorization": f"Bearer {hf_token}"} if hf_token else {}

    if use_local_load:
        print("Loading full dataset locally via 'datasets.load_dataset'...", flush=True)
        from datasets import load_dataset
        ds = load_dataset("fatemehENG/plantvillage-full", split="train", token=hf_token)
        print(f"Loaded {len(ds)} raw samples. Extracting features...", flush=True)
        max_per_class = max(10, target_samples // 38)
        for row in ds:
            lbl = row.get("class_label") or f"{row.get('host')}___{row.get('disease')}"
            if class_counts[lbl] >= max_per_class:
                continue
            raw_img = row.get("image")
            if raw_img is None:
                continue
            try:
                feats = extract_features_from_pil(raw_img)
                X_list.append(feats)
                y_list.append(lbl)
                class_counts[lbl] += 1
                if len(X_list) >= target_samples:
                    break
            except Exception:
                continue
    else:
        # Balanced sampling across the known class clusters in PlantVillage
        class_clusters = [
            0,      # Apple Scab
            1000,   # Apple Black Rot
            2000,   # Apple Cedar Rust
            3000,   # Apple Healthy
            5000,   # Cherry Powdery Mildew
            6500,   # Cherry Healthy
            8000,   # Corn Gray Leaf Spot
            9500,   # Corn Common Rust
            11000,  # Corn Northern Leaf Blight
            12500,  # Corn Healthy
            14000,  # Grape Black Rot
            15000,  # Orange Haunglongbing (Citrus Greening)
            18500,  # Peach Bacterial Spot
            21000,  # Pepper Bacterial Spot
            24000,  # Pepper Healthy
            27000,  # Potato Early Blight
            28500,  # Potato Late Blight
            29500,  # Potato Healthy
            31500,  # Squash Powdery Mildew
            34000,  # Strawberry Leaf Scorch
            37000,  # Tomato Bacterial Spot
            39500,  # Tomato Early Blight
            42000,  # Tomato Late Blight
            44500,  # Tomato Leaf Mold
            47000,  # Tomato Septoria Leaf Spot
            49500,  # Tomato Spider Mites
            52000,  # Tomato Yellow Leaf Curl Virus
            53500   # Tomato Mosaic Virus / Healthy
        ]

        per_cluster = max(6, target_samples // len(class_clusters))
        print(f"Sampling {per_cluster} images from {len(class_clusters)} crop pathology clusters...", flush=True)

        for cluster_off in class_clusters:
            try:
                url = f"https://datasets-server.huggingface.co/rows?dataset=fatemehENG/plantvillage-full&config=default&split=train&offset={cluster_off}&limit={per_cluster * 2}"
                resp = requests.get(url, headers=headers, timeout=12)
                if resp.status_code != 200:
                    continue
                rows = resp.json().get("rows", [])
                cluster_added = 0
                for row_obj in rows:
                    if cluster_added >= per_cluster:
                        break
                    item = row_obj.get("row", {})
                    lbl = item.get("class_label") or f"{item.get('host')}___{item.get('disease')}"

                    img_field = item.get("image", {})
                    src_url = img_field.get("src") if isinstance(img_field, dict) else None
                    if not src_url:
                        continue

                    try:
                        img_resp = requests.get(src_url, timeout=6)
                        if img_resp.status_code == 200:
                            pil_img = Image.open(io.BytesIO(img_resp.content)).convert("RGB")
                            feats = extract_features_from_pil(pil_img)
                            X_list.append(feats)
                            y_list.append(lbl)
                            class_counts[lbl] += 1
                            cluster_added += 1
                    except Exception:
                        continue

                print(f"  [Cluster @ {cluster_off:5d}] Added {cluster_added} images. Total collected: {len(X_list)}...", flush=True)
            except Exception as e:
                continue

    if len(X_list) < 15:
        print("Error: Could not retrieve sufficient training samples.", flush=True)
        return False

    print(f"\nFeature extraction complete: {len(X_list)} samples across {len(class_counts)} classes in {round(time.time() - start_time, 1)}s", flush=True)

    X = np.array(X_list, dtype=np.float32)
    y = np.array(y_list)

    classes = sorted(list(set(y)))
    label_to_idx = {c: i for i, c in enumerate(classes)}
    idx_to_label = {i: c for i, c in enumerate(classes)}
    y_encoded = np.array([label_to_idx[lbl] for lbl in y])

    X_train, X_test, y_train, y_test = train_test_split(
        X, y_encoded, test_size=0.2, random_state=42
    )

    print(f"Training Multiclass Classifier on {len(X_train)} samples across {len(classes)} classes...", flush=True)
    clf = HistGradientBoostingClassifier(
        max_iter=100,
        learning_rate=0.08,
        max_leaf_nodes=31,
        random_state=42
    )
    t_start = time.time()
    clf.fit(X_train, y_train)
    print(f"Classifier trained in {round(time.time() - t_start, 2)}s!", flush=True)

    y_pred = clf.predict(X_test)
    acc = accuracy_score(y_test, y_pred)
    print(f"Top-1 Test Accuracy: {acc * 100:.2f}%", flush=True)

    # Save model and metadata
    joblib.dump(clf, MODEL_SAVE_PATH)
    meta = {
        "classes": classes,
        "label_to_idx": label_to_idx,
        "idx_to_label": idx_to_label,
        "num_classes": len(classes),
        "dataset": "fatemehENG/plantvillage-full",
        "trained_samples": len(X),
        "test_accuracy": round(float(acc * 100), 2),
        "trained_at": time.strftime("%Y-%m-%d %H:%M:%S")
    }
    with open(LABEL_SAVE_PATH, "w", encoding="utf-8") as f:
        json.dump(meta, f, indent=2)

    print(f"Model saved to : {MODEL_SAVE_PATH}", flush=True)
    print(f"Labels saved to: {LABEL_SAVE_PATH}", flush=True)
    print("=" * 65, flush=True)
    print("SUCCESS: KisanSathi plant disease model is trained and ready!", flush=True)
    print("=" * 65, flush=True)
    return True

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Train model on PlantVillage Full")
    parser.add_argument("--samples", type=int, default=150, help="Target number of balanced samples")
    parser.add_argument("--local", action="store_true", help="Use local datasets.load_dataset (downloads full 855MB)")
    args = parser.parse_args()

    train_via_hf_dataset(target_samples=args.samples, use_local_load=args.local)
