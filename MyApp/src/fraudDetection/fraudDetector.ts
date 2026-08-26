import { httpRule } from './rules/httpRule';
import { prizeRule } from './rules/prizeRule';
import { urgencyRule } from './rules/urgencyRule';
import { urlRule } from './rules/urlRule';

export interface FraudDetectionResult {
  isSuspicious: boolean;
  score: number;
  triggeredRules: string[];
  reasons: string[];
}

const SUSPICIOUS_THRESHOLD = 20;

export const detectFraud = (message: string): FraudDetectionResult => {
  let totalScore = 0;
  const triggeredRules: string[] = [];
  const reasons: string[] = [];

  const rules = [httpRule, prizeRule, urgencyRule, urlRule];

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

  return {
    isSuspicious,
    score: totalScore,
    triggeredRules,
    reasons,
  };
};
