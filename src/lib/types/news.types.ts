export interface NewsArticle {
  _id: string;
  title: string;
  description: string;
  content: string;
  url: string;
  source: 'NSE' | 'MONEYCONTROL' | 'ECONOMIC_TIMES' | 'BUSINESS_STANDARD';
  category: 'MARKET' | 'STOCKS' | 'IPO' | 'ECONOMY' | 'COMMODITIES' | 'FOREX' | 'MUTUAL_FUNDS' | 'GENERAL';
  imageUrl: string;
  publishedAt: string;
  relatedSymbols: string[];
  timestamp: string;
}

export interface NewsResponse {
  success: boolean;
  count: number;
  data: NewsArticle[];
  lastUpdated?: string;
}

export interface NewsFilterOptions {
  source?: string;
  category?: string;
  limit?: number;
}
