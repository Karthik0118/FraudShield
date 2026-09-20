/**
 * SMS Detection Types
 *
 * Matches the backend /api/sms/detect response contract.
 */

// ─── Request ──────────────────────────────────────────────────────────────────

export interface SmsDetectRequest {
  text: string;
}

// ─── Response ─────────────────────────────────────────────────────────────────

export interface SmsDetectData {
  prediction: 'Legitimate' | 'Fraudulent';
  fraud_probability: number; // 0.0 – 1.0
  confidence: number;        // max class probability
  label_id: 0 | 1;           // 0=legitimate, 1=fraudulent
}

export interface SmsDetectResponse {
  success: boolean;
  message: string;
  data: SmsDetectData;
}
