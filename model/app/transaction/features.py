"""Feature engineering for transaction fraud detection.

Transforms raw ``TransactionData`` objects into numeric feature vectors
suitable for both the GAT and CNN components.

Feature list (14 dimensions per transaction):
  0  amount              — raw transaction amount
  1  log_amount           — log1p(amount) to compress scale
  2  normalized_amount    — amount / historical_mean  (1.0 when no history)
  3  amount_zscore        — (amount - mean) / std  (0.0 when no history)
  4  hist_mean_amount     — mean of previous amounts  (0.0 when no history)
  5  hist_median_amount   — median of previous amounts  (0.0 when no history)
  6  time_since_prev      — hours since previous transaction  (0.0 if first)
  7  txn_frequency        — transactions per day over history window
  8  unique_receivers     — count of distinct receivers in history
  9  is_new_receiver      — 1.0 if receiver not seen in history
 10  receiver_freq        — fraction of history sent to same receiver
 11  hour_sin             — sin(2π · hour / 24)   cyclical encoding
 12  hour_cos             — cos(2π · hour / 24)
 13  day_of_week          — day-of-week / 6  (Mon=0 … Sun=6, normalized)

Design notes:
  - No data leakage: features for the current transaction are computed
    using only the *previous* transactions.
  - Missing history gracefully falls back to neutral defaults.
  - Transaction type is currently omitted from the numeric vector
    because all examples are "UPI". When additional types appear, a
    one-hot or embedding can be appended.
"""

from __future__ import annotations

import math
from dataclasses import dataclass, field
from datetime import datetime
from statistics import mean, median, stdev
from typing import Dict, List, Optional, Tuple

import torch

from app.transaction.schemas import TransactionData


NUM_FEATURES = 14


@dataclass
class TransactionFeatures:
    """Computed feature vector for a single transaction."""

    amount: float = 0.0
    log_amount: float = 0.0
    normalized_amount: float = 1.0
    amount_zscore: float = 0.0
    hist_mean_amount: float = 0.0
    hist_median_amount: float = 0.0
    time_since_prev: float = 0.0
    txn_frequency: float = 0.0
    unique_receivers: int = 0
    is_new_receiver: float = 0.0
    receiver_freq: float = 0.0
    hour_sin: float = 0.0
    hour_cos: float = 0.0
    day_of_week: float = 0.0

    def to_tensor(self) -> torch.Tensor:
        """Return a 1-D float tensor of length ``NUM_FEATURES``."""
        return torch.tensor(
            [
                self.amount,
                self.log_amount,
                self.normalized_amount,
                self.amount_zscore,
                self.hist_mean_amount,
                self.hist_median_amount,
                self.time_since_prev,
                self.txn_frequency,
                self.unique_receivers,
                self.is_new_receiver,
                self.receiver_freq,
                self.hour_sin,
                self.hour_cos,
                self.day_of_week,
            ],
            dtype=torch.float32,
        )


# ── Helpers ──────────────────────────────────────────────────────────────────

def _hours_between(a: datetime, b: datetime) -> float:
    """Positive hours from *a* to *b*."""
    return abs((b - a).total_seconds()) / 3600.0


def _cyclical_hour(dt: datetime) -> Tuple[float, float]:
    frac = dt.hour / 24.0
    return math.sin(2 * math.pi * frac), math.cos(2 * math.pi * frac)


# ── Public API ───────────────────────────────────────────────────────────────

def compute_features(
    transaction: TransactionData,
    history: List[TransactionData],
    prev_transaction: Optional[TransactionData] = None,
) -> TransactionFeatures:
    """Compute the feature vector for *transaction* given *history*.

    Parameters
    ----------
    transaction:
        The transaction to featurize.
    history:
        All transactions that occurred *before* ``transaction`` (no leakage).
    prev_transaction:
        The immediately preceding transaction (for time-since-prev).
        If ``None`` and ``history`` is non-empty, the last element of
        *history* is used.
    """
    amounts = [t.amount for t in history]
    receivers = [t.receiver_id for t in history]

    # Basic amount features
    amt = transaction.amount
    log_amt = math.log1p(amt)
    hist_mean = mean(amounts) if amounts else 0.0
    hist_med = median(amounts) if amounts else 0.0
    hist_std = stdev(amounts) if len(amounts) >= 2 else 0.0

    norm_amt = (amt / hist_mean) if hist_mean > 0 else 1.0
    z_score = ((amt - hist_mean) / hist_std) if hist_std > 0 else 0.0

    # Time features
    prev = prev_transaction
    if prev is None and history:
        prev = history[-1]
    time_since = _hours_between(prev.timestamp, transaction.timestamp) if prev else 0.0

    # Frequency: transactions per day over the history window
    if len(history) >= 2:
        span_hours = _hours_between(history[0].timestamp, history[-1].timestamp)
        span_days = max(span_hours / 24.0, 1.0 / 24.0)  # at least 1 hour
        txn_freq = len(history) / span_days
    elif history:
        txn_freq = 1.0
    else:
        txn_freq = 0.0

    # Receiver features
    unique_recv = len(set(receivers))
    is_new = 1.0 if transaction.receiver_id not in set(receivers) else 0.0
    recv_count = receivers.count(transaction.receiver_id) if receivers else 0
    recv_freq = recv_count / len(receivers) if receivers else 0.0

    # Cyclical time encoding
    h_sin, h_cos = _cyclical_hour(transaction.timestamp)
    dow = transaction.timestamp.weekday() / 6.0  # 0..1

    return TransactionFeatures(
        amount=amt,
        log_amount=log_amt,
        normalized_amount=round(norm_amt, 6),
        amount_zscore=round(z_score, 6),
        hist_mean_amount=round(hist_mean, 4),
        hist_median_amount=round(hist_med, 4),
        time_since_prev=round(time_since, 4),
        txn_frequency=round(txn_freq, 4),
        unique_receivers=unique_recv,
        is_new_receiver=is_new,
        receiver_freq=round(recv_freq, 4),
        hour_sin=round(h_sin, 6),
        hour_cos=round(h_cos, 6),
        day_of_week=round(dow, 6),
    )


def featurize_sequence(
    current: TransactionData,
    previous: List[TransactionData],
) -> Tuple[List[TransactionFeatures], TransactionFeatures]:
    """Featurize the full sequence: previous transactions + current.

    Returns
    -------
    history_features:
        Feature vectors for each previous transaction, in chronological order.
    current_features:
        Feature vector for the current transaction (computed using all
        previous transactions as history — no leakage).
    """
    # Sort previous chronologically
    sorted_prev = sorted(previous, key=lambda t: t.timestamp)

    history_features: List[TransactionFeatures] = []
    for i, txn in enumerate(sorted_prev):
        # History for this txn = everything before it in sorted order
        hist_before = sorted_prev[:i]
        prev_txn = sorted_prev[i - 1] if i > 0 else None
        feat = compute_features(txn, hist_before, prev_txn)
        history_features.append(feat)

    # Current transaction: full previous history available
    prev_txn = sorted_prev[-1] if sorted_prev else None
    current_features = compute_features(current, sorted_prev, prev_txn)

    return history_features, current_features
