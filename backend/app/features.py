"""
Feature engineering shared by training (scripts/train.py) and online scoring.

Input is a DataFrame of raw transaction records using the dataset's snake_case
column names; output is a purely numeric frame with a fixed column order
(FEATURE_COLUMNS), so every model family can consume it and per-column
contributions can be grouped back into human-readable factors.
"""

from __future__ import annotations

import numpy as np
import pandas as pd

from app.constants import CHANNELS, HIGH_RISK_CATEGORIES, MERCHANT_CATEGORIES, TRANSACTION_TYPES

NUMERIC_FEATURES = [
    "log_amount",
    "amount_to_avg_ratio",
    "hour",
    "is_night",
    "day_of_week",
    "is_weekend",
    "is_foreign",
    "log_distance_km",
    "account_age_days",
    "device_age_days",
    "is_new_device",
    "is_vpn",
    "ip_risk_score",
    "txn_count_1h",
    "txn_count_24h",
    "failed_logins_24h",
    "is_high_risk_category",
]
CATEGORICAL_FEATURES = {
    "type": TRANSACTION_TYPES,
    "channel": CHANNELS,
    "merchant_category": MERCHANT_CATEGORIES,
}
FEATURE_COLUMNS = NUMERIC_FEATURES + [
    f"{col}={val}" for col, values in CATEGORICAL_FEATURES.items() for val in values
]


def feature_group(column: str) -> str:
    """Maps a model column back to the raw concept it encodes (for explanations)."""
    if "=" in column:
        return column.split("=", 1)[0]
    return {
        "log_amount": "amount",
        "amount_to_avg_ratio": "amount",
        "log_distance_km": "distance",
        "is_foreign": "distance",
        "hour": "time",
        "is_night": "time",
        "day_of_week": "time",
        "is_weekend": "time",
        "is_high_risk_category": "merchant_category",
        "device_age_days": "device",
        "is_new_device": "device",
    }.get(column, column)


def build_features(raw: pd.DataFrame) -> pd.DataFrame:
    ts = pd.to_datetime(raw["timestamp"], utc=True)
    out = pd.DataFrame(index=raw.index)
    out["log_amount"] = np.log1p(raw["amount"].astype(float))
    out["amount_to_avg_ratio"] = raw["amount_to_avg_ratio"].astype(float).clip(0, 200)
    out["hour"] = ts.dt.hour
    out["is_night"] = ts.dt.hour.isin([0, 1, 2, 3, 4, 5]).astype(int)
    out["day_of_week"] = ts.dt.dayofweek
    out["is_weekend"] = (ts.dt.dayofweek >= 5).astype(int)
    out["is_foreign"] = (raw["country"] != raw["home_country"]).astype(int)
    out["log_distance_km"] = np.log1p(raw["distance_from_home_km"].astype(float).clip(lower=0))
    for col in [
        "account_age_days", "device_age_days", "is_new_device", "is_vpn",
        "ip_risk_score", "txn_count_1h", "txn_count_24h", "failed_logins_24h",
    ]:
        out[col] = raw[col].astype(float)
    out["is_high_risk_category"] = raw["merchant_category"].isin(HIGH_RISK_CATEGORIES).astype(int)

    for col, values in CATEGORICAL_FEATURES.items():
        for val in values:
            out[f"{col}={val}"] = (raw[col] == val).astype(int)

    return out[FEATURE_COLUMNS].astype(np.float32)
