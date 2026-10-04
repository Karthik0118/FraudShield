import { RuleResult } from './types';

const PRIZE_KEYWORDS = [
  'you have won',
  'you won',
  'congratulations',
  'claim your prize',
  'claim your reward',
  'you have received',
  'cash prize',
  'reward',
  'lottery',
];

export const prizeRule = (text: string): RuleResult => {
  const lowerText = text.toLowerCase();
  const hasPrizeLanguage = PRIZE_KEYWORDS.some((keyword) => lowerText.includes(keyword));

  return {
    rule: 'PRIZE_LANGUAGE',
    triggered: hasPrizeLanguage,
    score: hasPrizeLanguage ? 15 : 0,
    reason: hasPrizeLanguage ? 'Message contains prize/reward language' : undefined,
  };
};
