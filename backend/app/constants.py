"""
Shared vocabularies used by the dataset generator, training pipeline and the
online scoring service. Keeping them in one place guarantees that the one-hot
layout the model was trained on is exactly the layout used at inference time.
"""

from __future__ import annotations

import math

TRANSACTION_TYPES = ["PURCHASE", "TRANSFER", "WITHDRAWAL", "DEPOSIT"]
CHANNELS = ["POS", "WEB", "MOBILE", "ATM"]
MERCHANT_CATEGORIES = [
    "grocery",
    "restaurants",
    "fashion",
    "utilities",
    "entertainment",
    "electronics",
    "travel",
    "gaming",
    "jewelry",
    "gift_cards",
    "crypto",
    "p2p",
    "wire",
    "atm",
    "cash_advance",
    "payroll",
    "refund",
]
HIGH_RISK_CATEGORIES = {"crypto", "gift_cards", "jewelry", "gaming", "wire", "cash_advance"}

# Approximate country centroids (lat, lon) used to derive distance-from-home.
COUNTRY_CENTROIDS: dict[str, tuple[float, float]] = {
    "US": (39.8, -98.6),
    "GB": (54.0, -2.0),
    "IN": (21.0, 78.0),
    "DE": (51.0, 10.0),
    "CA": (56.0, -106.0),
    "FR": (46.0, 2.0),
    "AU": (-25.0, 133.0),
    "SG": (1.35, 103.8),
    "BR": (-10.0, -55.0),
    "MX": (23.0, -102.0),
    "JP": (36.0, 138.0),
    "AE": (24.0, 54.0),
    "NG": (9.0, 8.0),
    "RU": (61.0, 105.0),
    "RO": (46.0, 25.0),
    "CN": (35.0, 103.0),
}
COUNTRIES = list(COUNTRY_CENTROIDS.keys())


def haversine_km(a: tuple[float, float], b: tuple[float, float]) -> float:
    lat1, lon1 = map(math.radians, a)
    lat2, lon2 = map(math.radians, b)
    dlat, dlon = lat2 - lat1, lon2 - lon1
    h = math.sin(dlat / 2) ** 2 + math.cos(lat1) * math.cos(lat2) * math.sin(dlon / 2) ** 2
    return 2 * 6371.0 * math.asin(math.sqrt(h))


def country_distance_km(country: str, home_country: str) -> float:
    """Distance between two country centroids; 0 for the same/unknown country."""
    if country == home_country:
        return 0.0
    a = COUNTRY_CENTROIDS.get(country)
    b = COUNTRY_CENTROIDS.get(home_country)
    if a is None or b is None:
        return 2500.0
    return haversine_km(a, b)
