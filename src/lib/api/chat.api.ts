import axiosInstance from '../axios';

export interface ChatMessage {
  _id: string;
  userId: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  metadata?: {
    queryType?: string;
    stockSymbol?: string;
    responseTime?: number;
    tokensUsed?: number;
  };
}

export interface SendMessageResponse {
  success: boolean;
  data: {
    message: string;
    timestamp: string;
  };
  metadata?: {
    responseTime: number;
  };
}

// ✅ NEW: Stock Analysis Response
export interface StockAnalysisResponse {
  success: boolean;
  data: {
    symbol: string;
    analysis: string;
    timestamp: string;
  };
}

// ✅ NEW: Portfolio Recommendation Response
export interface PortfolioRecommendationResponse {
  success: boolean;
  data: {
    recommendation: string;
    budget: number;
    riskLevel: string;
    timestamp: string;
  };
}

export interface ChatHistoryResponse {
  success: boolean;
  count: number;
  data: ChatMessage[];
}

export const chatApi = {
  // Send a message to AI
  sendMessage: async (message: string): Promise<SendMessageResponse> => {
    const { data } = await axiosInstance.post('/api/chat/message', { message });
    return data;
  },

  // Get chat history
  getChatHistory: async (limit: number = 50): Promise<ChatHistoryResponse> => {
    const { data } = await axiosInstance.get(`/api/chat/history?limit=${limit}`);
    return data;
  },

  // Clear chat history
  clearChatHistory: async (): Promise<{ success: boolean; message: string }> => {
    const { data } = await axiosInstance.delete('/api/chat/history');
    return data;
  },



  // ✅ NEW: Analyze stock with AI
  analyzeStock: async (symbol: string): Promise<StockAnalysisResponse> => {
    const { data } = await axiosInstance.get(`/api/chat/stock/${symbol}/analyze`);
    return data;
  },

  // ✅ NEW: Get portfolio recommendation
  recommendPortfolio: async (budget: number, riskLevel: 'low' | 'medium' | 'high'): Promise<PortfolioRecommendationResponse> => {
    const { data } = await axiosInstance.post('/api/chat/portfolio/recommend', {
      budget,
      riskLevel
    });
    return data;
  },
};
