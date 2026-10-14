"""
Generates the sample dataset if needed, benchmarks the candidate models and
caches the winner in models/model.joblib - exactly what the API does on first
start. Run it at build time (Render build command) so the server boots instantly.

Usage (from backend/):
    python -m scripts.train            # train only if the cached model is stale
    python -m scripts.train --force    # always retrain
"""

from __future__ import annotations

import argparse
import logging

from app import config
from app.state import AppState


def main() -> None:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--force", action="store_true", help="retrain even if a cached model matches the data")
    args = ap.parse_args()
    logging.basicConfig(level=logging.INFO, format="%(message)s")

    if args.force:
        config.MODEL_PATH.unlink(missing_ok=True)
    state = AppState()
    state.startup()

    m = state.bundle["metrics"]
    print(f"\nDataset: {m['dataset']['rows']:,} rows, {m['dataset']['fraud_rate']:.2%} fraud")
    print(f"{'model':22s} {'cv PR-AUC':>9s} {'PR-AUC':>7s} {'ROC-AUC':>7s} {'F1':>6s} {'recall':>6s}")
    for r in m["comparison"]:
        print(f"{r['model']:22s} {r['cv_pr_auc']:9.4f} {r['pr_auc']:7.4f} {r['roc_auc']:7.4f} "
              f"{r['f1']:6.3f} {r['recall']:6.3f}")
    t = m["test"]
    print(f"\nSelected: {m['selected_model']} (tuned CV PR-AUC {m['tuned_cv_pr_auc']:.4f})")
    print(f"Out-of-time test: PR-AUC {t['pr_auc']:.4f} | ROC-AUC {t['roc_auc']:.4f} | "
          f"precision {t['precision']:.3f} | recall {t['recall']:.3f} | F1 {t['f1']:.3f}")
    print(f"Thresholds: flag >= {m['thresholds']['flag']} | review >= {m['thresholds']['review']}")


if __name__ == "__main__":
    main()
