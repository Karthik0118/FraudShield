"""Tests for the transaction fraud detection API.

These tests verify the endpoint contract, validation, and the
rule-based fallback behaviour (assuming no trained model is present).
"""

from datetime import datetime, timedelta

import pytest
from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)

# ── Helpers ───────────────────────────────────────────────────────────────────

def _make_txn(amount: float, receiver: str, hours_ago: int = 0) -> dict:
    t = datetime.now() - timedelta(hours=hours_ago)
    return {
        "amount": amount,
        "receiver_id": receiver,
        "timestamp": t.isoformat(),
        "transaction_type": "UPI"
    }


# ── Tests ─────────────────────────────────────────────────────────────────────

def test_missing_body_returns_422():
    response = client.post("/predict-transaction")
    assert response.status_code == 422


def test_invalid_amount_returns_422():
    payload = {
        "current_transaction": _make_txn(-100, "user_1"),
        "previous_transactions": []
    }
    response = client.post("/predict-transaction", json=payload)
    assert response.status_code == 422
    # The global exception handler returns a generic "Invalid request payload."
    # so we just verify the status code.


def test_missing_history_is_handled_gracefully():
    """Testing with 0 previous transactions."""
    payload = {
        "current_transaction": _make_txn(500, "user_1"),
        "previous_transactions": []
    }
    response = client.post("/predict-transaction", json=payload)
    assert response.status_code == 200
    
    data = response.json()
    assert "fraud_probability" in data
    assert "is_fraud" in data
    assert "risk_level" in data
    # Without history, the rule-based fallback gives a mild penalty but usually not high fraud
    assert data["risk_level"] in ["LOW", "MEDIUM"]


def test_normal_transaction_with_history():
    """Testing a normal transaction matching historical behavior."""
    history = [
        _make_txn(500, "user_1", hours_ago=24),
        _make_txn(450, "user_1", hours_ago=12),
        _make_txn(550, "user_2", hours_ago=6),
    ]
    current = _make_txn(500, "user_1", hours_ago=0)
    
    payload = {
        "current_transaction": current,
        "previous_transactions": history
    }
    response = client.post("/predict-transaction", json=payload)
    assert response.status_code == 200
    
    data = response.json()
    assert data["risk_level"] == "LOW"
    assert data["is_fraud"] is False


def test_fraudulent_transaction_high_amount_new_receiver():
    """Testing a suspicious transaction (high amount + new receiver)."""
    history = [
        _make_txn(100, "user_1", hours_ago=48),
        _make_txn(200, "user_2", hours_ago=24),
        _make_txn(150, "user_1", hours_ago=12),
        _make_txn(250, "user_3", hours_ago=6),
    ]
    # Current is 50x higher than normal, to a new receiver
    current = _make_txn(25000, "unknown_scammer_99", hours_ago=0)
    
    payload = {
        "current_transaction": current,
        "previous_transactions": history
    }
    response = client.post("/predict-transaction", json=payload)
    assert response.status_code == 200
    
    data = response.json()
    assert data["is_fraud"] is True
    assert data["risk_level"] in ["MEDIUM", "HIGH"]
    assert data["fraud_probability"] >= 0.5


def test_too_many_previous_transactions_fails():
    """The API should enforce the 10-transaction limit."""
    history = [_make_txn(100, "user_1", hours_ago=i) for i in range(1, 15)]
    current = _make_txn(100, "user_1", hours_ago=0)
    
    payload = {
        "current_transaction": current,
        "previous_transactions": history
    }
    response = client.post("/predict-transaction", json=payload)
    assert response.status_code == 422
