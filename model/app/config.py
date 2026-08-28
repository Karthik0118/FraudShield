import os
from pathlib import Path

from dotenv import load_dotenv

load_dotenv(Path(__file__).resolve().parents[1] / ".env")


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


# Swap this ID later to use a fine-tuned in-house model without changing the API.
MODEL_ID = os.getenv(
    "HF_MODEL_ID",
    "mariagrandury/distilbert-base-uncased-finetuned-sms-spam-detection",
)
FRAUD_THRESHOLD = _float_env("FRAUD_THRESHOLD", 0.5)
MAX_TEXT_LENGTH = _int_env("MAX_TEXT_LENGTH", 2000)
MAX_TOKENS = _int_env("MAX_TOKENS", 256)
