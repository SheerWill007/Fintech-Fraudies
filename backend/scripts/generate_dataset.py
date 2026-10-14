"""
Synthetic card / account transaction dataset generator.

Produces 21,000 labelled transactions spread over the 180 days ending on
END_DATE. Legitimate activity is sampled from per-customer behavioural
profiles; fraud is injected from five distinct attack scenarios (account
takeover, card testing, big-ticket stolen card, synthetic identity, and a
deliberately subtle "low-and-slow" pattern) so the classes overlap the way
they do in real portfolios and no single rule separates them.

Usage (from backend/ml-engine):
    python -m scripts.generate_dataset            # writes data/transactions.csv
    python -m scripts.generate_dataset --rows 50000 --fraud-rate 0.02
"""

from __future__ import annotations

import argparse
from datetime import datetime, timedelta
from pathlib import Path

import numpy as np
import pandas as pd

from app.constants import COUNTRIES, country_distance_km

ROOT = Path(__file__).resolve().parent.parent
DEFAULT_OUT = ROOT / "data" / "transactions.csv"

END_DATE = datetime(2026, 10, 14, 23, 59, 59)
DAYS = 180
N_CUSTOMERS = 2400

HOME_COUNTRY_WEIGHTS = {
    "US": 0.45, "GB": 0.12, "IN": 0.12, "DE": 0.08, "CA": 0.07,
    "FR": 0.05, "AU": 0.05, "SG": 0.03, "BR": 0.03,
}
TRAVEL_COUNTRIES = ["US", "GB", "FR", "DE", "MX", "JP", "AE", "SG", "CA", "AU", "IN"]
FRAUD_COUNTRIES = ["NG", "RU", "RO", "CN", "BR", "AE", "US", "GB"]
FRAUD_COUNTRY_W = [0.2, 0.18, 0.16, 0.12, 0.1, 0.08, 0.08, 0.08]

TYPE_WEIGHTS = {"PURCHASE": 0.62, "TRANSFER": 0.14, "WITHDRAWAL": 0.12, "DEPOSIT": 0.12}
CATEGORY_BY_TYPE = {
    "PURCHASE": {
        "grocery": 0.22, "restaurants": 0.18, "fashion": 0.12, "utilities": 0.10,
        "entertainment": 0.10, "electronics": 0.09, "travel": 0.07, "gaming": 0.05,
        "gift_cards": 0.03, "jewelry": 0.02, "crypto": 0.02,
    },
    "TRANSFER": {"p2p": 0.70, "wire": 0.22, "crypto": 0.08},
    "WITHDRAWAL": {"atm": 0.85, "cash_advance": 0.15},
    "DEPOSIT": {"payroll": 0.55, "p2p": 0.30, "refund": 0.15},
}
CHANNEL_BY_TYPE = {
    "PURCHASE": {"POS": 0.45, "WEB": 0.30, "MOBILE": 0.25},
    "TRANSFER": {"MOBILE": 0.60, "WEB": 0.40},
    "WITHDRAWAL": {"ATM": 0.90, "MOBILE": 0.10},
    "DEPOSIT": {"MOBILE": 0.50, "WEB": 0.50},
}
# Typical ticket size relative to the customer's everyday spend.
CATEGORY_AMOUNT_MULT = {
    "grocery": 0.8, "restaurants": 0.6, "fashion": 1.4, "utilities": 1.6,
    "entertainment": 0.7, "electronics": 4.0, "travel": 5.0, "gaming": 0.6,
    "gift_cards": 1.0, "jewelry": 6.0, "crypto": 3.0, "p2p": 1.8, "wire": 8.0,
    "atm": 1.5, "cash_advance": 3.0, "payroll": 15.0, "refund": 0.9,
}
# Legit hour-of-day profile: quiet nights, lunchtime and evening peaks.
LEGIT_HOUR_W = np.array(
    [0.6, 0.35, 0.25, 0.2, 0.25, 0.5, 1.2, 2.4, 3.6, 4.2, 4.6, 5.2,
     6.0, 5.6, 5.0, 4.8, 5.0, 5.6, 6.4, 6.6, 5.8, 4.4, 2.8, 1.4]
)
LEGIT_HOUR_W = LEGIT_HOUR_W / LEGIT_HOUR_W.sum()
FRAUD_HOUR_W = np.array(
    [3.2, 3.6, 3.8, 3.6, 3.0, 2.2, 1.6, 1.6, 2.0, 2.4, 2.6, 2.8,
     3.0, 3.0, 3.0, 3.0, 3.2, 3.4, 3.6, 3.8, 3.8, 3.6, 3.4, 3.2]
)
FRAUD_HOUR_W = FRAUD_HOUR_W / FRAUD_HOUR_W.sum()


