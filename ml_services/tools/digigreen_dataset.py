"""
KisanSathi AI - Digital Green Crop Disease Dataset Integration Utility
Dataset: DigiGreen/Crop_Disease_Images (Hugging Face)
Author: Digital Green / Farmer.Chat
"""

import sys
from collections import Counter
from typing import Dict, Any, List

def load_digigreen_dataset(split: str = "train", streaming: bool = False):
    """
    Loads the Digital Green Crop Disease Images dataset from Hugging Face.
    """
    try:
        from datasets import load_dataset
        print(f"Loading 'DigiGreen/Crop_Disease_Images' (split='{split}', streaming={streaming})...")
        ds = load_dataset("DigiGreen/Crop_Disease_Images", split=split, streaming=streaming)
        return ds
    except Exception as e:
        print(f"Error loading dataset: {e}")
        return None

def analyze_dataset(ds) -> Dict[str, Any]:
    """
    Analyzes crop and pathology distributions in the dataset.
    """
    crops = Counter()
    diagnoses = Counter()
    states = Counter()
    total = 0

    for item in ds:
        total += 1
        crops[item.get("crop", "Unknown")] += 1
        diagnoses[item.get("diagnosis", "Unknown")] += 1
        states[item.get("state", "Unknown")] += 1

    summary = {
        "total_records": total,
        "unique_crops": len(crops),
        "unique_diagnoses": len(diagnoses),
        "top_crops": crops.most_common(12),
        "top_diagnoses": diagnoses.most_common(12),
        "states_represented": states.most_common(10)
    }
    return summary

def print_summary(summary: Dict[str, Any]):
    print("=" * 60)
    print("[Digital Green] Crop Disease Images Dataset Summary")
    print("=" * 60)
    print(f"Total Annotated Records : {summary['total_records']}")
    print(f"Unique Crops Covered   : {summary['unique_crops']}")
    print(f"Unique Diagnoses       : {summary['unique_diagnoses']}")
    print("\n* Top Indian States:")
    for state, cnt in summary["states_represented"]:
        print(f"  - {state:18}: {cnt:4} records")
    print("\n* Top Crops:")
    for crop, cnt in summary["top_crops"]:
        print(f"  - {crop:18}: {cnt:4} records")
    print("\n* Top Diagnoses & Conditions:")
    for diag, cnt in summary["top_diagnoses"]:
        print(f"  - {diag:24}: {cnt:4} records")
    print("=" * 60)

if __name__ == "__main__":
    split_name = sys.argv[1] if len(sys.argv) > 1 else "train"
    ds = load_digigreen_dataset(split=split_name)
    if ds is not None:
        stats = analyze_dataset(ds)
        print_summary(stats)
