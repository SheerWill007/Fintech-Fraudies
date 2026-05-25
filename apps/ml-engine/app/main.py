"""
Fraud Detection ML Engine
FastAPI service exposing a /predict endpoint that scores financial transactions.
"""

from __future__ import annotations

import logging
import os
from contextlib import asynccontextmanager
from typing import AsyncGenerator

import numpy as np
from fastapi import FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field, field_validator

# ---------------------------------------------------------------------------
# Logging
# ---------------------------------------------------------------------------
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger("ml_engine")


# ---------------------------------------------------------------------------
# Schemas
# ---------------------------------------------------------------------------
class TransactionInput(BaseModel):
    transactionId: str = Field(..., min_length=1, description="Unique transaction ID")
    userId: str = Field(..., min_length=1, description="User identifier")
    amount: float = Field(
        ..., gt=0, description="Transaction amount (must be positive)"
    )
    type: str = Field(
        ..., description="Transaction type: DEPOSIT, WITHDRAWAL, or TRANSFER"
    )
    ipAddress: str | None = Field(default=None, description="Originating IP address")
    deviceId: str | None = Field(default=None, description="Device fingerprint / ID")

    @field_validator("type")
    @classmethod
    def validate_type(cls, v: str) -> str:
        allowed = {"DEPOSIT", "WITHDRAWAL", "TRANSFER"}
        upper = v.upper()
        if upper not in allowed:
            raise ValueError(f"type must be one of {allowed}, got '{v}'")
        return upper


class RiskScoreOutput(BaseModel):
    transactionId: str
    riskScore: float = Field(..., ge=0.0, le=1.0)
    status: str  # APPROVED | PENDING | FLAGGED
    factors: list[str]


# ---------------------------------------------------------------------------
# Feature engineering helpers
# ---------------------------------------------------------------------------
LARGE_AMOUNT_THRESHOLD = float(os.getenv("LARGE_AMOUNT_THRESHOLD", "5000"))
HIGH_RISK_THRESHOLD = float(os.getenv("HIGH_RISK_THRESHOLD", "0.75"))
PENDING_THRESHOLD = float(os.getenv("PENDING_THRESHOLD", "0.50"))

# Transaction types that carry inherently higher risk
HIGH_RISK_TYPES = {"TRANSFER", "WITHDRAWAL"}


def compute_risk_score(transaction: TransactionInput) -> tuple[float, list[str]]:
    """
    Deterministic feature-based risk scorer.

    Returns (risk_score in [0, 1], list_of_contributing_factors).

    In production, replace this body with a call to a trained model:
        model.predict_proba(feature_vector)[0][1]
    """
    factors: list[str] = []
    score: float = 0.10  # baseline

    # --- Feature 1: Large transaction amount ---
    if transaction.amount > LARGE_AMOUNT_THRESHOLD:
        increment = min(0.30, (transaction.amount / LARGE_AMOUNT_THRESHOLD - 1) * 0.15)
        score += increment
        factors.append(f"Large transaction amount (${transaction.amount:,.2f})")

    # --- Feature 2: High-risk transaction type ---
    if transaction.type in HIGH_RISK_TYPES:
        score += 0.15
        factors.append(f"High-risk transaction type ({transaction.type})")

    # --- Feature 3: Missing device context (potential fraud signal) ---
    if transaction.deviceId is None and transaction.ipAddress is None:
        score += 0.20
        factors.append("No device or IP context provided")
    elif transaction.deviceId is None:
        score += 0.08
        factors.append("No device ID provided")

    # --- Feature 4: Very high single-factor scores push toward cap ---
    score = float(np.clip(score, 0.0, 1.0))

    return round(score, 4), factors


def determine_status(risk_score: float, factors: list[str]) -> str:
    if risk_score >= HIGH_RISK_THRESHOLD:
        return "FLAGGED"
    if risk_score >= PENDING_THRESHOLD:
        return "PENDING"
    return "APPROVED"


# ---------------------------------------------------------------------------
# App lifecycle
# ---------------------------------------------------------------------------
@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    logger.info("ML Engine starting up — model ready")
    # In production: load model from disk here
    # e.g. model = joblib.load("model.pkl")
    yield
    logger.info("ML Engine shutting down")


# ---------------------------------------------------------------------------
# App
# ---------------------------------------------------------------------------
app = FastAPI(
    title="Fraud Detection ML Engine",
    version="1.0.0",
    description="Scores financial transactions for fraud risk.",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=os.getenv("CORS_ORIGIN", "http://localhost:3001").split(","),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------
@app.get("/", tags=["health"])
def health_check() -> dict[str, str]:
    return {"status": "ok", "service": "fraud-detection-ml-engine"}


@app.post(
    "/predict",
    response_model=RiskScoreOutput,
    status_code=status.HTTP_200_OK,
    tags=["prediction"],
    summary="Score a transaction for fraud risk",
)
def predict_fraud(transaction: TransactionInput) -> RiskScoreOutput:
    """
    Accepts a transaction payload and returns a risk score between 0 and 1,
    a status (APPROVED / PENDING / FLAGGED), and the contributing risk factors.
    """
    try:
        risk_score, factors = compute_risk_score(transaction)
    except Exception as exc:
        logger.exception(
            "Unexpected error during prediction for %s", transaction.transactionId
        )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Prediction failed due to an internal error.",
        ) from exc

    tx_status = determine_status(risk_score, factors)

    logger.info(
        "Scored transaction %s | amount=%.2f | score=%.4f | status=%s",
        transaction.transactionId,
        transaction.amount,
        risk_score,
        tx_status,
    )

    return RiskScoreOutput(
        transactionId=transaction.transactionId,
        riskScore=risk_score,
        status=tx_status,
        factors=factors,
    )
