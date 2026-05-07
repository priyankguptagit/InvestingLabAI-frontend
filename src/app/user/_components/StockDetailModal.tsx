"use client";

import { TrendingUp, TrendingDown, Activity, BarChart3, History, LayoutDashboard, LineChart, Briefcase, Lock, Clock, Loader2, Wallet, Newspaper, ArrowRightLeft, BarChart2, Table2, X, Maximize2, Minimize2, ExternalLink } from "lucide-react";
import { Stock } from "@/lib/types/stock.types";
import { useEffect, useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter, usePathname } from "next/navigation";
import { useTheme } from "next-themes";
import { stockApi, userApi } from "@/lib/api";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { tradingApi } from "@/lib/api/trading.api";
import { useTradingWebSocket } from "@/hooks/useTradingWebSocket";
import { StockNewsCard } from "@/shared-components/trading/StockNewsCard";
import { TradingPanel } from "@/shared-components/trading/TradingPanel";
import { HoldingsCard } from "@/shared-components/trading/HoldingsCard";
import {
  AIAnalysis,
  PortfolioHolding,
  Portfolio,
} from "@/lib/types/trading.types";

interface StockDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  stock: Stock | null;
  theme?: 'light' | 'dark';
  forceUnauthenticated?: boolean;
}

type ModalTab = 'overview' | 'history' | 'chart' | 'trading';

