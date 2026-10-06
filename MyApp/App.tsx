/**
 * App Entry Point
 *
 * Minimal root: wraps the app in AuthProvider and SafeAreaProvider.
 *
 * Real-time detection pipeline:
 *   AccessibilityService → onAccessibilityTextScanned event
 *   → extract URLs → analyse via EXISTING backend APIs
 *   → decision logic (only HIGH-CONFIDENCE FRAUD triggers overlay)
 *
 * The real-time pipeline now uses the SAME detection endpoints/models as
 * the manual SMS and URL detectors:
 *   - SMS: POST /api/sms/detect → Python DistilBERT ML model
 *   - URL: POST /api/url/analyze → Node.js rule-based URL analyzer
 *
 * This eliminates the false-positive problem caused by the old approach
 * which used aggressive client-side keyword heuristics.
 */

import React, { useEffect, useRef } from 'react';
import { DeviceEventEmitter, NativeModules } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from './src/context/AuthContext';
import RootNavigator from './src/navigation/RootNavigator';
import { authStorage } from './src/storage/authStorage';
import Config from './src/config';

const { AccessibilityBridgeModule } = NativeModules;

// ── Constants ─────────────────────────────────────────────────────────────────
/** Minimum text length to consider for SMS analysis (skip UI noise). */
const MIN_SMS_TEXT_LENGTH = 30;

/** Minimum text length that looks like it could be a meaningful SMS/message. */
const MIN_MESSAGE_LIKE_LENGTH = 15;

/** Cooldown between overlay displays (ms) to prevent spam. */
const OVERLAY_COOLDOWN_MS = 15_000;

/** Maximum concurrent backend requests to prevent overload. */
const MAX_PENDING_REQUESTS = 2;