def pick(rng: np.random.Generator, weights: dict[str, float]) -> str:
    keys = list(weights)
    p = np.array([weights[k] for k in keys], dtype=float)
    return keys[rng.choice(len(keys), p=p / p.sum())]


def rand_ip(rng: np.random.Generator, datacenter: bool = False) -> str:
    if datacenter:
        first = rng.choice([45, 91, 103, 185, 193, 194])
    else:
        first = rng.choice([24, 49, 67, 73, 82, 98, 100, 122, 151, 172, 203])
    return f"{first}.{rng.integers(0, 256)}.{rng.integers(0, 256)}.{rng.integers(1, 255)}"


def rand_device(rng: np.random.Generator) -> str:
    return "dev_" + "".join(rng.choice(list("0123456789abcdef"), 12))


def make_customers(rng: np.random.Generator) -> pd.DataFrame:
    homes = list(HOME_COUNTRY_WEIGHTS)
    hw = np.array(list(HOME_COUNTRY_WEIGHTS.values()))
    rows = []
    for i in range(N_CUSTOMERS):
        n_dev = int(rng.choice([1, 2, 3], p=[0.55, 0.35, 0.10]))
        # Account age at END_DATE; ~8% of accounts were opened inside the window.
        if rng.random() < 0.08:
            age_end = int(rng.integers(5, DAYS))
        else:
            age_end = int(rng.integers(DAYS, 3650))
        rows.append(
            {
                "customer_id": f"CUST-{i + 1:05d}",
                "home_country": homes[rng.choice(len(homes), p=hw / hw.sum())],
                "avg_spend": float(np.clip(rng.lognormal(np.log(70), 0.75), 8, 2500)),
                "activity": float(rng.gamma(2.0, 1.0)),
                "account_age_end": age_end,
                "devices": [rand_device(rng) for _ in range(n_dev)],
                "device_ages": [int(rng.integers(10, 1400)) for _ in range(n_dev)],
                "ips": [rand_ip(rng) for _ in range(int(rng.integers(1, 3)))],
                "night_owl": rng.random() < 0.07,
            }
        )
    return pd.DataFrame(rows)


def sample_timestamp(rng: np.random.Generator, hour_w: np.ndarray, min_day: int = 0) -> datetime:
    # Mild growth trend: later days slightly more likely.
    days = np.arange(min_day, DAYS)
    w = 1.0 + 0.35 * days / DAYS
    day = int(rng.choice(days, p=w / w.sum()))
    hour = int(rng.choice(24, p=hour_w))
    start = END_DATE - timedelta(days=DAYS - 1)
    ts = datetime(start.year, start.month, start.day) + timedelta(
        days=day, hours=hour, minutes=int(rng.integers(0, 60)), seconds=int(rng.integers(0, 60))
    )
    return ts


def legit_row(rng: np.random.Generator, c: pd.Series) -> dict:
    ttype = pick(rng, TYPE_WEIGHTS)
    cat = pick(rng, CATEGORY_BY_TYPE[ttype])
    channel = pick(rng, CHANNEL_BY_TYPE[ttype])
    hour_w = FRAUD_HOUR_W if c.night_owl else LEGIT_HOUR_W
    ts = sample_timestamp(rng, hour_w)
    days_before_end = (END_DATE - ts).days
    account_age = max(1, c.account_age_end - days_before_end)

    amount = c.avg_spend * CATEGORY_AMOUNT_MULT[cat] * rng.lognormal(0, 0.55)
    amount = float(np.clip(amount, 1.0, 60000))

    traveling = rng.random() < 0.06
    country = c.home_country
    if traveling:
        options = [x for x in TRAVEL_COUNTRIES if x != c.home_country]
        country = options[rng.integers(len(options))]
    dist = country_distance_km(country, c.home_country)
    dist = dist * rng.uniform(0.7, 1.3) if dist else float(rng.exponential(9))

    new_device = rng.random() < (0.10 if traveling else 0.035)
    if new_device:
        device, device_age = rand_device(rng), int(rng.integers(0, 3))
    else:
        k = int(rng.integers(len(c.devices)))
        device = c.devices[k]
        device_age = max(0, c.device_ages[k] - days_before_end)

    vpn = rng.random() < 0.045
    ip = rand_ip(rng, datacenter=vpn) if (vpn or traveling) else c.ips[rng.integers(len(c.ips))]
    ip_risk = float(np.clip(rng.beta(1.6, 12) + (0.22 if vpn else 0) + (0.05 if traveling else 0), 0, 1))

    tx1h = int(rng.poisson(0.35))
    tx24 = tx1h + int(rng.poisson(1.6 * min(c.activity, 3) + 0.5))
    failed = int(rng.poisson(0.08 + (0.4 if new_device else 0)))

    return {
        "timestamp": ts, "customer_id": c.customer_id, "amount": round(amount, 2),
        "type": ttype, "merchant_category": cat, "channel": channel,
        "country": country, "home_country": c.home_country,
        "ip_address": ip, "device_id": device,
        "account_age_days": int(account_age), "device_age_days": int(device_age),
        "is_new_device": int(new_device), "is_vpn": int(vpn),
        "ip_risk_score": round(ip_risk, 3), "txn_count_1h": tx1h, "txn_count_24h": tx24,
        "amount_to_avg_ratio": round(amount / (c.avg_spend * rng.uniform(0.85, 1.15)), 3),
        "distance_from_home_km": round(dist, 1), "failed_logins_24h": failed,
        "is_fraud": 0, "fraud_scenario": "none",
    }


