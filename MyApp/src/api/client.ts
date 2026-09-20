/**
 * Axios API Client
 *
 * Centralized HTTP client with:
 * - Automatic Bearer token attachment
 * - 401 interception → token refresh → request retry
 * - Concurrent refresh prevention (queue mechanism)
 * - Automatic logout on refresh failure
 */

import axios, {
  AxiosError,
  AxiosRequestConfig,
  InternalAxiosRequestConfig,
} from 'axios';
import Config from '../config';
import {authStorage} from '../storage/authStorage';
import {TokenResponse} from '../types/auth';

// ─── Create Axios Instance ──────────────────────────────────────────────────

const apiClient = axios.create({
  baseURL: Config.API_BASE_URL,
  timeout: Config.REQUEST_TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
  },
});

// ─── Refresh Token Queue ────────────────────────────────────────────────────

let isRefreshing = false;
let failedQueue: Array<{
  resolve: (token: string) => void;
  reject: (error: Error) => void;
}> = [];

// Callback to clear auth state — set by AuthContext
let onAuthFailure: (() => void) | null = null;

export const setAuthFailureCallback = (callback: () => void) => {
  onAuthFailure = callback;
};

const processQueue = (error: Error | null, token: string | null = null) => {
  failedQueue.forEach(pending => {
    if (error) {
      pending.reject(error);
    } else if (token) {
      pending.resolve(token);
    }
  });
  failedQueue = [];
};

// ─── Request Interceptor ────────────────────────────────────────────────────

apiClient.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    const token = await authStorage.getAccessToken();
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  },
);

// ─── Response Interceptor ───────────────────────────────────────────────────

apiClient.interceptors.response.use(
  response => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };

    // Only attempt refresh on 401 errors for authenticated requests
    if (error.response?.status !== 401 || originalRequest._retry) {
      return Promise.reject(error);
    }

    // Don't try to refresh for auth endpoints themselves
    const url = originalRequest.url || '';
    if (
      url.includes('/auth/login') ||
      url.includes('/auth/register') ||
      url.includes('/auth/refresh-token')
    ) {
      return Promise.reject(error);
    }

    // If already refreshing, queue this request
    if (isRefreshing) {
      return new Promise<string>((resolve, reject) => {
        failedQueue.push({resolve, reject});
      })
        .then(token => {
          if (originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${token}`;
          }
          return apiClient(originalRequest);
        })
        .catch(err => Promise.reject(err));
    }

    originalRequest._retry = true;
    isRefreshing = true;

    try {
      const refreshToken = await authStorage.getRefreshToken();

      if (!refreshToken) {
        throw new Error('No refresh token available');
      }

      // Call refresh endpoint directly (not through intercepted client)
      const response = await axios.post<TokenResponse>(
        `${Config.API_BASE_URL}/api/auth/refresh-token`,
        {refreshToken},
        {headers: {'Content-Type': 'application/json'}},
      );

      const {accessToken, refreshToken: newRefreshToken} = response.data.data;

      // Store new tokens
      await authStorage.saveTokens(accessToken, newRefreshToken);

      // Update the authorization header
      if (originalRequest.headers) {
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
      }

      // Process queued requests with the new token
      processQueue(null, accessToken);

      return apiClient(originalRequest);
    } catch (refreshError) {
      // Only clear auth state for genuine authentication failures (401/403 from server).
      // Transient network errors during refresh should NOT log the user out.
      const isAuthError =
        (refreshError as any)?.response?.status === 401 ||
        (refreshError as any)?.response?.status === 403 ||
        (refreshError as Error)?.message === 'No refresh token available';

      processQueue(refreshError as Error, null);

      if (isAuthError) {
        await authStorage.clearAll();
        if (onAuthFailure) {
          onAuthFailure();
        }
      }

      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  },
);

export default apiClient;
