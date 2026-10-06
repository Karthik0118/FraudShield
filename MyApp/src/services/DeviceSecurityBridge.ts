/**
 * Device Security Bridge
 *
 * TypeScript bridge to the native DeviceSecurityModule.
 * Wraps all native calls safely with fallbacks for non-Android platforms.
 */

import {NativeModules, Platform} from 'react-native';

const {DeviceSecurityModule} = NativeModules;

// ─── Types ──────────────────────────────────────────────────────────────────

export type CheckStatus = 'safe' | 'warning' | 'risk';

export interface AccessibilityServiceInfo {
  packageName: string;
  label: string;
  isSystemApp: boolean;
  isOwnApp: boolean;
  isUnfamiliar: boolean;
}

export interface NotificationListenerInfo {
  packageName: string;
  label: string;
  isSystemApp: boolean;
  isOwnApp: boolean;
  isUnfamiliar: boolean;
}

export interface RecentAppInfo {
  packageName: string;
  label: string;
  installTime: number;
}

export interface SecurityScanResult {
  accessibilityServices: {
    services: AccessibilityServiceInfo[];
    total: number;
    unfamiliarCount: number;
    status: CheckStatus;
  };
  notificationListeners: {
    listeners: NotificationListenerInfo[];
    total: number;
    unfamiliarCount: number;
    status: CheckStatus;
  };
  developerOptions: {
    developerOptionsEnabled: boolean;
    usbDebuggingEnabled: boolean;
    status: CheckStatus;
  };
  installSources: {
    unknownSourcesEnabled: boolean;
    status: CheckStatus;
  };
  recentApps: {
    apps: RecentAppInfo[];
    count: number;
    status: CheckStatus;
  };
  deviceEncryption: {
    isEncrypted: boolean;
    status: CheckStatus;
  };
  scanTimestamp: number;
}

// ─── Risk Engine Types ──────────────────────────────────────────────────────

export type DeviceRiskLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface DeviceRiskReason {
  id: string;
  title: string;
  description: string;
  severity: 'info' | 'warning' | 'danger';
  actionLabel?: string;
  actionType?: 'accessibility' | 'notification' | 'developer' | 'apps' | 'security';
}

export interface DeviceSecurityAssessment {
  riskLevel: DeviceRiskLevel;
  score: number; // 0-100 (100 = most secure)
  label: string;
  color: string;
  reasons: DeviceRiskReason[];
  totalChecks: number;
  passedChecks: number;
  scanTimestamp: number;
}

// ─── Bridge Methods ─────────────────────────────────────────────────────────

const DeviceSecurityBridge = {
  runSecurityScan: async (): Promise<SecurityScanResult | null> => {
    if (Platform.OS !== 'android' || !DeviceSecurityModule) return null;
    try {
      return await DeviceSecurityModule.runSecurityScan();
    } catch {
      return null;
    }
  },

  openSecuritySettings: async (): Promise<boolean> => {
    if (Platform.OS !== 'android' || !DeviceSecurityModule) return false;
    try {
      return await DeviceSecurityModule.openSecuritySettings();
    } catch {
      return false;
    }
  },

  openDeveloperSettings: async (): Promise<boolean> => {
    if (Platform.OS !== 'android' || !DeviceSecurityModule) return false;
    try {
      return await DeviceSecurityModule.openDeveloperSettings();
    } catch {
      return false;
    }
  },

  openAppSettings: async (): Promise<boolean> => {
    if (Platform.OS !== 'android' || !DeviceSecurityModule) return false;
    try {
      return await DeviceSecurityModule.openAppSettings();
    } catch {
      return false;
    }
  },

  getLastScanTime: async (): Promise<number> => {
    if (Platform.OS !== 'android' || !DeviceSecurityModule) return 0;
    try {
      return await DeviceSecurityModule.getLastScanTime();
    } catch {
      return 0;
    }
  },

  showSecurityAlert: async (title: string, message: string, riskLevel: string): Promise<boolean> => {
    if (Platform.OS !== 'android' || !DeviceSecurityModule) return false;
    try {
      return await DeviceSecurityModule.showSecurityAlert(title, message, riskLevel);
    } catch {
      return false;
    }
  },
};

// ─── Local Risk Engine ──────────────────────────────────────────────────────

/**
 * Evaluates a security scan result and produces a risk assessment.
 * Purely local, rule-based — no external AI API.
 */
