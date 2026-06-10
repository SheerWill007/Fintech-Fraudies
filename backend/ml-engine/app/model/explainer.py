import os
import numpy as np
from app.schemas import TransactionInput

LARGE_AMOUNT_THRESHOLD = float(os.getenv("LARGE_AMOUNT_THRESHOLD", "5000"))
HIGH_RISK_TYPES = {"TRANSFER", "WITHDRAWAL"}

def explain(transaction: TransactionInput, features: np.ndarray, risk_score: float) -> list[str]:
    """
    Generates human-readable risk factors from the feature vector and transaction input.
    In a fully trained model pipeline, this would extract features with the highest
    contributions (e.g. using SHAP or feature importances).
    """
    factors: list[str] = []

    # 1. Amount threshold check
    if transaction.amount > LARGE_AMOUNT_THRESHOLD:
        factors.append(f"Large transaction amount (${transaction.amount:,.2f})")

    # 2. Transaction type risk check
    if transaction.type in HIGH_RISK_TYPES:
        factors.append(f"High-risk transaction type ({transaction.type})")

    # 3. Device/IP risk check (features[13] is new device / missing device)
    if transaction.deviceId is None and transaction.ipAddress is None:
        factors.append("No device or IP context provided")
    elif transaction.deviceId is None:
        factors.append("No device ID provided")

    return factors
