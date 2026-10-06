/**
 * Transaction Fraud Detection Types
 *
 * Types derived from the GCN model's actual request/response schema
 * (see model/app/transaction/schemas.py and inference.py).
 */

// ─── Request Types ──────────────────────────────────────────────────────────

export type TransactionType = 'UPI' | 'NEFT' | 'IMPS' | 'RTGS';

export const TRANSACTION_TYPES: TransactionType[] = ['UPI', 'NEFT', 'IMPS', 'RTGS'];

export interface Transaction {
  amount: number;
  receiver_id: string;
  timestamp: string;        // ISO 8601: YYYY-MM-DDTHH:mm:ss
  transaction_type: TransactionType;
}

export interface TransactionPredictionRequest {
  current_transaction: Transaction;
  previous_transactions: Transaction[];
}

// ─── Response Types (from model/app/transaction/schemas.py) ────────────────

export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH';

export interface TransactionPredictionResponse {
  fraud_probability: number;
  is_fraud: boolean;
  risk_level: RiskLevel;
  inference_time_ms: number;
  model_version: string;
  anomaly_factors?: Record<string, number> | null;
}

// ─── Local Analysis Types ───────────────────────────────────────────────────

export type PatternSeverity = 'low' | 'medium' | 'high' | 'critical';

export interface FraudPattern {
  id: string;
  title: string;
  description: string;
  severity: PatternSeverity;
  value?: string;
}

export interface RiskFactor {
  label: string;
  level: number;       // 0–100
  severity: PatternSeverity;
}

export interface TransactionAnalysisData {
  request: TransactionPredictionRequest;
  response: TransactionPredictionResponse;
}
