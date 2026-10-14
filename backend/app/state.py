"""Holds the active dataset, the trained model and analyst activity, and persists them to disk."""

from __future__ import annotations

import json
import logging
import shutil
import threading
import uuid
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Any

import joblib
import numpy as np
import pandas as pd

from app import config, ml
from app.data import fingerprint, load_bytes, load_dataset
from app.features import FEATURE_COLUMNS

log = logging.getLogger(__name__)
ACTIVE_META = config.UPLOAD_DIR / "active.json"
SAMPLE_NAME = "transactions.csv"
OPEN_STATUSES = ("FLAGGED", "PENDING")


class NotFoundError(KeyError):
    pass


class AppState:
    def __init__(self) -> None:
        self._lock = threading.RLock()
        self.df: pd.DataFrame | None = None
        self.bundle: dict[str, Any] | None = None
        self.source: dict[str, Any] = {}

    # ------------------------------------------------------------------ lifecycle
    def startup(self) -> None:
        path, name, kind = self._active_dataset_path()
        try:
            df = load_dataset(path)
        except Exception as exc:  # unreadable upload -> fall back to the bundled sample
            log.warning("Active dataset unusable (%s); falling back to sample data", exc)
            path, name, kind = self._sample_path(), SAMPLE_NAME, "sample"
            df = load_dataset(path)
        self._activate(df, {"filename": name, "kind": kind})

    def _sample_path(self) -> Path:
        if not config.SAMPLE_DATASET.exists():
            from scripts.generate_dataset import generate

            log.info("Sample dataset missing - generating 21,000 transactions")
            config.SAMPLE_DATASET.parent.mkdir(parents=True, exist_ok=True)
            generate(rows=21000, fraud_rate=0.032, seed=42).to_csv(config.SAMPLE_DATASET, index=False)
        return config.SAMPLE_DATASET

    def _active_dataset_path(self) -> tuple[Path, str, str]:
        if ACTIVE_META.exists():
            meta = json.loads(ACTIVE_META.read_text())
            path = config.UPLOAD_DIR / meta["stored_as"]
            if path.exists():
                return path, meta["filename"], "upload"
        return self._sample_path(), SAMPLE_NAME, "sample"

    def _activate(self, df: pd.DataFrame, source: dict[str, Any], force_retrain: bool = False) -> None:
        fp = fingerprint(df)
        bundle = None
        if config.MODEL_PATH.exists() and not force_retrain:
            try:
                cached = joblib.load(config.MODEL_PATH)
                if cached.get("fingerprint") == fp and cached.get("features") == FEATURE_COLUMNS:
                    bundle = cached
            except Exception as exc:  # corrupted / incompatible pickle
                log.warning("Ignoring cached model: %s", exc)
        if bundle is None:
            log.info("Training fraud model on %s rows...", f"{len(df):,}")
            bundle = ml.train(df, cv_folds=config.CV_FOLDS, tuning_iterations=config.TUNING_ITERATIONS)
            bundle["fingerprint"] = fp
            config.MODEL_DIR.mkdir(parents=True, exist_ok=True)
            joblib.dump(bundle, config.MODEL_PATH)
        else:
            log.info("Loaded cached %s model (v%s)", bundle["model_name"], bundle["version"])

        enriched = self._enrich(df, bundle)
        with self._lock:
            self.bundle = bundle
            self.source = {**source, "fingerprint": fp}
            self.df = enriched
            self._replay_runtime()

    def _enrich(self, df: pd.DataFrame, bundle: dict[str, Any]) -> pd.DataFrame:
        """Joins out-of-fold scores and derives each transaction's decision state."""
        out = df.merge(bundle["scores"], on="transaction_id", how="left")
        out["risk_score"] = out["risk_score"].fillna(0.0)
        out["risk_factors"] = out["risk_factors"].apply(lambda f: f if isinstance(f, list) else [])
        thresholds = bundle["thresholds"]
        out["model_decision"] = [ml.status_for(s, thresholds) for s in out["risk_score"]]
        out["status"] = out["model_decision"]
        out["is_fraud"] = out["is_fraud"].astype(float)
        out["source"] = "dataset"

        # Alerts older than the backlog window have already been worked by analysts.
        cutoff = out["timestamp"].max() - pd.Timedelta(days=config.REVIEW_BACKLOG_DAYS)
        resolved = out["status"].isin(OPEN_STATUSES) & (out["timestamp"] < cutoff)
        fraud = out["is_fraud"] == 1
        out["status"] = np.where(resolved & fraud, "BLOCKED", np.where(resolved, "APPROVED", out["status"]))
        delay_hours = (pd.util.hash_pandas_object(out["transaction_id"], index=False) % 30 + 1).astype(int)
        out["reviewed_at"] = pd.Series(pd.NaT, index=out.index, dtype="datetime64[ns, UTC]")
        out.loc[resolved, "reviewed_at"] = out.loc[resolved, "timestamp"] + pd.to_timedelta(
            delay_hours[resolved], unit="h"
        )
        out["review_note"] = np.where(
            resolved & fraud, "Confirmed fraud - card blocked",
            np.where(resolved, "Verified with customer - false positive", None),
        )
        out.index = out["transaction_id"].to_numpy()
        return out

    # ------------------------------------------------------------------ runtime persistence
    def _runtime_file(self, kind: str) -> Path:
        return config.STATE_DIR / f"{self.source['fingerprint']}-{kind}"

    def _replay_runtime(self) -> None:
        ingested = self._runtime_file("ingested.jsonl")
        if ingested.exists():
            rows = [json.loads(line) for line in ingested.read_text().splitlines() if line.strip()]
            if rows:
                live = pd.DataFrame(rows)
                for col in ["timestamp", "reviewed_at"]:
                    live[col] = pd.to_datetime(live[col], utc=True)
                live.index = live["transaction_id"].to_numpy()
                self.df = pd.concat([self.df, live[self.df.columns]])
        reviews = self._runtime_file("reviews.json")
        if reviews.exists():
            for tx_id, r in json.loads(reviews.read_text()).items():
                if tx_id in self.df.index:
                    self._apply_review(tx_id, r)

    def _apply_review(self, tx_id: str, r: dict[str, Any]) -> None:
        self.df.loc[tx_id, "status"] = r["status"]
        self.df.loc[tx_id, "review_note"] = r.get("note")
        self.df.loc[tx_id, "reviewed_at"] = pd.Timestamp(r["reviewed_at"])
        if pd.isna(self.df.loc[tx_id, "is_fraud"]):
            self.df.loc[tx_id, "is_fraud"] = 1.0 if r["status"] == "BLOCKED" else 0.0

    # ------------------------------------------------------------------ actions
    def get(self, tx_id: str) -> pd.Series:
        if self.df is None or tx_id not in self.df.index:
            raise NotFoundError(tx_id)
        return self.df.loc[tx_id]

    def explain(self, tx_id: str) -> list[dict[str, Any]]:
        row = self.get(tx_id)
        _, contributions = ml.score_records(self.bundle, row.to_frame().T.reset_index(drop=True))
        return contributions[0]

    def review(self, tx_id: str, decision: str, note: str | None) -> pd.Series:
        with self._lock:
            self.get(tx_id)
            r = {
                "status": "BLOCKED" if decision == "block" else "APPROVED",
                "note": note or ("Confirmed fraud" if decision == "block" else "Cleared by analyst"),
                "reviewed_at": datetime.now(timezone.utc).isoformat(),
            }
            self._apply_review(tx_id, r)
            path = self._runtime_file("reviews.json")
            path.parent.mkdir(parents=True, exist_ok=True)
            existing = json.loads(path.read_text()) if path.exists() else {}
            existing[tx_id] = r
            path.write_text(json.dumps(existing))
            return self.df.loc[tx_id]

    def behavioural_context(self, tx: dict[str, Any], now: pd.Timestamp) -> dict[str, Any]:
        """Derives velocity / account / device features from the customer's history."""
        hist = self.df[(self.df["customer_id"] == tx["customer_id"]) & (self.df["timestamp"] <= now)]
        ctx: dict[str, Any] = {
            "txn_count_1h": int((hist["timestamp"] > now - pd.Timedelta(hours=1)).sum()),
            "txn_count_24h": int((hist["timestamp"] > now - pd.Timedelta(hours=24)).sum()),
        }
        if hist.empty:
            ctx.update(account_age_days=0, amount_to_avg_ratio=1.0, home_country=tx.get("country"))
        else:
            last = hist.iloc[-1]
            recent = hist[hist["timestamp"] > now - pd.Timedelta(days=30)]
            avg = (recent if len(recent) else hist)["amount"].mean()
            ctx.update(
                account_age_days=float(last["account_age_days"]) + (now - last["timestamp"]).days,
                amount_to_avg_ratio=round(float(tx["amount"]) / avg, 3) if avg else 1.0,
                home_country=last["home_country"],
            )
        device = tx.get("device_id")
        seen = hist[hist["device_id"] == device] if device else hist.iloc[0:0]
        if seen.empty:
            ctx.update(is_new_device=True, device_age_days=0)
        else:
            first = seen.iloc[0]
            ctx.update(
                is_new_device=False,
                device_age_days=float(first["device_age_days"]) + (now - first["timestamp"]).days,
            )
        return ctx

    def ingest(self, tx: dict[str, Any]) -> tuple[pd.Series, list[dict[str, Any]]]:
        """Scores a new transaction against live history and adds it to the dataset."""
        with self._lock:
            ts = pd.Timestamp(tx.get("timestamp") or datetime.now(timezone.utc))
            now = ts.tz_localize("UTC") if ts.tzinfo is None else ts.tz_convert("UTC")
            ctx = self.behavioural_context(tx, now)
            # Explicit values (e.g. device-intelligence signals) win over derived ones.
            merged = {**ctx, **{k: v for k, v in tx.items() if v is not None}, "timestamp": now}
            merged["transaction_id"] = f"LIVE-{uuid.uuid4().hex[:10].upper()}"
            record = ml.complete_record(self.bundle, merged)
            raw = pd.DataFrame([record])
            scores, contributions = ml.score_records(self.bundle, raw)
            score = float(scores[0])
            status = ml.status_for(score, self.bundle["thresholds"])
            row = {
                **record,
                "fraud_scenario": None,
                "is_fraud": np.nan,
                "risk_score": score,
                "risk_factors": ml.top_factors(contributions[0]),
                "model_decision": status,
                "status": status,
                "source": "live",
                "reviewed_at": pd.NaT,
                "review_note": None,
            }
            new = pd.DataFrame([row])
            new["reviewed_at"] = pd.to_datetime(new["reviewed_at"], utc=True)
            new.index = new["transaction_id"].to_numpy()
            self.df = pd.concat([self.df, new[self.df.columns]])

            path = self._runtime_file("ingested.jsonl")
            path.parent.mkdir(parents=True, exist_ok=True)
            serialisable = {
                k: (v.isoformat() if isinstance(v, pd.Timestamp) else None if v is pd.NaT else v)
                for k, v in row.items()
            }
            serialisable["is_fraud"] = None
            with path.open("a") as fh:
                fh.write(json.dumps(serialisable, default=str) + "\n")
            return self.df.loc[row["transaction_id"]], contributions[0]

    def simulate(self, tx: dict[str, Any]) -> tuple[float, str, list[dict[str, Any]]]:
        record = ml.complete_record(self.bundle, tx)
        scores, contributions = ml.score_records(self.bundle, pd.DataFrame([record]))
        score = float(scores[0])
        return score, ml.status_for(score, self.bundle["thresholds"]), contributions[0]

    def upload(self, content: bytes, filename: str) -> None:
        df = load_bytes(content, filename)
        config.UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
        stored_as = "active" + Path(filename).suffix.lower()
        for old in config.UPLOAD_DIR.glob("active.*"):
            if old.name != "active.json":
                old.unlink()
        (config.UPLOAD_DIR / stored_as).write_bytes(content)
        ACTIVE_META.write_text(json.dumps({"filename": filename, "stored_as": stored_as}))
        self._activate(df, {"filename": filename, "kind": "upload"})

    def reset_to_sample(self) -> None:
        if config.UPLOAD_DIR.exists():
            shutil.rmtree(config.UPLOAD_DIR)
        self._activate(load_dataset(self._sample_path()), {"filename": SAMPLE_NAME, "kind": "sample"})

    def reset_activity(self) -> None:
        """Drops live-ingested transactions and analyst reviews for the active dataset."""
        for kind in ("ingested.jsonl", "reviews.json"):
            self._runtime_file(kind).unlink(missing_ok=True)
        base = self.df[self.df["source"] == "dataset"].drop(
            columns=["risk_score", "risk_factors", "model_decision", "status", "source", "reviewed_at", "review_note"]
        )
        with self._lock:
            self.df = self._enrich(base.reset_index(drop=True), self.bundle)

    def retrain(self) -> None:
        assert self.df is not None
        base = self.df[self.df["source"] == "dataset"]
        cols = [c for c in base.columns if c not in {
            "risk_score", "risk_factors", "model_decision", "status", "source", "reviewed_at", "review_note"
        }]
        meta = {k: v for k, v in self.source.items() if k != "fingerprint"}
        self._activate(base[cols].reset_index(drop=True), meta, force_retrain=True)


state = AppState()