export default function StockDetailModal({ isOpen, onClose, stock, theme = 'dark', forceUnauthenticated = false }: StockDetailModalProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [activeTab, setActiveTab] = useState<ModalTab>('overview');
  const [intradayData, setIntradayData] = useState<any[]>([]);
  const [snapshotData, setSnapshotData] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [historyRange, setHistoryRange] = useState<'1d' | '1w' | '1m' | '1y'>('1d');
  const [historyView, setHistoryView] = useState<'chart' | 'table'>('chart');
  const [isMarketOpen, setIsMarketOpen] = useState(false);
  const [chartLoaded, setChartLoaded] = useState(false);
  const [isChartFullscreen, setIsChartFullscreen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  // Keep a ref so the ESC handler always calls the latest onClose
  // without needing it in the effect dependency array.
  const onCloseRef = useRef(onClose);
  useEffect(() => { onCloseRef.current = onClose; }, [onClose]);

  // Trading state
  const [stockNews, setStockNews] = useState<any[]>([]);
  const [aiRecommendation, setAiRecommendation] = useState<any>(null);
  const [newsFallbackUsed, setNewsFallbackUsed] = useState(false);
  const [newsLoading, setNewsLoading] = useState(false);
  const [portfolio, setPortfolio] = useState<Portfolio | null>(null);
  const [userHolding, setUserHolding] = useState<PortfolioHolding | null>(null);
  const [portfolioLoading, setPortfolioLoading] = useState(false);
  const [realtimePrice, setRealtimePrice] = useState<number | null>(null);

  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const isDark = (mounted && resolvedTheme) ? resolvedTheme === 'dark' : theme === 'dark';

  // Check if user is authenticated
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentPlan, setCurrentPlan] = useState<string>("Free");
  const [authChecking, setAuthChecking] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      if (!isOpen) return;

      if (forceUnauthenticated) {
        setIsLoggedIn(false);
        setAuthChecking(false);
        return;
      }

      setAuthChecking(true);
      try {
        const data = await userApi.getProfile();
        setIsLoggedIn(!!data.success);
        if (data.success && data.user) {
          setCurrentPlan(data.user.currentPlan || "Free");
        } else {
          setIsLoggedIn(false);
        }
      } catch (error) {
        setIsLoggedIn(false);
      } finally {
        setAuthChecking(false);
      }
    };

    checkAuth();
  }, [isOpen]);

  // Fetch Portfolio - Memoized to prevent stale closures and ensure reliable updates
  const fetchPortfolio = useCallback(async () => {
    if (!isLoggedIn) return;
    // Don't set loading to true on background updates to avoid UI flickering
    // setPortfolioLoading(true); 
    try {
      const response = await tradingApi.getPortfolio();
      if (response.success) {
        console.log("Portfolio updated:", response.data); // Debugging log
        setPortfolio(response.data);
        const holding = response.data.holdings.find((h: PortfolioHolding) => h.symbol === stock?.symbol);
        setUserHolding(holding || null);
      }
    } catch (error) {
      console.error("Failed to fetch portfolio:", error);
      // Only reset if it's a hard error, otherwise keep stale data
      // setPortfolio(null); 
      // setUserHolding(null);
    } finally {
      setPortfolioLoading(false);
    }
  }, [isLoggedIn, stock?.symbol]);

  // WebSocket connection
  const { isConnected, subscribeToStock, unsubscribeFromStock, subscribeToPortfolio } = useTradingWebSocket({
    autoConnect: isLoggedIn,
    onPriceUpdate: (data) => {
      if (data.symbol === stock?.symbol) {
        setRealtimePrice(data.price);
      }
    },
    onPortfolioUpdate: () => {
      fetchPortfolio();
    },
    onTradeExecuted: () => {
      fetchPortfolio();
    },
  });

  // Fetch Stock News & AI Signal
  const fetchStockNewsData = async () => {
    if (!stock || !isLoggedIn) return;
    setNewsLoading(true);
    try {
      const response = await tradingApi.getStockNewsAndRecommendation(stock.symbol);
      if (response.success && response.data) {
        setStockNews(response.data.news || []);
        setAiRecommendation(response.data.aiRecommendation || null);
        setNewsFallbackUsed(response.data.newsFallbackUsed || false);
      }
    } catch (error) {
      setStockNews([]);
      setAiRecommendation(null);
    } finally {
      setNewsLoading(false);
    }
  };

  // Initial Portfolio Fetch on Mount/Login
  useEffect(() => {
    if (isLoggedIn) {
      setPortfolioLoading(true);
      fetchPortfolio().then(() => setPortfolioLoading(false));
    }
  }, [isLoggedIn, fetchPortfolio]);


  const handleTradeExecuted = () => {
    console.log("Trade executed, refreshing portfolio...");
    fetchPortfolio();
  };

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCloseRef.current();
    };
    if (isOpen) {
      window.addEventListener("keydown", handleEsc);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      window.removeEventListener("keydown", handleEsc);
      document.body.style.overflow = 'unset';
      setActiveTab('overview');
      setChartLoaded(false);
    };
    // ⚠️ ONLY depend on isOpen — not onClose.
    // onClose is accessed via ref so a new function reference from the parent
    // (e.g. after a stock-list refresh) never triggers this cleanup.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  // Separate effect so a new stock object from the scraper does NOT
  // trigger the cleanup above and reset the active tab.
  useEffect(() => {
    return () => {
      if (stock) {
        unsubscribeFromStock(stock.symbol);
      }
    };
  }, [stock?.symbol, unsubscribeFromStock]);

  useEffect(() => {
    if (activeTab === 'history' && stock) {
      const fetchHistory = async () => {
        try {
          setLoadingHistory(true);
          const response = await stockApi.getStockHistory(stock.symbol, historyRange);
          if (response.success) {
            setIntradayData(response.data?.intraday || []);
            setSnapshotData(response.data?.snapshots || []);
            setIsMarketOpen(response.isMarketOpen || false);
          }
        } catch (error) {
          console.error("Failed to fetch stock history", error);
        } finally {
          setLoadingHistory(false);
        }
      };
      fetchHistory();
    }
  }, [activeTab, stock, historyRange]);

  useEffect(() => {
    if (activeTab === 'trading' && isLoggedIn && stock) {
      fetchPortfolio();
      fetchStockNewsData();

      if (isConnected) {
        subscribeToStock(stock.symbol);
        subscribeToPortfolio();
      }
    }
  }, [activeTab, isLoggedIn, stock, isConnected, fetchPortfolio]);

  useEffect(() => {
    if (activeTab === 'chart' && !chartLoaded && stock && containerRef.current) {
      containerRef.current.innerHTML = "";

      // Force TradingView's internal container + iframe to fill the wrapper
      const style = document.createElement("style");
      style.innerHTML = `
        .tradingview-widget-container,
        .tradingview-widget-container__widget,
        .tradingview-widget-container iframe {
          width: 100% !important;
          height: 100% !important;
          min-height: 520px !important;
        }
      `;
      containerRef.current.appendChild(style);

      const script = document.createElement("script");
      script.src = "https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js";
      script.type = "text/javascript";
      script.async = true;
      script.innerHTML = JSON.stringify({
        "autosize": true,
        "symbol": stock.symbol,
        "interval": "D",
        "timezone": "Asia/Kolkata",
        "theme": isDark ? "dark" : "light",
        "style": "1",
        "locale": "in",
        "enable_publishing": false,
        "backgroundColor": isDark ? "rgba(10, 10, 10, 1)" : "rgba(255, 255, 255, 1)",
        "gridColor": isDark ? "rgba(255, 255, 255, 0.05)" : "rgba(0, 0, 0, 0.05)",
        "hide_top_toolbar": false,
        "hide_legend": false,
        "save_image": false,
        "calendar": false,
        "hide_volume": false,
        "support_host": "https://www.tradingview.com"
      });
      containerRef.current.appendChild(script);
      setChartLoaded(true);
    }
  }, [activeTab, chartLoaded, stock, isDark]);

  // ESC key: exit fullscreen first, then close modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (isChartFullscreen) {
          e.stopPropagation();
          setIsChartFullscreen(false);
        }
      }
    };
    document.addEventListener('keydown', handleKeyDown, true);
    return () => document.removeEventListener('keydown', handleKeyDown, true);
  }, [isChartFullscreen]);

  if (!isOpen || !stock) return null;

  const isPositive = stock.change >= 0;
  const priceRangePercent = ((stock.price - stock.low) / (stock.high - stock.low)) * 100;
  const displayPrice = realtimePrice || stock.price;

  const tabs = [
    { id: 'overview' as ModalTab, label: 'Overview', icon: LayoutDashboard },
    { id: 'chart' as ModalTab, label: 'TradingView', icon: LineChart },
    { id: 'history' as ModalTab, label: 'History', icon: History },
    { id: 'trading' as ModalTab, label: 'Trade', icon: Briefcase },
  ];

  const styles = {
    bg: isDark ? 'bg-[#0A0A0A]' : 'bg-white',
    backdrop: isDark ? 'bg-[#050505]/80' : 'bg-slate-200/60',
    border: isDark ? 'border-white/[0.08]' : 'border-slate-200',
    text: isDark ? 'text-white' : 'text-slate-900',
    textMuted: isDark ? 'text-slate-500' : 'text-slate-500',
    cardBg: isDark ? 'bg-white/[0.02]' : 'bg-slate-50',
    // Removed hover effect that was causing the vanishing issue
    cardHover: '',
    inputBg: isDark ? 'bg-white/[0.03]' : 'bg-white',
    divider: isDark ? 'divide-white/[0.05]' : 'divide-slate-200',
    headerBorder: isDark ? 'border-white/[0.06]' : 'border-slate-100',
    footerBorder: isDark ? 'border-white/[0.06]' : 'border-slate-100',
    tabActive: isDark ? 'text-white' : 'text-indigo-600 bg-indigo-50',
    tabInactive: isDark ? 'text-slate-500 hover:text-slate-300' : 'text-slate-500 hover:text-slate-700'
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className={`fixed inset-0 backdrop-blur-md z-[9998] ${styles.backdrop}`}
            onClick={onClose}
          />

          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6 pointer-events-none">
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 30 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 30 }}
              transition={{ type: "spring", duration: 0.5, bounce: 0.3 }}
              className={`relative ${styles.bg} rounded-[24px] border ${styles.border} shadow-2xl w-full max-w-5xl h-fit min-h-[60vh] max-h-full flex flex-col pointer-events-auto overflow-hidden ring-1 ring-black/5`}
              onClick={(e) => e.stopPropagation()}
            >
              {isDark && <div className="absolute inset-0 bg-noise opacity-[0.03] pointer-events-none mix-blend-overlay" />}

              {/* --- HEADER --- */}
              <div className={`shrink-0 p-6 sm:p-8 border-b ${styles.headerBorder} ${styles.bg} relative overflow-hidden z-10`}>
                {isDark && <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-indigo-500/30 to-transparent" />}

                {/* Close Button - More Premium and Accessible */}
                <button
                  onClick={onClose}
                  className="absolute top-6 right-6 p-2.5 rounded-xl bg-white/10 hover:bg-red-500/20 border border-white/10 hover:border-red-500/50 text-slate-400 hover:text-white transition-all z-50 group shadow-xl backdrop-blur-md"
                  aria-label="Close modal"
                >
                  <X className="w-5 h-5 group-hover:rotate-90 transition-transform duration-300" />
                </button>

                <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 relative z-10 pr-16">
                  <div className="flex items-center gap-5">
                    <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-2xl font-bold text-white shadow-xl bg-gradient-to-br from-indigo-600 to-purple-600 ring-1 ring-white/10 relative overflow-hidden group">
                      <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/20 to-purple-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                      {stock.symbol[0]}
                    </div>

                    <div>
                      <div className="flex items-center gap-3">
                        <h2 className={`text-3xl font-bold ${styles.text} tracking-tight`}>{stock.symbol}</h2>
                        <span className={`text-[10px] px-2 py-0.5 rounded-md border ${styles.border} ${styles.cardBg} ${styles.textMuted} font-medium uppercase tracking-wider`}>
                          {stock.category}
                        </span>
                      </div>
                      <p className={`${styles.textMuted} text-sm font-medium mt-1 flex items-center gap-2`}>
                        {stock.name}
                        <span className="opacity-30">•</span>
                        <span className="text-xs opacity-70">NSE</span>
                      </p>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className={`text-4xl font-bold ${styles.text} mb-1 tabular-nums tracking-tight`}>
                      ₹{stock.price.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </div>
                    <div className={`flex items-center justify-end gap-2 font-bold text-lg ${isPositive ? 'text-emerald-500' : 'text-rose-500'}`}>
                      {isPositive ? <TrendingUp className="w-5 h-5" /> : <TrendingDown className="w-5 h-5" />}
                      <span>{stock.change > 0 ? '+' : ''}{stock.change.toFixed(2)}</span>
                      <span className="opacity-80 text-base">({stock.changePercent > 0 ? '+' : ''}{stock.changePercent.toFixed(2)}%)</span>
                    </div>
                  </div>
                </div>

                <div className="flex gap-1 mt-8 overflow-x-auto pb-1 custom-scrollbar-dark mask-linear-fade">
                  {tabs.map((tab) => {
                    const Icon = tab.icon;
                    const isActive = activeTab === tab.id;
                    return (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`
                            relative flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-medium transition-all whitespace-nowrap
                            ${isActive ? styles.tabActive : styles.tabInactive}
                        `}
                      >
                        {isActive && isDark && (
                          <motion.div
                            layoutId="modalTab"
                            className="absolute inset-0 bg-white/[0.08] border border-white/[0.05] rounded-lg shadow-sm"
                            transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                          />
                        )}
                        <Icon className={`w-4 h-4 relative z-10 ${isActive ? 'text-indigo-500' : ''}`} />
                        <span className="relative z-10">{tab.label}</span>
                        {tab.id === 'trading' && !isLoggedIn && <Lock className="w-3 h-3 ml-1 text-amber-500/80 relative z-10" />}
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* --- CONTENT AREA --- */}
              <div className={`flex-1 overflow-y-auto custom-scrollbar-dark ${styles.bg} relative`}>

                {activeTab === 'overview' && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4 }}
                    className="p-6 sm:p-8 space-y-6"
                  >
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <StatCard label="Open" value={stock.open} styles={styles} />
                      <StatCard label="Prev. Close" value={stock.previousClose} styles={styles} />
                      <StatCard label="Day High" value={stock.high} color="text-emerald-500" styles={styles} />
                      <StatCard label="Day Low" value={stock.low} color="text-rose-500" styles={styles} />
                    </div>

                    <div className={`${styles.cardBg} p-6 rounded-2xl border ${styles.border}`}>
                      <div className={`flex justify-between text-sm font-medium ${styles.textMuted} mb-4`}>
                        <span>Day's Range</span>
                        <span className={styles.text}>{priceRangePercent.toFixed(1)}%</span>
                      </div>
                      <div className={`h-2 ${isDark ? 'bg-white/[0.05]' : 'bg-slate-200'} rounded-full overflow-hidden relative`}>
                        <div
                          className="absolute top-0 bottom-0 left-0 bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-500 rounded-full"
                          style={{ width: `${priceRangePercent}%` }}
                        />
                      </div>
                      <div className={`flex justify-between text-xs ${styles.textMuted} mt-3 font-mono`}>
                        <span>L: ₹{stock.low.toFixed(2)}</span>
                        <span>H: ₹{stock.high.toFixed(2)}</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <DetailCard
                        label="Total Volume"
                        value={stock.volume.toLocaleString()}
                        icon={Activity}
                        subtext="Shares Traded"
                        styles={styles}
                      />
                      <DetailCard
                        label="Traded Value"
                        value={`₹${(stock.marketCap / 10000000).toFixed(2)} Cr`}
                        icon={BarChart3}
                        subtext="Estimated Turnover"
                        styles={styles}
                      />
                    </div>
                  </motion.div>
                )}

                {activeTab === 'history' && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-6 sm:p-8">
                    {/* Range Tabs + View Toggle */}
                    <div className="flex items-center justify-between mb-6">
                      <div className="flex gap-1">
                        {(['1d', '1w', '1m', '1y'] as const).map((range) => (
                          <button
                            key={range}
                            onClick={() => setHistoryRange(range)}
                            className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${historyRange === range
                              ? isDark ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30' : 'bg-indigo-50 text-indigo-600 border border-indigo-200'
                              : isDark ? 'text-slate-500 hover:text-slate-300 hover:bg-white/[0.04]' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                              }`}
                          >
                            {range}
                          </button>
                        ))}
                      </div>
                      <div className="flex gap-1">
                        <button
                          onClick={() => setHistoryView('chart')}
                          className={`p-2 rounded-lg transition-all ${historyView === 'chart'
                            ? isDark ? 'bg-white/[0.08] text-indigo-400' : 'bg-indigo-50 text-indigo-600'
                            : isDark ? 'text-slate-500 hover:text-slate-300' : 'text-slate-400 hover:text-slate-600'}`}
                        >
                          <BarChart2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setHistoryView('table')}
                          className={`p-2 rounded-lg transition-all ${historyView === 'table'
                            ? isDark ? 'bg-white/[0.08] text-indigo-400' : 'bg-indigo-50 text-indigo-600'
                            : isDark ? 'text-slate-500 hover:text-slate-300' : 'text-slate-400 hover:text-slate-600'}`}
                        >
                          <Table2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {loadingHistory ? (
                      <div className={`flex flex-col items-center justify-center h-64 ${styles.textMuted}`}>
                        <Activity className="w-8 h-8 animate-bounce mb-3 text-indigo-500" />
                        <span className="text-sm font-medium">Retrieving data...</span>
                      </div>
                    ) : (() => {
                      // 1D: show minute-by-minute intraday. 1W/1M/1Y: show daily snapshots.
                      const displayData = historyRange === '1d'
                        ? intradayData
                        : snapshotData;

                      if (displayData.length === 0) {
                        return (
                          <div className={`text-center py-20 ${styles.textMuted}`}>
                            <History className="w-12 h-12 mx-auto mb-4 opacity-20" />
                            <p className="font-medium">No data available for this range.</p>
                            <p className="text-xs mt-2 opacity-60">
                              {historyRange === '1d'
                                ? isMarketOpen
                                  ? 'Data will appear as market prices are captured.'
                                  : 'Market is currently closed. Showing last available session.'
                                : 'Daily closing prices will accumulate as trading days pass.'}
                            </p>
                          </div>
                        );
                      }

                      // Chart view
                      if (historyView === 'chart') {
                        const chartData = displayData.map((item: any) => ({
                          time: historyRange === '1d'
                            ? new Date(item.timestamp).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
                            : new Date(item.date || item.timestamp).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }),
                          price: item.price,
                          change: item.changePercent,
                          isLive: item.isClosed === false
                        }));

                        const prices = chartData.map((d: any) => d.price);
                        const minPrice = Math.min(...prices);
                        const maxPrice = Math.max(...prices);
                        const padding = (maxPrice - minPrice) * 0.1 || 1;
                        const isUp = chartData.length > 1 && chartData[chartData.length - 1].price >= chartData[0].price;
                        const chartColor = isUp ? '#10b981' : '#f43f5e';

                        return (
                          <div className={`rounded-2xl border ${styles.border} ${styles.cardBg} p-4`}>
                            <ResponsiveContainer width="100%" height={320}>
                              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                                <defs>
                                  <linearGradient id="priceGradient" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor={chartColor} stopOpacity={0.3} />
                                    <stop offset="95%" stopColor={chartColor} stopOpacity={0} />
                                  </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke={isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.06)'} />
                                <XAxis
                                  dataKey="time"
                                  tick={{ fontSize: 10, fill: isDark ? '#64748b' : '#94a3b8' }}
                                  axisLine={false}
                                  tickLine={false}
                                  interval={Math.max(0, Math.floor(chartData.length / 6))}
                                />
                                <YAxis
                                  domain={[minPrice - padding, maxPrice + padding]}
                                  tick={{ fontSize: 10, fill: isDark ? '#64748b' : '#94a3b8' }}
                                  axisLine={false}
                                  tickLine={false}
                                  tickFormatter={(v: number) => `₹${v.toFixed(0)}`}
                                  width={60}
                                />
                                <Tooltip
                                  contentStyle={{
                                    background: isDark ? '#1a1a2e' : '#fff',
                                    border: isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid #e2e8f0',
                                    borderRadius: '12px',
                                    fontSize: '12px',
                                    boxShadow: '0 8px 32px rgba(0,0,0,0.3)'
                                  }}
                                  formatter={(value: any) => [`₹${Number(value).toFixed(2)}`, 'Price']}
                                />
                                <Area
                                  type="monotone"
                                  dataKey="price"
                                  stroke={chartColor}
                                  strokeWidth={2}
                                  fill="url(#priceGradient)"
                                  dot={false}
                                  activeDot={{ r: 4, fill: chartColor, stroke: isDark ? '#0A0A0A' : '#fff', strokeWidth: 2 }}
                                />
                              </AreaChart>
                            </ResponsiveContainer>
                            <div className={`flex items-center justify-center gap-4 mt-3 text-xs ${styles.textMuted}`}>
                              <span>{displayData.length} data points</span>
                              <span>•</span>
                              <span>{historyRange === '1d' ? 'Intraday (1 min)' : 'Daily Close'}</span>
                              {isMarketOpen && historyRange === '1d' && (
                                <>
                                  <span>•</span>
                                  <span className="text-emerald-500 flex items-center gap-1">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                    Market Open
                                  </span>
                                </>
                              )}
                              {isMarketOpen && historyRange !== '1d' && (
                                <>
                                  <span>•</span>
                                  <span className="text-cyan-500 flex items-center gap-1">
                                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-500 animate-pulse" />
                                    Today's price is live
                                  </span>
                                </>
                              )}
                            </div>
                          </div>
                        );
                      }

                      // Table view
                      return (
                        <div className={`overflow-hidden rounded-2xl border ${styles.border}`}>
                          <div className="max-h-[400px] overflow-y-auto custom-scrollbar-dark">
                            <table className={`w-full text-left text-sm ${styles.textMuted}`}>
                              <thead className={`${styles.cardBg} ${styles.textMuted} uppercase text-[10px] font-bold tracking-wider sticky top-0 z-10`}>
                                <tr>
                                  <th className="px-6 py-4">{historyRange === '1d' ? 'Time' : 'Date'}</th>
                                  <th className="px-6 py-4 text-right">Price</th>
                                  <th className="px-6 py-4 text-right">Open</th>
                                  <th className="px-6 py-4 text-right">H / L</th>
                                  <th className="px-6 py-4 text-right">Change</th>
                                </tr>
                              </thead>
                              <tbody className={`divide-y ${styles.divider}`}>
                                {displayData.map((item: any, idx: number) => {
                                  const isPos = (item.change || 0) >= 0;
                                  return (
                                    <tr key={item._id || idx} className="transition-colors hover:bg-white/[0.02]">
                                      <td className={`px-6 py-3 font-mono text-xs ${styles.textMuted}`}>
                                        {historyRange === '1d'
                                          ? new Date(item.timestamp).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
                                          : new Date(item.date || item.timestamp).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
                                        }
                                      </td>
                                      <td className={`px-6 py-3 text-right font-bold ${styles.text}`}>
                                        ₹{item.price?.toFixed(2) ?? '—'}
                                      </td>
                                      <td className="px-6 py-3 text-right">
                                        {item.open != null ? `₹${item.open.toFixed(2)}` : '—'}
                                      </td>
                                      <td className="px-6 py-3 text-right text-xs">
                                        <span className="text-emerald-500/80">{item.high != null ? item.high.toFixed(0) : '—'}</span>
                                        {' / '}
                                        <span className="text-rose-500/80">{item.low != null ? item.low.toFixed(0) : '—'}</span>
                                      </td>
                                      <td className={`px-6 py-3 text-right font-bold ${isPos ? 'text-emerald-500' : 'text-rose-500'}`}>
                                        {item.changePercent != null ? `${item.changePercent.toFixed(2)}%` : '—'}
                                      </td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      );
                    })()}
                  </motion.div>
                )}

                {/* ── TradingView Chart Tab ── */}
                <div className={`w-full ${activeTab === 'chart' ? 'block' : 'hidden'}`}>

                  {/* Wrapper: CSS fullscreen — containerRef NEVER changes, only the parent resizes */}
                  <div className={isChartFullscreen
                    ? 'fixed inset-0 z-[99999] flex flex-col bg-[#0A0A0A]'
                    : `${isDark ? 'bg-[#0A0A0A]' : 'bg-white'}`
                  }>
                    {/* Toolbar */}
                    <div className={`flex items-center justify-between px-5 py-3 border-b shrink-0 ${
                      isChartFullscreen
                        ? 'border-white/[0.07] bg-[#0f0f0f]'
                        : isDark ? 'border-white/[0.06]' : 'border-slate-100'
                    }`}>
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-gradient-to-r from-indigo-500/10 to-purple-500/10 border border-indigo-500/20">
                          <div className="w-5 h-5 rounded-md bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                            <LineChart className="w-3 h-3 text-white" />
                          </div>
                          <span className="text-xs font-bold text-indigo-400 tracking-wide">TradingView</span>
                        </div>
                        <span className={`text-xs font-medium ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                          NSE:{stock.symbol} · Real-time
                        </span>
                        <span className="flex items-center gap-1 text-[10px] font-semibold text-emerald-500">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                          LIVE
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <a
                          href={`https://www.tradingview.com/chart/?symbol=NSE:${stock.symbol}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all border ${
                            isDark
                              ? 'text-slate-400 hover:text-white border-white/[0.07] hover:bg-white/[0.05]'
                              : 'text-slate-500 hover:text-slate-800 border-slate-200 hover:bg-slate-50'
                          }`}
                        >
                          <ExternalLink className="w-3 h-3" />
                          Open in TradingView
                        </a>
                        <button
                          onClick={() => setIsChartFullscreen(prev => !prev)}
                          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all border ${
                            isDark
                              ? 'text-slate-400 hover:text-white border-white/[0.07] hover:bg-white/[0.05]'
                              : 'text-slate-500 hover:text-slate-800 border-slate-200 hover:bg-slate-50'
                          }`}
                        >
                          {isChartFullscreen
                            ? <><Minimize2 className="w-3 h-3" />&nbsp;Exit Fullscreen</>
                            : <><Maximize2 className="w-3 h-3" />&nbsp;Fullscreen</>
                          }
                        </button>
                      </div>
                    </div>

                    {/* Chart — single permanent div, ref never moves */}
                    <div className="w-full flex-1" style={isChartFullscreen ? {} : { height: '500px' }}>
                      <div className="w-full h-full" ref={containerRef} />
                    </div>

                    {/* Footer */}
                    <div className={`flex items-center justify-between px-5 py-2 border-t text-[10px] font-medium shrink-0 ${
                      isDark ? 'border-white/[0.05] text-slate-600' : 'border-slate-100 text-slate-400'
                    }`}>
                      <span>Powered by TradingView · Data may be delayed 15 min</span>
                      <span className={isDark ? 'text-slate-700' : 'text-slate-300'}>© TradingView Inc.</span>
                    </div>
                  </div>

                </div>

                {/* 4. TRADING TAB */}
                {activeTab === 'trading' && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="p-6 sm:p-8 min-h-full"
                  >
                    {authChecking ? (
                      <div className="flex flex-col items-center justify-center h-full min-h-[400px]">
                        <Loader2 className="h-10 w-10 animate-spin text-cyan-500 mb-4" />
                        <p className={`${styles.textMuted} text-sm`}>Verifying authentication...</p>
                      </div>
                    ) : !isLoggedIn ? (
                      <div className="flex flex-col items-center justify-center h-full min-h-[400px] text-center">
                        <div className={`max-w-md w-full p-8 ${styles.cardBg} rounded-3xl border ${styles.border} relative overflow-hidden group`}>
                          {isDark && <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />}

                          <div className={`w-16 h-16 ${isDark ? 'bg-slate-900' : 'bg-white shadow-md'} rounded-2xl flex items-center justify-center mb-6 border ${styles.border} mx-auto shadow-2xl`}>
                            <Lock className="w-8 h-8 text-indigo-500" />
                          </div>
                          <h3 className={`text-2xl font-bold ${styles.text} mb-2`}>Login Required</h3>
                          <p className={`${styles.textMuted} mb-8 text-sm leading-relaxed`}>
                            Access to the live trading terminal is restricted to verified members.
                          </p>
                          <button
                            onClick={() => {
                              onClose();
                              // Small timeout to let this modal's unmount start, avoiding scroll-lock visual fighting
                              setTimeout(() => {
                                window.dispatchEvent(new Event("open-login-modal"));
                              }, 50);
                            }}
                            className="relative z-10 block w-full py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold transition-all shadow-lg hover:shadow-indigo-500/25"
                          >
                            Login to Trade
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                        {/* LEFT COLUMN: Analysis & Holdings (7/12) */}
                        <div className="lg:col-span-7 flex flex-col gap-6">
                          {/* Stock News & AI Signal Card */}
                          <div className={`rounded-2xl border ${styles.border} ${styles.cardBg} flex flex-col overflow-hidden`}>
                            <div className={`p-4 border-b ${styles.border} flex items-center gap-2 ${isDark ? 'bg-indigo-950/10' : 'bg-indigo-50'}`}>
                              <Newspaper className="w-5 h-5 text-indigo-500" />
                              <h3 className={`font-semibold ${styles.text}`}>Market News & AI Signal</h3>
                            </div>
                            <div className="p-4 min-h-[400px]">
                              <StockNewsCard
                                news={stockNews}
                                aiRecommendation={aiRecommendation}
                                loading={newsLoading}
                                symbol={stock.symbol}
                                newsFallbackUsed={newsFallbackUsed}
                                onRefresh={fetchStockNewsData}
                                currentPlan={currentPlan}
                              />
                            </div>
                          </div>

                          {/* Holdings Card */}
                          <div className={`rounded-2xl border ${styles.border} ${styles.cardBg} overflow-hidden`}>
                            <div className={`p-4 border-b ${styles.border} flex items-center gap-2 ${isDark ? 'bg-emerald-950/10' : 'bg-emerald-50'}`}>
                              <Wallet className="w-5 h-5 text-emerald-500" />
                              <h3 className={`font-semibold ${styles.text}`}>Your Position</h3>
                            </div>
                            <div className="p-4">
                              <HoldingsCard holding={userHolding} loading={portfolioLoading} />
                            </div>
                          </div>
                        </div>

                        {/* RIGHT COLUMN: Execution (5/12) */}
                        <div className="lg:col-span-5 flex flex-col">
                          <div className={`${styles.cardBg} border ${styles.border} rounded-2xl p-0 flex flex-col shadow-xl h-fit`}>
                            <div className={`p-5 border-b ${styles.border} ${isDark ? 'bg-gradient-to-r from-indigo-600/10 to-transparent' : 'bg-slate-50'}`}>
                              <div className="flex items-center gap-2 mb-1">
                                <ArrowRightLeft className="w-5 h-5 text-indigo-500" />
                                <h3 className={`font-bold text-lg ${styles.text}`}>Execute Trade</h3>
                              </div>
                              <p className={`text-xs ${styles.textMuted}`}>
                                Place instant market orders at realtime price.
                              </p>
                            </div>

                            <div className="p-6 flex flex-col justify-center">
                              <TradingPanel
                                symbol={stock.symbol}
                                stockName={stock.name}
                                currentPrice={displayPrice}
                                userHolding={userHolding}
                                availableBalance={portfolio?.availableBalance || 100000}
                                onTradeExecuted={handleTradeExecuted}
                                currentPlan={currentPlan}
                                isDark={isDark}
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </motion.div>
                )}

              </div>

              <div className={`p-4 border-t ${styles.footerBorder} ${styles.bg} flex justify-between items-center text-[10px] ${styles.textMuted} z-10`}>
                <div className="flex items-center gap-2">
                  <Clock className="w-3 h-3" />
                  Last update: {new Date(stock.timestamp).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}, {new Date(stock.timestamp).toLocaleTimeString()}
                </div>
                <div className="flex items-center gap-1">
                  Data provided by <span className={`${styles.text} font-bold`}>NSE</span>
                </div>
              </div>

            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}

// --- SUB COMPONENTS ---

function StatCard({ label, value, color, styles }: { label: string, value: number, color?: string, styles: any }) {
  const textColor = color || styles.text;
  return (
    <div className={`${styles.cardBg} p-5 rounded-2xl border ${styles.border} ${styles.cardHover} transition-colors group`}>
      <div className={`${styles.textMuted} text-[10px] font-bold uppercase tracking-wider mb-2 group-hover:opacity-80 transition-opacity`}>{label}</div>
      <div className={`text-xl font-bold ${textColor} tabular-nums`}>₹{value.toFixed(2)}</div>
    </div>
  )
}

function DetailCard({ label, value, icon: Icon, subtext, styles }: { label: string, value: string, icon: any, subtext: string, styles: any }) {
  return (
    <div className={`${styles.cardBg} p-6 rounded-2xl border ${styles.border} flex items-center justify-between ${styles.cardHover} transition-colors`}>
      <div>
        <div className={`${styles.textMuted} text-[10px] font-bold uppercase tracking-wider mb-1`}>{label}</div>
        <div className={`text-2xl font-bold ${styles.text} tabular-nums tracking-tight mb-1`}>{value}</div>
        <div className={`text-xs ${styles.textMuted} font-medium`}>{subtext}</div>
      </div>
      <div className={`w-12 h-12 rounded-full ${styles.inputBg} flex items-center justify-center`}>
        <Icon className="w-6 h-6 text-indigo-500/80" />
      </div>
    </div>
  )
}