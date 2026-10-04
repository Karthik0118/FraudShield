const url = require('url');

const SHORTENERS = new Set(['bit.ly', 't.co', 'tinyurl.com', 'is.gd', 'buff.ly', 'adf.ly', 'bit.do', 'cutt.ly', 'ow.ly', 'shorte.st', 'x.co', 'goo.gl']);
const SUSPICIOUS_TLDS = new Set(['.xyz', '.top', '.tk', '.ml', '.ga', '.cf', '.gq', '.pw', '.cc', '.club', '.info', '.biz', '.online', '.site', '.live', '.buzz']);

function calculateEntropy(str) {
  const len = str.length;
  const frequencies = Array.from(str).reduce((freq, c) => {
    freq[c] = (freq[c] || 0) + 1;
    return freq;
  }, {});
  return Object.values(frequencies).reduce((sum, f) => {
    const p = f / len;
    return sum - p * Math.log2(p);
  }, 0);
}

const analyzeUrl = (urlStr) => {
  let riskScore = 0;
  const reasons = [];
  const detectedSignals = [];

  let parsedUrl;
  try {
    parsedUrl = new URL(urlStr.startsWith('http') ? urlStr : `http://${urlStr}`);
  } catch (e) {
    return {
      url: urlStr,
      riskScore: 100,
      riskLevel: "HIGH_RISK",
      isMalicious: true,
      reasons: ["Invalid URL format"],
      detectedSignals: ["Invalid Format"],
      recommendation: "Do not visit this URL. It is improperly formatted and highly suspicious."
    };
  }

  const hostname = parsedUrl.hostname.toLowerCase();
  const pathname = parsedUrl.pathname.toLowerCase();
  const search = parsedUrl.search.toLowerCase();
  const protocol = parsedUrl.protocol;

  // 1. HTTP vs HTTPS
  if (protocol === 'http:') {
    riskScore += 20;
    reasons.push('Uses insecure HTTP connection instead of HTTPS');
    detectedSignals.push('Insecure Protocol (HTTP)');
  }

  // 2. IP instead of domain
  if (/^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$/.test(hostname)) {
    riskScore += 50;
    reasons.push('Uses an IP address instead of a domain name');
    detectedSignals.push('IP Address as Domain');
  }

  // 3. URL length (>75)
  if (urlStr.length > 75) {
    riskScore += 10;
    reasons.push('URL is unusually long');
    detectedSignals.push('Long URL');
  }

  // 4. Number of subdomains (>2)
  const parts = hostname.split('.');
  if (parts.length > 3 && !hostname.endsWith('co.uk') && !hostname.endsWith('com.au')) {
    riskScore += 15;
    reasons.push('URL has multiple subdomains which is often used in phishing');
    detectedSignals.push('Excessive Subdomains');
  }

  // 5. Suspicious chars
  if (/[<>{}|\\^~\[\]`]/.test(urlStr)) {
    riskScore += 10;
    reasons.push('Contains unusual or suspicious characters');
    detectedSignals.push('Suspicious Characters');
  }

  // 6. @ symbol
  if (urlStr.includes('@')) {
    riskScore += 40;
    reasons.push('Contains @ symbol, often used to hide the real destination');
    detectedSignals.push('@ Symbol present');
  }

  // 7. Excessive hyphens (>2)
  if ((hostname.match(/-/g) || []).length > 2) {
    riskScore += 15;
    reasons.push('Domain contains multiple hyphens, common in fake domains');
    detectedSignals.push('Multiple Hyphens');
  }

  // 8. Punycode / IDN
  if (hostname.includes('xn--')) {
    riskScore += 30;
    reasons.push('Uses Punycode (IDN) which can be used for homograph attacks');
    detectedSignals.push('Punycode Detected');
  }

  // 9. URL shorteners
  if (SHORTENERS.has(hostname) || hostname.length < 8 && parts.length === 2) {
    riskScore += 25;
    reasons.push('Uses a URL shortener service to hide the final destination');
    detectedSignals.push('URL Shortener');
  }

  // 10. Suspicious ports
  if (parsedUrl.port && parsedUrl.port !== '80' && parsedUrl.port !== '443') {
    riskScore += 20;
    reasons.push(`Uses a non-standard port (${parsedUrl.port})`);
    detectedSignals.push('Non-standard Port');
  }

  // 11. Suspicious paths
  if (/\/(login|secure|auth|admin|update|verify|confirm|account)/.test(pathname)) {
    riskScore += 15;
    reasons.push('Path suggests a login or verification page');
    detectedSignals.push('Suspicious Path');
  }

  // 12. Login keywords
  if (/(login|signin|auth|credential)/.test(urlStr)) {
    riskScore += 10;
    reasons.push('Contains login-related keywords');
    detectedSignals.push('Login Keywords');
  }

  // 13. Payment keywords
  if (/(paypal|stripe|checkout|billing|pay|invoice)/.test(urlStr)) {
    riskScore += 10;
    reasons.push('Contains payment-related keywords');
    detectedSignals.push('Payment Keywords');
  }

  // 14. Bank keywords
  if (/(bank|chase|wellsfargo|citi|capitalone|boa)/.test(urlStr)) {
    riskScore += 15;
    reasons.push('Contains banking-related keywords');
    detectedSignals.push('Bank Keywords');
  }

  // 15. Prize keywords
  if (/(prize|win|free|bonus|lucky|reward)/.test(urlStr)) {
    riskScore += 20;
    reasons.push('Contains prize or reward keywords often used in scams');
    detectedSignals.push('Prize/Reward Keywords');
  }

  // 16. Urgency keywords
  if (/(urgent|immediate|suspend|alert|action|required)/.test(urlStr)) {
    riskScore += 15;
    reasons.push('Contains words implying urgency to rush the user');
    detectedSignals.push('Urgency Keywords');
  }

  // 17. Suspicious query params
  if (search.length > 50 || /(id=|token=|key=|email=)/.test(search)) {
    riskScore += 10;
    reasons.push('Contains complex or suspicious query parameters');
    detectedSignals.push('Suspicious Query Parameters');
  }

  // 18. Domain entropy
  const entropy = calculateEntropy(hostname);
  if (entropy > 4.0) {
    riskScore += 15;
    reasons.push('Domain name appears randomly generated (high entropy)');
    detectedSignals.push('High Domain Entropy');
  }

  // 19. Known suspicious TLDs
  const tldMatch = hostname.match(/\.[a-z]{2,}$/i);
  if (tldMatch && SUSPICIOUS_TLDS.has(tldMatch[0])) {
    riskScore += 30;
    reasons.push(`Uses a Top-Level Domain (${tldMatch[0]}) commonly associated with spam/malware`);
    detectedSignals.push('Suspicious TLD');
  }

  // 20. Domain name length
  if (hostname.length > 30) {
    riskScore += 10;
    reasons.push('Domain name is unusually long');
    detectedSignals.push('Long Domain Name');
  }

  // Cap risk score at 100
  riskScore = Math.min(riskScore, 100);

  let riskLevel = "SAFE";
  let recommendation = "URL appears safe, but always exercise caution.";
  
  if (riskScore >= 70) {
    riskLevel = "HIGH_RISK";
    recommendation = "Do not visit this URL. It exhibits multiple signs of being malicious or a phishing attempt.";
  } else if (riskScore >= 30) {
    riskLevel = "SUSPICIOUS";
    recommendation = "Proceed with caution. Verify the source before entering any personal information.";
  }

  if (reasons.length === 0) {
    reasons.push("No suspicious signals detected.");
    detectedSignals.push("Clean");
  }

  return {
    url: urlStr,
    riskScore,
    riskLevel,
    isMalicious: riskScore >= 70,
    reasons,
    detectedSignals,
    recommendation
  };
};

module.exports = { analyzeUrl };
