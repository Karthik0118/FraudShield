"""FastAPI router for the transaction fraud detection endpoint.

Mounts under the main ``app`` in ``main.py``.
All existing routes (``/predict``, ``/health``) are unaffected.
"""

from __future__ import annotations

import logging

from fastapi import APIRouter, HTTPException

from app.transaction.config import MAX_PREVIOUS_TRANSACTIONS
from app.transaction.history_provider import RequestTransactionHistoryProvider
from app.transaction.inference import transaction_detector
from app.transaction.schemas import (
    TransactionPredictRequest,
    TransactionPredictResponse,
)

logger = logging.getLogger("fraud.transaction.api")

router = APIRouter(tags=["transaction"])


@router.post(
    "/predict-transaction",
    response_model=TransactionPredictResponse,
    summary="Detect fraud in a UPI transaction",
    description=(
        "Analyzes the current transaction against the user's recent "
        "transaction history using a GAT + 1D CNN architecture. "
        "Returns fraud probability, binary classification, and risk level."
    ),
)
def predict_transaction(payload: TransactionPredictRequest) -> TransactionPredictResponse:
    """Evaluate a transaction for fraud."""

    # ── Validate current transaction ─────────────────────────────────────────
    current = payload.current_transaction
    if current.amount <= 0:
        raise HTTPException(status_code=422, detail="Transaction amount must be positive.")

    # ── Obtain history via provider abstraction ──────────────────────────────
    provider = RequestTransactionHistoryProvider(payload.previous_transactions)
    previous = provider.get_history(limit=MAX_PREVIOUS_TRANSACTIONS)

    # ── Additional validation ────────────────────────────────────────────────
    for i, txn in enumerate(previous):
        if txn.amount <= 0:
            raise HTTPException(
                status_code=422,
                detail=f"previous_transactions[{i}].amount must be positive.",
            )

    # ── Check detector readiness ─────────────────────────────────────────────
    if not transaction_detector.is_ready():
        raise HTTPException(
            status_code=503,
            detail="Transaction fraud detection model is not loaded.",
        )

    # ── Run inference ────────────────────────────────────────────────────────
    result = transaction_detector.predict(current, previous)

    return TransactionPredictResponse(
        fraud_probability=result.fraud_probability,
        is_fraud=result.is_fraud,
        risk_level=result.risk_level,
        inference_time_ms=result.inference_time_ms,
        model_version=result.model_version,
        anomaly_factors=result.anomaly_factors,
    )
