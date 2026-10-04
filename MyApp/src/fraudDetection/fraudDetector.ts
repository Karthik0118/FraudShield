import { httpRule } from './rules/httpRule';
import { prizeRule } from './rules/prizeRule';
import { urgencyRule } from './rules/urgencyRule';
import { urlRule } from './rules/urlRule';
import { otpBankRule } from './rules/otpBankRule';

export interface FraudDetectionResult {
  isSuspicious: boolean;
  score: number;
  riskLevel: 'SAFE' | 'SUSPICIOUS' | 'HIGH_RISK';
  triggeredRules: string[];
  reasons: string[];
}

const SUSPICIOUS_THRESHOLD = 30;
const HIGH_RISK_THRESHOLD = 50;

export const detectFraud = (message: string): FraudDetectionResult => {
  let totalScore = 0;
  const triggeredRules: string[] = [];
  const reasons: string[] = [];

  const rules = [httpRule, prizeRule, urgencyRule, urlRule, otpBankRule];

  for (const rule of rules) {
    const result = rule(message);
    if (result.triggered) {
      totalScore += result.score;
      triggeredRules.push(result.rule);
      if (result.reason) {
        reasons.push(result.reason);
      }
    }
  }

  const isSuspicious = totalScore >= SUSPICIOUS_THRESHOLD;
  let riskLevel: 'SAFE' | 'SUSPICIOUS' | 'HIGH_RISK' = 'SAFE';
  
  if (totalScore >= HIGH_RISK_THRESHOLD) {
    riskLevel = 'HIGH_RISK';
  } else if (totalScore >= SUSPICIOUS_THRESHOLD) {
    riskLevel = 'SUSPICIOUS';
  }

  return {
    isSuspicious,
    score: totalScore,
    riskLevel,
    triggeredRules,
    reasons,
  };
};
