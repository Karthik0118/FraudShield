"""Inference pipeline for transaction fraud detection.

This module is the single entry-point used by the API route.
It handles:
  1. Loading/initialising the model (neural or rule-based fallback)
  2. Preprocessing a request into graph + CNN tensors
  3. Running inference
  4. Returning a structured result

The inference code is **completely separate** from training code.
The model is never retrained during a request.

Fallback strategy
─────────────────
If no trained GAT+CNN model checkpoint exists on disk, a rule-based
anomaly scorer is used so that the ``/predict-transaction`` endpoint
is functional immediately.  The rule-based scorer uses statistical
anomaly detection on the engineered features.
"""

from __future__ import annotations

import logging
import time
from dataclasses import dataclass
from pathlib import Path
from typing import Dict, List, Literal, Optional

import torch

from app.transaction.config import (
    MODEL_DIR,
    RISK_THRESHOLD_HIGH,
    RISK_THRESHOLD_LOW,
    TRANSACTION_FRAUD_THRESHOLD,
)
from app.transaction.features import TransactionFeatures, featurize_sequence
from app.transaction.graph import build_transaction_graph
from app.transaction.model import TransactionFraudModel
from app.transaction.schemas import TransactionData
from app.transaction.sequence import build_cnn_sequence

logger = logging.getLogger("fraud.transaction")


# ── Result dataclass ─────────────────────────────────────────────────────────

@dataclass(frozen=True)
class TransactionPredictionResult:
    fraud_probability: float
    is_fraud: bool
    risk_level: Literal["LOW", "MEDIUM", "HIGH"]
    inference_time_ms: float
    model_version: str
    anomaly_factors: Optional[Dict[str, float]] = None


# ── Risk level helper ─────────────────────────────────────────────────────────

def _risk_level(prob: float) -> Literal["LOW", "MEDIUM", "HIGH"]:
    if prob >= RISK_THRESHOLD_HIGH:
        return "HIGH"
    if prob >= RISK_THRESHOLD_LOW:
        return "MEDIUM"
    return "LOW"


# ── Rule-based fallback ──────────────────────────────────────────────────────

def _rule_based_score(
    current_features: TransactionFeatures,
    history_features: List[TransactionFeatures],
) -> tuple[float, Dict[str, float]]:
    """Compute an anomaly score using statistical heuristics.

    Each factor contributes a score in [0, 1].  The final probability
    is a weighted average.  This is a *simple baseline* that allows the
    API to return meaningful results before training data is available.
    """
    factors: Dict[str, float] = {}

    # 1. Amount anomaly — how far is current amount from history?
    if current_features.hist_mean_amount > 0:
        ratio = current_features.amount / current_features.hist_mean_amount
        # Sigmoid-like scaling: ratio of 5x → ~0.8, 10x → ~0.95
        factors["amount_anomaly"] = min(1.0, max(0.0, 1 - 1 / (1 + 0.3 * (ratio - 1))))
    else:
        factors["amount_anomaly"] = 0.3  # no history → mild uncertainty

    # 2. Z-score anomaly
    z = abs(current_features.amount_zscore)
    factors["zscore_anomaly"] = min(1.0, z / 5.0)  # z=5 → 1.0

    # 3. New receiver flag
    factors["new_receiver"] = 0.4 if current_features.is_new_receiver > 0.5 else 0.0

    # 4. Time anomaly — unusual hour?
    #    Late night (0–5 AM) gets a mild bump
    #    hour_cos close to 1.0 → near midnight
    if current_features.hour_cos > 0.85:
        factors["unusual_time"] = 0.2
    else:
        factors["unusual_time"] = 0.0

    # 5. Velocity anomaly — too many transactions too fast?
    if current_features.time_since_prev > 0 and current_features.time_since_prev < 0.1:
        factors["high_velocity"] = 0.3
    else:
        factors["high_velocity"] = 0.0

    # 6. No history penalty
    if not history_features:
        factors["no_history"] = 0.15
    else:
        factors["no_history"] = 0.0

    # Weighted combination
    weights = {
        "amount_anomaly": 0.35,
        "zscore_anomaly": 0.25,
        "new_receiver": 0.15,
        "unusual_time": 0.08,
        "high_velocity": 0.10,
        "no_history": 0.07,
    }
    score = sum(factors[k] * weights[k] for k in factors)
    score = min(1.0, max(0.0, score))

    return score, factors


