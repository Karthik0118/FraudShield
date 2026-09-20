/**
 * SMS Detection API Service
 *
 * Uses the existing authenticated apiClient (Axios with JWT interceptors).
 * Calls POST /api/sms/detect on the Node.js backend which proxies to ML service.
 */

import apiClient from './client';
import {SmsDetectRequest, SmsDetectResponse} from '../types/sms';

const SMS_BASE = '/api/sms';

const smsApi = {
  /**
   * POST /api/sms/detect
   * Analyzes an SMS message and returns prediction + fraud probability.
   * Requires authentication (Bearer token added automatically by apiClient).
   */
  detect: async (data: SmsDetectRequest): Promise<SmsDetectResponse> => {
    const response = await apiClient.post<SmsDetectResponse>(
      `${SMS_BASE}/detect`,
      data,
    );
    return response.data;
  },
};

export default smsApi;
