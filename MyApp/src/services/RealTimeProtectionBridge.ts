import {NativeModules, NativeEventEmitter, Platform} from 'react-native';

const {RealTimeProtectionModule} = NativeModules;

const RealTimeProtectionBridge = {
  isNotificationAccessEnabled: async (): Promise<boolean> => {
    if (Platform.OS !== 'android' || !RealTimeProtectionModule) return false;
    try {
      return await RealTimeProtectionModule.isNotificationAccessEnabled();
    } catch {
      return false;
    }
  },

  openNotificationAccessSettings: async (): Promise<boolean> => {
    if (Platform.OS !== 'android' || !RealTimeProtectionModule) return false;
    try {
      return await RealTimeProtectionModule.openNotificationAccessSettings();
    } catch {
      return false;
    }
  },

  setRealtimeProtectionEnabled: async (enabled: boolean): Promise<boolean> => {
    if (Platform.OS !== 'android' || !RealTimeProtectionModule) return false;
    try {
      return await RealTimeProtectionModule.setRealtimeProtectionEnabled(enabled);
    } catch {
      return false;
    }
  },

  isRealtimeProtectionEnabled: async (): Promise<boolean> => {
    if (Platform.OS !== 'android' || !RealTimeProtectionModule) return false;
    try {
      return await RealTimeProtectionModule.isRealtimeProtectionEnabled();
    } catch {
      return false;
    }
  },

  getRecentDetections: async (): Promise<string> => {
    if (Platform.OS !== 'android' || !RealTimeProtectionModule) return '[]';
    try {
      return await RealTimeProtectionModule.getRecentDetections();
    } catch {
      return '[]';
    }
  },

  getEventEmitter: (): NativeEventEmitter | null => {
    if (Platform.OS !== 'android' || !RealTimeProtectionModule) return null;
    return new NativeEventEmitter(RealTimeProtectionModule);
  },
};

export default RealTimeProtectionBridge;