# ═══════════════════════════════════════════════════════════════════════════════
# TransactionFraudDetector — main inference class
# ═══════════════════════════════════════════════════════════════════════════════

class TransactionFraudDetector:
    """Loads the trained GAT+CNN model (or falls back to rules) and
    provides a clean ``predict()`` interface.
    """

    def __init__(self) -> None:
        self._model: Optional[TransactionFraudModel] = None
        self._model_loaded = False
        self._using_fallback = True
        self._model_version = "rule-based-v1"

    # ── Loading ──────────────────────────────────────────────────────────────

    def load(self) -> None:
        """Attempt to load a trained checkpoint.  Fall back to rules."""
        checkpoint_path = MODEL_DIR / "model" / "checkpoint.pt"
        if checkpoint_path.exists():
            try:
                self._model = TransactionFraudModel()
                state = torch.load(checkpoint_path, map_location="cpu", weights_only=True)
                self._model.load_state_dict(state)
                self._model.eval()
                self._model_loaded = True
                self._using_fallback = False
                self._model_version = "gat-cnn-v1"
                logger.info(
                    "Transaction fraud model loaded from %s", checkpoint_path,
                )
            except Exception:
                logger.warning(
                    "Failed to load transaction model from %s. "
                    "Using rule-based fallback.",
                    checkpoint_path,
                    exc_info=True,
                )
                self._model = None
                self._model_loaded = False
                self._using_fallback = True
        else:
            logger.info(
                "No trained transaction model found at %s. "
                "Using rule-based fallback scorer.",
                checkpoint_path,
            )
            self._using_fallback = True

    def is_ready(self) -> bool:
        """Return True if the detector can serve predictions."""
        return self._model_loaded or self._using_fallback

    # ── Prediction ───────────────────────────────────────────────────────────

    def predict(
        self,
        current: TransactionData,
        previous: List[TransactionData],
    ) -> TransactionPredictionResult:
        """Run fraud detection on a transaction.

        Parameters
        ----------
        current : TransactionData
        previous : List[TransactionData]  (0..10 items)

        Returns
        -------
        TransactionPredictionResult
        """
        start = time.perf_counter()

        # 1. Feature engineering
        history_features, current_features = featurize_sequence(current, previous)

        if self._using_fallback or self._model is None:
            # Rule-based path
            prob, factors = _rule_based_score(current_features, history_features)
            elapsed = (time.perf_counter() - start) * 1000

            result = TransactionPredictionResult(
                fraud_probability=round(prob, 4),
                is_fraud=prob >= TRANSACTION_FRAUD_THRESHOLD,
                risk_level=_risk_level(prob),
                inference_time_ms=round(elapsed, 2),
                model_version=self._model_version,
                anomaly_factors={k: round(v, 4) for k, v in factors.items()},
            )
        else:
            # Neural network path
            result = self._neural_predict(
                current, previous, history_features, current_features, start,
            )

        logger.info(
            "Transaction prediction: fraud_prob=%.4f is_fraud=%s risk=%s "
            "model=%s time=%.1fms",
            result.fraud_probability,
            result.is_fraud,
            result.risk_level,
            result.model_version,
            result.inference_time_ms,
        )
        return result

    def _neural_predict(
        self,
        current: TransactionData,
        previous: List[TransactionData],
        history_features: List[TransactionFeatures],
        current_features: TransactionFeatures,
        start: float,
    ) -> TransactionPredictionResult:
        """Run the GAT+CNN neural network."""
        assert self._model is not None

        # 2. Build graph
        graph_data = build_transaction_graph(current, previous)

        # 3. Build CNN sequence
        cnn_data = build_cnn_sequence(history_features)

        # 4. Current transaction feature tensor
        current_tensor = current_features.to_tensor()

        # 5. Forward pass
        with torch.no_grad():
            prob = self._model(graph_data, cnn_data, current_tensor)
            prob_val = float(prob.item())

        elapsed = (time.perf_counter() - start) * 1000

        return TransactionPredictionResult(
            fraud_probability=round(prob_val, 4),
            is_fraud=prob_val >= TRANSACTION_FRAUD_THRESHOLD,
            risk_level=_risk_level(prob_val),
            inference_time_ms=round(elapsed, 2),
            model_version=self._model_version,
        )


# ── Module-level singleton ───────────────────────────────────────────────────
transaction_detector = TransactionFraudDetector()
