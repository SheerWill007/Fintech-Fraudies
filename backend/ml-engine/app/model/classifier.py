import os
import numpy as np
from app.schemas import TransactionInput
from app.model.features import extract_features
from app.model.explainer import explain

LARGE_AMOUNT_THRESHOLD = float(os.getenv("LARGE_AMOUNT_THRESHOLD", "5000"))

class Classifier:
    def __init__(self):
        self.model = None

    def load(self):
        """
        Simulate model loading. In a real-world scenario, you would do:
        import joblib
        self.model = joblib.load("model.pkl")
        """
        self.model = "Simulated Random Forest Classifier (100 trees)"

    def score(self, transaction: TransactionInput) -> tuple[float, list[str]]:
        """
        Scores the transaction using feature extraction and scoring rules.
        Returns a tuple of (risk_score, factors).
        """
        features = extract_features(transaction)
        
        # Deterministic feature-based scoring (mimicking a Random Forest predict_proba output)
        score = 0.10  # baseline
        
        # Feature 1: Large transaction amount
        if transaction.amount > LARGE_AMOUNT_THRESHOLD:
            increment = min(0.30, (transaction.amount / LARGE_AMOUNT_THRESHOLD - 1) * 0.15)
            score += increment

        # Feature 2: High-risk transaction type
        if transaction.type in {"TRANSFER", "WITHDRAWAL"}:
            score += 0.15

        # Feature 3: Missing device / IP context
        if transaction.deviceId is None and transaction.ipAddress is None:
            score += 0.20
        elif transaction.deviceId is None:
            score += 0.08

        # Ensure bounds are strictly [0.0, 1.0]
        score = float(np.clip(score, 0.0, 1.0))
        risk_score = round(score, 4)
        
        # Generate explanations (features group contributions)
        factors = explain(transaction, features, risk_score)
        
        return risk_score, factors
