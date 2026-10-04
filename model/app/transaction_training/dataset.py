"""Synthetic dataset generator and dataset interface.

Since no real labelled transaction fraud dataset is included in the
project, this module provides:

1. A clean ``TransactionDataset`` interface so a real dataset can be
   plugged in later.
2. A ``SyntheticDatasetGenerator`` that creates realistic-looking
   transaction sequences with fraud labels for development and
   initial model training.

Synthetic data generation strategy
───────────────────────────────────
- Normal users: consistent amounts, regular receivers, normal hours
- Fraudulent sequences: the *last* transaction (the "current" one)
  exhibits anomalous behaviour such as:
    • amount 5–50× higher than usual
    • new receiver never seen before
    • unusual time (late night)
    • multiple anomaly signals combined

This is NOT a substitute for real data.  It exists only to:
  - Verify the training pipeline works end-to-end
  - Provide a smoke-test dataset
  - Allow baseline comparison
"""

from __future__ import annotations

import random
from dataclasses import dataclass, field
from datetime import datetime, timedelta
from typing import List, Optional, Tuple

from app.transaction.schemas import TransactionData


@dataclass
class TransactionSample:
    """A single training/evaluation sample."""
    current_transaction: TransactionData
    previous_transactions: List[TransactionData]
    label: int  # 0 = legitimate, 1 = fraud


class TransactionDataset:
    """Abstract-ish dataset interface.

    Subclass or replace this to load real data from CSV, Parquet, or
    a database.
    """

    def __init__(self, samples: List[TransactionSample]) -> None:
        self.samples = samples

    def __len__(self) -> int:
        return len(self.samples)

    def __getitem__(self, idx: int) -> TransactionSample:
        return self.samples[idx]

    @property
    def labels(self) -> List[int]:
        return [s.label for s in self.samples]

    def split(
        self,
        train_ratio: float = 0.7,
        val_ratio: float = 0.15,
        temporal: bool = True,
    ) -> Tuple["TransactionDataset", "TransactionDataset", "TransactionDataset"]:
        """Split into train/val/test sets.

        If ``temporal=True``, uses chronological ordering (recommended
        for fraud detection to avoid future leakage).  Otherwise random.
        """
        if temporal:
            # Sort by current transaction timestamp
            sorted_samples = sorted(
                self.samples, key=lambda s: s.current_transaction.timestamp,
            )
        else:
            sorted_samples = list(self.samples)
            random.shuffle(sorted_samples)

        n = len(sorted_samples)
        train_end = int(n * train_ratio)
        val_end = int(n * (train_ratio + val_ratio))

        return (
            TransactionDataset(sorted_samples[:train_end]),
            TransactionDataset(sorted_samples[train_end:val_end]),
            TransactionDataset(sorted_samples[val_end:]),
        )


# ═══════════════════════════════════════════════════════════════════════════════
# Synthetic Data Generator
# ═══════════════════════════════════════════════════════════════════════════════

_RECEIVERS = [f"user_{i:03d}" for i in range(1, 51)]
_TXN_TYPES = ["UPI", "UPI", "UPI", "NEFT", "IMPS"]  # weighted towards UPI