def fraud_row(rng: np.random.Generator, c: pd.Series, scenario: str) -> dict:
    r = legit_row(rng, c)  # start from the victim's context, then perturb
    r["is_fraud"], r["fraud_scenario"] = 1, scenario
    ts = sample_timestamp(rng, FRAUD_HOUR_W)
    days_before_end = (END_DATE - ts).days

    def foreign(p: float) -> None:
        if rng.random() < p:
            options = [x for x in FRAUD_COUNTRIES if x != c.home_country]
            w = np.array([FRAUD_COUNTRY_W[FRAUD_COUNTRIES.index(x)] for x in options])
            r["country"] = options[rng.choice(len(options), p=w / w.sum())]
            r["distance_from_home_km"] = round(
                country_distance_km(r["country"], c.home_country) * rng.uniform(0.7, 1.3), 1
            )

    def new_device(p: float) -> None:
        if rng.random() < p:
            r["device_id"], r["is_new_device"], r["device_age_days"] = rand_device(rng), 1, int(rng.integers(0, 2))

    def vpn(p: float, risk: tuple[float, float]) -> None:
        on = rng.random() < p
        r["is_vpn"] = int(on)
        if on:
            r["ip_address"] = rand_ip(rng, datacenter=True)
        r["ip_risk_score"] = round(float(np.clip(rng.beta(*risk) + (0.15 if on else 0), 0, 1)), 3)

    if scenario == "account_takeover":
        r["type"] = pick(rng, {"TRANSFER": 0.7, "WITHDRAWAL": 0.3})
        r["merchant_category"] = (
            pick(rng, {"wire": 0.45, "p2p": 0.30, "crypto": 0.25})
            if r["type"] == "TRANSFER" else pick(rng, {"cash_advance": 0.6, "atm": 0.4})
        )
        r["channel"] = pick(rng, {"WEB": 0.55, "MOBILE": 0.45}) if r["merchant_category"] != "atm" else "ATM"
        ratio = rng.uniform(2.5, 22)
        new_device(0.8)
        vpn(0.55, (4, 5))
        foreign(0.5)
        r["failed_logins_24h"] = int(rng.poisson(2.6))
        r["txn_count_1h"] = int(rng.poisson(1.4))
    elif scenario == "card_testing":
        # A concentrated campaign window makes this visible on the time series.
        ts = END_DATE - timedelta(days=int(rng.integers(52, 66)), hours=int(rng.integers(0, 24)),
                                  minutes=int(rng.integers(0, 60)))
        days_before_end = (END_DATE - ts).days
        r["type"], r["channel"] = "PURCHASE", pick(rng, {"WEB": 0.8, "MOBILE": 0.2})
        r["merchant_category"] = pick(rng, {"gaming": 0.4, "gift_cards": 0.35, "entertainment": 0.25})
        r["amount"] = round(float(rng.uniform(0.5, 14)), 2)
        ratio = r["amount"] / c.avg_spend
        new_device(0.5)
        vpn(0.4, (3, 6))
        foreign(0.3)
        r["txn_count_1h"] = int(rng.poisson(6)) + 3
        r["failed_logins_24h"] = int(rng.poisson(0.5))
    elif scenario == "stolen_card":
        r["type"] = "PURCHASE"
        r["merchant_category"] = pick(rng, {"electronics": 0.4, "jewelry": 0.2, "gift_cards": 0.2, "travel": 0.2})
        r["channel"] = pick(rng, {"WEB": 0.65, "POS": 0.2, "MOBILE": 0.15})
        ratio = rng.uniform(3, 16)
        new_device(0.4)
        vpn(0.3, (2.5, 6))
        foreign(0.4)
        r["txn_count_1h"] = int(rng.poisson(2))
        r["failed_logins_24h"] = int(rng.poisson(0.3))
    elif scenario == "synthetic_identity":
        r["customer_id"] = f"CUST-S{rng.integers(1, 120):04d}"
        r["account_age_days"] = int(rng.integers(1, 45))
        r["type"] = pick(rng, {"TRANSFER": 0.5, "PURCHASE": 0.3, "WITHDRAWAL": 0.2})
        r["merchant_category"] = {
            "TRANSFER": pick(rng, {"crypto": 0.5, "wire": 0.3, "p2p": 0.2}),
            "PURCHASE": pick(rng, {"electronics": 0.5, "gift_cards": 0.5}),
            "WITHDRAWAL": pick(rng, {"cash_advance": 0.7, "atm": 0.3}),
        }[r["type"]]
        r["channel"] = "ATM" if r["merchant_category"] == "atm" else pick(rng, {"WEB": 0.6, "MOBILE": 0.4})
        ratio = rng.uniform(1.5, 9)
        new_device(0.3)
        vpn(0.35, (3, 6))
        r["txn_count_1h"] = int(rng.poisson(1.8))
    else:  # "low_and_slow": barely distinguishable from normal behaviour
        ratio = rng.uniform(1.2, 3.5)
        new_device(0.2)
        vpn(0.12, (2, 9))
        foreign(0.12)
        r["failed_logins_24h"] = int(rng.poisson(0.4))

    r["timestamp"] = ts
    if scenario != "synthetic_identity":
        r["account_age_days"] = max(1, c.account_age_end - days_before_end)
    if scenario != "card_testing":
        r["amount"] = round(float(np.clip(c.avg_spend * ratio * rng.uniform(0.9, 1.1), 5, 60000)), 2)
    r["amount_to_avg_ratio"] = round(r["amount"] / (c.avg_spend * rng.uniform(0.85, 1.15)), 3)
    r["txn_count_24h"] = r["txn_count_1h"] + int(rng.poisson(2.5))
    if r["country"] == r["home_country"]:
        r["distance_from_home_km"] = round(float(rng.exponential(40)), 1)
    return r


