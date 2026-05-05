// Stock Data Interface
export interface Stock {
  _id: string;
  symbol: string;
  name: string;
  category: 'NIFTY50' | 'ETF';
  price: number;
  open: number;
  high: number;
  low: number;
  previousClose: number;
  change: number;
  changePercent: number;
  volume: number;
  marketCap: number;
  timestamp: string;
  lastUpdated: string;
  createdAt?: string;
  updatedAt?: string;
}

// API Response Types
export interface StockListResponse {
  success: boolean;
  count: number;
  data: Stock[];
  lastUpdated?: string;
}

export interface StockDetailResponse {
  success: boolean;
  data: Stock;
}

export interface ScraperStatusResponse {
  success: boolean;
  status: 'Running' | 'Stopped';
  lastUpdate: string | null;
}

export interface ManualScrapeResponse {
  success: boolean;
  message: string;
}

// UI State Types
export type StockCategory = 'NIFTY50' | 'ETF' | 'ALL';

export interface StockFilterOptions {
  category: StockCategory;
  searchQuery: string;
  sortBy: 'symbol' | 'price' | 'change' | 'volume';
  sortOrder: 'asc' | 'desc';
}