class SyntheticDatasetGenerator:
    """Generate synthetic transaction sequences with fraud labels."""

    def __init__(self, seed: int = 42) -> None:
        self.rng = random.Random(seed)

    def generate(
        self,
        n_samples: int = 1000,
        fraud_ratio: float = 0.2,
    ) -> TransactionDataset:
        """Generate ``n_samples`` sequences.

        Parameters
        ----------
        n_samples : int
            Total number of samples to generate.
        fraud_ratio : float
            Fraction of samples that should be fraudulent.
        """
        samples: List[TransactionSample] = []
        n_fraud = int(n_samples * fraud_ratio)
        n_legit = n_samples - n_fraud

        base_time = datetime(2026, 1, 1, 9, 0, 0)

        for i in range(n_legit):
            sample = self._generate_normal_sample(
                base_time + timedelta(days=i * 0.5),
            )
            samples.append(sample)

        for i in range(n_fraud):
            sample = self._generate_fraud_sample(
                base_time + timedelta(days=(n_legit + i) * 0.5),
            )
            samples.append(sample)

        # Shuffle to mix fraud/legit
        self.rng.shuffle(samples)
        return TransactionDataset(samples)

    def _generate_normal_sample(self, base_time: datetime) -> TransactionSample:
        """Generate a normal transaction sequence."""
        user_avg = self.rng.uniform(100, 5000)
        user_std = user_avg * 0.3
        user_receivers = self.rng.sample(_RECEIVERS, k=self.rng.randint(3, 8))

        n_prev = self.rng.randint(1, 10)
        previous = []
        t = base_time

        for _ in range(n_prev):
            amt = max(10, self.rng.gauss(user_avg, user_std))
            recv = self.rng.choice(user_receivers)
            t += timedelta(hours=self.rng.uniform(1, 48))
            previous.append(TransactionData(
                amount=round(amt, 2),
                receiver_id=recv,
                timestamp=t,
                transaction_type=self.rng.choice(_TXN_TYPES),
            ))

        # Current = normal transaction
        t += timedelta(hours=self.rng.uniform(1, 24))
        current_amt = max(10, self.rng.gauss(user_avg, user_std))
        current = TransactionData(
            amount=round(current_amt, 2),
            receiver_id=self.rng.choice(user_receivers),
            timestamp=t,
            transaction_type=self.rng.choice(_TXN_TYPES),
        )

        return TransactionSample(
            current_transaction=current,
            previous_transactions=previous,
            label=0,
        )

    def _generate_fraud_sample(self, base_time: datetime) -> TransactionSample:
        """Generate a sequence where the current transaction is anomalous."""
        user_avg = self.rng.uniform(100, 3000)
        user_std = user_avg * 0.2
        user_receivers = self.rng.sample(_RECEIVERS, k=self.rng.randint(3, 6))

        n_prev = self.rng.randint(2, 10)
        previous = []
        t = base_time

        for _ in range(n_prev):
            amt = max(10, self.rng.gauss(user_avg, user_std))
            recv = self.rng.choice(user_receivers)
            t += timedelta(hours=self.rng.uniform(2, 48))
            previous.append(TransactionData(
                amount=round(amt, 2),
                receiver_id=recv,
                timestamp=t,
                transaction_type=self.rng.choice(_TXN_TYPES),
            ))

        # Current = anomalous transaction
        fraud_type = self.rng.choice(["high_amount", "new_receiver", "combined", "velocity"])

        if fraud_type == "high_amount":
            current_amt = user_avg * self.rng.uniform(5, 50)
            recv = self.rng.choice(user_receivers)
            t += timedelta(hours=self.rng.uniform(1, 24))
        elif fraud_type == "new_receiver":
            current_amt = max(user_avg * 2, self.rng.gauss(user_avg * 3, user_std))
            recv = f"unknown_{self.rng.randint(1000, 9999)}"
            t += timedelta(hours=self.rng.uniform(1, 24))
        elif fraud_type == "combined":
            current_amt = user_avg * self.rng.uniform(8, 30)
            recv = f"unknown_{self.rng.randint(1000, 9999)}"
            # Late night
            t += timedelta(hours=self.rng.uniform(1, 6))
            t = t.replace(hour=self.rng.randint(1, 4))
        else:  # velocity
            current_amt = user_avg * self.rng.uniform(3, 10)
            recv = f"unknown_{self.rng.randint(1000, 9999)}"
            # Very soon after last
            t += timedelta(minutes=self.rng.uniform(1, 10))

        current = TransactionData(
            amount=round(max(10, current_amt), 2),
            receiver_id=recv,
            timestamp=t,
            transaction_type=self.rng.choice(_TXN_TYPES),
        )

        return TransactionSample(
            current_transaction=current,
            previous_transactions=previous,
            label=1,
        )
