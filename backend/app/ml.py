"""
Model benchmarking, selection, training and inference.

Methodology
  * Out-of-time split: the most recent 20% of transactions are a hold-out test
    set, mirroring how a fraud model is deployed (it scores the future).
  * Candidates (Logistic Regression, Random Forest, HistGradientBoosting,
    XGBoost, LightGBM) are compared with stratified K-fold CV on the training
    window using PR-AUC (average precision) - the right headline metric at a
    ~3% base rate, where ROC-AUC flatters every model.
  * The winning family gets a randomised hyper-parameter search, then is refit
    on all data for serving.
  * Decision thresholds come from out-of-fold predictions, never from test.
  * Every transaction in the dataset is scored out-of-fold, so the dashboard
    shows honest scores rather than scores on rows the model memorised.
"""

from __future__ import annotations

import logging
import time
from datetime import datetime, timezone
from typing import Any, Callable

import numpy as np
import pandas as pd
from sklearn.base import clone
from sklearn.ensemble import HistGradientBoostingClassifier, RandomForestClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import (
    average_precision_score,
    brier_score_loss,
    confusion_matrix,
    f1_score,
    precision_recall_curve,
    precision_score,
    recall_score,
    roc_auc_score,
    roc_curve,
)
from sklearn.model_selection import ParameterSampler, StratifiedKFold
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler

from app.constants import country_distance_km
from app.explainer import column_contributions, explain_rows, top_factors
from app.features import FEATURE_COLUMNS, build_features, feature_group

log = logging.getLogger(__name__)
SEED = 42
TEST_FRACTION = 0.2


# --------------------------------------------------------------------------- candidates
def candidates() -> dict[str, Any]:
    models: dict[str, Any] = {
        "Logistic Regression": Pipeline(
            [("scale", StandardScaler()), ("clf", LogisticRegression(max_iter=2000, C=0.5))]
        ),
        "Random Forest": RandomForestClassifier(
            n_estimators=300, min_samples_leaf=2, n_jobs=-1, random_state=SEED
        ),
        "HistGradientBoosting": HistGradientBoostingClassifier(
            max_iter=400, learning_rate=0.05, max_leaf_nodes=31, random_state=SEED
        ),
    }
    try:
        from xgboost import XGBClassifier

        models["XGBoost"] = XGBClassifier(
            n_estimators=500, learning_rate=0.05, max_depth=5, subsample=0.85,
            colsample_bytree=0.8, min_child_weight=2, eval_metric="aucpr",
            tree_method="hist", n_jobs=-1, random_state=SEED,
        )
    except ImportError:
        log.warning("xgboost not installed - skipping candidate")
    try:
        from lightgbm import LGBMClassifier

        models["LightGBM"] = LGBMClassifier(
            n_estimators=500, learning_rate=0.05, num_leaves=31, subsample=0.85,
            subsample_freq=1, colsample_bytree=0.8, min_child_samples=20,
            random_state=SEED, n_jobs=-1, verbose=-1,
        )
    except ImportError:
        log.warning("lightgbm not installed - skipping candidate")
    return models


SEARCH_SPACES: dict[str, dict[str, list]] = {
    "XGBoost": {
        "n_estimators": [300, 500, 800], "learning_rate": [0.02, 0.05, 0.1],
        "max_depth": [3, 4, 5, 6, 8], "min_child_weight": [1, 2, 5],
        "subsample": [0.7, 0.85, 1.0], "colsample_bytree": [0.6, 0.8, 1.0],
        "reg_lambda": [0.5, 1.0, 3.0],
    },
    "LightGBM": {
        "n_estimators": [300, 500, 800], "learning_rate": [0.02, 0.05, 0.1],
        "num_leaves": [15, 31, 63], "min_child_samples": [10, 20, 40],
        "subsample": [0.7, 0.85, 1.0], "colsample_bytree": [0.6, 0.8, 1.0],
        "reg_lambda": [0.0, 1.0, 3.0],
    },
    "HistGradientBoosting": {
        "max_iter": [200, 400, 800], "learning_rate": [0.02, 0.05, 0.1],
        "max_leaf_nodes": [15, 31, 63], "min_samples_leaf": [10, 20, 40],
        "l2_regularization": [0.0, 1.0, 3.0],
    },
    "Random Forest": {
        "n_estimators": [200, 400], "max_depth": [None, 12, 20],
        "min_samples_leaf": [1, 2, 5], "max_features": ["sqrt", 0.3, 0.5],
    },
    "Logistic Regression": {"C": [0.05, 0.1, 0.5, 1.0, 5.0]},
}


