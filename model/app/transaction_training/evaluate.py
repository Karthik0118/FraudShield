"""Evaluation metrics for transaction fraud detection.

Fraud detection is highly imbalanced, so accuracy alone is unreliable.
This module reports:
  - Accuracy
  - Precision (fraud class)
  - Recall (fraud class)
  - F1-score (fraud class)
  - ROC-AUC
  - PR-AUC
  - Confusion matrix
"""

from __future__ import annotations

import json
from dataclasses import asdict, dataclass
from pathlib import Path
from typing import Dict, List, Optional, Sequence

import numpy as np


@dataclass
class EvaluationReport:
    """Structured evaluation results."""
    accuracy: float
    precision: float
    recall: float
    f1: float
    roc_auc: float
    pr_auc: float
    confusion_matrix: List[List[int]]  # [[TN, FP], [FN, TP]]
    model_name: str = ""
    dataset_size: int = 0
    fraud_count: int = 0
    legit_count: int = 0

    def summary(self) -> str:
        cm = self.confusion_matrix
        lines = [
            f"=== {self.model_name} ===",
            f"Dataset: {self.dataset_size} samples "
            f"({self.fraud_count} fraud, {self.legit_count} legit)",
            f"Accuracy:  {self.accuracy:.4f}",
            f"Precision: {self.precision:.4f}",
            f"Recall:    {self.recall:.4f}",
            f"F1-score:  {self.f1:.4f}",
            f"ROC-AUC:   {self.roc_auc:.4f}",
            f"PR-AUC:    {self.pr_auc:.4f}",
            f"Confusion Matrix:",
            f"  TN={cm[0][0]}  FP={cm[0][1]}",
            f"  FN={cm[1][0]}  TP={cm[1][1]}",
        ]
        return "\n".join(lines)

    def to_dict(self) -> Dict:
        return asdict(self)

    def save(self, path: Path) -> None:
        path.parent.mkdir(parents=True, exist_ok=True)
        with open(path, "w", encoding="utf-8") as f:
            json.dump(self.to_dict(), f, indent=2)


def evaluate(
    y_true: Sequence[int],
    y_prob: Sequence[float],
    threshold: float = 0.5,
    model_name: str = "",
) -> EvaluationReport:
    """Compute evaluation metrics.

    Parameters
    ----------
    y_true : array-like of {0, 1}
        True labels.
    y_prob : array-like of float
        Predicted fraud probabilities.
    threshold : float
        Classification threshold.
    model_name : str
        Name for reporting.
    """
    y_true_arr = np.array(y_true, dtype=int)
    y_prob_arr = np.array(y_prob, dtype=float)
    y_pred = (y_prob_arr >= threshold).astype(int)

    # Confusion matrix
    tp = int(np.sum((y_pred == 1) & (y_true_arr == 1)))
    tn = int(np.sum((y_pred == 0) & (y_true_arr == 0)))
    fp = int(np.sum((y_pred == 1) & (y_true_arr == 0)))
    fn = int(np.sum((y_pred == 0) & (y_true_arr == 1)))

    accuracy = (tp + tn) / max(1, tp + tn + fp + fn)
    precision = tp / max(1, tp + fp)
    recall = tp / max(1, tp + fn)
    f1 = 2 * precision * recall / max(1e-8, precision + recall)

    # ROC-AUC
    roc_auc = _roc_auc(y_true_arr, y_prob_arr)

    # PR-AUC
    pr_auc = _pr_auc(y_true_arr, y_prob_arr)

    return EvaluationReport(
        accuracy=round(accuracy, 4),
        precision=round(precision, 4),
        recall=round(recall, 4),
        f1=round(f1, 4),
        roc_auc=round(roc_auc, 4),
        pr_auc=round(pr_auc, 4),
        confusion_matrix=[[tn, fp], [fn, tp]],
        model_name=model_name,
        dataset_size=len(y_true_arr),
        fraud_count=int(y_true_arr.sum()),
        legit_count=int((y_true_arr == 0).sum()),
    )


def _roc_auc(y_true: np.ndarray, y_prob: np.ndarray) -> float:
    """Compute ROC-AUC using the trapezoidal rule (no sklearn needed)."""
    if len(np.unique(y_true)) < 2:
        return 0.5
    # Sort by descending probability
    desc = np.argsort(-y_prob)
    y_sorted = y_true[desc]

    total_pos = y_true.sum()
    total_neg = len(y_true) - total_pos
    if total_pos == 0 or total_neg == 0:
        return 0.5

    tpr_prev, fpr_prev = 0.0, 0.0
    auc = 0.0
    tp, fp = 0, 0

    for i in range(len(y_sorted)):
        if y_sorted[i] == 1:
            tp += 1
        else:
            fp += 1
        tpr = tp / total_pos
        fpr = fp / total_neg
        auc += (fpr - fpr_prev) * (tpr + tpr_prev) / 2
        tpr_prev, fpr_prev = tpr, fpr

    return float(auc)


def _pr_auc(y_true: np.ndarray, y_prob: np.ndarray) -> float:
    """Compute PR-AUC using the trapezoidal rule."""
    if len(np.unique(y_true)) < 2:
        return 0.5
    desc = np.argsort(-y_prob)
    y_sorted = y_true[desc]

    total_pos = y_true.sum()
    if total_pos == 0:
        return 0.0

    tp, fp = 0, 0
    precisions = []
    recalls = []

    for i in range(len(y_sorted)):
        if y_sorted[i] == 1:
            tp += 1
        else:
            fp += 1
        prec = tp / (tp + fp)
        rec = tp / total_pos
        precisions.append(prec)
        recalls.append(rec)

    # Trapezoidal integration
    auc = 0.0
    for i in range(1, len(recalls)):
        auc += (recalls[i] - recalls[i - 1]) * (precisions[i] + precisions[i - 1]) / 2

    return float(auc)
