/**
 * Risk Analysis Utility
 *
 * Generates local "Explain My Risk" analysis from actual transaction data
 * and GCN model results. No external API calls.
 *
 * Only creates explanations from data that actually exists.
 */

import {
  Transaction,
  TransactionPredictionRequest,
  TransactionPredictionResponse,
  RiskFactor,
  PatternSeverity,
} from '../types/transaction';

export interface RiskExplanation {
  overallRisk: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  summary: string;
  factors: RiskFactor[];
  reasons: string[];
}

/**
 * Generate a risk explanation from actual available data.
 * Never invents data — only uses fields present in the request/response.
 */
export const generateRiskExplanation = (
  request: TransactionPredictionRequest,
  response: TransactionPredictionResponse,
): RiskExplanation => {
  const factors: RiskFactor[] = [];
  const reasons: string[] = [];
  const current = request.current_transaction;
  const previous = request.previous_transactions;

  // ── Factor: Amount Analysis ────────────────────────────────────────────
  if (previous.length > 0) {
    const avgAmount =
      previous.reduce((sum, t) => sum + t.amount, 0) / previous.length;
    const ratio = current.amount / avgAmount;

    if (ratio > 3) {
      const level = Math.min(Math.round(ratio * 10), 100);
      factors.push({
        label: 'High Amount',
        level,
        severity: ratio > 10 ? 'critical' : ratio > 5 ? 'high' : 'medium',
      });
      reasons.push(
        `Transaction amount is ${ratio.toFixed(1)}× higher than the average previous transaction.`,
      );
    } else {
      factors.push({
        label: 'Amount',
        level: Math.min(Math.round(ratio * 20), 100),
        severity: 'low',
      });
    }
  }

  // ── Factor: Receiver Familiarity ───────────────────────────────────────
  if (previous.length > 0) {
    const knownReceivers = new Set(previous.map(t => t.receiver_id));
    if (!knownReceivers.has(current.receiver_id)) {
      factors.push({
        label: 'New Receiver',
        level: 75,
        severity: 'high',
      });
      reasons.push('Receiver is unfamiliar — not found in previous transactions.');
    } else {
      const count = previous.filter(
        t => t.receiver_id === current.receiver_id,
      ).length;
      factors.push({
        label: 'Known Receiver',
        level: Math.max(10, 50 - count * 10),
        severity: 'low',
      });
    }
  }

  // ── Factor: Transaction Pattern ────────────────────────────────────────
  if (previous.length >= 2) {
    const sortedPrev = [...previous].sort(
      (a, b) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
    );
    const lastAmount = sortedPrev[0].amount;
    const changeRatio = current.amount / (lastAmount || 1);

    if (changeRatio > 5) {
      factors.push({
        label: 'Unusual Pattern',
        level: Math.min(Math.round(changeRatio * 8), 100),
        severity: 'high',
      });
      reasons.push(
        'Transaction pattern differs significantly from previous activity.',
      );
    }
  }

  // ── Factor: Model Probability ──────────────────────────────────────────
  const probPercent = Math.round(response.fraud_probability * 100);
  factors.push({
    label: 'Model Risk Score',
    level: probPercent,
    severity: getSeverityFromProb(response.fraud_probability),
  });

  // ── Overall Risk ──────────────────────────────────────────────────────
  const overallRisk = response.risk_level === 'HIGH' || response.risk_level as string === 'CRITICAL' 
    ? 'HIGH' 
    : response.risk_level === 'MEDIUM' 
    ? 'MEDIUM' 
    : 'LOW';

  // ── Summary ────────────────────────────────────────────────────────────
  let summary: string;
  if (response.is_fraud) {
    summary =
      'This transaction exhibits characteristics associated with fraudulent activity. Review the risk factors below.';
  } else if (response.risk_level === 'MEDIUM') {
    summary =
      'This transaction has some elevated risk indicators but falls within acceptable parameters.';
  } else {
    summary =
      'This transaction appears consistent with normal activity patterns.';
  }

  if (previous.length === 0) {
    reasons.push(
      'No previous transaction history available for behavioral comparison.',
    );
  }

  return {overallRisk, summary, factors, reasons};
};

const getSeverityFromProb = (prob: number): PatternSeverity => {
  if (prob >= 0.8) return 'critical';
  if (prob >= 0.6) return 'high';
  if (prob >= 0.3) return 'medium';
  return 'low';
};
