import apiClient from './client';

const URL_BASE = '/api/url';

export interface UrlAnalyzeRequest {
  url: string;
}

export interface UrlAnalyzeResponse {
  success: boolean;
  message: string;
  data: {
    url: string;
    riskScore: number;
    riskLevel: 'SAFE' | 'SUSPICIOUS' | 'HIGH_RISK';
    isMalicious: boolean;
    reasons: string[];
    detectedSignals: string[];
    recommendation: string;
  };
}

export const urlApi = {
  analyze: async (data: UrlAnalyzeRequest): Promise<UrlAnalyzeResponse> => {
    const response = await apiClient.post<UrlAnalyzeResponse>(`${URL_BASE}/analyze`, data);
    return response.data;
  },
};