def _set_params(model: Any, params: dict[str, Any]) -> Any:
    m = clone(model)
    if hasattr(m, "steps"):
        params = {f"clf__{k}": v for k, v in params.items()}
    return m.set_params(**params)


# --------------------------------------------------------------------------- metrics helpers
def _oof(model: Any, X: pd.DataFrame, y: np.ndarray, folds: int) -> np.ndarray:
    skf = StratifiedKFold(n_splits=folds, shuffle=True, random_state=SEED)
    oof = np.zeros(len(y))
    for tr, va in skf.split(X, y):
        m = clone(model).fit(X.iloc[tr], y[tr])
        oof[va] = m.predict_proba(X.iloc[va])[:, 1]
    return oof


def _best_f1_threshold(y: np.ndarray, p: np.ndarray) -> float:
    prec, rec, thr = precision_recall_curve(y, p)
    f1 = 2 * prec[:-1] * rec[:-1] / np.clip(prec[:-1] + rec[:-1], 1e-9, None)
    return float(thr[int(np.argmax(f1))])


def _recall_threshold(y: np.ndarray, p: np.ndarray, target: float) -> float:
    _, rec, thr = precision_recall_curve(y, p)
    ok = np.where(rec[:-1] >= target)[0]
    return float(thr[ok[-1]]) if len(ok) else float(thr[0])


def _curve(xs: np.ndarray, ys: np.ndarray, n: int = 120) -> list[dict[str, float]]:
    idx = np.unique(np.linspace(0, len(xs) - 1, min(n, len(xs))).astype(int))
    return [{"x": round(float(xs[i]), 4), "y": round(float(ys[i]), 4)} for i in idx]


def evaluate(y: np.ndarray, p: np.ndarray, threshold: float) -> dict[str, float]:
    pred = (p >= threshold).astype(int)
    return {
        "roc_auc": round(float(roc_auc_score(y, p)), 4),
        "pr_auc": round(float(average_precision_score(y, p)), 4),
        "precision": round(float(precision_score(y, pred, zero_division=0)), 4),
        "recall": round(float(recall_score(y, pred)), 4),
        "f1": round(float(f1_score(y, pred)), 4),
        "brier": round(float(brier_score_loss(y, p)), 5),
    }


def _grouped_importance(model: Any, X: pd.DataFrame) -> list[dict[str, float]]:
    """Mean |SHAP| per raw feature group when available, else impurity importance."""
    contrib = column_contributions(model, X)
    if contrib is not None:
        col_imp = np.abs(contrib).mean(axis=0)
    else:
        est = model.steps[-1][1] if hasattr(model, "steps") else model
        col_imp = getattr(est, "feature_importances_", np.zeros(len(FEATURE_COLUMNS)))
    groups: dict[str, float] = {}
    for col, v in zip(FEATURE_COLUMNS, col_imp):
        groups[feature_group(col)] = groups.get(feature_group(col), 0.0) + float(v)
    total = sum(groups.values()) or 1.0
    return sorted(
        ({"feature": g, "importance": round(v / total, 4)} for g, v in groups.items()),
        key=lambda d: -d["importance"],
    )


