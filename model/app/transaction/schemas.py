"""Pydantic schemas for the transaction fraud detection endpoint.

These schemas define the API contract for ``POST /predict-transaction``.
They are entirely separate from the existing text-prediction schemas
in ``app.schemas``, which remain unchanged.
"""

from __future__ import annotations

from datetime import datetime
from typing import List, Literal, Optional

from pydantic import BaseModel, Field, field_validator


# ── Request models ────────────────────────────────────────────────────────────

class TransactionData(BaseModel):
    """A single UPI transaction."""

    amount: float = Field(
        ...,
        gt=0,
        description="Transaction amount in INR. Must be positive.",
    )
    receiver_id: str = Field(
        ...,
        min_length=1,
        description="Identifier of the payment receiver.",
    )
    timestamp: datetime = Field(
        ...,
        description="ISO-8601 timestamp of the transaction.",
    )
    transaction_type: str = Field(
        default="UPI",
        description="Payment method/type (e.g. UPI, NEFT, IMPS).",
    )

    @field_validator("receiver_id", mode="before")
    @classmethod
    def strip_receiver(cls, v: str) -> str:
        if isinstance(v, str):
            v = v.strip()
            if not v:
                raise ValueError("receiver_id cannot be empty or whitespace.")
        return v

    model_config = {
        "json_schema_extra": {
            "examples": [
                {
                    "amount": 5000,
                    "receiver_id": "user_123",
                    "timestamp": "2026-10-04T13:00:00",
                    "transaction_type": "UPI",
                }
            ]
        }
    }


class TransactionPredictRequest(BaseModel):
    """Request body for ``POST /predict-transaction``."""

    current_transaction: TransactionData = Field(
        ...,
        description="The transaction being evaluated for fraud.",
    )
    previous_transactions: List[TransactionData] = Field(
        default_factory=list,
        description=(
            "Up to 10 most recent transactions for the same user, "
            "ordered chronologically (oldest first). "
            "May be empty if no history is available."
        ),
    )

    @field_validator("previous_transactions", mode="before")
    @classmethod
    def limit_history(cls, v: list) -> list:
        if len(v) > 10:
            raise ValueError(
                f"previous_transactions may contain at most 10 items, got {len(v)}."
            )
        return v

    model_config = {
        "json_schema_extra": {
            "examples": [
                {
                    "current_transaction": {
                        "amount": 25000,
                        "receiver_id": "unknown_receiver",
                        "timestamp": "2026-10-04T13:00:00",
                        "transaction_type": "UPI",
                    },
                    "previous_transactions": [
                        {
                            "amount": 200,
                            "receiver_id": "user_001",
                            "timestamp": "2026-10-03T10:00:00",
                            "transaction_type": "UPI",
                        },
                        {
                            "amount": 350,
                            "receiver_id": "user_002",
                            "timestamp": "2026-10-03T14:30:00",
                            "transaction_type": "UPI",
                        },
                    ],
                }
            ]
        }
    }


# ── Response models ───────────────────────────────────────────────────────────

class TransactionPredictResponse(BaseModel):
    """Response body from ``POST /predict-transaction``."""

    fraud_probability: float = Field(
        ...,
        ge=0.0,
        le=1.0,
        description="Probability that the current transaction is fraudulent (0–1).",
    )
    is_fraud: bool = Field(
        ...,
        description="Whether the transaction exceeds the fraud threshold.",
    )
    risk_level: Literal["LOW", "MEDIUM", "HIGH"] = Field(
        ...,
        description="Categorical risk assessment.",
    )
    inference_time_ms: float = Field(
        ...,
        description="Total inference time in milliseconds.",
    )
    model_version: str = Field(
        ...,
        description="Identifier of the model/method used for prediction.",
    )
    anomaly_factors: Optional[dict] = Field(
        default=None,
        description=(
            "Breakdown of why the transaction was flagged. "
            "Only populated by the rule-based fallback."
        ),
    )
