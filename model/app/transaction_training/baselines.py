"""Baseline models for comparison.

Before claiming the GAT + CNN architecture provides value, we should
verify it outperforms simple baselines.

Baselines implemented:
  1. Logistic Regression (via manual gradient descent, no sklearn)
  2. Feature-based heuristic (rule-based scorer from inference.py)
  3. Random Forest and XGBoost (optional, requires sklearn/xgboost)

All baselines use the same engineered features as the neural model.
"""

from __future__ import annotations

import logging
from typing import List, Optional, Tuple

import numpy as np

from app.transaction.features import featurize_sequence
from app.transaction.inference import _rule_based_score
from app.transaction_training.dataset import TransactionSample
from app.transaction_training.evaluate import EvaluationReport, evaluate

logger = logging.getLogger("fraud.baselines")


def _extract_features(samples: List[TransactionSample]) -> Tuple[np.ndarray, np.ndarray]:
    """Extract feature vectors and labels from samples."""
    X_list = []
    y_list = []

    for sample in samples:
        history_feats, current_feats = featurize_sequence(
            sample.current_transaction,
            sample.previous_transactions,
        )
        X_list.append(current_feats.to_tensor().numpy())
        y_list.append(sample.label)

    return np.array(X_list), np.array(y_list)


# ═══════════════════════════════════════════════════════════════════════════════
# 1. Rule-Based Baseline
# ═══════════════════════════════════════════════════════════════════════════════

def evaluate_rule_based(
    samples: List[TransactionSample],
    threshold: float = 0.5,
) -> EvaluationReport:
    """Evaluate the rule-based fallback scorer."""
    y_true = []
    y_prob = []

    for sample in samples:
        history_feats, current_feats = featurize_sequence(
            sample.current_transaction,
            sample.previous_transactions,
        )
        prob, _ = _rule_based_score(current_feats, history_feats)
        y_true.append(sample.label)
        y_prob.append(prob)

    return evaluate(y_true, y_prob, threshold=threshold, model_name="Rule-Based")


# ═══════════════════════════════════════════════════════════════════════════════
# 2. Logistic Regression (manual, no sklearn)
# ═══════════════════════════════════════════════════════════════════════════════

class SimpleLogisticRegression:
    """Minimal logistic regression via gradient descent."""

    def __init__(self, lr: float = 0.01, epochs: int = 1000) -> None:
        self.lr = lr
        self.epochs = epochs
        self.weights: Optional[np.ndarray] = None
        self.bias: float = 0.0

    def _sigmoid(self, z: np.ndarray) -> np.ndarray:
        z_clipped = np.clip(z, -500, 500)
        return 1 / (1 + np.exp(-z_clipped))

    def fit(self, X: np.ndarray, y: np.ndarray) -> None:
        n, d = X.shape
        self.weights = np.zeros(d)
        self.bias = 0.0

        # Normalize features
        self._mean = X.mean(axis=0)
        self._std = X.std(axis=0) + 1e-8
        X_norm = (X - self._mean) / self._std

        for _ in range(self.epochs):
            z = X_norm @ self.weights + self.bias
            preds = self._sigmoid(z)
            error = preds - y
            self.weights -= self.lr * (X_norm.T @ error) / n
            self.bias -= self.lr * error.mean()

    def predict_proba(self, X: np.ndarray) -> np.ndarray:
        X_norm = (X - self._mean) / self._std
        z = X_norm @ self.weights + self.bias
        return self._sigmoid(z)


def evaluate_logistic_regression(
    train_samples: List[TransactionSample],
    test_samples: List[TransactionSample],
    threshold: float = 0.5,
) -> EvaluationReport:
    """Train and evaluate logistic regression."""
    X_train, y_train = _extract_features(train_samples)
    X_test, y_test = _extract_features(test_samples)

    model = SimpleLogisticRegression(lr=0.01, epochs=2000)
    model.fit(X_train, y_train)
    y_prob = model.predict_proba(X_test)

    return evaluate(y_test, y_prob, threshold=threshold, model_name="Logistic Regression")


# ═══════════════════════════════════════════════════════════════════════════════
# 3. Optional sklearn-based baselines
# ═══════════════════════════════════════════════════════════════════════════════

def evaluate_sklearn_baselines(
    train_samples: List[TransactionSample],
    test_samples: List[TransactionSample],
    threshold: float = 0.5,
) -> List[EvaluationReport]:
    """Train and evaluate Random Forest and (optionally) XGBoost.

    Returns an empty list if sklearn is not installed.
    """
    reports = []
    X_train, y_train = _extract_features(train_samples)
    X_test, y_test = _extract_features(test_samples)

    # Random Forest
    try:
        from sklearn.ensemble import RandomForestClassifier
        from sklearn.preprocessing import StandardScaler

        scaler = StandardScaler()
        X_train_s = scaler.fit_transform(X_train)
        X_test_s = scaler.transform(X_test)

        rf = RandomForestClassifier(
            n_estimators=100,
            max_depth=10,
            class_weight="balanced",
            random_state=42,
        )
        rf.fit(X_train_s, y_train)
        y_prob_rf = rf.predict_proba(X_test_s)[:, 1]
        reports.append(
            evaluate(y_test, y_prob_rf, threshold=threshold, model_name="Random Forest")
        )
        logger.info("Random Forest evaluation complete.")
    except ImportError:
        logger.info("sklearn not installed — skipping Random Forest baseline.")

    # XGBoost
    try:
        from xgboost import XGBClassifier

        n_pos = y_train.sum()
        n_neg = len(y_train) - n_pos
        scale = n_neg / max(1, n_pos)

        xgb = XGBClassifier(
            n_estimators=100,
            max_depth=6,
            scale_pos_weight=scale,
            eval_metric="logloss",
            random_state=42,
        )
        xgb.fit(X_train, y_train)
        y_prob_xgb = xgb.predict_proba(X_test)[:, 1]
        reports.append(
            evaluate(y_test, y_prob_xgb, threshold=threshold, model_name="XGBoost")
        )
        logger.info("XGBoost evaluation complete.")
    except ImportError:
        logger.info("xgboost not installed — skipping XGBoost baseline.")

    return reports
