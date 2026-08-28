"""Modular text-fraud classifier.

Later stages (URL detection, risk engine) can sit beside this class without
changing FastAPI routes. Replace the Hugging Face model by setting HF_MODEL_ID
or subclassing TextFraudClassifier.
"""

from __future__ import annotations

import logging
import time
from dataclasses import dataclass

import torch
import torch.nn.functional as F
from transformers import AutoModelForSequenceClassification, AutoTokenizer

from app.config import FRAUD_THRESHOLD, MAX_TOKENS, MODEL_ID

logger = logging.getLogger("fraud.text_classifier")

_POSITIVE_LABELS = {
    "spam",
    "fraud",
    "phishing",
    "scam",
    "malicious",
    "label_1",
    "1",
}


@dataclass(frozen=True)
class ClassificationResult:
    prediction: str
    fraud_probability: float
    confidence: float
    inference_time_ms: float
    model_id: str
    raw_label: str


class TextFraudClassifier:
    """Loads a Hugging Face sequence classifier once and reuses it in memory."""

    def __init__(
        self,
        model_id: str = MODEL_ID,
        threshold: float = FRAUD_THRESHOLD,
    ) -> None:
        self.model_id = model_id
        self.threshold = threshold
        self.tokenizer = None
        self.model = None
        self.device = torch.device("cpu")
        self._spam_index: int = 1
        self._id2label: dict[int, str] = {}

    def load(self) -> None:
        logger.info("Loading tokenizer: %s", self.model_id)
        self.tokenizer = AutoTokenizer.from_pretrained(self.model_id)
        logger.info("Loading model: %s", self.model_id)
        self.model = AutoModelForSequenceClassification.from_pretrained(self.model_id)
        self.model.to(self.device)
        self.model.eval()
        self._id2label = {int(k): str(v) for k, v in self.model.config.id2label.items()}
        self._spam_index = self._resolve_spam_index(self._id2label)
        logger.info(
            "Model ready on %s | labels=%s | fraud_class_index=%s | threshold=%.3f",
            self.device,
            self._id2label,
            self._spam_index,
            self.threshold,
        )

    @staticmethod
    def _resolve_spam_index(id2label: dict[int, str]) -> int:
        for idx, label in id2label.items():
            if label.lower() in _POSITIVE_LABELS:
                return idx
        return 1 if 1 in id2label else next(iter(id2label))

    def is_ready(self) -> bool:
        return self.tokenizer is not None and self.model is not None

    def predict(self, text: str) -> ClassificationResult:
        if not self.is_ready():
            raise RuntimeError("Classifier is not loaded. Call load() at application startup.")

        encoded = self.tokenizer(
            text,
            return_tensors="pt",
            truncation=True,
            max_length=MAX_TOKENS,
            padding=True,
        )
        encoded = {key: value.to(self.device) for key, value in encoded.items()}

        start = time.perf_counter()
        with torch.no_grad():
            logits = self.model(**encoded).logits
            probabilities = F.softmax(logits, dim=-1)[0]
        inference_time_ms = (time.perf_counter() - start) * 1000

        fraud_probability = float(probabilities[self._spam_index].item())
        predicted_index = int(torch.argmax(probabilities).item())
        raw_label = self._id2label.get(predicted_index, str(predicted_index))
        confidence = float(probabilities[predicted_index].item())
        prediction = "FRAUD" if fraud_probability >= self.threshold else "NOT_FRAUD"

        logger.info(
            "Prediction: %s | Fraud probability: %.4f | Inference time: %.1f ms",
            prediction,
            fraud_probability,
            inference_time_ms,
        )

        return ClassificationResult(
            prediction=prediction,
            fraud_probability=round(fraud_probability, 4),
            confidence=round(confidence, 4),
            inference_time_ms=round(inference_time_ms, 2),
            model_id=self.model_id,
            raw_label=raw_label,
        )


classifier = TextFraudClassifier()
