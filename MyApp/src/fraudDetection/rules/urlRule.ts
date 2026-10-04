import { RuleResult } from './types';

const URL_REGEX = /(https?:\/\/[^\s]+)/g;

export const urlRule = (text: string): RuleResult => {
  const urls = text.match(URL_REGEX) || [];
  let isSuspicious = false;

  for (const url of urls) {
    // 1. IP address instead of domain
    const ipPattern = /https?:\/\/(?:[0-9]{1,3}\.){3}[0-9]{1,3}/i;
    if (ipPattern.test(url)) {
      isSuspicious = true;
      break;
    }

    // 2. Excessively long URLs (e.g., > 100 chars)
    if (url.length > 100) {
      isSuspicious = true;
      break;
    }

    // 3. Obvious URL obfuscation (e.g. lots of % characters or base64 looking)
    const encodedCount = (url.match(/%/g) || []).length;
    if (encodedCount > 10) {
      isSuspicious = true;
      break;
    }
  }

  return {
    rule: 'SUSPICIOUS_URL',
    triggered: isSuspicious,
    score: isSuspicious ? 20 : 0,
    reason: isSuspicious ? 'Message contains a suspicious URL pattern' : undefined,
  };
};