// ── URL regex for extracting URLs from text ──────────────────────────────────
const URL_REGEX = /https?:\/\/[a-zA-Z0-9.-]+(?:\.[a-zA-Z]{2,})+(?::\d{1,5})?(?:\/[^\s<>"'\[\]{}]*)?/gi;

/**
 * Calls the existing backend SMS detection endpoint.
 * Returns the prediction result or null on failure.
 */
async function callSmsDetectionApi(text: string): Promise<{
  prediction: string;
  fraud_probability: number;
  confidence: number;
} | null> {
  try {
    const token = await authStorage.getAccessToken();
    if (!token) return null; // Not logged in

    const response = await fetch(`${Config.API_BASE_URL}/api/sms/detect`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ text }),
    });

    if (!response.ok) return null;

    const json = await response.json();
    if (json.success && json.data) {
      return json.data;
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Calls the existing backend URL analysis endpoint.
 * Returns the analysis result or null on failure.
 */
async function callUrlAnalysisApi(url: string): Promise<{
  riskScore: number;
  riskLevel: string;
  isMalicious: boolean;
  reasons: string[];
  detectedSignals: string[];
  recommendation: string;
} | null> {
  try {
    const token = await authStorage.getAccessToken();
    if (!token) return null;

    const response = await fetch(`${Config.API_BASE_URL}/api/url/analyze`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ url }),
    });

    if (!response.ok) return null;

    const json = await response.json();
    if (json.success && json.data) {
      return json.data;
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Determines whether text is likely an SMS/message (vs. random UI text).
 * A simple heuristic: messages tend to be sentences with spaces.
 */
function looksLikeMessage(text: string): boolean {
  // Must have multiple words
  const words = text.split(/\s+/).filter(w => w.length > 0);
  if (words.length < 3) return false;

  // Must be long enough to be a message
  if (text.length < MIN_MESSAGE_LIKE_LENGTH) return false;

  return true;
}

const App: React.FC = () => {
  const lastOverlayTime = useRef(0);
  const pendingRequests = useRef(0);
  const processedHashes = useRef(new Set<string>());

  useEffect(() => {
    const subscription = DeviceEventEmitter.addListener(
      'onAccessibilityTextScanned',
      async (payload: any) => {
        // The payload is now a structured object from the rewritten Java service
        const text: string = typeof payload === 'string' ? payload : payload?.text;
        const packageName: string = typeof payload === 'string' ? 'unknown' : (payload?.packageName || 'unknown');
        const detectedUrlsRaw: string = typeof payload === 'string' ? '' : (payload?.detectedUrls || '');

        if (!text || text.length < MIN_SMS_TEXT_LENGTH) return;

        // Rate limit: don't overload backend
        if (pendingRequests.current >= MAX_PENDING_REQUESTS) return;

        // Content hash deduplication (JS side)
        const contentHash = simpleHash(text);
        if (processedHashes.current.has(contentHash)) return;
        processedHashes.current.add(contentHash);

        // Cap the hash set size
        if (processedHashes.current.size > 100) {
          const iterator = processedHashes.current.values();
          for (let i = 0; i < 50; i++) {
            const val = iterator.next().value;
            if (val) processedHashes.current.delete(val);
          }
        }

        // Overlay cooldown check
        const now = Date.now();
        if (now - lastOverlayTime.current < OVERLAY_COOLDOWN_MS) return;

        try {
          pendingRequests.current++;

          // ── Strategy 1: Check detected URLs first ─────────────────────
          const detectedUrls = detectedUrlsRaw
            ? detectedUrlsRaw.split(',').filter((u: string) => u.length > 0)
            : extractUrlsFromText(text);

          if (detectedUrls.length > 0) {
            // Analyse each URL using the EXISTING backend URL analyzer
            for (const url of detectedUrls) {
              const urlResult = await callUrlAnalysisApi(url);
              if (!urlResult) continue;

              console.log(
                `[REALTIME] URL analysis: url=${url} riskScore=${urlResult.riskScore} ` +
                `riskLevel=${urlResult.riskLevel} isMalicious=${urlResult.isMalicious}`
              );

              // Only show overlay for HIGH_RISK URLs (riskScore >= 70)
              if (urlResult.riskLevel === 'HIGH_RISK' && urlResult.isMalicious) {
                const title = '⚠️ Suspicious URL Detected';
                const explanation =
                  `FraudShield flagged this URL as HIGH RISK (Score: ${urlResult.riskScore}/100). ` +
                  `Signals: ${urlResult.detectedSignals.join(', ')}. ` +
                  `${urlResult.recommendation}`;

                showOverlay(title, explanation, url);
                return; // One overlay per event
              }
              // SUSPICIOUS URLs (30-69) — do NOT show as confirmed fraud
              // SAFE URLs — no overlay
            }
          }

          // ── Strategy 2: If no risky URLs, check text as SMS ────────────
          if (looksLikeMessage(text)) {
            const smsResult = await callSmsDetectionApi(text);
            if (!smsResult) return; // Backend unavailable — fail open (no overlay)

            console.log(
              `[REALTIME] SMS analysis: package=${packageName} prediction=${smsResult.prediction} ` +
              `probability=${smsResult.fraud_probability} confidence=${smsResult.confidence}`
            );

            // Only show overlay for FRAUDULENT with HIGH probability
            // The DistilBERT model uses threshold 0.5 internally.
            // For real-time overlays, we use a HIGHER threshold to avoid
            // false positives on borderline cases.
            const isFraud = smsResult.prediction === 'Fraudulent';
            const highConfidence = smsResult.fraud_probability >= 0.7;

            if (isFraud && highConfidence) {
              const probPercent = Math.round(smsResult.fraud_probability * 100);
              const title = '🚨 Scam Alert: Suspicious Message Detected';
              const explanation =
                `FraudShield's AI model detected this message as likely fraudulent ` +
                `(${probPercent}% fraud probability, ${Math.round(smsResult.confidence * 100)}% confidence). ` +
                `Do not click any links or share personal information.`;

              // Use a preview of the text for the overlay
              const preview = text.length > 200 ? text.substring(0, 197) + '...' : text;
              showOverlay(title, explanation, preview);
            }
            // NOT_FRAUD or low-confidence FRAUD → no overlay
          }

        } catch (error) {
          console.log('[REALTIME] Error during analysis:', error);
        } finally {
          pendingRequests.current--;
        }
      }
    );

    const realtimeTxnSubscription = DeviceEventEmitter.addListener(
      'onRealtimeTransaction',
      async (payloadStr: string) => {
        try {
          const payload = typeof payloadStr === 'string' ? JSON.parse(payloadStr) : payloadStr;
          console.log('[REALTIME TXN]', payload);
          
          const amountText = `₹${Number(payload.amount).toLocaleString('en-IN')}`;
          await fetch(`${Config.API_BASE_URL}/api/detections`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${await authStorage.getAccessToken()}`,
            },
            body: JSON.stringify({
              type: 'TRANSACTION',
              input: JSON.stringify({ amount: payload.amount, receiver_id: payload.receiver }),
              preview: `${amountText} → ${payload.receiver} (${payload.sourceApp})`,
              result: payload.riskLevel === 'LOW' ? 'Legitimate' : 'Fraudulent',
              riskScore: payload.fraudProbability * 100,
              riskLevel: payload.riskLevel === 'HIGH' ? 'HIGH_RISK' : payload.riskLevel === 'MEDIUM' ? 'SUSPICIOUS' : 'SAFE',
              model: 'GCN Real-Time',
              confidence: 1 - payload.fraudProbability,
              detectedSignals: [],
              reasons: [],
              recommendation: payload.riskLevel === 'LOW' ? 'Transaction appears safe.' : 'Review this transaction carefully before proceeding.',
              scamType: payload.riskLevel === 'LOW' ? 'None' : 'Suspicious Transaction',
            }),
          });
        } catch (err) {
          console.log('[REALTIME TXN ERROR]', err);
        }
      }
    );

    return () => {
      subscription.remove();
      realtimeTxnSubscription.remove();
    };
  }, []);

  function showOverlay(title: string, explanation: string, content: string) {
    const now = Date.now();
    if (now - lastOverlayTime.current < OVERLAY_COOLDOWN_MS) return;
    lastOverlayTime.current = now;

    if (AccessibilityBridgeModule && AccessibilityBridgeModule.showFraudOverlay) {
      AccessibilityBridgeModule.showFraudOverlay(title, explanation, content);
    }
  }

  return (
    <SafeAreaProvider>
      <AuthProvider>
        <RootNavigator />
      </AuthProvider>
    </SafeAreaProvider>
  );
};

/** Extract URLs from text using regex (fallback if Java didn't provide them). */
function extractUrlsFromText(text: string): string[] {
  const matches = text.match(URL_REGEX);
  return matches ? [...new Set(matches)] : [];
}

/** Simple string hash for deduplication. */
function simpleHash(text: string): string {
  const normalized = text.replace(/\s+/g, ' ').trim().toLowerCase();
  let hash = 0;
  for (let i = 0; i < normalized.length; i++) {
    const char = normalized.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0; // Convert to 32-bit integer
  }
  return hash.toString();
}

export default App;