# --------------------------------------------------------------------------- training
def train(
    df: pd.DataFrame,
    cv_folds: int = 5,
    tuning_iterations: int = 12,
    progress: Callable[[str], None] = log.info,
) -> dict[str, Any]:
    t0 = time.time()
    df = df.sort_values("timestamp").reset_index(drop=True)
    X = build_features(df)
    y = df["is_fraud"].to_numpy().astype(int)

    cut = int(len(df) * (1 - TEST_FRACTION))
    X_tr, X_te, y_tr, y_te = X.iloc[:cut], X.iloc[cut:], y[:cut], y[cut:]
    progress(
        f"Rows {len(df):,} | train {len(X_tr):,} ({y_tr.mean():.2%} fraud) | "
        f"test {len(X_te):,} ({y_te.mean():.2%} fraud)"
    )

    # 1. Benchmark every candidate ------------------------------------------------
    comparison, test_preds = [], {}
    for name, model in candidates().items():
        start = time.time()
        oof = _oof(model, X_tr, y_tr, cv_folds)
        thr = _best_f1_threshold(y_tr, oof)
        fitted = clone(model).fit(X_tr, y_tr)
        fit_s = time.time() - start
        t = time.perf_counter()
        p_te = fitted.predict_proba(X_te)[:, 1]
        latency_ms = (time.perf_counter() - t) / len(X_te) * 1000
        test_preds[name] = p_te
        comparison.append({
            "model": name,
            "cv_pr_auc": round(float(average_precision_score(y_tr, oof)), 4),
            "threshold": round(thr, 4),
            **evaluate(y_te, p_te, thr),
            "train_seconds": round(fit_s, 1),
            "latency_ms": round(latency_ms, 4),
        })
        progress(f"  {name:22s} cv PR-AUC {comparison[-1]['cv_pr_auc']:.4f} | "
                 f"test PR-AUC {comparison[-1]['pr_auc']:.4f} ({fit_s:.1f}s)")

    comparison.sort(key=lambda r: -r["cv_pr_auc"])
    winner = comparison[0]["model"]
    progress(f"Selected {winner} (best CV PR-AUC)")

    # 2. Tune the winner ----------------------------------------------------------
    base = candidates()[winner]
    best_params: dict[str, Any] = {}
    best_cv = comparison[0]["cv_pr_auc"]
    space = SEARCH_SPACES.get(winner)
    if space and tuning_iterations > 0:
        # Compare candidates against the defaults on the same 3-fold protocol.
        best_cv = float(average_precision_score(y_tr, _oof(base, X_tr, y_tr, 3)))
        progress(f"Tuning {winner}: default 3-fold CV PR-AUC {best_cv:.4f}")
        for params in ParameterSampler(space, n_iter=tuning_iterations, random_state=SEED):
            score = float(average_precision_score(y_tr, _oof(_set_params(base, params), X_tr, y_tr, 3)))
            if score > best_cv:
                best_cv, best_params = score, params
        progress(f"Tuned CV PR-AUC {best_cv:.4f} with {best_params or 'default params'}")
    tuned = _set_params(base, best_params) if best_params else clone(base)

    # Hold-out report for the tuned model (fit on the training window only)
    thr_tr = _best_f1_threshold(y_tr, _oof(tuned, X_tr, y_tr, cv_folds))
    p_te = clone(tuned).fit(X_tr, y_tr).predict_proba(X_te)[:, 1]
    test_metrics = evaluate(y_te, p_te, thr_tr)
    tn, fp, fn, tp = confusion_matrix(y_te, (p_te >= thr_tr).astype(int)).ravel().tolist()
    fpr, tpr, _ = roc_curve(y_te, p_te)
    prec, rec, _ = precision_recall_curve(y_te, p_te)

    # 3. Out-of-fold scores for every row + decision thresholds ----------------
    skf = StratifiedKFold(n_splits=cv_folds, shuffle=True, random_state=SEED)
    oof_all = np.zeros(len(y))
    factors: list[list[str]] = [[] for _ in range(len(y))]
    for tr, va in skf.split(X, y):
        m = clone(tuned).fit(X.iloc[tr], y[tr])
        oof_all[va] = m.predict_proba(X.iloc[va])[:, 1]
        for i, contribs in zip(va, explain_rows(m, df.iloc[va], X.iloc[va])):
            factors[i] = top_factors(contribs)
    flag_thr = _best_f1_threshold(y, oof_all)
    review_thr = min(_recall_threshold(y, oof_all, 0.92), flag_thr * 0.6)

    final = clone(tuned).fit(X, y)
    legit = df[df.is_fraud == 0]
    now = datetime.now(timezone.utc)
    oof_pred = (oof_all >= flag_thr).astype(int)

    metrics = {
        "selected_model": winner,
        "selection_metric": f"{cv_folds}-fold CV PR-AUC on the training window",
        "params": {k: (v if v is None or isinstance(v, (int, float, str)) else str(v)) for k, v in best_params.items()},
        "tuned_cv_pr_auc": round(best_cv, 4),
        "thresholds": {"flag": round(flag_thr, 4), "review": round(review_thr, 4)},
        "dataset": {
            "rows": int(len(df)),
            "fraud_rows": int(y.sum()),
            "fraud_rate": round(float(y.mean()), 4),
            "customers": int(df.customer_id.nunique()),
            "features": len(FEATURE_COLUMNS),
            "train_rows": int(cut),
            "test_rows": int(len(df) - cut),
            "test_start": df.timestamp.iloc[cut].isoformat(),
        },
        "comparison": comparison,
        "test": {
            **test_metrics,
            "threshold": round(thr_tr, 4),
            "confusion_matrix": {"tn": tn, "fp": fp, "fn": fn, "tp": tp},
            "roc": _curve(fpr, tpr),
            "pr": _curve(rec[::-1], prec[::-1]),
            "roc_by_model": {name: _curve(*roc_curve(y_te, p)[:2], n=60) for name, p in test_preds.items()},
        },
        "out_of_fold": {
            **evaluate(y, oof_all, flag_thr),
            "flagged": int(oof_pred.sum()),
            "caught_fraud": int((oof_pred & y).sum()),
        },
        "feature_importance": _grouped_importance(final, X),
        "training_seconds": round(time.time() - t0, 1),
    }
    progress(f"Trained in {metrics['training_seconds']}s | thresholds flag={flag_thr:.4f} review={review_thr:.4f}")

    return {
        "model": final,
        "model_name": winner,
        "version": now.strftime("%Y%m%d.%H%M"),
        "trained_at": now.isoformat(),
        "features": FEATURE_COLUMNS,
        "thresholds": {"flag": flag_thr, "review": review_thr},
        "defaults": {
            "account_age_days": float(legit.account_age_days.median()),
            "device_age_days": float(legit.device_age_days.median()),
            "ip_risk_score": float(legit.ip_risk_score.median()),
            "txn_count_1h": 0.0,
            "txn_count_24h": float(legit.txn_count_24h.median()),
            "failed_logins_24h": 0.0,
        },
        "metrics": metrics,
        "scores": pd.DataFrame({
            "transaction_id": df["transaction_id"].to_numpy(),
            "risk_score": np.round(oof_all, 4),
            "risk_factors": factors,
        }),
    }


