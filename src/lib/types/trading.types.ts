// Trading TypeScript Interfaces

export interface TradeRequest {
  symbol: string;
  type: 'BUY' | 'SELL';
  quantity: number;
  orderType?: 'MARKET' | 'LIMIT' | 'STOP_LOSS';
  limitPrice?: number;
  stopLossPrice?: number;
  reason?: string;
}

export interface Trade {
  _id: string;
  userId: string;
  symbol: string;
  stockName: string;
  type: 'BUY' | 'SELL';
  orderType: 'MARKET' | 'LIMIT' | 'STOP_LOSS';
  quantity: number;
  price: number;
  limitPrice?: number;
  stopLossPrice?: number;
  totalAmount: number;
  status: 'PENDING' | 'EXECUTED' | 'CANCELLED' | 'REJECTED';
  executedAt?: string;
  cancelledAt?: string;
  rejectionReason?: string;
  aiRecommendation?: string;
  aiConfidenceScore?: number;
  aiRiskLevel?: 'LOW' | 'MEDIUM' | 'HIGH';
  currentPrice?: number;
  unrealizedPL?: number;
  realizedPL?: number;
  category: 'NIFTY50' | 'NIFTY100' | 'ETF';
  tradingSession: string;
  reason?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PortfolioHolding {
  symbol: string;
  stockName: string;
  quantity: number;
  averageBuyPrice: number;
  currentPrice: number;
  currentValue: number;
  totalInvested: number;
  unrealizedPL: number;
  unrealizedPLPercent: number;
}

export interface Portfolio {
  holdings: PortfolioHolding[];
  totalValue: number;
  availableBalance: number;
  summary: {
    totalHoldings: number;
    totalInvested: number;
    currentValue: number;
    totalPL: number;
    totalPLPercent: number;
    profitableStocks: number;
    losingStocks: number;
  };
}

export interface TradingStats {
  totalTrades: number;
  totalVolume: number;
  totalProfit: number;
  totalLoss: number;
  winRate: number;
  bestTrade?: Trade;
  worstTrade?: Trade;
  mostTradedSymbol?: string;
  averageTradeSize: number;
}

export interface AIAnalysis {
  recommendation: 'BUY' | 'SELL' | 'HOLD';
  confidenceScore: number;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  reasoning: string;
  keyFactors: string[];
  suggestedPrice?: number;
  stopLoss?: number;
  target?: number;
}

export interface TradeResponse {
  success: boolean;
  message: string;
  data: {
    trade: Trade;
    balance: number;
    aiRecommendation?: AIAnalysis;
  };
}

export interface TradeHistoryResponse {
  success: boolean;
  data: {
    trades: Trade[];
    total: number;
    page: number;
    totalPages: number;
  };
}

export interface PortfolioResponse {
  success: boolean;
  data: Portfolio;
}

export interface TradingStatsResponse {
  success: boolean;
  data: TradingStats;
}

export interface AIAnalysisResponse {
  success: boolean;
  data: AIAnalysis;
}

export interface AIPortfolioAnalysisResponse {
  success: boolean;
  data: {
    analysis: string;
  };
}

export interface TradingInsightsResponse {
  success: boolean;
  data: {
    insights: string;
    tradingSummary: {
      totalTrades: number;
      buyCount: number;
      sellCount: number;
      mostTradedSymbols: string[];
      averageTradeSize: number;
    };
  };
}

export interface ResetBalanceRequest {
  newBalance?: number;
}

export interface ResetBalanceResponse {
  success: boolean;
  message: string;
  data: {
    newBalance: number;
  };
}

// WebSocket Events
export interface PriceUpdate {
  symbol: string;
  price: number;
  open: number;
  high: number;
  low: number;
  change: number;
  changePercent: number;
  volume: number;
  timestamp: Date;
}

export interface PortfolioUpdate {
  holdings: PortfolioHolding[];
  totalValue: number;
  totalPL: number;
  timestamp: Date;
}

export interface TradeExecutedEvent {
  trade: Trade;
  timestamp: Date;
}

export interface AIAlertEvent {
  symbol: string;
  alert: string;
  severity: 'INFO' | 'WARNING' | 'CRITICAL';
  timestamp: Date;
}

export interface MarketStatusEvent {
  status: string;
  message: string;
  timestamp: Date;
}
