import { RuleResult } from './types';

export const httpRule = (text: string): RuleResult => {
  const hasHttp = /http:\/\//i.test(text);
  return {
    rule: 'HTTP_LINK',
    triggered: hasHttp,
    score: hasHttp ? 20 : 0,
    reason: hasHttp ? 'Message contains an HTTP link' : undefined,
  };
};
