"""API tests. Run from backend/:  pytest

Uses an isolated data/model directory with a small generated dataset and a
reduced training budget so the suite runs in well under a minute.
"""

from __future__ import annotations

import io
import os
import tempfile
from pathlib import Path

import pytest

_TMP = Path(tempfile.mkdtemp(prefix="fraudies-test-"))
os.environ["FF_DATA_DIR"] = str(_TMP / "data")
os.environ["FF_MODEL_DIR"] = str(_TMP / "models")
os.environ["FF_CV_FOLDS"] = "3"
os.environ["FF_TUNING_ITERATIONS"] = "0"

from fastapi.testclient import TestClient  # noqa: E402

from app import config  # noqa: E402
from scripts.generate_dataset import generate  # noqa: E402

config.SAMPLE_DATASET.parent.mkdir(parents=True, exist_ok=True)
generate(rows=4000, fraud_rate=0.04, seed=7).to_csv(config.SAMPLE_DATASET, index=False)

from app.main import app  # noqa: E402


@pytest.fixture(scope="module")
def client():
    with TestClient(app) as c:
        yield c


def test_health(client):
    body = client.get("/api/health").json()
    assert body["status"] == "ok" and body["model_loaded"] and body["rows"] == 4000


def test_dataset_and_filters(client):
    info = client.get("/api/dataset").json()
    assert info["kind"] == "sample" and info["rows"] == 4000 and info["fraud_rows"] == 160
    opts = client.get("/api/filters").json()
    assert "PURCHASE" in opts["types"] and opts["min_date"] <= opts["max_date"]


def test_model_benchmark(client):
    m = client.get("/api/model").json()
    names = {r["model"] for r in m["metrics"]["comparison"]}
    assert {"Logistic Regression", "Random Forest", "HistGradientBoosting"} <= names
    assert m["model"] == m["metrics"]["comparison"][0]["model"]  # best CV PR-AUC wins
    assert m["metrics"]["test"]["roc_auc"] > 0.85
    assert 0 < m["thresholds"]["review"] < m["thresholds"]["flag"] < 1


def test_overview_and_analytics(client):
    ov = client.get("/api/overview").json()
    assert ov["kpis"]["transactions"] == 4000 and ov["kpis"]["fraud_count"] == 160
    assert len(client.get("/api/analytics/timeseries", params={"bucket": "week"}).json()) > 10
    cats = client.get("/api/analytics/breakdown", params={"dimension": "category"}).json()
    assert sum(c["transactions"] for c in cats) == 4000
    assert len(client.get("/api/analytics/hourly").json()) == 24
    dist = client.get("/api/analytics/risk-distribution").json()
    assert sum(b["legit"] + b["fraud"] for b in dist) == 4000
    filtered = client.get("/api/overview", params={"type": "TRANSFER"}).json()
    assert 0 < filtered["kpis"]["transactions"] < 4000


def test_transactions_list_filter_sort(client):
    page = client.get(
        "/api/transactions", params={"sort": "risk_score", "order": "desc", "page_size": 10, "label": "fraud"}
    ).json()
    assert page["total"] == 160 and len(page["rows"]) == 10
    scores = [r["risk_score"] for r in page["rows"]]
    assert scores == sorted(scores, reverse=True)
    one = page["rows"][0]["transaction_id"]
    found = client.get("/api/transactions", params={"search": one.lower()}).json()
    assert found["total"] == 1


def test_transaction_detail_has_explanation(client):
    tx_id = client.get("/api/transactions", params={"page_size": 1}).json()["rows"][0]["transaction_id"]
    detail = client.get(f"/api/transactions/{tx_id}").json()
    assert detail["transaction"]["transaction_id"] == tx_id
    assert isinstance(detail["contributions"], list)
    assert client.get("/api/transactions/NOPE").status_code == 404


def test_ingest_and_review_flow(client):
    risky = {
        "customer_id": "CUST-00001", "amount": 4800, "type": "TRANSFER", "merchant_category": "crypto",
        "channel": "WEB", "country": "NG", "device_id": "dev_brand_new", "is_vpn": True,
        "ip_risk_score": 0.9, "failed_logins_24h": 4,
    }
    res = client.post("/api/transactions", json=risky)
    assert res.status_code == 201
    tx = res.json()["transaction"]
    assert tx["source"] == "live" and tx["is_new_device"] is True
    assert tx["status"] in {"FLAGGED", "PENDING"}

    alerts = client.get("/api/alerts").json()
    assert any(r["transaction_id"] == tx["transaction_id"] for r in alerts["rows"]) or alerts["total"] > 20

    reviewed = client.post(f"/api/transactions/{tx['transaction_id']}/review", json={"decision": "block"}).json()
    assert reviewed["status"] == "BLOCKED" and reviewed["is_fraud"] is True

    benign = client.post("/api/transactions", json={
        "customer_id": "CUST-00001", "amount": 12.5, "type": "PURCHASE", "merchant_category": "grocery",
        "channel": "POS", "country": tx["home_country"], "ip_address": "73.1.2.3", "ip_risk_score": 0.05,
    }).json()["transaction"]
    assert benign["risk_score"] < tx["risk_score"]


def test_simulator(client):
    low = client.post("/api/model/score", json={"amount": 25, "type": "PURCHASE", "merchant_category": "grocery",
                                                 "channel": "POS", "ip_risk_score": 0.05, "is_new_device": False,
                                                 "device_age_days": 400, "account_age_days": 900}).json()
    high = client.post("/api/model/score", json={"amount": 3000, "type": "TRANSFER", "merchant_category": "wire",
                                                  "channel": "WEB", "country": "RU", "home_country": "US",
                                                  "is_new_device": True, "is_vpn": True, "ip_risk_score": 0.85,
                                                  "failed_logins_24h": 5, "amount_to_avg_ratio": 14,
                                                  "account_age_days": 20}).json()
    assert high["risk_score"] > low["risk_score"]
    assert high["status"] in {"FLAGGED", "PENDING"} and low["status"] == "APPROVED"
    assert client.post("/api/model/score", json={"amount": -1, "type": "PURCHASE"}).status_code == 422


def test_upload_validation(client):
    bad = io.BytesIO(b"transaction_id,amount\n1,10\n")
    res = client.post("/api/dataset/upload", files={"file": ("bad.csv", bad, "text/csv")})
    assert res.status_code == 422 and "Missing required column" in res.json()["detail"]
    res = client.post("/api/dataset/upload", files={"file": ("x.txt", io.BytesIO(b"x"), "text/plain")})
    assert res.status_code == 400
