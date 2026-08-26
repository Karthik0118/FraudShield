import { Alert } from 'react-native';
import { detectFraud } from './fraudDetector';

/**
 * Checks a message for fraud and triggers a React Native Alert if it's suspicious.
 * This reuses the standard Alert.alert mechanism for the warning UI.
 */
export const checkMessageAndAlert = (message: string) => {
  const result = detectFraud(message);

  if (result.isSuspicious) {
    const reasonsStr = result.reasons.map(r => `• ${r}`).join('\n');
    Alert.alert(
      'Suspicious Message Detected',
      `This message has been flagged by our security engine (Score: ${result.score}).\n\nReasons:\n${reasonsStr}\n\nPlease do not click on any links or share personal information.`,
      [{ text: 'Dismiss', style: 'cancel' }]
    );
  }

  return result;
};
