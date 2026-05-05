"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import {
  TrendingUp, TrendingDown, Layers, Activity, Sparkles, BarChart3,
  Search, RefreshCw, ArrowUpDown, LineChart, Zap, Plus, Minus, CheckCircle
} from "lucide-react";
import { stockApi, watchlistApi } from "@/lib/api";
import { Stock } from "@/lib/types/stock.types";
import StockDetailModal from "@/app/user/_components/StockDetailModal";
import AIChatButton from '@/app/user/_components/chat/AIChatButton';
import { motion } from "framer-motion";

type MainTabType = 'indices' | 'etfs';
type TabType = 'nifty50' | 'nifty100' | 'nifty500' | 'commodity' | 'bond' | 'sector' | 'other';

export default function TradingPage() {
  // Tabs State
  const [activeMainTab, setActiveMainTab] = useState<MainTabType>('indices');
  const [activeTab, setActiveTab] = useState<TabType>('nifty50');

  // Data State
  const [stocks, setStocks] = useState<Stock[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStock, setSelectedStock] = useState<Stock | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<string>("");

  // Sort State
  const [sortBy, setSortBy] = useState<'symbol' | 'change'>('symbol');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Watchlist State
  const [watchlist, setWatchlist] = useState<Set<string>>(new Set());
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  }, []);

  useEffect(() => {
    const fetchWatchlist = async () => {
      try {
        const res = await watchlistApi.getWatchlist();
        if (res.success) {
          setWatchlist(new Set(res.data.map((item: any) => item.symbol)));
        }
      } catch (err) {
        console.error("Failed to fetch watchlist", err);
      }
    };
    fetchWatchlist();
  }, []);

  const handleToggleWatchlist = async (e: React.MouseEvent, symbol: string) => {
    e.stopPropagation();
    try {
      if (watchlist.has(symbol)) {
        const res = await watchlistApi.removeFromWatchlist(symbol);
        if (res.success) {
          setWatchlist(prev => {
            const next = new Set(prev);
            next.delete(symbol);
            return next;
          });
          showToast(`${symbol} removed from watchlist`);
        }
      } else {
        const res = await watchlistApi.addToWatchlist(symbol);
        if (res.success) {
          setWatchlist(prev => new Set(prev).add(symbol));
          showToast(`${symbol} has been added to your watchlist`);
        }
      }
    } catch (error) {
      console.error("Watchlist toggle failed", error);
      showToast("Failed to update watchlist");
    }
  };

  const mainTabs = [
    { id: 'indices' as MainTabType, name: 'Market Indices', icon: LineChart },
    { id: 'etfs' as MainTabType, name: 'Exchange Traded Funds', icon: Layers }
  ];

  const indicesTabs = [
    { id: 'nifty50' as TabType, name: 'Nifty 50', icon: LineChart, color: 'blue', description: 'Blue Chip Giants' },
    { id: 'nifty100' as TabType, name: 'Nifty 100', icon: BarChart3, color: 'emerald', description: 'Market Movers' },
    { id: 'nifty500' as TabType, name: 'Nifty 500', icon: TrendingUp, color: 'indigo', description: 'Broad Market' }
  ];

  const etfsTabs = [
    { id: 'commodity' as TabType, name: 'Commodity', icon: Layers, color: 'amber', description: 'Gold & Silver' },
    { id: 'bond' as TabType, name: 'Bond', icon: Layers, color: 'teal', description: 'G-Sec & Liquid' },
    { id: 'sector' as TabType, name: 'Sector', icon: Layers, color: 'fuchsia', description: 'Bank, IT, Auto' },
    { id: 'other' as TabType, name: 'Others', icon: Layers, color: 'gray', description: 'Misc Funds' }
  ];

  const currentSubTabs = activeMainTab === 'indices' ? indicesTabs : etfsTabs;
  const currentTabInfo = currentSubTabs.find(t => t.id === activeTab) || currentSubTabs[0];

  const handleMainTabSwitch = (tabId: MainTabType) => {
    setActiveMainTab(tabId);
    setActiveTab(tabId === 'indices' ? 'nifty50' : 'commodity');
  };

  const fetchStocks = useCallback(async (tab: TabType) => {
    try {
      if (stocks.length === 0) setLoading(true);
      let response;
      switch (tab) {
        case 'nifty50': response = await stockApi.getNifty50Stocks(); break;
        case 'nifty100': response = await stockApi.getNifty100Stocks(); break;
        case 'nifty500': response = await stockApi.getNifty500Stocks(); break;
        case 'commodity':
        case 'bond':
        case 'sector':
        case 'other':
          const etfRes = await stockApi.getETFStocks();
          response = {
            ...etfRes,
            data: etfRes.data.filter((s: Stock) => {
              const nameStr = (s.name || s.symbol).toLowerCase();
              if (tab === 'commodity') {
                return nameStr.includes('gold') || nameStr.includes('silver') || nameStr.includes('commodity');
              }
              if (tab === 'bond') {
                return nameStr.includes('bond') || nameStr.includes('liquid') || nameStr.includes('gilt');
              }
              if (tab === 'sector') {
                const sectorKeywords = ['bank', 'tech', 'infra', 'pharma', 'auto', 'fmcg', 'health', 'it'];
                return sectorKeywords.some(k => nameStr.includes(k));
              }
              const allKeywords = ['gold', 'silver', 'commodity', 'bond', 'liquid', 'gilt', 'bank', 'tech', 'infra', 'pharma', 'auto', 'fmcg', 'health', 'it'];
              return !allKeywords.some(k => nameStr.includes(k));
            })
          };
          break;
      }
      setStocks(response.data);
      setLastUpdated(response.lastUpdated || new Date().toISOString());
      setError("");
    } catch (err: any) {
      setError(err.response?.data?.message || `Failed to fetch data`);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    setLoading(true);
    setSearchQuery("");
    fetchStocks(activeTab);
  }, [activeTab, fetchStocks]);

  useEffect(() => {
    const interval = setInterval(() => fetchStocks(activeTab), 120000);
    return () => clearInterval(interval);
  }, [activeTab, fetchStocks]);

  // Keep the open modal's stock data in sync when the stocks list refreshes
  useEffect(() => {
    if (!selectedStock || stocks.length === 0) return;
    const updated = stocks.find(s => s.symbol === selectedStock.symbol);
    if (updated) setSelectedStock(updated);
  }, [stocks]);

  const processedStocks = useMemo(() => {
    let result = stocks.filter((stock) =>
      (stock.symbol || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (stock.name || '').toLowerCase().includes(searchQuery.toLowerCase())
    );

    return result.sort((a, b) => {
      let comparison = 0;
      if (sortBy === 'symbol') comparison = a.symbol.localeCompare(b.symbol);
      else if (sortBy === 'change') comparison = a.changePercent - b.changePercent;
      return sortOrder === 'asc' ? comparison : -comparison;
    });
  }, [stocks, searchQuery, sortBy, sortOrder]);

  const handleModalClose = useCallback(() => {
    setIsModalOpen(false);
    setSelectedStock(null);
  }, []);

  const handleStockClick = useCallback((stock: Stock) => {
    setSelectedStock(stock);
    setIsModalOpen(true);
  }, []);

  const toggleSort = useCallback((field: 'symbol' | 'change') => {
    setSortBy(prev => {
      if (prev === field) {
        setSortOrder(o => o === 'asc' ? 'desc' : 'asc');
        return prev;
      }
      setSortOrder('desc');
      return field;
    });
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 pt-24 pb-12 px-4 md:px-6 transition-colors duration-300">
      <div className="max-w-7xl mx-auto">
        {/* Animated Header Section */}
        <div className="mb-8 md:mb-12 text-center animate-in fade-in slide-in-from-bottom-4 duration-700">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r 
                         from-blue-100 to-purple-100 dark:from-blue-900/30 dark:to-purple-900/30 border border-blue-200 dark:border-blue-800 mb-4 
                         animate-in zoom-in duration-500">
            <BarChart3 className="w-4 h-4 text-blue-600 dark:text-blue-400 animate-pulse" />
            <span className="text-sm font-semibold text-gray-700 dark:text-slate-300">Live Market Data</span>
          </div>

          {/* Title with Gradient */}
          <h1 className="text-3xl md:text-5xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-blue-600 
                         bg-clip-text text-transparent mb-3 animate-in slide-in-from-bottom-3 
                         duration-700 delay-100">
            Stock Market Trading
          </h1>

          <p className="text-gray-600 dark:text-slate-400 text-base md:text-lg max-w-2xl mx-auto animate-in fade-in 
                       slide-in-from-bottom-2 duration-700 delay-200">
            Access real-time market data from NSE India • Updated every 2 minutes
          </p>
        </div>

        {/* --- TWO-TIER TABS (Copied from MarketsClient but adapted for theme) --- */}
        <div className="flex flex-col items-center gap-4 mb-10 animate-in fade-in slide-in-from-bottom-6 duration-700">

          {/* PRIMARY TABS */}
          <div className="inline-flex p-1.5 rounded-2xl bg-white dark:bg-slate-900/50 border border-gray-200 dark:border-white/[0.08] backdrop-blur-3xl shadow-xl">
            {mainTabs.map((mTab) => {
              const Icon = mTab.icon;
              const isActive = activeMainTab === mTab.id;
              return (
                <button
                  key={mTab.id}
                  onClick={() => handleMainTabSwitch(mTab.id)}
                  className={`
                                relative px-8 py-3 rounded-xl text-base font-bold transition-all duration-300
                                flex items-center gap-3 overflow-hidden group
                                ${isActive ? 'text-gray-900 dark:text-white shadow-md bg-gray-100 dark:bg-white/[0.06]' : 'text-gray-500 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white'}
                            `}
                >
                  <Icon className={`w-5 h-5 relative z-10 transition-colors ${isActive ? 'text-blue-600 dark:text-indigo-400' : 'group-hover:text-gray-900 dark:group-hover:text-white'}`} />
                  <span className="relative z-10">{mTab.name}</span>
                </button>
              );
            })}
          </div>

          {/* SECONDARY TABS */}
          <div className="inline-flex p-1 rounded-2xl bg-gray-50 dark:bg-slate-900/30 border border-gray-200 dark:border-white/[0.03] backdrop-blur-xl mb-4">
            {currentSubTabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              // For Light mode text colors, map color to safe text class:
              const colorMapTextLight: Record<string, string> = {
                'blue': 'text-blue-600', 'emerald': 'text-emerald-600', 'indigo': 'text-indigo-600',
                'amber': 'text-amber-600', 'teal': 'text-teal-600', 'fuchsia': 'text-fuchsia-600', 'gray': 'text-gray-600'
              };
              const colorMapTextDark: Record<string, string> = {
                'blue': 'dark:text-blue-400', 'emerald': 'dark:text-emerald-400', 'indigo': 'dark:text-indigo-400',
                'amber': 'dark:text-amber-400', 'teal': 'dark:text-teal-400', 'fuchsia': 'dark:text-fuchsia-400', 'gray': 'dark:text-gray-400'
              };
              const actColorLight = colorMapTextLight[tab.color] || 'text-blue-600';
              const actColorDark = colorMapTextDark[tab.color] || 'dark:text-blue-400';

              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`
                                relative px-6 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all duration-300
                                flex items-center gap-2 overflow-hidden group
                                ${isActive ? 'text-gray-900 dark:text-white shadow-sm bg-white dark:bg-white/[0.06]' : 'text-gray-500 dark:text-slate-500 hover:text-gray-900 dark:hover:text-slate-300'}
                            `}
                >
                  <Icon className={`w-3.5 h-3.5 relative z-10 transition-colors ${isActive ? `${actColorLight} ${actColorDark}` : 'group-hover:text-gray-900 dark:group-hover:text-white'}`} />
                  <span className="relative z-10">{tab.name}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Toolbar & Search */}
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between mb-6 animate-in fade-in slide-in-from-bottom-6 duration-700">
          <div className="relative w-full md:w-96 group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 
                                group-focus-within:text-blue-500 transition-colors" />
            <input
              type="text"
              placeholder={`Search ${currentTabInfo.name} stocks...`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3.5 rounded-xl bg-white dark:bg-slate-900/50 backdrop-blur-md border-2 border-gray-200 dark:border-white/10
                            text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-4 
                            focus:ring-blue-100 dark:focus:ring-blue-900/30 focus:border-blue-500 transition-all duration-300 
                            shadow-sm hover:shadow-md"
            />
          </div>

          <div className="w-full md:w-auto flex flex-row items-center justify-between md:justify-end gap-3">
            <button
              onClick={() => fetchStocks(activeTab)}
              disabled={loading}
              className="p-3 rounded-xl bg-white dark:bg-slate-900/50 border border-gray-200 dark:border-white/10 
                            hover:bg-blue-50 dark:hover:bg-indigo-500/10 text-gray-600 dark:text-slate-400 
                            hover:text-blue-600 dark:hover:text-indigo-400 transition-all shadow-sm"
            >
              <RefreshCw className={`w-5 h-5 ${loading ? "animate-spin" : ""}`} />
            </button>
            <div className="flex-1 md:flex-none px-5 py-3 rounded-xl bg-gradient-to-r from-gray-50 to-gray-100 dark:from-slate-800 dark:to-slate-900
                                border border-gray-200 dark:border-slate-700 shadow-sm text-center md:text-left">
              <span className="text-sm text-gray-600 dark:text-slate-400">Total: </span>
              <span className="text-sm font-bold text-gray-900 dark:text-white">{processedStocks.length}</span>
            </div>
          </div>
        </div>

        {/* Error State */}
        {error && (
          <div className="mb-6 p-4 rounded-xl bg-red-50 border-2 border-red-200 text-red-700 animate-in fade-in shake duration-500">
            {error}
          </div>
        )}

        {/* Loading State or Table */}
        {loading && stocks.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 animate-pulse">
            <Activity className="w-16 h-16 text-blue-500 animate-bounce mb-4" />
            <p className="text-gray-600 dark:text-slate-400 text-lg">Loading market data...</p>
          </div>
        ) : (
          <div className="bg-white dark:bg-slate-900/50 backdrop-blur-md rounded-2xl shadow-xl border-2 border-gray-100 dark:border-white/10 overflow-hidden 
                         animate-in fade-in slide-in-from-bottom-4 duration-700 delay-200 hover:shadow-2xl transition-shadow">

            <div className="overflow-x-auto min-h-[400px]">
              <div className="min-w-[800px]">
                {/* Table Header */}
                <div className="grid grid-cols-12 gap-4 px-6 py-4 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-slate-800 dark:to-slate-900
                                border-b-2 border-gray-200 dark:border-slate-700 text-sm font-bold text-gray-700 dark:text-slate-400">
                  <div className="col-span-3 flex items-center gap-2 cursor-pointer hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                    onClick={() => toggleSort('symbol')}>
                    SYMBOL <ArrowUpDown className="w-4 h-4" />
                  </div>
                  <div className="col-span-2 text-right">OPEN</div>
                  <div className="col-span-2 text-right">HIGH</div>
                  <div className="col-span-2 text-right">LOW</div>
                  <div className="col-span-1 text-right">PRICE</div>
                  <div className="col-span-2 text-right flex items-center justify-end gap-2 cursor-pointer hover:text-green-600 transition-colors"
                    onClick={() => toggleSort('change')}>
                    CHANGE <ArrowUpDown className="w-4 h-4" />
                  </div>
                </div>

                {/* Table Body */}
                <div className="divide-y divide-gray-100 dark:divide-slate-800">
                  {processedStocks.length === 0 ? (
                    <div className="text-center py-12 text-gray-500 dark:text-slate-500">
                      No stocks found matching "{searchQuery}"
                    </div>
                  ) : (
                    processedStocks.map((stock, index) => {
                      const isPositive = stock.change >= 0;
                      const changeColor = isPositive ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400";
                      const bgColorStyle = isPositive ? "bg-green-50 dark:bg-green-900/10" : "bg-red-50 dark:bg-red-900/10";

                      const colorMapBadgeLight: Record<string, string> = {
                        'blue': 'from-blue-400 to-blue-500', 'emerald': 'from-emerald-400 to-emerald-500', 'indigo': 'from-indigo-400 to-indigo-500',
                        'amber': 'from-amber-400 to-amber-500', 'teal': 'from-teal-400 to-teal-500', 'fuchsia': 'from-fuchsia-400 to-fuchsia-500', 'gray': 'from-gray-400 to-gray-500'
                      };
                      const bgGradientStr = colorMapBadgeLight[currentTabInfo.color] || 'from-blue-400 to-blue-500';

                      return (
                        <div
                          key={stock.symbol}
                          onClick={() => handleStockClick(stock)}
                          className="grid grid-cols-12 gap-4 px-6 py-4 hover:bg-gradient-to-r 
                                    hover:from-blue-50 hover:to-purple-50 dark:hover:from-slate-800 dark:hover:to-slate-700 transition-all duration-300 
                                    cursor-pointer group animate-in fade-in slide-in-from-left 
                                    duration-500 hover:scale-[1.02]"
                          style={{ animationDelay: `${Math.min(index * 30, 400)}ms` }}
                        >
                          {/* Symbol */}
                          <div className="col-span-3 flex items-center gap-3">
                            <div className={`relative w-11 h-11 rounded-xl bg-gradient-to-br ${bgGradientStr} flex items-center justify-center font-bold 
                                            text-white text-sm shadow-md group-hover:scale-110 
                                            group-hover:rotate-6 transition-all duration-300`}>
                              {stock.symbol.charAt(0)}
                            </div>
                            <div>
                              <div className="font-bold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors flex items-center gap-2">
                                {stock.symbol}
                                <button
                                  onClick={(e) => handleToggleWatchlist(e, stock.symbol)}
                                  className={`ml-1 flex items-center justify-center w-7 h-7 rounded-lg transition-all duration-300 border shadow-sm group/btn
                                        ${watchlist.has(stock.symbol)
                                      ? 'bg-rose-50 hover:bg-rose-100 border-rose-200 text-rose-600 dark:bg-rose-900/30 dark:hover:bg-rose-900/50 dark:border-rose-800/50 dark:text-rose-400 hover:scale-105'
                                      : 'bg-emerald-50 hover:bg-emerald-100 border-emerald-200 text-emerald-600 dark:bg-emerald-900/30 dark:hover:bg-emerald-900/50 dark:border-emerald-800/50 dark:text-emerald-400 hover:scale-105'
                                    }
                                     `}
                                  title={watchlist.has(stock.symbol) ? "Remove from Watchlist" : "Add to Watchlist"}
                                >
                                  {watchlist.has(stock.symbol) ? (
                                    <Minus strokeWidth={3} size={16} className="transition-transform duration-300 group-hover/btn:rotate-180" />
                                  ) : (
                                    <Plus strokeWidth={3} size={16} className="transition-transform duration-300 group-hover/btn:rotate-90" />
                                  )}
                                </button>
                              </div>
                              <div className="text-xs text-gray-500 dark:text-slate-500">{stock.name}</div>
                            </div>
                          </div>

                          <div className="col-span-2 flex items-center justify-end text-gray-700 dark:text-slate-300 font-medium">
                            {stock.open != null ? `₹${stock.open.toFixed(2)}` : '—'}
                          </div>
                          <div className="col-span-2 flex items-center justify-end text-green-600 dark:text-green-400 font-bold">
                            {stock.high != null ? `₹${stock.high.toFixed(2)}` : '—'}
                          </div>
                          <div className="col-span-2 flex items-center justify-end text-red-600 dark:text-red-400 font-bold">
                            {stock.low != null ? `₹${stock.low.toFixed(2)}` : '—'}
                          </div>
                          <div className="col-span-1 flex items-center justify-end text-gray-900 dark:text-white font-bold text-lg">
                            {stock.price != null ? `₹${stock.price.toFixed(2)}` : '—'}
                          </div>

                          <div className="col-span-2 flex items-center justify-end">
                            <div className={`px-4 py-2 rounded-xl border border-transparent dark:border-current/10 ${bgColorStyle} ${changeColor} font-bold 
                                            text-sm flex items-center gap-1.5 shadow-sm 
                                            group-hover:scale-110 transition-transform`}>
                              {isPositive ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                              <span>{stock.changePercent != null ? `${Math.abs(stock.changePercent).toFixed(2)}%` : '—'}</span>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Live Data Indicator with Pulse */}
        <div className="flex items-center justify-center mt-8 animate-in fade-in slide-in-from-bottom-2 duration-700 delay-500">
          <div className="bg-white dark:bg-slate-900 rounded-2xl px-6 py-4 shadow-lg border-2 border-gray-200 dark:border-slate-800 
                         flex flex-col md:flex-row items-center gap-3 md:gap-4 hover:shadow-xl hover:scale-105 transition-all 
                         duration-300">
            <div className="flex items-center gap-2">
              <div className="relative">
                <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse" />
                <div className="absolute inset-0 w-3 h-3 rounded-full bg-green-400 animate-ping" />
              </div>
            </div>
            <span className="text-xs md:text-sm text-gray-700 dark:text-slate-300 font-semibold">
              Updates every 2 minutes. Last Check: {lastUpdated ? new Date(lastUpdated).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }) : "--:--"}
            </span>
          </div>
        </div>

      </div>

      <StockDetailModal
        isOpen={isModalOpen}
        onClose={handleModalClose}
        stock={selectedStock}
      />

      {/* Toast Popup */}
      {toastMessage && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-6 py-3 rounded-full shadow-2xl z-50 animate-in slide-in-from-bottom-5 fade-in duration-300 flex items-center gap-2 font-medium text-sm">
          <CheckCircle size={16} className="text-green-400 dark:text-green-600" />
          {toastMessage}
        </div>
      )}

      {/* AI Chatbot */}
      <AIChatButton />
    </div>
  );
}
