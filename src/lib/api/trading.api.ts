import axiosInstance from '../axios';
import {
  TradeRequest,
  TradeResponse,
  TradeHistoryResponse,
  PortfolioResponse,
  TradingStatsResponse,
  AIAnalysisResponse,
  AIPortfolioAnalysisResponse,
  TradingInsightsResponse,
  ResetBalanceRequest,
  ResetBalanceResponse,
} from '../types/trading.types';

// Trading API Service
export const tradingApi = {
  // Execute a paper trade
  executeTrade: async (request: TradeRequest): Promise<TradeResponse> => {
    const response = await axiosInstance.post('/api/paper-trading/trade', request);
    return response.data;
  },

  // Get trade history with optional filters
  getTradeHistory: async (params?: {
    symbol?: string;
    type?: 'BUY' | 'SELL';
    status?: string;
    startDate?: string;
    endDate?: string;
    page?: number;
    limit?: number;
  }): Promise<TradeHistoryResponse> => {
    const response = await axiosInstance.get('/api/paper-trading/trades', { params });
    return response.data;
  },

  // Get user's portfolio
  getPortfolio: async (): Promise<PortfolioResponse> => {
    const response = await axiosInstance.get('/api/paper-trading/portfolio');
    return response.data;
  },

  // Get trading statistics
  getTradingStats: async (): Promise<TradingStatsResponse> => {
    const response = await axiosInstance.get('/api/paper-trading/stats');
    return response.data;
  },

  // Get AI analysis for a specific stock
  getAIAnalysis: async (symbol: string): Promise<AIAnalysisResponse> => {
    const response = await axiosInstance.get(`/api/paper-trading/ai/analysis/${symbol}`);
    return response.data;
  },

  // Get AI portfolio analysis
  getAIPortfolioAnalysis: async (): Promise<AIPortfolioAnalysisResponse> => {
    const response = await axiosInstance.get('/api/paper-trading/ai/portfolio-analysis');
    return response.data;
  },

  // Get personalized trading insights
  getTradingInsights: async (): Promise<TradingInsightsResponse> => {
    const response = await axiosInstance.get('/api/paper-trading/ai/insights');
    return response.data;
  },

  // Reset virtual balance
  resetVirtualBalance: async (request?: ResetBalanceRequest): Promise<ResetBalanceResponse> => {
    const response = await axiosInstance.post('/api/paper-trading/reset-balance', request || {});
    return response.data;
  },

  // Get stock-specific news + AI recommendation based on news
  getStockNewsAndRecommendation: async (symbol: string): Promise<any> => {
    const response = await axiosInstance.get(`/api/paper-trading/stock-news/${symbol}`);
    return response.data;
  },

  // Get real portfolio chart data (P&L% time-series + index comparisons)
  getPortfolioChart: async (range: '1w' | '1m' | '3m' | '1y' = '1w'): Promise<any> => {
    const response = await axiosInstance.get(`/api/paper-trading/portfolio-chart?range=${range}`);
    return response.data;
  },
};
