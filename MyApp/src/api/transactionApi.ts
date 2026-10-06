/**
 * Transaction Fraud Detection API Service
 *
 * Calls the GCN ML model directly (not proxied through the Node.js backend).
 * Uses a standalone axios call to the TRANSACTION_ML_URL, similar to how
 * the original SMS/URL ML calls were structured.
 */

import axios from 'axios';
import Config from '../config';
import {
  TransactionPredictionRequest,
  TransactionPredictionResponse,
} from '../types/transaction';

const transactionApi = {
  /**
   * POST /predict-transaction
   * Sends transaction data to the GCN model and returns fraud prediction.
   * No authentication required (direct ML model call).
   */
  analyzeTransaction: async (
    payload: TransactionPredictionRequest,
  ): Promise<TransactionPredictionResponse> => {
    console.log('[TXN] Analyze request started');
    console.log(`[TXN] API URL: ${Config.TRANSACTION_ML_URL}/predict-transaction`);
    try {
      const response = await axios.post<TransactionPredictionResponse>(
        `${Config.TRANSACTION_ML_URL}/predict-transaction`,
        payload,
        {
          headers: {'Content-Type': 'application/json'},
          timeout: Config.REQUEST_TIMEOUT,
        },
      );
      console.log(`[TXN] Response status: ${response.status}`);
      console.log('[TXN] is_fraud:', response.data.is_fraud);
      return response.data;
    } catch (error: any) {
      console.log(
        `[TXN] Error: ${error?.response?.status ?? 'No response'} - ${
          error?.response?.data?.detail || error?.message || 'Unknown'
        }`,
      );
      throw error;
    }
  },
};

export default transactionApi;
