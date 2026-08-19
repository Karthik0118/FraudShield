/**
 * Auth Storage
 *
 * AsyncStorage wrapper for persisting authentication tokens and user data.
 * All storage operations are centralized here — no scattered AsyncStorage calls.
 *
 * Compatible with @react-native-async-storage/async-storage v3.x
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import Config from '../config';
import {User} from '../types/auth';

const {STORAGE_KEYS} = Config;

export const authStorage = {
  // ─── Tokens ──────────────────────────────────────────────────────────────

  saveTokens: async (
    accessToken: string,
    refreshToken: string,
  ): Promise<void> => {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, accessToken);
      await AsyncStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, refreshToken);
    } catch (e) {
      console.warn('Failed to save tokens:', e);
    }
  },

  getAccessToken: async (): Promise<string | null> => {
    try {
      return await AsyncStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
    } catch (e) {
      console.warn('Failed to get access token:', e);
      return null;
    }
  },

  getRefreshToken: async (): Promise<string | null> => {
    try {
      return await AsyncStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);
    } catch (e) {
      console.warn('Failed to get refresh token:', e);
      return null;
    }
  },

  // ─── User Data ───────────────────────────────────────────────────────────

  saveUser: async (user: User): Promise<void> => {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(user));
    } catch (e) {
      console.warn('Failed to save user:', e);
    }
  },

  getUser: async (): Promise<User | null> => {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.USER_DATA);
      if (data) {
        return JSON.parse(data) as User;
      }
    } catch (e) {
      console.warn('Failed to get user:', e);
    }
    return null;
  },

  // ─── Clear ───────────────────────────────────────────────────────────────

  clearAll: async (): Promise<void> => {
    try {
      await AsyncStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
      await AsyncStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
      await AsyncStorage.removeItem(STORAGE_KEYS.USER_DATA);
    } catch (e) {
      console.warn('Failed to clear storage:', e);
    }
  },
};
