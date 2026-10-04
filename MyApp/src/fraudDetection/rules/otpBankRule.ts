import { RuleResult } from './types';

const OTP_BANK_KEYWORDS = [
  'otp',
  'bank',
  'account',
  'kyc',
  'password',
  'pin',
  'verification code',
  'credit card',
  'debit card'
];

export const otpBankRule = (text: string): RuleResult => {
  const lowerText = text.toLowerCase();
  const hasKeywords = OTP_BANK_KEYWORDS.some((keyword) => lowerText.includes(keyword));

  return {
    rule: 'SENSITIVE_INFO_REQUEST',
    triggered: hasKeywords,
    score: hasKeywords ? 10 : 0,
    reason: hasKeywords ? 'Message asks for sensitive information (OTP/Bank)' : undefined,
  };
};
