import { detectFraud } from '../src/fraudDetection/fraudDetector';

describe('Local Rule-Based Fraud Detection Engine', () => {
  it('A. Normal message -> Not suspicious', () => {
    const message = "Hey, are you coming to college today?";
    const result = detectFraud(message);
    
    expect(result.isSuspicious).toBe(false);
    expect(result.score).toBe(0);
    expect(result.triggeredRules).toHaveLength(0);
  });

  it('B. HTTP link -> Suspicious', () => {
    const message = "Check this http://example.com";
    const result = detectFraud(message);
    
    expect(result.isSuspicious).toBe(true);
    expect(result.score).toBe(20);
    expect(result.triggeredRules).toContain('HTTP_LINK');
  });

  it('C. Prize message -> Suspicious', () => {
    const message = "Congratulations! You have won ₹50,000. Claim your prize now.";
    const result = detectFraud(message);
    
    expect(result.isSuspicious).toBe(true);
    // prize rule (+30) + urgency rule ('claim now', +20) 
    expect(result.score).toBe(50);
    expect(result.triggeredRules).toContain('PRIZE_LANGUAGE');
    expect(result.triggeredRules).toContain('URGENCY_LANGUAGE');
  });

  it('D. Urgency -> Suspicious', () => {
    const message = "Your account will be blocked. Verify now immediately.";
    const result = detectFraud(message);
    
    expect(result.isSuspicious).toBe(true);
    expect(result.score).toBeGreaterThanOrEqual(20);
    expect(result.triggeredRules).toContain('URGENCY_LANGUAGE');
  });

  it('E. Combined -> Multiple rules triggered and high score', () => {
    const message = "Congratulations! You have won ₹1,00,000. Claim now at http://example.com";
    const result = detectFraud(message);
    
    expect(result.isSuspicious).toBe(true);
    // prize (+30) + urgency (+20) + http (+20)
    expect(result.score).toBe(70);
    expect(result.triggeredRules).toContain('PRIZE_LANGUAGE');
    expect(result.triggeredRules).toContain('URGENCY_LANGUAGE');
    expect(result.triggeredRules).toContain('HTTP_LINK');
  });

  it('F. Suspicious URL IP address', () => {
    const message = "Login here https://192.168.1.1/login";
    const result = detectFraud(message);

    expect(result.isSuspicious).toBe(true);
    expect(result.score).toBe(30);
    expect(result.triggeredRules).toContain('SUSPICIOUS_URL');
  });
});
