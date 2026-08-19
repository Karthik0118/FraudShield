/**
 * Authentication Types
 *
 * These types match the exact backend API contract.
 * Derived from inspecting:
 * - backend/models/User.js
 * - backend/controllers/authController.js
 * - backend/validators/authValidator.js
 * - backend/API_DOCUMENTATION.md
 */

// ─── User ────────────────────────────────────────────────────────────────────

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: 'user' | 'admin';
  isVerified: boolean;
  createdAt?: string;
  updatedAt?: string;
}

// ─── Request Types ───────────────────────────────────────────────────────────

export interface RegisterRequest {
  name: string;
  email: string;
  phone: string;
  password: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface UpdateProfileRequest {
  name?: string;
  phone?: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

// ─── Response Types ──────────────────────────────────────────────────────────

/** Shared wrapper: every API response has `success` */
export interface ApiResponse {
  success: boolean;
  message?: string;
}

/** Login & Register both return user + token pair */
export interface AuthResponse extends ApiResponse {
  data: {
    user: User;
    accessToken: string;
    refreshToken: string;
  };
}

/** GET /api/auth/profile */
export interface ProfileResponse extends ApiResponse {
  data: User;
}

/** PUT /api/auth/profile */
export interface UpdateProfileResponse extends ApiResponse {
  data: User;
}

/** POST /api/auth/refresh-token  &  POST /api/auth/change-password */
export interface TokenResponse extends ApiResponse {
  data: {
    accessToken: string;
    refreshToken: string;
  };
}

/** POST /api/auth/logout */
export interface LogoutResponse extends ApiResponse {}

// ─── Error Types ─────────────────────────────────────────────────────────────

export interface ValidationError {
  field: string;
  message: string;
}

export interface ApiErrorResponse {
  success: false;
  message: string;
  errors?: ValidationError[];
}

// ─── Auth State ──────────────────────────────────────────────────────────────

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}
