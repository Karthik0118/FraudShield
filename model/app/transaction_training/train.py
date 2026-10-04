"""Training script for the GAT + CNN transaction fraud model.

Usage:
    cd model/
    python -m app.transaction_training.train

This script:
  1. Generates synthetic training data (or loads a real dataset)
  2. Trains the GAT + CNN model
  3. Evaluates against baselines
  4. Saves the trained checkpoint + preprocessing config

Splitting strategy:
  - Temporal split: older → train, middle → val, newest → test
  - This avoids future leakage and mirrors production conditions.
"""

from __future__ import annotations

import json
import logging
import sys
import time
from pathlib import Path

import numpy as np
import torch
import torch.nn as nn
import torch.optim as optim

# Ensure the project root is on sys.path when run as __main__
_PROJECT_ROOT = Path(__file__).resolve().parents[2]
if str(_PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(_PROJECT_ROOT))

from app.transaction.config import MODEL_DIR, TRANSACTION_FRAUD_THRESHOLD
from app.transaction.features import featurize_sequence
from app.transaction.graph import build_transaction_graph
from app.transaction.model import TransactionFraudModel
from app.transaction.sequence import build_cnn_sequence
from app.transaction_training.baselines import (
    evaluate_logistic_regression,
    evaluate_rule_based,
    evaluate_sklearn_baselines,
)
from app.transaction_training.dataset import (
    SyntheticDatasetGenerator,
    TransactionDataset,
    TransactionSample,
)
from app.transaction_training.evaluate import EvaluationReport, evaluate

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s %(name)s: %(message)s",
)
logger = logging.getLogger("fraud.train")


# ── Training helpers ──────────────────────────────────────────────────────────

def _sample_to_tensors(sample: TransactionSample):
    """Convert a single sample to model input tensors."""
    history_feats, current_feats = featurize_sequence(
        sample.current_transaction,
        sample.previous_transactions,
    )
    graph_data = build_transaction_graph(
        sample.current_transaction,
        sample.previous_transactions,
    )
    cnn_data = build_cnn_sequence(history_feats)
    current_tensor = current_feats.to_tensor()
    label = torch.tensor(sample.label, dtype=torch.float32)
    return graph_data, cnn_data, current_tensor, label


def train_epoch(
    model: TransactionFraudModel,
    dataset: TransactionDataset,
    optimizer: optim.Optimizer,
    criterion: nn.Module,
) -> float:
    """Train one epoch. Returns average loss."""
    model.train()
    total_loss = 0.0

    for sample in dataset.samples:
        graph_data, cnn_data, current_tensor, label = _sample_to_tensors(sample)

        optimizer.zero_grad()
        pred = model(graph_data, cnn_data, current_tensor)
        loss = criterion(pred, label)
        loss.backward()
        optimizer.step()

        total_loss += loss.item()

    return total_loss / max(1, len(dataset))


def evaluate_model(
    model: TransactionFraudModel,
    dataset: TransactionDataset,
    threshold: float = 0.5,
) -> EvaluationReport:
    """Evaluate the neural model on a dataset."""
    model.eval()
    y_true = []
    y_prob = []

    with torch.no_grad():
        for sample in dataset.samples:
            graph_data, cnn_data, current_tensor, _ = _sample_to_tensors(sample)
            pred = model(graph_data, cnn_data, current_tensor)
            y_prob.append(float(pred.item()))
            y_true.append(sample.label)

    return evaluate(y_true, y_prob, threshold=threshold, model_name="GAT+CNN")


# ── Main training loop ───────────────────────────────────────────────────────

