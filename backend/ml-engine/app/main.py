"""
Fraud Detection ML Engine
FastAPI service exposing a /predict endpoint that scores financial transactions.
"""

from __future__ import annotations

import logging
import os
from contextlib import asynccontextmanager
from typing import AsyncGenerator

from fastapi import FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware

from app.schemas import TransactionInput, RiskScoreOutput
from app.model.classifier import Classifier

# ---------------------------------------------------------------------------
# Logging
# ---------------------------------------------------------------------------
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger("ml_engine")

# ---------------------------------------------------------------------------
# Config & Classifier Setup
# ---------------------------------------------------------------------------
HIGH_RISK_THRESHOLD = float(os.getenv("HIGH_RISK_THRESHOLD", "0.70"))
PENDING_THRESHOLD = float(os.getenv("PENDING_THRESHOLD", "0.40"))

classifier = Classifier()

def determine_status(risk_score: float) -> str:
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
    logger.info("ML Engine starting up — loading model")
    classifier.load()
    logger.info("ML Engine starting up — model ready")
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
        risk_score, factors = classifier.score(transaction)
    except Exception as exc:
        logger.exception(
            "Unexpected error during prediction for %s", transaction.transactionId
        )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Prediction failed due to an internal error.",
        ) from exc

    tx_status = determine_status(risk_score)

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
