/**
 * Authentication API Service
 *
 * All auth API calls in one place. Screens never make raw Axios requests.
 * Matches the exact backend contract from API_DOCUMENTATION.md.
 */

import apiClient from './client';
import {
  RegisterRequest,
  LoginRequest,
  UpdateProfileRequest,
  ChangePasswordRequest,
  AuthResponse,
  ProfileResponse,
  UpdateProfileResponse,
  TokenResponse,
  LogoutResponse,
} from '../types/auth';

const AUTH_BASE = '/api/auth';

const authApi = {
  /**
   * POST /api/auth/register
   * Creates a new user account and returns tokens.
   */
  register: async (data: RegisterRequest): Promise<AuthResponse> => {
    const response = await apiClient.post<AuthResponse>(
      `${AUTH_BASE}/register`,
      data,
    );
    return response.data;
  },

  /**
   * POST /api/auth/login
   * Authenticates user and returns tokens.
   */
  login: async (data: LoginRequest): Promise<AuthResponse> => {
    const response = await apiClient.post<AuthResponse>(
      `${AUTH_BASE}/login`,
      data,
    );
    return response.data;
  },

  /**
   * GET /api/auth/profile
   * Retrieves the authenticated user's profile.
   */
  getProfile: async (): Promise<ProfileResponse> => {
    const response = await apiClient.get<ProfileResponse>(
      `${AUTH_BASE}/profile`,
    );
    return response.data;
  },

  /**
   * PUT /api/auth/profile
   * Updates the authenticated user's name and/or phone.
   */
  updateProfile: async (
    data: UpdateProfileRequest,
  ): Promise<UpdateProfileResponse> => {
    const response = await apiClient.put<UpdateProfileResponse>(
      `${AUTH_BASE}/profile`,
      data,
    );
    return response.data;
  },

  /**
   * POST /api/auth/refresh-token
   * Exchanges a refresh token for a new token pair (rotation).
   */
  refreshToken: async (refreshToken: string): Promise<TokenResponse> => {
    const response = await apiClient.post<TokenResponse>(
      `${AUTH_BASE}/refresh-token`,
      {refreshToken},
    );
    return response.data;
  },

  /**
   * POST /api/auth/logout
   * Invalidates the user's refresh token server-side.
   */
  logout: async (): Promise<LogoutResponse> => {
    const response = await apiClient.post<LogoutResponse>(
      `${AUTH_BASE}/logout`,
    );
    return response.data;
  },

  /**
   * POST /api/auth/change-password
   * Changes password and returns new token pair.
   */
  changePassword: async (
    data: ChangePasswordRequest,
  ): Promise<TokenResponse> => {
    const response = await apiClient.post<TokenResponse>(
      `${AUTH_BASE}/change-password`,
      data,
    );
    return response.data;
  },
};

export default authApi;
