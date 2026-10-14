"""FastAPI backend for the Fraudies fraud-monitoring dashboard.

Run from the `backend/` folder:
    uvicorn app.main:app --reload

For production (Render):
    uvicorn app.main:app --host 0.0.0.0 --port $PORT
"""

from __future__ import annotations

import logging
from contextlib import asynccontextmanager
from datetime import date
from typing import Any, Literal, Optional

import numpy as np
import pandas as pd
from fastapi import Depends, FastAPI, File, HTTPException, Query, UploadFile
from fastapi.middleware.cors import CORSMiddleware

from app import analytics, config
from app.data import REQUIRED_COLUMNS, DatasetError, Filters
from app.schemas import ReviewRequest, ScoreRequest, TransactionCreate
from app.state import NotFoundError, state

logging.basicConfig(level=logging.INFO, format="%(levelname)s %(name)s: %(message)s")


@asynccontextmanager
async def lifespan(_: FastAPI):
    state.startup()
    yield


app = FastAPI(
    title="Fraudies API",
    version="2.0.0",
    description="Real-time fraud scoring, alert review and portfolio analytics.",
    lifespan=lifespan,
)
app.add_middleware(
    CORSMiddleware,
    allow_origins=config.CORS_ORIGINS,
    allow_origin_regex=config.CORS_ORIGIN_REGEX,
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ------------------------------------------------------------------ helpers
def get_filters(
    start: Optional[date] = None,
    end: Optional[date] = None,
    type: list[str] = Query(default_factory=list),
    channel: list[str] = Query(default_factory=list),
    category: list[str] = Query(default_factory=list),
    country: list[str] = Query(default_factory=list),
) -> Filters:
    return Filters(start=start, end=end, types=type, channels=channel, categories=category, countries=country)


def _df() -> pd.DataFrame:
    if state.df is None:
        raise HTTPException(503, "Dataset not loaded yet")
    return state.df


def _clean(value: Any) -> Any:
    if isinstance(value, pd.Timestamp):
        return None if pd.isna(value) else value.isoformat()
    if isinstance(value, (np.integer,)):
        return int(value)
    if isinstance(value, (np.floating, float)):
        return None if np.isnan(value) else round(float(value), 4)
    if isinstance(value, (list, np.ndarray)):
        return list(value)
    if value is None or value is pd.NaT or (not isinstance(value, str) and pd.isna(value)):
        return None
    return value


def tx_out(row: pd.Series) -> dict[str, Any]:
    out = {k: _clean(v) for k, v in row.items()}
    for key in ("is_new_device", "is_vpn"):
        out[key] = bool(out[key]) if out.get(key) is not None else None
    if out.get("is_fraud") is not None:
        out["is_fraud"] = bool(out["is_fraud"])
    return out


def _page(df: pd.DataFrame, page: int, page_size: int) -> dict[str, Any]:
    total = len(df)
    chunk = df.iloc[(page - 1) * page_size : page * page_size]
    return {
        "rows": [tx_out(r) for _, r in chunk.iterrows()],
        "total": total,
        "page": page,
        "page_size": page_size,
        "pages": max(1, -(-total // page_size)),
    }


def _model_payload() -> dict[str, Any]:
    b = state.bundle
    return {
        "model": b["model_name"],
        "version": b["version"],
        "trained_at": b["trained_at"],
        "thresholds": b["thresholds"],
        "metrics": b["metrics"],
    }


# ------------------------------------------------------------------ health & dataset
@app.get("/api/health", tags=["system"])
def health() -> dict[str, Any]:
    return {
        "status": "ok",
        "model_loaded": state.bundle is not None,
        "model": state.bundle["model_name"] if state.bundle else None,
        "rows": int(len(state.df)) if state.df is not None else 0,
    }


@app.get("/api/dataset", tags=["dataset"])
def dataset_info() -> dict[str, Any]:
    df = _df()
    base = df[df["source"] == "dataset"]
    return {
        **state.source,
        "rows": int(len(base)),
        "live_rows": int((df["source"] == "live").sum()),
        "fraud_rows": int((base["is_fraud"] == 1).sum()),
        "customers": int(base["customer_id"].nunique()),
        "min_date": base["timestamp"].min().isoformat(),
        "max_date": base["timestamp"].max().isoformat(),
        "required_columns": REQUIRED_COLUMNS,
        "preview": [tx_out(r) for _, r in base.head(8).iterrows()],
    }


@app.post("/api/dataset/upload", tags=["dataset"])
async def upload_dataset(file: UploadFile = File(...)) -> dict[str, Any]:
    """Replace the active dataset with a CSV/XLSX that follows the schema in `GET /api/dataset`,
    then retrain the model on it."""
    filename = file.filename or "upload.csv"
    if not filename.lower().endswith((".csv", ".xlsx", ".xls")):
        raise HTTPException(400, "Invalid file type. Upload a .csv or .xlsx file.")
    max_bytes = config.MAX_UPLOAD_MB * 1024 * 1024
    chunks, size = [], 0
    while chunk := await file.read(1 << 20):
        size += len(chunk)
        if size > max_bytes:
            raise HTTPException(413, f"File too large (max {config.MAX_UPLOAD_MB} MB)")
        chunks.append(chunk)
    try:
        state.upload(b"".join(chunks), filename)
    except DatasetError as exc:
        raise HTTPException(422, str(exc)) from exc
    return {"dataset": dataset_info(), "model": _model_payload()}


@app.post("/api/dataset/reset", tags=["dataset"])
def reset_dataset() -> dict[str, Any]:
    """Switch back to the bundled 21,000-row sample dataset."""
    state.reset_to_sample()
    return {"dataset": dataset_info(), "model": _model_payload()}


@app.post("/api/dataset/reset-activity", tags=["dataset"])
def reset_activity() -> dict[str, Any]:
    """Discard live-ingested transactions and analyst reviews."""
    state.reset_activity()
    return dataset_info()


@app.get("/api/filters", tags=["analytics"])
def filters() -> dict[str, Any]:
    return analytics.filter_options(_df())


# ------------------------------------------------------------------ analytics
@app.get("/api/overview", tags=["analytics"])
def overview(f: Filters = Depends(get_filters)) -> dict[str, Any]:
    return analytics.overview(f.apply(_df()), state.bundle["thresholds"])


@app.get("/api/analytics/timeseries", tags=["analytics"])
def timeseries(
    bucket: Literal["day", "week", "month"] = "day", f: Filters = Depends(get_filters)
) -> list[dict[str, Any]]:
    return analytics.timeseries(f.apply(_df()), bucket, state.bundle["thresholds"])


@app.get("/api/analytics/breakdown", tags=["analytics"])
def breakdown(
    dimension: Literal["type", "channel", "category", "country"] = "category",
    f: Filters = Depends(get_filters),
) -> list[dict[str, Any]]:
    return analytics.breakdown(f.apply(_df()), dimension)


@app.get("/api/analytics/hourly", tags=["analytics"])
def hourly(f: Filters = Depends(get_filters)) -> list[dict[str, Any]]:
    return analytics.hourly(f.apply(_df()))


@app.get("/api/analytics/risk-distribution", tags=["analytics"])
def risk_distribution(f: Filters = Depends(get_filters)) -> list[dict[str, Any]]:
    return analytics.risk_distribution(f.apply(_df()))


@app.get("/api/analytics/top-customers", tags=["analytics"])
def top_customers(limit: int = Query(10, ge=1, le=50), f: Filters = Depends(get_filters)) -> list[dict[str, Any]]:
    return analytics.top_customers(f.apply(_df()), limit)


# ------------------------------------------------------------------ transactions
@app.get("/api/transactions", tags=["transactions"])
def list_transactions(
    f: Filters = Depends(get_filters),
    status: list[str] = Query(default_factory=list),
    label: Optional[Literal["fraud", "legit", "unknown"]] = None,
    source: Optional[Literal["dataset", "live"]] = None,
    min_risk: float = Query(0, ge=0, le=1),
    max_risk: float = Query(1, ge=0, le=1),
    search: Optional[str] = None,
    sort: Literal["timestamp", "amount", "risk_score"] = "timestamp",
    order: Literal["asc", "desc"] = "desc",
    page: int = Query(1, ge=1),
    page_size: int = Query(25, ge=1, le=200),
) -> dict[str, Any]:
    df = f.apply(_df())
    df = df[(df["risk_score"] >= min_risk) & (df["risk_score"] <= max_risk)]
    if status:
        df = df[df["status"].isin([s.upper() for s in status])]
    if label == "fraud":
        df = df[df["is_fraud"] == 1]
    elif label == "legit":
        df = df[df["is_fraud"] == 0]
    elif label == "unknown":
        df = df[df["is_fraud"].isna()]
    if source:
        df = df[df["source"] == source]
    if search:
        q = search.strip().lower()
        hay = (
            df["transaction_id"].str.lower() + " " + df["customer_id"].str.lower() + " "
            + df["ip_address"].fillna("").astype(str) + " " + df["device_id"].fillna("").astype(str).str.lower()
        )
        df = df[hay.str.contains(q, regex=False)]
    df = df.sort_values(sort, ascending=order == "asc", kind="stable")
    return _page(df, page, page_size)


@app.get("/api/transactions/{tx_id}", tags=["transactions"])
def get_transaction(tx_id: str) -> dict[str, Any]:
    try:
        row = state.get(tx_id)
    except NotFoundError as exc:
        raise HTTPException(404, f"Transaction {tx_id} not found") from exc
    df = _df()
    history = df[(df["customer_id"] == row["customer_id"]) & (df["transaction_id"] != tx_id)]
    history = history.sort_values("timestamp", ascending=False).head(10)
    return {
        "transaction": tx_out(row),
        "contributions": state.explain(tx_id),
        "customer_history": [tx_out(r) for _, r in history.iterrows()],
    }


@app.post("/api/transactions", tags=["transactions"], status_code=201)
def create_transaction(body: TransactionCreate) -> dict[str, Any]:
    """Ingest and score a transaction in real time. Behavioural features are derived
    from the customer's history; the decision is APPROVED, PENDING or FLAGGED."""
    row, contributions = state.ingest(body.model_dump())
    return {"transaction": tx_out(row), "contributions": contributions}


@app.post("/api/transactions/{tx_id}/review", tags=["alerts"])
def review_transaction(tx_id: str, body: ReviewRequest) -> dict[str, Any]:
    try:
        row = state.review(tx_id, body.decision, body.note)
    except NotFoundError as exc:
        raise HTTPException(404, f"Transaction {tx_id} not found") from exc
    return tx_out(row)


@app.get("/api/alerts", tags=["alerts"])
def alerts(
    view: Literal["open", "resolved"] = "open",
    status: Optional[Literal["FLAGGED", "PENDING"]] = None,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
) -> dict[str, Any]:
    df = _df()
    open_mask = df["status"].isin(["FLAGGED", "PENDING"])
    if view == "open":
        rows = df[open_mask]
        if status:
            rows = rows[rows["status"] == status]
        rows = rows.sort_values(["risk_score", "timestamp"], ascending=False)
    else:
        rows = df[df["reviewed_at"].notna()].sort_values("reviewed_at", ascending=False)
    resolved = df[df["reviewed_at"].notna()]
    return {
        **_page(rows, page, page_size),
        "counts": {
            "flagged": int((df["status"] == "FLAGGED").sum()),
            "pending": int((df["status"] == "PENDING").sum()),
            "resolved": int(len(resolved)),
            "blocked": int((resolved["status"] == "BLOCKED").sum()),
            "cleared": int((resolved["status"] == "APPROVED").sum()),
            "open_exposure": round(float(df.loc[open_mask, "amount"].sum()), 2),
        },
    }


# ------------------------------------------------------------------ model
@app.get("/api/model", tags=["model"])
def model_info() -> dict[str, Any]:
    """Selected model, benchmark against the other candidates, hold-out metrics and curves."""
    return _model_payload()


@app.post("/api/model/score", tags=["model"])
def score(body: ScoreRequest) -> dict[str, Any]:
    """What-if scoring for the simulator. Nothing is stored."""
    risk, status, contributions = state.simulate(body.model_dump())
    return {
        "risk_score": risk,
        "status": status,
        "contributions": contributions,
        "factors": [c["label"] for c in contributions if c["contribution"] >= 0.15][:5],
        "thresholds": state.bundle["thresholds"],
    }


@app.post("/api/model/retrain", tags=["model"])
def retrain() -> dict[str, Any]:
    """Re-run the full benchmark and retrain on the active dataset (takes ~1 minute)."""
    state.retrain()
    return _model_payload()
