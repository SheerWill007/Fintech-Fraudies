from __future__ import annotations

import os
from pathlib import Path

BACKEND_DIR = Path(__file__).resolve().parents[1]

DATA_DIR = Path(os.getenv("FF_DATA_DIR", BACKEND_DIR / "data"))
MODEL_DIR = Path(os.getenv("FF_MODEL_DIR", BACKEND_DIR / "models"))

SAMPLE_DATASET = DATA_DIR / "transactions.csv"
UPLOAD_DIR = DATA_DIR / "uploads"
STATE_DIR = DATA_DIR / "runtime"  # analyst reviews + live-ingested transactions
MODEL_PATH = MODEL_DIR / "model.joblib"

MAX_UPLOAD_MB = int(os.getenv("FF_MAX_UPLOAD_MB", "100"))
CORS_ORIGINS = [
    o.strip()
    for o in os.getenv("FF_CORS_ORIGINS", "http://localhost:3000,http://127.0.0.1:3000").split(",")
    if o.strip()
]
# Optional regex so Vercel preview deployments (https://<project>-<hash>.vercel.app) work too.
CORS_ORIGIN_REGEX = os.getenv("FF_CORS_ORIGIN_REGEX") or None

# Training budget. Lower these on very small hosts; the defaults train in about a minute.
CV_FOLDS = int(os.getenv("FF_CV_FOLDS", "5"))
TUNING_ITERATIONS = int(os.getenv("FF_TUNING_ITERATIONS", "12"))

# Alerts older than this (relative to the newest transaction) are treated as already
# reviewed by an analyst when a dataset is loaded, so the queue holds recent work only.
REVIEW_BACKLOG_DAYS = int(os.getenv("FF_REVIEW_BACKLOG_DAYS", "10"))

PORT = int(os.getenv("PORT", "8000"))
