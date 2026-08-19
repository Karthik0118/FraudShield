/**
 * Authentication Context
 *
 * Provides authentication state and actions to the entire app.
 * Handles:
 * - Login / Register / Logout
 * - Session persistence (check stored tokens on mount)
 * - Token refresh on app launch
 * - Profile refresh
 */

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
} from 'react';
import {User} from '../types/auth';
import authApi from '../api/authApi';
import {authStorage} from '../storage/authStorage';
import {setAuthFailureCallback} from '../api/client';
import {extractApiError} from '../utils/errorHandler';

// ─── Context Shape ──────────────────────────────────────────────────────────

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (
    name: string,
    email: string,
    phone: string,
    password: string,
  ) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  updateStoredUser: (user: User) => Promise<void>;
  updateTokens: (accessToken: string, refreshToken: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// ─── Provider ───────────────────────────────────────────────────────────────

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({children}) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const isAuthenticated = user !== null;

  // Clear local auth state
  const clearAuth = useCallback(async () => {
    setUser(null);
    await authStorage.clearAll();
  }, []);

  // Register the auth failure callback for the API client interceptor
  useEffect(() => {
    setAuthFailureCallback(() => {
      clearAuth();
    });
  }, [clearAuth]);

  // ─── Check Persisted Session on Mount ──────────────────────────────────

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const accessToken = await authStorage.getAccessToken();
        if (!accessToken) {
          setIsLoading(false);
          return;
        }

        // Token exists — validate it by fetching the profile
        const profileResponse = await authApi.getProfile();
        const userData = profileResponse.data;
        setUser(userData);
        await authStorage.saveUser(userData);
      } catch {
        // Token invalid/expired — the interceptor will try refresh.
        // If that also fails, onAuthFailure clears everything.
        // As a safety net, also try loading cached user data
        const cachedUser = await authStorage.getUser();
        if (!cachedUser) {
          await clearAuth();
        }
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, [clearAuth]);

  // ─── Login ─────────────────────────────────────────────────────────────

  const login = useCallback(async (email: string, password: string) => {
    const response = await authApi.login({email, password});
    const {user: userData, accessToken, refreshToken} = response.data;

    await authStorage.saveTokens(accessToken, refreshToken);
    await authStorage.saveUser(userData);
    setUser(userData);
  }, []);

  // ─── Register ──────────────────────────────────────────────────────────

  const register = useCallback(
    async (name: string, email: string, phone: string, password: string) => {
      const response = await authApi.register({name, email, phone, password});
      const {user: userData, accessToken, refreshToken} = response.data;

      await authStorage.saveTokens(accessToken, refreshToken);
      await authStorage.saveUser(userData);
      setUser(userData);
    },
    [],
  );

  // ─── Logout ────────────────────────────────────────────────────────────

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } catch {
      // Even if the API call fails (e.g., token already invalid),
      // we still clear local state safely
    }
    await clearAuth();
  }, [clearAuth]);

  // ─── Refresh User Profile ──────────────────────────────────────────────

  const refreshUser = useCallback(async () => {
    try {
      const profileResponse = await authApi.getProfile();
      const userData = profileResponse.data;
      setUser(userData);
      await authStorage.saveUser(userData);
    } catch (error) {
      throw extractApiError(error);
    }
  }, []);

  // ─── Update Stored User (after edit profile) ──────────────────────────

  const updateStoredUser = useCallback(async (updatedUser: User) => {
    setUser(updatedUser);
    await authStorage.saveUser(updatedUser);
  }, []);

  // ─── Update Tokens (after change password) ────────────────────────────

  const updateTokens = useCallback(
    async (accessToken: string, refreshToken: string) => {
      await authStorage.saveTokens(accessToken, refreshToken);
    },
    [],
  );

  // ─── Memoized Value ───────────────────────────────────────────────────

  const value = useMemo(
    () => ({
      user,
      isAuthenticated,
      isLoading,
      login,
      register,
      logout,
      refreshUser,
      updateStoredUser,
      updateTokens,
    }),
    [
      user,
      isAuthenticated,
      isLoading,
      login,
      register,
      logout,
      refreshUser,
      updateStoredUser,
      updateTokens,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// ─── Hook ───────────────────────────────────────────────────────────────────

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
