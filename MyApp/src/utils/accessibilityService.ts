/**
 * Accessibility & Overlay Bridge Utility
 *
 * Exposes methods to query Android AccessibilityService status and Overlay permissions
 * and open the corresponding Android system settings.
 */

import {NativeModules, Platform} from 'react-native';

const {AccessibilityBridgeModule} = NativeModules;

export interface ServiceStatus {
  accessibilityEnabled: boolean;
  overlayGranted: boolean;
}

export const isAccessibilityServiceEnabled = async (): Promise<boolean> => {
  if (Platform.OS !== 'android' || !AccessibilityBridgeModule) {
    return false;
  }
  try {
    return await AccessibilityBridgeModule.isAccessibilityServiceEnabled();
  } catch {
    return false;
  }
};

export const openAccessibilitySettings = async (): Promise<boolean> => {
  if (Platform.OS !== 'android' || !AccessibilityBridgeModule) {
    return false;
  }
  try {
    return await AccessibilityBridgeModule.openAccessibilitySettings();
  } catch {
    return false;
  }
};

export const isOverlayPermissionGranted = async (): Promise<boolean> => {
  if (Platform.OS !== 'android' || !AccessibilityBridgeModule) {
    return false;
  }
  try {
    return await AccessibilityBridgeModule.isOverlayPermissionGranted();
  } catch {
    return false;
  }
};

export const openOverlaySettings = async (): Promise<boolean> => {
  if (Platform.OS !== 'android' || !AccessibilityBridgeModule) {
    return false;
  }
  try {
    return await AccessibilityBridgeModule.openOverlaySettings();
  } catch {
    return false;
  }
};

export const checkAllServiceStatus = async (): Promise<ServiceStatus> => {
  const [accessibilityEnabled, overlayGranted] = await Promise.all([
    isAccessibilityServiceEnabled(),
    isOverlayPermissionGranted(),
  ]);
  return {accessibilityEnabled, overlayGranted};
};
