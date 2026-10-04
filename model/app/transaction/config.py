"""Transaction-specific configuration.

All thresholds and model hyperparameters are loaded from environment
variables with sensible defaults so the system works out of the box.
"""

import os
from pathlib import Path


def _float_env(name: str, default: float) -> float:
    raw = os.getenv(name, str(default)).strip()
    try:
        return float(raw)
    except ValueError as exc:
        raise ValueError(f"{name} must be a number, got {raw!r}") from exc


def _int_env(name: str, default: int) -> int:
    raw = os.getenv(name, str(default)).strip()
    try:
        return int(raw)
    except ValueError as exc:
        raise ValueError(f"{name} must be an integer, got {raw!r}") from exc


# ── Fraud threshold ──────────────────────────────────────────────────────────
# Transaction fraud_probability >= this value → classified as fraud.
TRANSACTION_FRAUD_THRESHOLD = _float_env("TRANSACTION_FRAUD_THRESHOLD", 0.5)

# ── Risk level boundaries ────────────────────────────────────────────────────
RISK_THRESHOLD_LOW = _float_env("RISK_THRESHOLD_LOW", 0.3)
RISK_THRESHOLD_HIGH = _float_env("RISK_THRESHOLD_HIGH", 0.7)

# ── History limits ────────────────────────────────────────────────────────────
MAX_PREVIOUS_TRANSACTIONS = _int_env("MAX_PREVIOUS_TRANSACTIONS", 10)

# ── Model architecture hyperparameters ────────────────────────────────────────
TRANSACTION_FEATURE_DIM = _int_env("TRANSACTION_FEATURE_DIM", 14)
GAT_HIDDEN_DIM = _int_env("GAT_HIDDEN_DIM", 32)
GAT_HEADS = _int_env("GAT_HEADS", 4)
GAT_OUTPUT_DIM = _int_env("GAT_OUTPUT_DIM", 32)
CNN_CHANNELS = _int_env("CNN_CHANNELS", 64)
CNN_KERNEL_SIZE = _int_env("CNN_KERNEL_SIZE", 3)
FUSION_HIDDEN_DIM = _int_env("FUSION_HIDDEN_DIM", 64)

# ── Saved model directory ────────────────────────────────────────────────────
MODEL_DIR = Path(os.getenv(
    "TRANSACTION_MODEL_DIR",
    str(Path(__file__).resolve().parents[2] / "models" / "gcn_cnn"),
))
