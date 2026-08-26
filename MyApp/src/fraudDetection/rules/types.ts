export interface RuleResult {
  rule: string;
  triggered: boolean;
  score: number;
  reason?: string;
}

export type RuleFunction = (text: string, urls?: string[]) => RuleResult;
