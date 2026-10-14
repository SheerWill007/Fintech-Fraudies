"""Dataset loading, validation and filtering."""

from __future__ import annotations

import hashlib
import io
from dataclasses import dataclass, field
from datetime import date, timedelta
from pathlib import Path
from typing import IO

import pandas as pd

from app.constants import CHANNELS, MERCHANT_CATEGORIES, TRANSACTION_TYPES

REQUIRED_COLUMNS = {
    "transaction_id": "Unique transaction identifier",
    "customer_id": "Customer / account identifier",
    "timestamp": "ISO-8601 timestamp (UTC)",
    "amount": "Transaction amount, > 0",
    "type": f"One of {', '.join(TRANSACTION_TYPES)}",
    "merchant_category": f"One of {', '.join(MERCHANT_CATEGORIES)}",
    "channel": f"One of {', '.join(CHANNELS)}",
    "country": "ISO-3166 alpha-2 country of the transaction",
    "home_country": "ISO-3166 alpha-2 home country of the customer",
    "account_age_days": "Account age at transaction time",
    "device_age_days": "Days since the device was first seen",
    "is_new_device": "0/1",
    "is_vpn": "0/1",
    "ip_risk_score": "IP reputation risk in [0, 1]",
    "txn_count_1h": "Customer transactions in the previous hour",
    "txn_count_24h": "Customer transactions in the previous 24 hours",
    "amount_to_avg_ratio": "Amount divided by the customer's 30-day average",
    "distance_from_home_km": "Distance from the customer's usual location",
    "failed_logins_24h": "Failed logins in the previous 24 hours",
    "is_fraud": "Label: 0/1",
}
OPTIONAL_COLUMNS = ["ip_address", "device_id", "fraud_scenario"]


class DatasetError(ValueError):
    """Raised when a dataset does not match the expected schema."""


def read_table(source: str | Path | IO[bytes], filename: str = "") -> pd.DataFrame:
    name = (filename or str(source)).lower()
    if name.endswith((".xlsx", ".xls")):
        return pd.read_excel(source)
    return pd.read_csv(source)


def clean(df: pd.DataFrame) -> pd.DataFrame:
    df = df.rename(columns=lambda c: str(c).strip().lower())
    missing = [c for c in REQUIRED_COLUMNS if c not in df.columns]
    if missing:
        raise DatasetError(f"Missing required column(s): {', '.join(missing)}")
    if df.empty:
        raise DatasetError("Dataset is empty")

    df = df[[*REQUIRED_COLUMNS, *[c for c in OPTIONAL_COLUMNS if c in df.columns]]].copy()
    for col in OPTIONAL_COLUMNS:
        if col not in df.columns:
            df[col] = None

    df["transaction_id"] = df["transaction_id"].astype(str)
    if df["transaction_id"].duplicated().any():
        raise DatasetError("transaction_id values must be unique")
    df["customer_id"] = df["customer_id"].astype(str)
    df["timestamp"] = pd.to_datetime(df["timestamp"], utc=True, errors="coerce")
    for col in ["type", "channel", "country", "home_country"]:
        df[col] = df[col].astype(str).str.strip().str.upper()
    df["merchant_category"] = df["merchant_category"].astype(str).str.strip().str.lower()

    numeric = [
        "amount", "account_age_days", "device_age_days", "is_new_device", "is_vpn", "ip_risk_score",
        "txn_count_1h", "txn_count_24h", "amount_to_avg_ratio", "distance_from_home_km",
        "failed_logins_24h", "is_fraud",
    ]
    for col in numeric:
        df[col] = pd.to_numeric(df[col], errors="coerce")

    before = len(df)
    df = df.dropna(subset=["timestamp", *numeric])
    df = df[
        (df["amount"] > 0)
        & df["type"].isin(TRANSACTION_TYPES)
        & df["channel"].isin(CHANNELS)
        & df["merchant_category"].isin(MERCHANT_CATEGORIES)
    ]
    if len(df) < 0.9 * before:
        raise DatasetError(
            f"{before - len(df):,} of {before:,} rows have invalid values "
            "(unparseable numbers/timestamps or unknown type/channel/category)"
        )
    df["is_fraud"] = df["is_fraud"].astype(int)
    if df["is_fraud"].nunique() < 2 or df["is_fraud"].sum() < 20:
        raise DatasetError("Need at least 20 fraud and 20 legitimate rows to train a model")
    return df.sort_values("timestamp").reset_index(drop=True)


def load_dataset(path: Path) -> pd.DataFrame:
    return clean(read_table(path))


def load_bytes(content: bytes, filename: str) -> pd.DataFrame:
    return clean(read_table(io.BytesIO(content), filename))


def fingerprint(df: pd.DataFrame) -> str:
    """Stable hash of the training data, used to decide whether the cached model is valid."""
    cols = [c for c in REQUIRED_COLUMNS]
    digest = hashlib.sha256(pd.util.hash_pandas_object(df[cols], index=False).values.tobytes())
    return digest.hexdigest()[:16]


@dataclass
class Filters:
    start: date | None = None
    end: date | None = None
    types: list[str] = field(default_factory=list)
    channels: list[str] = field(default_factory=list)
    categories: list[str] = field(default_factory=list)
    countries: list[str] = field(default_factory=list)

    def apply(self, df: pd.DataFrame) -> pd.DataFrame:
        mask = pd.Series(True, index=df.index)
        if self.start:
            mask &= df["timestamp"] >= pd.Timestamp(self.start, tz="UTC")
        if self.end:
            mask &= df["timestamp"] < pd.Timestamp(self.end + timedelta(days=1), tz="UTC")
        if self.types:
            mask &= df["type"].isin([t.upper() for t in self.types])
        if self.channels:
            mask &= df["channel"].isin([c.upper() for c in self.channels])
        if self.categories:
            mask &= df["merchant_category"].isin([c.lower() for c in self.categories])
        if self.countries:
            mask &= df["country"].isin([c.upper() for c in self.countries])
        return df[mask]
