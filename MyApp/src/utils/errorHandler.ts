/**
 * Error Handler Utilities
 *
 * Converts Axios errors and API error responses into user-friendly messages.
 * Never exposes raw stack traces or technical details to the user.
 */

import {AxiosError} from 'axios';
import {ApiErrorResponse, ValidationError} from '../types/auth';

export interface AppError {
  message: string;
  validationErrors?: ValidationError[];
  statusCode?: number;
}

/**
 * Extract a user-friendly error from an Axios error.
 */
export const extractApiError = (error: unknown): AppError => {
  // Axios error with a response from the server
  if (isAxiosError(error) && error.response) {
    const status = error.response.status;
    const data = error.response.data as ApiErrorResponse;

    // Server returned a structured error
    if (data && data.message) {
      return {
        message: data.message,
        validationErrors: data.errors,
        statusCode: status,
      };
    }

    // Fallback HTTP status messages
    return {
      message: getHttpStatusMessage(status),
      statusCode: status,
    };
  }

  // Network error (no response)
  if (isAxiosError(error) && !error.response) {
    if (error.code === 'ECONNABORTED') {
      return {
        message: 'Request timed out. Please check your connection and try again.',
      };
    }
    return {
      message: 'Unable to connect to the server. Please check your internet connection.',
    };
  }

  // Generic JS error
  if (error instanceof Error) {
    return {message: error.message};
  }

  // Unknown error
  return {message: 'An unexpected error occurred. Please try again.'};
};

/**
 * Type guard for Axios errors.
 */
const isAxiosError = (error: unknown): error is AxiosError => {
  return (error as AxiosError)?.isAxiosError === true;
};

/**
 * Map HTTP status codes to user-friendly messages.
 */
const getHttpStatusMessage = (status: number): string => {
  switch (status) {
    case 400:
      return 'Invalid request. Please check your input.';
    case 401:
      return 'Authentication failed. Please log in again.';
    case 403:
      return 'You do not have permission to perform this action.';
    case 404:
      return 'The requested resource was not found.';
    case 409:
      return 'A conflict occurred. The resource may already exist.';
    case 422:
      return 'The submitted data is invalid. Please check your input.';
    case 429:
      return 'Too many requests. Please wait and try again.';
    case 500:
      return 'A server error occurred. Please try again later.';
    case 502:
    case 503:
    case 504:
      return 'The server is temporarily unavailable. Please try again later.';
    default:
      return 'An unexpected error occurred. Please try again.';
  }
};

/**
 * Format validation errors into a single readable string.
 */
export const formatValidationErrors = (
  errors: ValidationError[],
): string => {
  return errors.map(e => e.message).join('\n');
};
