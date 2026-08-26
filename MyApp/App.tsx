/**
 * App Entry Point
 *
 * Minimal root: wraps the app in AuthProvider and SafeAreaProvider.
 * No business logic here — all routing handled by RootNavigator.
 */

import React, { useEffect } from 'react';
import { DeviceEventEmitter, NativeModules } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from './src/context/AuthContext';
import RootNavigator from './src/navigation/RootNavigator';
import { detectFraud } from './src/fraudDetection/fraudDetector';

const { AccessibilityBridgeModule } = NativeModules;

const App: React.FC = () => {
  useEffect(() => {
    const subscription = DeviceEventEmitter.addListener(
      'onAccessibilityTextScanned',
      (text: string) => {
        if (!text) return;
        const result = detectFraud(text);
        if (result.isSuspicious) {
          const title = "Scam Alert: Suspicious Activity Detected";
          const explanation = "Our local security engine flagged this message. Triggered rules: " + result.triggeredRules.join(', ') + ". Avoid clicking links or sharing personal info.";
          
          if (AccessibilityBridgeModule && AccessibilityBridgeModule.showFraudOverlay) {
            AccessibilityBridgeModule.showFraudOverlay(title, explanation, text);
          }
        }
      }
    );

    return () => subscription.remove();
  }, []);

  return (
    <SafeAreaProvider>
      <AuthProvider>
        <RootNavigator />
      </AuthProvider>
    </SafeAreaProvider>
  );
};

export default App;