def generate(rows: int, fraud_rate: float, seed: int) -> pd.DataFrame:
    rng = np.random.default_rng(seed)
    customers = make_customers(rng)
    act = customers["activity"].to_numpy()
    p_cust = act / act.sum()

    n_fraud = int(round(rows * fraud_rate))
    n_legit = rows - n_fraud
    records = [legit_row(rng, customers.iloc[rng.choice(len(customers), p=p_cust)]) for _ in range(n_legit)]

    scenarios = {
        "account_takeover": 0.33, "card_testing": 0.22, "stolen_card": 0.23,
        "synthetic_identity": 0.10, "low_and_slow": 0.12,
    }
    for _ in range(n_fraud):
        victim = customers.iloc[rng.integers(len(customers))]
        records.append(fraud_row(rng, victim, pick(rng, scenarios)))

    df = pd.DataFrame(records).sort_values("timestamp").reset_index(drop=True)
    df.insert(0, "transaction_id", [f"TX-{i + 1:06d}" for i in range(len(df))])
    df["timestamp"] = pd.to_datetime(df["timestamp"]).dt.strftime("%Y-%m-%dT%H:%M:%SZ")
    return df


def main() -> None:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--rows", type=int, default=21000)
    ap.add_argument("--fraud-rate", type=float, default=0.032)
    ap.add_argument("--seed", type=int, default=42)
    ap.add_argument("--out", type=Path, default=DEFAULT_OUT)
    args = ap.parse_args()

    df = generate(args.rows, args.fraud_rate, args.seed)
    args.out.parent.mkdir(parents=True, exist_ok=True)
    df.to_csv(args.out, index=False)
    print(f"Wrote {len(df):,} rows -> {args.out}")
    print(f"Fraud rate: {df.is_fraud.mean():.2%}  ({df.is_fraud.sum():,} fraud rows)")
    print(df.fraud_scenario.value_counts().to_string())
    assert set(df.country) <= set(COUNTRIES)


if __name__ == "__main__":
    main()