export function evaluateDeviceSecurity(
  scan: SecurityScanResult,
): DeviceSecurityAssessment {
  const reasons: DeviceRiskReason[] = [];
  let riskPoints = 0; // Higher = worse
  let totalChecks = 6;
  let passedChecks = 0;

  // 1. Accessibility Services
  if (scan.accessibilityServices.unfamiliarCount >= 2) {
    riskPoints += 30;
    reasons.push({
      id: 'accessibility_multiple',
      title: 'Multiple Unfamiliar Accessibility Services',
      description: `${scan.accessibilityServices.unfamiliarCount} unfamiliar apps have accessibility access. These services can read screen content and simulate user actions.`,
      severity: 'danger',
      actionLabel: 'Review Accessibility Services',
      actionType: 'accessibility',
    });
  } else if (scan.accessibilityServices.unfamiliarCount === 1) {
    riskPoints += 15;
    const unfamiliar = scan.accessibilityServices.services.find(s => s.isUnfamiliar);
    reasons.push({
      id: 'accessibility_one',
      title: 'Unfamiliar Accessibility Service Detected',
      description: `"${unfamiliar?.label || 'Unknown app'}" has accessibility access, which allows it to read screen content.`,
      severity: 'warning',
      actionLabel: 'Review Accessibility Services',
      actionType: 'accessibility',
    });
  } else {
    passedChecks++;
  }

  // 2. Notification Listeners
  if (scan.notificationListeners.unfamiliarCount >= 2) {
    riskPoints += 25;
    reasons.push({
      id: 'notification_multiple',
      title: 'Multiple Unfamiliar Notification Listeners',
      description: `${scan.notificationListeners.unfamiliarCount} unfamiliar apps can read your notifications, potentially including OTPs and banking alerts.`,
      severity: 'danger',
      actionLabel: 'Review Notification Access',
      actionType: 'notification',
    });
  } else if (scan.notificationListeners.unfamiliarCount === 1) {
    riskPoints += 12;
    const unfamiliar = scan.notificationListeners.listeners.find(l => l.isUnfamiliar);
    reasons.push({
      id: 'notification_one',
      title: 'Unfamiliar App Has Notification Access',
      description: `"${unfamiliar?.label || 'Unknown app'}" can read your notifications.`,
      severity: 'warning',
      actionLabel: 'Review Notification Access',
      actionType: 'notification',
    });
  } else {
    passedChecks++;
  }

  // 3. Developer Options / USB Debugging
  if (scan.developerOptions.usbDebuggingEnabled) {
    riskPoints += 15;
    reasons.push({
      id: 'usb_debugging',
      title: 'USB Debugging Enabled',
      description: 'USB debugging allows connected computers to access device data. Disable it when not actively developing.',
      severity: 'warning',
      actionLabel: 'Review Developer Options',
      actionType: 'developer',
    });
  } else if (scan.developerOptions.developerOptionsEnabled) {
    riskPoints += 5;
    reasons.push({
      id: 'developer_options',
      title: 'Developer Options Enabled',
      description: 'Developer options are enabled. This is generally safe but may expose advanced settings.',
      severity: 'info',
      actionLabel: 'Review Developer Options',
      actionType: 'developer',
    });
  } else {
    passedChecks++;
  }

  // 4. Unknown Sources
  if (scan.installSources.unknownSourcesEnabled) {
    riskPoints += 10;
    reasons.push({
      id: 'unknown_sources',
      title: 'App Sideloading Permitted',
      description: 'Your device allows installing apps from unknown sources, which increases the risk of installing malicious software.',
      severity: 'warning',
      actionLabel: 'Review Security Settings',
      actionType: 'security',
    });
  } else {
    passedChecks++;
  }

  // 5. Recently Installed Apps
  if (scan.recentApps.count > 5) {
    riskPoints += 10;
    reasons.push({
      id: 'recent_apps_many',
      title: 'Many Recently Installed Apps',
      description: `${scan.recentApps.count} apps were installed in the last 7 days. Review them to ensure none are unwanted.`,
      severity: 'warning',
      actionLabel: 'Review Installed Apps',
      actionType: 'apps',
    });
  } else if (scan.recentApps.count > 3) {
    riskPoints += 5;
    reasons.push({
      id: 'recent_apps_some',
      title: 'Several Recently Installed Apps',
      description: `${scan.recentApps.count} apps were installed in the last 7 days.`,
      severity: 'info',
      actionLabel: 'Review Installed Apps',
      actionType: 'apps',
    });
  } else {
    passedChecks++;
  }

  // 6. Device Encryption
  if (!scan.deviceEncryption.isEncrypted) {
    riskPoints += 20;
    reasons.push({
      id: 'no_encryption',
      title: 'Device Not Encrypted',
      description: 'Your device storage is not encrypted. Anyone with physical access could read your data.',
      severity: 'danger',
      actionLabel: 'Review Security Settings',
      actionType: 'security',
    });
  } else {
    passedChecks++;
  }

  // Calculate risk level
  let riskLevel: DeviceRiskLevel;
  let label: string;
  let color: string;
  const score = Math.max(0, 100 - riskPoints);

  if (riskPoints >= 60) {
    riskLevel = 'CRITICAL';
    label = 'Possible Device Compromise';
    color = '#DC2626';
  } else if (riskPoints >= 35) {
    riskLevel = 'HIGH';
    label = 'High Security Risk';
    color = '#EF4444';
  } else if (riskPoints >= 15) {
    riskLevel = 'MEDIUM';
    label = 'Security Warning';
    color = '#F59E0B';
  } else {
    riskLevel = 'LOW';
    label = 'Device Appears Secure';
    color = '#10B981';
  }

  return {
    riskLevel,
    score,
    label,
    color,
    reasons,
    totalChecks,
    passedChecks,
    scanTimestamp: scan.scanTimestamp,
  };
}

export default DeviceSecurityBridge;
