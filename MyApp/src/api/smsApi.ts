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
    console.log('[SMS] Detect request started');
    console.log(`[SMS] API URL: ${SMS_BASE}/detect`);
    try {
      console.log('[SMS] Request sent');
      const response = await apiClient.post<SmsDetectResponse>(
        `${SMS_BASE}/detect`,
        data,
      );
      console.log(`[SMS] Response status: ${response.status}`);
      console.log('[SMS] Detection successful');
      return response.data;
    } catch (error: any) {
      console.log(`[SMS] Error status: ${error?.response?.status ?? 'No response'}`);
      console.log(`[SMS] Error message: ${error?.response?.data?.message || error?.message || 'Unknown error'}`);
      throw error;
    }
  },
};

export default smsApi;