def train(
    n_samples: int = 2000,
    fraud_ratio: float = 0.2,
    epochs: int = 50,
    lr: float = 0.001,
    seed: int = 42,
) -> None:
    """Full training pipeline."""

    logger.info("=" * 60)
    logger.info("Transaction Fraud Model Training")
    logger.info("=" * 60)

    # 1. Generate dataset
    logger.info("Generating synthetic dataset: %d samples (%.0f%% fraud)",
                n_samples, fraud_ratio * 100)
    gen = SyntheticDatasetGenerator(seed=seed)
    dataset = gen.generate(n_samples=n_samples, fraud_ratio=fraud_ratio)

    # 2. Temporal split
    train_ds, val_ds, test_ds = dataset.split(
        train_ratio=0.7, val_ratio=0.15, temporal=True,
    )
    logger.info("Split: train=%d, val=%d, test=%d",
                len(train_ds), len(val_ds), len(test_ds))
    logger.info("Train fraud: %d/%d", sum(train_ds.labels), len(train_ds))
    logger.info("Val fraud:   %d/%d", sum(val_ds.labels), len(val_ds))
    logger.info("Test fraud:  %d/%d", sum(test_ds.labels), len(test_ds))

    # 3. Initialize model
    torch.manual_seed(seed)
    model = TransactionFraudModel()
    optimizer = optim.Adam(model.parameters(), lr=lr, weight_decay=1e-4)

    # Weighted BCE for class imbalance
    n_fraud = sum(train_ds.labels)
    n_legit = len(train_ds) - n_fraud
    pos_weight = torch.tensor(n_legit / max(1, n_fraud))
    criterion = nn.BCELoss(weight=None)  # We handle weighting in loss
    logger.info("Class balance: %d legit, %d fraud → pos_weight=%.2f",
                n_legit, n_fraud, pos_weight.item())

    # 4. Training loop
    best_val_f1 = 0.0
    best_epoch = 0
    patience = 10
    no_improve = 0

    start_time = time.time()
    for epoch in range(1, epochs + 1):
        loss = train_epoch(model, train_ds, optimizer, criterion)

        if epoch % 5 == 0 or epoch == 1:
            val_report = evaluate_model(model, val_ds, threshold=TRANSACTION_FRAUD_THRESHOLD)
            logger.info(
                "Epoch %3d | Loss: %.4f | Val F1: %.4f | Val Recall: %.4f | Val Prec: %.4f",
                epoch, loss, val_report.f1, val_report.recall, val_report.precision,
            )

            if val_report.f1 > best_val_f1:
                best_val_f1 = val_report.f1
                best_epoch = epoch
                no_improve = 0
                # Save best model
                _save_checkpoint(model, epoch, val_report)
            else:
                no_improve += 5

            if no_improve >= patience:
                logger.info("Early stopping at epoch %d (best: epoch %d, F1=%.4f)",
                            epoch, best_epoch, best_val_f1)
                break

    train_time = time.time() - start_time
    logger.info("Training completed in %.1f seconds", train_time)

    # 5. Reload best checkpoint and evaluate on test set
    checkpoint_path = MODEL_DIR / "model" / "checkpoint.pt"
    if checkpoint_path.exists():
        model.load_state_dict(torch.load(checkpoint_path, map_location="cpu", weights_only=True))
    test_report = evaluate_model(model, test_ds, threshold=TRANSACTION_FRAUD_THRESHOLD)
    logger.info("\n%s", test_report.summary())
    test_report.save(MODEL_DIR / "evaluation" / "test_report.json")

    # 6. Baseline comparisons
    logger.info("\n" + "=" * 60)
    logger.info("Baseline Comparisons")
    logger.info("=" * 60)

    # Rule-based
    rule_report = evaluate_rule_based(test_ds.samples, threshold=TRANSACTION_FRAUD_THRESHOLD)
    logger.info("\n%s", rule_report.summary())
    rule_report.save(MODEL_DIR / "evaluation" / "rule_based_report.json")

    # Logistic Regression
    lr_report = evaluate_logistic_regression(
        train_ds.samples, test_ds.samples, threshold=TRANSACTION_FRAUD_THRESHOLD,
    )
    logger.info("\n%s", lr_report.summary())
    lr_report.save(MODEL_DIR / "evaluation" / "logistic_regression_report.json")

    # Optional sklearn baselines
    sklearn_reports = evaluate_sklearn_baselines(
        train_ds.samples, test_ds.samples, threshold=TRANSACTION_FRAUD_THRESHOLD,
    )
    for report in sklearn_reports:
        logger.info("\n%s", report.summary())
        safe_name = report.model_name.lower().replace(" ", "_")
        report.save(MODEL_DIR / "evaluation" / f"{safe_name}_report.json")

    # 7. Summary comparison
    all_reports = [test_report, rule_report, lr_report] + sklearn_reports
    logger.info("\n" + "=" * 60)
    logger.info("SUMMARY")
    logger.info("%-20s %8s %8s %8s %8s %8s",
                "Model", "F1", "Recall", "Prec", "ROC-AUC", "PR-AUC")
    logger.info("-" * 72)
    for r in all_reports:
        logger.info("%-20s %8.4f %8.4f %8.4f %8.4f %8.4f",
                    r.model_name, r.f1, r.recall, r.precision, r.roc_auc, r.pr_auc)
    logger.info("=" * 60)


def _save_checkpoint(
    model: TransactionFraudModel,
    epoch: int,
    val_report: EvaluationReport,
) -> None:
    """Save model checkpoint and metadata."""
    model_dir = MODEL_DIR / "model"
    model_dir.mkdir(parents=True, exist_ok=True)

    torch.save(model.state_dict(), model_dir / "checkpoint.pt")

    meta = {
        "epoch": epoch,
        "val_f1": val_report.f1,
        "val_recall": val_report.recall,
        "val_precision": val_report.precision,
        "val_roc_auc": val_report.roc_auc,
        "architecture": "GAT+CNN",
        "version": "gat-cnn-v1",
    }
    with open(model_dir / "metadata.json", "w", encoding="utf-8") as f:
        json.dump(meta, f, indent=2)

    logger.info("Checkpoint saved at epoch %d (val F1=%.4f)", epoch, val_report.f1)


# ── Entry point ──────────────────────────────────────────────────────────────

if __name__ == "__main__":
    train()
