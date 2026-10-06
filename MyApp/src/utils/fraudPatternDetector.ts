/**
 * Fraud Pattern Detector
 *
 * Analyses transaction data LOCALLY to detect suspicious patterns.
 * No external API calls — all logic runs on-device from actual data.
 */

import {
  Transaction,
  TransactionPredictionRequest,
  TransactionPredictionResponse,
  FraudPattern,
  PatternSeverity,
} from '../types/transaction';

/**
 * Detect all fraud patterns present in the transaction data.
 * Only returns patterns that are actually detected — never invents patterns.
 */
export const detectFraudPatterns = (
  request: TransactionPredictionRequest,
  response: TransactionPredictionResponse,
): FraudPattern[] => {
  const patterns: FraudPattern[] = [];
  const current = request.current_transaction;
  const previous = request.previous_transactions;

  // ── Pattern: New Receiver ──────────────────────────────────────────────
  if (previous.length > 0) {
    const knownReceivers = new Set(previous.map(t => t.receiver_id));
    if (!knownReceivers.has(current.receiver_id)) {
      patterns.push({
        id: 'new_receiver',
        title: 'New Receiver',
        description: `"${current.receiver_id}" does not appear in previous transaction history.`,
        severity: response.is_fraud ? 'high' : 'medium',
        value: current.receiver_id,
      });
    }
  }

  // ── Pattern: Unusually High Amount ─────────────────────────────────────
  if (previous.length > 0) {
    const avgAmount =
      previous.reduce((sum, t) => sum + t.amount, 0) / previous.length;
    const maxPreviousAmount = Math.max(...previous.map(t => t.amount));

    if (current.amount > avgAmount * 3) {
      const multiplier = (current.amount / avgAmount).toFixed(1);
      patterns.push({
        id: 'unusual_amount',
        title: 'Unusual Amount',
        description: `₹${current.amount.toLocaleString('en-IN')} is ${multiplier}× the average previous transaction (₹${Math.round(avgAmount).toLocaleString('en-IN')}).`,
        severity: current.amount > avgAmount * 10 ? 'critical' : 'high',
        value: `₹${current.amount.toLocaleString('en-IN')}`,
      });
    } else if (current.amount > maxPreviousAmount * 2) {
      patterns.push({
        id: 'high_amount',
        title: 'Higher Than Usual',
        description: `₹${current.amount.toLocaleString('en-IN')} exceeds the highest previous transaction (₹${maxPreviousAmount.toLocaleString('en-IN')}).`,
        severity: 'medium',
        value: `₹${current.amount.toLocaleString('en-IN')}`,
      });
    }
  }

  // ── Pattern: Rapid Successive Transactions ─────────────────────────────
  if (previous.length > 0) {
    const currentTime = new Date(current.timestamp).getTime();
    const recentTransactions = previous.filter(t => {
      const timeDiff = currentTime - new Date(t.timestamp).getTime();
      return timeDiff > 0 && timeDiff < 3600000; // Within 1 hour
    });
    if (recentTransactions.length >= 2) {
      patterns.push({
        id: 'rapid_transfers',
        title: 'Rapid Transfers',
        description: `${recentTransactions.length} transactions occurred within the last hour.`,
        severity: 'high',
        value: `${recentTransactions.length} in 1h`,
      });
    }
  }

  // ── Pattern: Multiple Transactions to Same Receiver ────────────────────
  if (previous.length > 0) {
    const receiverCounts: Record<string, number> = {};
    previous.forEach(t => {
      receiverCounts[t.receiver_id] = (receiverCounts[t.receiver_id] || 0) + 1;
    });
    if (receiverCounts[current.receiver_id] >= 2) {
      patterns.push({
        id: 'repeated_receiver',
        title: 'Repeated Receiver',
        description: `${receiverCounts[current.receiver_id] + 1} transactions (including current) to "${current.receiver_id}".`,
        severity: 'low',
        value: `${receiverCounts[current.receiver_id] + 1} times`,
      });
    }
  }

  // ── Pattern: Sudden Amount Increase ────────────────────────────────────
  if (previous.length >= 2) {
    const sortedPrev = [...previous].sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
    );
    const lastAmount = sortedPrev[0].amount;
    if (current.amount > lastAmount * 5 && current.amount > 1000) {
      patterns.push({
        id: 'sudden_increase',
        title: 'Sudden Amount Increase',
        description: `Jump from ₹${lastAmount.toLocaleString('en-IN')} to ₹${current.amount.toLocaleString('en-IN')} in consecutive transactions.`,
        severity: 'high',
        value: `${(current.amount / lastAmount).toFixed(0)}× increase`,
      });
    }
  }

  // ── Pattern: Unusual Transaction Type ──────────────────────────────────
  if (previous.length >= 3) {
    const typeCounts: Record<string, number> = {};
    previous.forEach(t => {
      typeCounts[t.transaction_type] =
        (typeCounts[t.transaction_type] || 0) + 1;
    });
    if (!typeCounts[current.transaction_type]) {
      patterns.push({
        id: 'unusual_type',
        title: 'Unusual Transaction Type',
        description: `"${current.transaction_type}" has not been used in previous transactions.`,
        severity: 'medium',
        value: current.transaction_type,
      });
    }
  }

  // ── Pattern: Large Transaction After Long Inactivity ───────────────────
  if (previous.length > 0) {
    const currentTime = new Date(current.timestamp).getTime();
    const sortedPrev = [...previous].sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
    );
    const lastTxnTime = new Date(sortedPrev[0].timestamp).getTime();
    const daysSinceLast =
      (currentTime - lastTxnTime) / (1000 * 60 * 60 * 24);

    if (daysSinceLast > 7 && current.amount > 5000) {
      patterns.push({
        id: 'inactivity_spike',
        title: 'Post-Inactivity Spike',
        description: `Large transaction of ₹${current.amount.toLocaleString('en-IN')} after ${Math.round(daysSinceLast)} days of inactivity.`,
        severity: 'high',
        value: `${Math.round(daysSinceLast)} days gap`,
      });
    }
  }

  // ── Pattern: First Transaction (No History) ────────────────────────────
  if (previous.length === 0) {
    patterns.push({
      id: 'first_transaction',
      title: 'First Transaction',
      description:
        'No previous transaction history available for pattern comparison.',
      severity: 'low',
      value: 'No history',
    });
  }

  return patterns;
};

/**
 * Get the icon color for a severity level.
 */
export const getSeverityColor = (severity: PatternSeverity): string => {
  switch (severity) {
    case 'critical':
      return '#B91C1C'; // errorDark
    case 'high':
      return '#EF4444'; // error
    case 'medium':
      return '#F59E0B'; // warning
    case 'low':
      return '#10B981'; // success
  }
};

/**
 * Get the emoji for a severity level.
 */
export const getSeverityEmoji = (severity: PatternSeverity): string => {
  switch (severity) {
    case 'critical':
      return '🔴';
    case 'high':
      return '🔴';
    case 'medium':
      return '🟠';
    case 'low':
      return '🟢';
  }
};
