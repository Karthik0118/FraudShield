/**
 * Validation Utilities
 *
 * Client-side validation rules matching the backend validators exactly.
 * See: backend/validators/authValidator.js
 */

export interface ValidationResult {
  isValid: boolean;
  error?: string;
}

/**
 * Validate email format.
 * Backend uses: isEmail() from express-validator
 */
export const validateEmail = (email: string): ValidationResult => {
  if (!email.trim()) {
    return {isValid: false, error: 'Email is required'};
  }
  const emailRegex = /^\S+@\S+\.\S+$/;
  if (!emailRegex.test(email.trim())) {
    return {isValid: false, error: 'Please enter a valid email'};
  }
  return {isValid: true};
};

/**
 * Validate password.
 * Backend requires: min 6 chars, must contain at least one number.
 */
export const validatePassword = (password: string): ValidationResult => {
  if (!password) {
    return {isValid: false, error: 'Password is required'};
  }
  if (password.length < 6) {
    return {isValid: false, error: 'Password must be at least 6 characters'};
  }
  if (!/\d/.test(password)) {
    return {
      isValid: false,
      error: 'Password must contain at least one number',
    };
  }
  return {isValid: true};
};

/**
 * Validate name.
 * Backend requires: 2–50 characters, trimmed, non-empty.
 */
export const validateName = (name: string): ValidationResult => {
  const trimmed = name.trim();
  if (!trimmed) {
    return {isValid: false, error: 'Name is required'};
  }
  if (trimmed.length < 2) {
    return {isValid: false, error: 'Name must be at least 2 characters'};
  }
  if (trimmed.length > 50) {
    return {isValid: false, error: 'Name cannot exceed 50 characters'};
  }
  return {isValid: true};
};

/**
 * Validate phone number.
 * Backend regex: /^\+?[1-9]\d{6,14}$/
 */
export const validatePhone = (phone: string): ValidationResult => {
  const trimmed = phone.trim();
  if (!trimmed) {
    return {isValid: false, error: 'Phone number is required'};
  }
  const phoneRegex = /^\+?[1-9]\d{6,14}$/;
  if (!phoneRegex.test(trimmed)) {
    return {
      isValid: false,
      error: 'Please enter a valid phone number (e.g. +919876543210)',
    };
  }
  return {isValid: true};
};

/**
 * Validate that two passwords match (for confirm password fields).
 */
export const validatePasswordMatch = (
  password: string,
  confirmPassword: string,
): ValidationResult => {
  if (!confirmPassword) {
    return {isValid: false, error: 'Please confirm your password'};
  }
  if (password !== confirmPassword) {
    return {isValid: false, error: 'Passwords do not match'};
  }
  return {isValid: true};
};