# --------------------------------------------------------------------------- inference
DEFAULT_CATEGORY = {"PURCHASE": "grocery", "TRANSFER": "p2p", "WITHDRAWAL": "atm", "DEPOSIT": "payroll"}
DEFAULT_CHANNEL = {"PURCHASE": "WEB", "TRANSFER": "MOBILE", "WITHDRAWAL": "ATM", "DEPOSIT": "MOBILE"}


def status_for(score: float, thresholds: dict[str, float]) -> str:
    if score >= thresholds["flag"]:
        return "FLAGGED"
    if score >= thresholds["review"]:
        return "PENDING"
    return "APPROVED"


def complete_record(bundle: dict[str, Any], tx: dict[str, Any]) -> dict[str, Any]:
    """Fills behavioural context the caller did not supply with neutral defaults."""
    d = bundle["defaults"]
    ttype = tx["type"].upper()
    country = (tx.get("country") or "US").upper()
    home = (tx.get("home_country") or country).upper()
    is_new = tx.get("is_new_device")
    if is_new is None:
        is_new = not tx.get("device_id")
    is_vpn = bool(tx.get("is_vpn"))
    ip_risk = tx.get("ip_risk_score")
    if ip_risk is None:
        ip_risk = 0.5 if not tx.get("ip_address") else d["ip_risk_score"] + (0.22 if is_vpn else 0.0)
    distance = tx.get("distance_from_home_km")
    if distance is None:
        distance = country_distance_km(country, home) or 5.0

    def pick(key: str, fallback: float) -> float:
        value = tx.get(key)
        return fallback if value is None else value

    return {
        "transaction_id": tx.get("transaction_id") or "SIM",
        "customer_id": tx.get("customer_id") or "UNKNOWN",
        "timestamp": pd.Timestamp(tx.get("timestamp") or datetime.now(timezone.utc)),
        "amount": float(tx["amount"]),
        "type": ttype,
        "merchant_category": (tx.get("merchant_category") or DEFAULT_CATEGORY[ttype]).lower(),
        "channel": (tx.get("channel") or DEFAULT_CHANNEL[ttype]).upper(),
        "country": country,
        "home_country": home,
        "ip_address": tx.get("ip_address"),
        "device_id": tx.get("device_id"),
        "amount_to_avg_ratio": pick("amount_to_avg_ratio", 1.0),
        "distance_from_home_km": distance,
        "account_age_days": pick("account_age_days", d["account_age_days"]),
        "device_age_days": pick("device_age_days", 0.0 if is_new else d["device_age_days"]),
        "is_new_device": int(bool(is_new)),
        "is_vpn": int(is_vpn),
        "ip_risk_score": float(min(1.0, ip_risk)),
        "txn_count_1h": pick("txn_count_1h", d["txn_count_1h"]),
        "txn_count_24h": pick("txn_count_24h", d["txn_count_24h"]),
        "failed_logins_24h": pick("failed_logins_24h", d["failed_logins_24h"]),
    }


def score_records(bundle: dict[str, Any], raw: pd.DataFrame) -> tuple[np.ndarray, list[list[dict[str, Any]]]]:
    X = build_features(raw)
    model = bundle["model"]
    scores = np.round(model.predict_proba(X)[:, 1], 4)
    return scores, explain_rows(model, raw, X)
