import apiClient from './client';

const DETECTION_BASE = '/api/detections';

export interface Detection {
  _id: string;
  type: 'SMS' | 'URL' | 'TRANSACTION';
  input: string;
  preview: string;
  result: string;
  riskScore: number;
  riskLevel: 'SAFE' | 'SUSPICIOUS' | 'HIGH_RISK';
  model?: string;
  confidence?: number;
  detectedSignals: string[];
  reasons: string[];
  recommendation: string;
  scamType: string;
  createdAt: string;
}

export const detectionApi = {
  create: async (data: Partial<Detection>) => {
    const response = await apiClient.post(`${DETECTION_BASE}`, data);
    return response.data;
  },
  getHistory: async (): Promise<{ success: boolean; data: Detection[] }> => {
    const response = await apiClient.get(`${DETECTION_BASE}/history`);
    return response.data;
  },
  clearHistory: async () => {
    const response = await apiClient.delete(`${DETECTION_BASE}/history`);
    return response.data;
  }
};
