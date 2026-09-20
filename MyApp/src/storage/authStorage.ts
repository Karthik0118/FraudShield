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

// In-memory cache to guarantee fast, synchronous-like fallback within active session
let memoryAccessToken: string | null = null;
let memoryRefreshToken: string | null = null;
let memoryUser: User | null = null;

export const authStorage = {
  // ─── Tokens ──────────────────────────────────────────────────────────────

  saveTokens: async (
    accessToken: string,
    refreshToken: string,
  ): Promise<void> => {
    memoryAccessToken = accessToken;
    memoryRefreshToken = refreshToken;
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, accessToken);
      await AsyncStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, refreshToken);
    } catch (e) {
      console.warn('Failed to save tokens to AsyncStorage (kept in memory):', e);
    }
  },

  getAccessToken: async (): Promise<string | null> => {
    if (memoryAccessToken) {
      return memoryAccessToken;
    }
    try {
      const token = await AsyncStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
      if (token) {
        memoryAccessToken = token;
      }
      return token;
    } catch (e) {
      console.warn('Failed to get access token from AsyncStorage:', e);
      return memoryAccessToken;
    }
  },

  getRefreshToken: async (): Promise<string | null> => {
    if (memoryRefreshToken) {
      return memoryRefreshToken;
    }
    try {
      const token = await AsyncStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);
      if (token) {
        memoryRefreshToken = token;
      }
      return token;
    } catch (e) {
      console.warn('Failed to get refresh token from AsyncStorage:', e);
      return memoryRefreshToken;
    }
  },

  // ─── User Data ───────────────────────────────────────────────────────────

  saveUser: async (user: User): Promise<void> => {
    memoryUser = user;
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(user));
    } catch (e) {
      console.warn('Failed to save user to AsyncStorage (kept in memory):', e);
    }
  },

  getUser: async (): Promise<User | null> => {
    if (memoryUser) {
      return memoryUser;
    }
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.USER_DATA);
      if (data) {
        const parsed = JSON.parse(data) as User;
        memoryUser = parsed;
        return parsed;
      }
    } catch (e) {
      console.warn('Failed to get user from AsyncStorage:', e);
      return memoryUser;
    }
    return null;
  },

  // ─── Clear ───────────────────────────────────────────────────────────────

  clearAll: async (): Promise<void> => {
    memoryAccessToken = null;
    memoryRefreshToken = null;
    memoryUser = null;
    try {
      await AsyncStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
      await AsyncStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
      await AsyncStorage.removeItem(STORAGE_KEYS.USER_DATA);
    } catch (e) {
      console.warn('Failed to clear AsyncStorage:', e);
    }
  },
};
