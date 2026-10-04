import apiClient from './client';

const AI_BASE = '/api/ai';

export interface AiExplainRequest {
  detectionData: any;
}

export interface AiExplainResponse {
  success: boolean;
  data: {
    why: string;
    scamType: string;
    action: string;
    explanation: string;
  };
}

export const aiApi = {
  explainResult: async (data: AiExplainRequest): Promise<AiExplainResponse> => {
    const response = await apiClient.post<AiExplainResponse>(`${AI_BASE}/explain`, data);
    return response.data;
  },
};
