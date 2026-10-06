/**
 * Security Score Calculator
 *
 * Calculates a FraudShield Security Score locally from actual application data.
 * No external API calls — purely derived from real detection results.
 *
 * This is NOT an official banking score. It reflects activity within FraudShield.
 */

import {TransactionPredictionResponse} from '../types/transaction';

export interface SecurityScoreData {
  score: number;                // 0–100
  label: string;                // 'Excellent' | 'Good' | 'Fair' | 'Poor'
  color: string;                // Semantic color
  hasEnoughData: boolean;
  breakdown: {
    transactionSafety: number;  // 0–100
    description: string;
  };
}

/**
 * Calculate security score from a transaction prediction result.
 * Returns a meaningful score only when data is available.
 */
export const calculateTransactionSecurityScore = (
  response: TransactionPredictionResponse | null,
): SecurityScoreData => {
  if (!response) {
    return {
      score: 0,
      label: 'No Data',
      color: '#94A3B8',
      hasEnoughData: false,
      breakdown: {
        transactionSafety: 0,
        description: 'Not enough activity to calculate a reliable score.',
      },
    };
  }

  // Transaction safety based on actual fraud_probability
  const transactionSafety = Math.round((1 - response.fraud_probability) * 100);

  // Overall score (currently just transaction — expands as more data is available)
  const score = transactionSafety;

  const {label, color} = getScoreLabel(score);

  return {
    score,
    label,
    color,
    hasEnoughData: true,
    breakdown: {
      transactionSafety,
      description:
        !response.is_fraud
          ? 'Transaction classified as legitimate by the GCN model.'
          : 'Transaction flagged as potentially fraudulent.',
    },
  };
};

const getScoreLabel = (
  score: number,
): {label: string; color: string} => {
  if (score >= 80) return {label: 'Excellent', color: '#10B981'};
  if (score >= 60) return {label: 'Good', color: '#3B82F6'};
  if (score >= 40) return {label: 'Fair', color: '#F59E0B'};
  return {label: 'Poor', color: '#EF4444'};
};
