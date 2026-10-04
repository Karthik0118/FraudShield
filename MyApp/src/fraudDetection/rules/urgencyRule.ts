import { RuleResult } from './types';

const URGENCY_KEYWORDS = [
  'act now',
  'urgent',
  'immediately',
  'limited time',
  'claim now',
  'verify now',
  'your account will be blocked',
  'expires today',
];

export const urgencyRule = (text: string): RuleResult => {
  const lowerText = text.toLowerCase();
  const hasUrgencyLanguage = URGENCY_KEYWORDS.some((keyword) => lowerText.includes(keyword));

  return {
    rule: 'URGENCY_LANGUAGE',
    triggered: hasUrgencyLanguage,
    score: hasUrgencyLanguage ? 15 : 0,
    reason: hasUrgencyLanguage ? 'Message contains urgency language' : undefined,
  };
};
