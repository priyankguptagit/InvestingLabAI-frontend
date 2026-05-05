import axiosInstance from '../axios';
import { API_ENDPOINTS } from '../constants';
import {
  Stock,
  StockListResponse,
  StockDetailResponse,
  ScraperStatusResponse,
  ManualScrapeResponse,
} from '../types/stock.types';

// Stock API Service
export const stockApi = {
  // Get all latest stocks (both Nifty50 and ETF)
  getAllLatestStocks: async (): Promise<StockListResponse> => {
    const response = await axiosInstance.get(API_ENDPOINTS.STOCK.ALL_LATEST);
    return response.data;
  },

  // Get Nifty 50 stocks only
  getNifty50Stocks: async (): Promise<StockListResponse> => {
    const response = await axiosInstance.get(API_ENDPOINTS.STOCK.NIFTY50);
    return response.data;
  },

  // Get Nifty 100 stocks only
  getNifty100Stocks: async (): Promise<StockListResponse> => {
    const response = await axiosInstance.get(API_ENDPOINTS.STOCK.NIFTY100);
    return response.data;
  },

  getNifty500Stocks: async (): Promise<StockListResponse> => {
    const response = await axiosInstance.get(API_ENDPOINTS.STOCK.NIFTY500);
    return response.data;
  },

  // Get ETF stocks (optionally filtered by subCategory)
  getETFStocks: async (subCategory?: string): Promise<StockListResponse> => {
    const url = subCategory ? `${API_ENDPOINTS.STOCK.ETF}?subCategory=${subCategory}` : API_ENDPOINTS.STOCK.ETF;
    const response = await axiosInstance.get(url);
    return response.data;
  },

  // Get specific stock by symbol
  getStockBySymbol: async (symbol: string): Promise<StockDetailResponse> => {
    const response = await axiosInstance.get(API_ENDPOINTS.STOCK.BY_SYMBOL(symbol));
    return response.data;
  },

  // Get stock history (intraday + EOD)
  getStockHistory: async (symbol: string, range: '1d' | '1w' | '1m' | '1y' = '1d') => {
    const response = await axiosInstance.get(`${API_ENDPOINTS.STOCK.HISTORY(symbol)}?range=${range}`);
    return response.data;
  },

  // ✨ NEW: Search stocks by partial symbol/name
  searchStocks: async (query: string) => {
    const response = await axiosInstance.get(`/api/stocks/search?q=${encodeURIComponent(query)}`);
    return response.data;
  },

  // Get scraper status
  getScraperStatus: async (): Promise<ScraperStatusResponse> => {
    const response = await axiosInstance.get(API_ENDPOINTS.STOCK.SCRAPER_STATUS);
    return response.data;
  },

  // Manual trigger scraper (admin only)
  triggerManualScrape: async (): Promise<ManualScrapeResponse> => {
    const response = await axiosInstance.post(API_ENDPOINTS.STOCK.MANUAL_SCRAPE);
    return response.data;
  },
};
