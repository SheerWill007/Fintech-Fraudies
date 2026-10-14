"""Aggregations behind the dashboard. Every function takes an already-filtered frame."""

from __future__ import annotations

from typing import Any

import numpy as np
import pandas as pd

CAUGHT_STATUSES = ("FLAGGED", "PENDING", "BLOCKED")
DIMENSIONS = {"type": "type", "channel": "channel", "category": "merchant_category", "country": "country"}


def _f(x: Any, digits: int = 2) -> float:
    return round(float(x), digits) if pd.notna(x) else 0.0


def _window(df: pd.DataFrame, end: pd.Timestamp, days: int, offset: int = 0) -> pd.DataFrame:
    hi = end - pd.Timedelta(days=offset)
    return df[(df["timestamp"] > hi - pd.Timedelta(days=days)) & (df["timestamp"] <= hi)]


def _kpis(df: pd.DataFrame) -> dict[str, float]:
    fraud = df["is_fraud"] == 1
    n = len(df)
    return {
        "transactions": int(n),
        "volume": _f(df["amount"].sum()),
        "fraud_count": int(fraud.sum()),
        "fraud_rate": _f(fraud.mean() if n else 0, 4),
        "fraud_amount": _f(df.loc[fraud, "amount"].sum()),
    }


def overview(df: pd.DataFrame, thresholds: dict[str, float]) -> dict[str, Any]:
    if df.empty:
        return {"kpis": _kpis(df), "previous": _kpis(df), "status_counts": {}, "detection": {}}
    end = df["timestamp"].max()
    fraud = df["is_fraud"] == 1
    caught = df["model_decision"].isin(CAUGHT_STATUSES) | (df["status"] == "BLOCKED")
    predicted = df["risk_score"] >= thresholds["flag"]
    labelled = df["is_fraud"].notna()
    tp = int((predicted & fraud).sum())
    fp = int((predicted & labelled & ~fraud).sum())
    fn = int((~predicted & fraud).sum())

    kpis = _kpis(df) | {
        "avg_risk": _f(df["risk_score"].mean(), 4),
        "prevented_amount": _f(df.loc[fraud & caught, "amount"].sum()),
        "missed_amount": _f(df.loc[fraud & ~caught, "amount"].sum()),
        "open_alerts": int(df["status"].isin(["FLAGGED", "PENDING"]).sum()),
        "customers": int(df["customer_id"].nunique()),
        "approval_rate": _f((df["status"] == "APPROVED").mean(), 4),
    }
    return {
        "as_of": end.isoformat(),
        "kpis": kpis,
        "last_30d": _kpis(_window(df, end, 30)),
        "previous_30d": _kpis(_window(df, end, 30, offset=30)),
        "status_counts": {k: int(v) for k, v in df["status"].value_counts().items()},
        "detection": {
            "precision": _f(tp / (tp + fp) if tp + fp else 0, 4),
            "recall": _f(tp / (tp + fn) if tp + fn else 0, 4),
            "true_positives": tp,
            "false_positives": fp,
            "false_negatives": fn,
            "threshold": _f(thresholds["flag"], 4),
        },
    }


def timeseries(df: pd.DataFrame, bucket: str, thresholds: dict[str, float]) -> list[dict[str, Any]]:
    if df.empty:
        return []
    freq = {"day": "D", "week": "W-MON", "month": "MS"}[bucket]
    d = df.assign(
        fraud=(df["is_fraud"] == 1).astype(int),
        flagged=(df["risk_score"] >= thresholds["flag"]).astype(int),
        fraud_amount=np.where(df["is_fraud"] == 1, df["amount"], 0.0),
    ).set_index("timestamp")
    g = d.resample(freq, label="left", closed="left").agg(
        transactions=("amount", "size"), volume=("amount", "sum"), fraud=("fraud", "sum"),
        flagged=("flagged", "sum"), fraud_amount=("fraud_amount", "sum"), avg_risk=("risk_score", "mean"),
    ).fillna(0)
    if bucket != "day" and len(g) > 2:
        # Drop partially covered first/last periods so trends don't show artificial dips.
        first, last = df["timestamp"].min(), df["timestamp"].max()
        offset = pd.tseries.frequencies.to_offset(freq)
        starts = g.index
        ends = starts + offset
        g = g[(starts >= first.floor("D")) & (ends <= last.floor("D") + pd.Timedelta(days=1))]
    g["fraud_rate"] = np.where(g["transactions"] > 0, g["fraud"] / g["transactions"].clip(lower=1), 0)
    return [
        {
            "date": idx.strftime("%Y-%m-%d"),
            "transactions": int(r.transactions), "volume": _f(r.volume), "fraud": int(r.fraud),
            "flagged": int(r.flagged), "fraud_amount": _f(r.fraud_amount),
            "fraud_rate": _f(r.fraud_rate, 4), "avg_risk": _f(r.avg_risk, 4),
        }
        for idx, r in g.iterrows()
    ]


