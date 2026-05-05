import axios from '@/lib/axios';
import { API_ENDPOINTS } from '@/lib/constants';
import { NewsResponse, NewsFilterOptions } from '@/lib/types/news.types';

export const newsApi = {
  // Get latest news with optional filters
  getLatestNews: async (params?: NewsFilterOptions) => {
    const { data } = await axios.get<NewsResponse>(API_ENDPOINTS.NEWS.LATEST, { params });
    return data;
  },

  // Get specific category news
  getMarketNews: async (limit = 20) => {
    const { data } = await axios.get<NewsResponse>(API_ENDPOINTS.NEWS.MARKET, { params: { limit } });
    return data;
  },

  getStockNews: async (limit = 20) => {
    const { data } = await axios.get<NewsResponse>(API_ENDPOINTS.NEWS.STOCKS, { params: { limit } });
    return data;
  },

  getIPONews: async (limit = 20) => {
    const { data } = await axios.get<NewsResponse>(API_ENDPOINTS.NEWS.IPO, { params: { limit } });
    return data;
  },

  // Get news by symbol
  getNewsBySymbol: async (symbol: string) => {
    const { data } = await axios.get<NewsResponse>(API_ENDPOINTS.NEWS.BY_SYMBOL(symbol));
    return data;
  },

  // Manual trigger
  triggerScrape: async () => {
    const { data } = await axios.post(API_ENDPOINTS.NEWS.MANUAL_SCRAPE);
    return data;
  }
};
