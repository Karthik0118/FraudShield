import { RuleResult } from './types';

export const httpRule = (text: string): RuleResult => {
  const hasHttp = /http:\/\//i.test(text);
  // Do not flag if it has https. Actually, we just look for unencrypted http.
  // We should give it a score of 15, so it requires other signals to hit 30.
  return {
    rule: 'HTTP_LINK',
    triggered: hasHttp,
    score: hasHttp ? 15 : 0,
    reason: hasHttp ? 'Message contains an unencrypted HTTP link' : undefined,
  };
};
