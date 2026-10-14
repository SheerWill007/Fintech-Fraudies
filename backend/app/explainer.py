"""
Per-prediction explanations.

Gradient-boosted trees (XGBoost / LightGBM) expose exact TreeSHAP values
natively, so no extra dependency is needed. Linear models use coefficient x
standardised value. Column-level contributions (log-odds) are summed back into
raw-feature groups and rendered as analyst-readable risk factors.
"""

from __future__ import annotations

from typing import Any

import numpy as np
import pandas as pd

from app.constants import HIGH_RISK_CATEGORIES
from app.features import FEATURE_COLUMNS, feature_group

FACTOR_MIN_CONTRIBUTION = 0.15  # log-odds
MAX_FACTORS = 5


def _final_estimator(model: Any) -> Any:
    return model.steps[-1][1] if hasattr(model, "steps") else model


def column_contributions(model: Any, X: pd.DataFrame) -> np.ndarray | None:
    """Returns an (n_rows, n_features) matrix of log-odds contributions, or None."""
    est = _final_estimator(model)
    name = type(est).__name__
    if name == "XGBClassifier":
        import xgboost as xgb

        contrib = est.get_booster().predict(xgb.DMatrix(X), pred_contribs=True)
        return np.asarray(contrib)[:, :-1]
    if name == "LGBMClassifier":
        contrib = est.predict(X, pred_contrib=True)
        return np.asarray(contrib)[:, :-1]
    if name == "LogisticRegression" and hasattr(model, "steps"):
        Xs = model[:-1].transform(X)
        return np.asarray(Xs) * est.coef_[0]
    return None


def group_contributions(row_contrib: np.ndarray) -> dict[str, float]:
    groups: dict[str, float] = {}
    for col, value in zip(FEATURE_COLUMNS, row_contrib):
        g = feature_group(col)
        groups[g] = groups.get(g, 0.0) + float(value)
    return groups


def describe(group: str, r: dict[str, Any]) -> str:
    if group == "amount":
        return f"Amount {r['amount_to_avg_ratio']:.1f}x customer average (${r['amount']:,.2f})"
    if group == "distance":
        if r["country"] != r["home_country"]:
            return f"Cross-border: {r['country']} vs home {r['home_country']}"
        return f"{r['distance_from_home_km']:.0f} km from usual location"
    if group == "time":
        hour = pd.to_datetime(r["timestamp"], utc=True).hour
        return f"Unusual time of day ({hour:02d}:00 UTC)"
    if group == "device":
        if r["is_new_device"]:
            return "New / unrecognised device"
        return f"Device first seen {int(r['device_age_days'])} days ago"
    if group == "is_vpn":
        return "VPN / proxy connection" if r["is_vpn"] else "Direct connection"
    if group == "ip_risk_score":
        return f"IP reputation risk {r['ip_risk_score']:.2f}"
    if group == "txn_count_1h":
        return f"Velocity: {int(r['txn_count_1h'])} transactions in the last hour"
    if group == "txn_count_24h":
        return f"{int(r['txn_count_24h'])} transactions in the last 24h"
    if group == "failed_logins_24h":
        return f"{int(r['failed_logins_24h'])} failed logins in the last 24h"
    if group == "account_age_days":
        return f"Account age {int(r['account_age_days'])} days"
    if group == "merchant_category":
        cat = r["merchant_category"]
        return f"High-risk merchant category ({cat})" if cat in HIGH_RISK_CATEGORIES else f"Merchant category ({cat})"
    if group == "type":
        return f"Transaction type {r['type']}"
    if group == "channel":
        return f"{r['channel']} channel"
    return group


def explain_rows(model: Any, raw: pd.DataFrame, X: pd.DataFrame) -> list[list[dict[str, Any]]]:
    """
    For each row returns the contributing groups sorted by impact:
    [{"feature": group, "label": text, "contribution": log_odds}, ...]
    """
    contrib = column_contributions(model, X)
    records = raw.to_dict("records")
    out: list[list[dict[str, Any]]] = []
    for i, r in enumerate(records):
        if contrib is None:
            out.append([])
            continue
        groups = group_contributions(contrib[i])
        items = [
            {"feature": g, "label": describe(g, r), "contribution": round(v, 4)}
            for g, v in sorted(groups.items(), key=lambda kv: -abs(kv[1]))
        ]
        out.append(items)
    return out


def top_factors(contributions: list[dict[str, Any]]) -> list[str]:
    positive = [c for c in contributions if c["contribution"] > 0]
    positive.sort(key=lambda c: -c["contribution"])
    strong = [c["label"] for c in positive if c["contribution"] >= FACTOR_MIN_CONTRIBUTION]
    return strong[:MAX_FACTORS]