def breakdown(df: pd.DataFrame, dimension: str) -> list[dict[str, Any]]:
    col = DIMENSIONS[dimension]
    d = df.assign(fraud=(df["is_fraud"] == 1).astype(int))
    g = d.groupby(col).agg(
        transactions=("amount", "size"), volume=("amount", "sum"),
        fraud=("fraud", "sum"), avg_risk=("risk_score", "mean"),
    )
    g["fraud_rate"] = g["fraud"] / g["transactions"]
    g = g.sort_values(["fraud", "transactions"], ascending=False)
    return [
        {
            "key": str(k), "transactions": int(r.transactions), "volume": _f(r.volume),
            "fraud": int(r.fraud), "fraud_rate": _f(r.fraud_rate, 4), "avg_risk": _f(r.avg_risk, 4),
        }
        for k, r in g.iterrows()
    ]


def hourly(df: pd.DataFrame) -> list[dict[str, Any]]:
    d = df.assign(hour=df["timestamp"].dt.hour, fraud=(df["is_fraud"] == 1).astype(int))
    g = d.groupby("hour").agg(transactions=("amount", "size"), fraud=("fraud", "sum")).reindex(range(24), fill_value=0)
    return [
        {
            "hour": int(h), "transactions": int(r.transactions), "fraud": int(r.fraud),
            "fraud_rate": _f(r.fraud / r.transactions if r.transactions else 0, 4),
        }
        for h, r in g.iterrows()
    ]


def risk_distribution(df: pd.DataFrame, bins: int = 20) -> list[dict[str, Any]]:
    edges = np.linspace(0, 1, bins + 1)
    idx = np.clip(np.digitize(df["risk_score"], edges) - 1, 0, bins - 1)
    fraud = (df["is_fraud"] == 1).to_numpy()
    out = []
    for b in range(bins):
        in_bin = idx == b
        out.append({
            "bin": f"{edges[b]:.2f}",
            "label": f"{edges[b]:.2f}-{edges[b + 1]:.2f}",
            "legit": int((in_bin & ~fraud).sum()),
            "fraud": int((in_bin & fraud).sum()),
        })
    return out


def top_customers(df: pd.DataFrame, limit: int = 10) -> list[dict[str, Any]]:
    d = df.assign(fraud=(df["is_fraud"] == 1).astype(int),
                  fraud_amount=np.where(df["is_fraud"] == 1, df["amount"], 0.0))
    g = d.groupby("customer_id").agg(
        transactions=("amount", "size"), volume=("amount", "sum"), fraud=("fraud", "sum"),
        fraud_amount=("fraud_amount", "sum"), max_risk=("risk_score", "max"),
        home_country=("home_country", "last"), last_seen=("timestamp", "max"),
    )
    g = g[g["fraud"] > 0].sort_values(["fraud_amount", "max_risk"], ascending=False).head(limit)
    return [
        {
            "customer_id": str(k), "transactions": int(r.transactions), "volume": _f(r.volume),
            "fraud": int(r.fraud), "fraud_amount": _f(r.fraud_amount), "max_risk": _f(r.max_risk, 4),
            "home_country": r.home_country, "last_seen": r.last_seen.isoformat(),
        }
        for k, r in g.iterrows()
    ]


def filter_options(df: pd.DataFrame) -> dict[str, Any]:
    return {
        "types": sorted(df["type"].unique().tolist()),
        "channels": sorted(df["channel"].unique().tolist()),
        "categories": sorted(df["merchant_category"].unique().tolist()),
        "countries": df["country"].value_counts().index.tolist(),
        "min_date": df["timestamp"].min().date().isoformat(),
        "max_date": df["timestamp"].max().date().isoformat(),
    }
