"use client";

import React, { useState, useEffect, useMemo } from "react";
import axios from "axios";

import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  TrendingUp,
  TrendingDown,
  Activity,
  X,
  RefreshCw,
  Clock,
  BarChart2,
  Loader2,
  Database,
  Server,
  Briefcase,
  Layers,
  ArrowUpRight,
  ArrowDownRight,
  ChevronRight,
  MoreHorizontal
} from "lucide-react";
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area
} from "recharts";
import { cn } from "@/lib/utils";
import { stockApi } from "@/lib/api/stock.api";
import { companyApi } from "@/lib/api";

// ==========================================
// TYPES
// ==========================================

interface StockData {
  _id?: string;
  symbol: string;
  name: string;
  category: "NIFTY50" | "ETF";
  price: number;
  change: number;
  changePercent: number;
  open: number;
  high: number;
  low: number;
  volume: number;
  marketCap?: number;
  timestamp: string;
}

// ==========================================
// ANIMATION VARIANTS
// ==========================================

const listContainerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.04,
      delayChildren: 0.1
    }
  }
};

const rowVariants = {
  hidden: { x: -20, opacity: 0 },
  visible: {
    x: 0,
    opacity: 1,
    transition: { type: "spring" as const, stiffness: 100, damping: 15 }
  },
  hover: {
    scale: 1.01,
    backgroundColor: "rgba(255, 255, 255, 0.03)",
    transition: { duration: 0.2 }
  }
};

// ==========================================
// COMPONENT: MINI SPARKLINE (Visual Only)
// ==========================================
const MiniSparkline = ({ isPositive }: { isPositive: boolean }) => {
  const color = isPositive ? "#10b981" : "#f43f5e";
  // Generate a deterministic but random-looking path based on trend
  const path = isPositive
    ? "M0 25 Q10 20 20 22 T40 15 T60 10 T80 5 L100 2"
    : "M0 5 Q10 10 20 8 T40 15 T60 20 T80 25 L100 28";

  return (
    <svg width="100" height="30" viewBox="0 0 100 30" className="opacity-80">
      <path
        d={path}
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d={`${path} L100 30 L0 30 Z`}
        fill={color}
        fillOpacity="0.1"
        stroke="none"
      />
    </svg>
  );
};

// ==========================================
// COMPONENT: STOCK DETAIL MODAL
// ==========================================

const TIME_RANGES = ['1D', '1W', '1M', '6M', '1Y', 'YTD', 'All'];

const StockDetailModal = ({ stock, isOpen, onClose }: { stock: StockData | null; isOpen: boolean; onClose: () => void }) => {
  const [history, setHistory] = useState<StockData[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeRange, setActiveRange] = useState("1D");

  useEffect(() => {
    if (isOpen && stock) {
      // Reset range to 1D when opening a new stock
      setActiveRange("1D");

      const fetchHistory = async () => {
        setLoading(true);
        try {

          const response = await axios.get(`/api/stocks`, {
            params: { category: 'NIFTY50', limit: 2000 },
            withCredentials: true
          });

          if (response.data.success) {
            const filteredHistory = response.data.data
              .filter((item: any) => item.symbol === stock.symbol)
              // Sort ascending by time for the chart
              .sort((a: any, b: any) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

            setHistory(filteredHistory.length > 0 ? filteredHistory : [stock]);
          }
        } catch (error) {
          console.error("Failed to fetch history", error);
          setHistory([stock]);
        } finally {
          setLoading(false);
        }
      };
      fetchHistory();
    }
  }, [isOpen, stock]);

  // Filter Data based on Active Range
  const chartData = useMemo(() => {
    if (!history.length) return [];

    const now = new Date();
    const cutoff = new Date();

    switch (activeRange) {
      case '1D':
        // For 1D, we typically want today's data. 
        // If data is scarce, we might fallback to last 24h.
        cutoff.setHours(0, 0, 0, 0);
        break;
      case '1W':
        cutoff.setDate(now.getDate() - 7);
        break;
      case '1M':
        cutoff.setMonth(now.getMonth() - 1);
        break;
      case '6M':
        cutoff.setMonth(now.getMonth() - 6);
        break;
      case '1Y':
        cutoff.setFullYear(now.getFullYear() - 1);
        break;
      case 'YTD':
        cutoff.setMonth(0, 1); // January 1st of current year
        cutoff.setHours(0, 0, 0, 0);
        break;
      case 'All':
        return history;
      default:
        return history;
    }

    return history.filter(item => new Date(item.timestamp) >= cutoff);
  }, [history, activeRange]);

  if (!isOpen || !stock) return null;

  const isPositive = stock.change >= 0;
  const Color = isPositive ? "#10b981" : "#f43f5e";

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-lg"
          />

          <motion.div
            className="fixed inset-0 z-[101] flex items-center justify-center p-4 pointer-events-none"
          >
            <motion.div
              layoutId={`stock-row-${stock.symbol}`}
              className="w-full max-w-5xl bg-[#020617] border border-white/10 rounded-[24px] shadow-2xl overflow-hidden pointer-events-auto flex flex-col md:flex-row h-[85vh] md:h-[600px]"
            >
              {/* LEFT SIDE: COMPANY INFO */}
              <div className="w-full md:w-[35%] p-8 bg-[#0B1121] border-r border-white/5 flex flex-col relative overflow-hidden">
                <div className={`absolute top-0 left-0 w-full h-[60%] bg-gradient-to-b ${isPositive ? 'from-emerald-500/10' : 'from-red-500/10'} to-transparent pointer-events-none`} />

                <div className="relative z-10 flex flex-col h-full">
                  <div className="flex justify-between items-start">
                    <button onClick={onClose} className="p-2 -ml-2 rounded-full bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors">
                      <X size={20} />
                    </button>
                    <div className={cn("px-3 py-1 rounded-full text-xs font-bold border", isPositive ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" : "bg-red-500/10 border-red-500/20 text-red-400")}>
                      {isPositive ? "Bullish" : "Bearish"}
                    </div>
                  </div>

                  <div className="mt-8 mb-8">
                    <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-slate-800 to-slate-900 border border-white/10 flex items-center justify-center mb-6 shadow-xl text-2xl font-bold text-white tracking-tighter">
                      {stock.symbol.substring(0, 1)}
                    </div>
                    <h2 className="text-3xl font-bold text-white tracking-tight leading-none">{stock.symbol}</h2>
                    <p className="text-sm text-slate-500 font-medium mt-2 line-clamp-2">{stock.name}</p>
                  </div>

                  <div className="mt-auto space-y-6">
                    <div>
                      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Current Price</p>
                      <div className="flex items-end gap-3">
                        <span className="text-4xl font-bold text-white tracking-tight">₹{stock.price.toLocaleString()}</span>
                        <div className={cn("flex items-center mb-1.5 text-sm font-bold", isPositive ? "text-emerald-400" : "text-red-400")}>
                          {isPositive ? <ArrowUpRight size={16} /> : <ArrowDownRight size={16} />}
                          <span>{Math.abs(stock.changePercent).toFixed(2)}%</span>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="p-3 bg-white/5 rounded-xl border border-white/5">
                        <span className="text-[10px] text-slate-400 uppercase tracking-wider">High</span>
                        <p className="text-lg font-semibold text-slate-200">₹{stock.high.toLocaleString()}</p>
                      </div>
                      <div className="p-3 bg-white/5 rounded-xl border border-white/5">
                        <span className="text-[10px] text-slate-400 uppercase tracking-wider">Low</span>
                        <p className="text-lg font-semibold text-slate-200">₹{stock.low.toLocaleString()}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* RIGHT SIDE: CHART & STATS */}
              <div className="w-full md:w-[65%] bg-[#020617] flex flex-col relative">
                <div className="p-6 border-b border-white/5 flex justify-between items-center bg-[#020617]/50 backdrop-blur-sm z-10">
                  <div>
                    <h3 className="font-semibold text-white">Market Performance</h3>
                    <p className="text-xs text-slate-500">Real-time trading data</p>
                  </div>
                  <div className="flex gap-1 bg-white/5 p-1 rounded-lg">
                    {TIME_RANGES.map((t) => (
                      <button
                        key={t}
                        onClick={() => setActiveRange(t)}
                        className={cn(
                          "px-3 py-1 text-xs font-medium rounded-md transition-all",
                          activeRange === t
                            ? "bg-cyan-500/20 text-cyan-400 shadow-sm"
                            : "text-slate-400 hover:text-white hover:bg-white/10"
                        )}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex-1 p-6 relative">
                  {loading ? (
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
                      <Loader2 className="h-8 w-8 animate-spin text-cyan-500" />
                      <span className="text-xs text-slate-500 font-medium">Loading historical data...</span>
                    </div>
                  ) : chartData.length === 0 ? (
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-slate-500">
                      <Activity className="h-8 w-8 opacity-20" />
                      <span className="text-xs">No data for this time range</span>
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={chartData}>
                        <defs>
                          <linearGradient id="colorPriceNifty" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor={Color} stopOpacity={0.3} />
                            <stop offset="95%" stopColor={Color} stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                        <XAxis dataKey="timestamp" hide />
                        <YAxis
                          /* FIX FOR FLAT GRAPH: 
                            Using 'dataMin' and 'dataMax' forces the Y-axis to scale 
                            to the exact range of the data, showing even small fluctuations.
                          */
                          domain={['dataMin', 'dataMax']}
                          orientation="right"
                          tick={{ fill: '#64748b', fontSize: 11 }}
                          axisLine={false}
                          tickLine={false}
                          tickFormatter={(val) => `₹${val.toFixed(0)}`}
                          width={60}
                        />
                        <Tooltip
                          contentStyle={{ backgroundColor: '#0F172A', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '8px' }}
                          itemStyle={{ color: '#e2e8f0', fontSize: '12px' }}
                          labelStyle={{ display: 'none' }}
                          formatter={(value: any) => [`₹${value}`, 'Price']}
                        />
                        <Area
                          type="monotone"
                          dataKey="price"
                          stroke={Color}
                          strokeWidth={2}
                          fillOpacity={1}
                          fill="url(#colorPriceNifty)"
                          animationDuration={1000}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  )}
                </div>

                <div className="p-6 border-t border-white/5 grid grid-cols-3 gap-6 bg-[#0B1121]/50">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-cyan-500/10 rounded-lg text-cyan-400"><Layers size={18} /></div>
                    <div>
                      <p className="text-[10px] text-slate-500 uppercase font-bold">Open</p>
                      <p className="text-sm font-semibold text-slate-200">₹{stock.open.toLocaleString()}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-purple-500/10 rounded-lg text-purple-400"><BarChart2 size={18} /></div>
                    <div>
                      <p className="text-[10px] text-slate-500 uppercase font-bold">Volume</p>
                      <p className="text-sm font-semibold text-slate-200">{(stock.volume / 1000).toFixed(2)}k</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-amber-500/10 rounded-lg text-amber-400"><Activity size={18} /></div>
                    <div>
                      <p className="text-[10px] text-slate-500 uppercase font-bold">Prev Close</p>
                      <p className="text-sm font-semibold text-slate-200">₹{(stock.price - stock.change).toFixed(2)}</p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

// ==========================================
// COMPONENT: MAIN PAGE
// ==========================================

export default function Nifty50Page() {
  const [stocks, setStocks] = useState<StockData[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedStock, setSelectedStock] = useState<StockData | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [scraperStatus, setScraperStatus] = useState<string>("Checking...");
  const [isScraping, setIsScraping] = useState(false);
  const [hasScrapePermission, setHasScrapePermission] = useState(false);

  useEffect(() => {
    companyApi.getMe().then(res => {
      if (res.success && res.user) {
        if (res.user.role === 'super_admin' || (res.user.customRole?.permissions || []).includes('trading.scrape')) {
          setHasScrapePermission(true);
        }
      }
    }).catch(() => { });
  }, []);

  // ============================================
  // DATA FETCHING LOGIC
  // ============================================
  // ... inside Nifty50Page component

  const fetchStocks = async () => {
    if (stocks.length === 0) setLoading(true);
    try {
      const data = await stockApi.getNifty50Stocks();

      if (data.success) {
        /**
       * PROFESSIONAL DATA-DRIVEN FILTERING
       * 
       * Instead of hardcoding symbols, we filter based on data characteristics:
       * 1. Exclude index summary rows (symbol contains 'NIFTY' or 'INDEX')
       * 2. Exclude non-stock instruments (ETF, BEES, GOLD, SILVER, etc.)
       * 3. Require valid price data
       * 
       * This approach automatically adapts when the Nifty 50 index changes.
       */
        const nonStockPatterns = ['ETF', 'BEES', 'LIQUID', 'GILT', 'GOLD', 'SILVER', 'FUND', 'INDEX'];

        const niftyOnly = data.data.filter((item: StockData) => {
          const symbol = (item.symbol || '').trim().toUpperCase();

          // Skip index summary rows
          if (symbol.includes('NIFTY') || symbol.includes('SENSEX')) {
            return false;
          }

          // Exclude known non-stock instruments
          if (nonStockPatterns.some(p => symbol.includes(p))) {
            return false;
          }

          // Must have valid price (real stocks have prices > 0)
          if (!item.price || item.price <= 0) {
            return false;
          }

          return true;
        });

        // 2. NEW FIX: Deduplicate to get only the LATEST entry for each symbol
        // (This prevents the main list from showing the same company 50 times)
        const latestStocksMap = new Map();
        niftyOnly.forEach((stock: StockData) => {
          const existing = latestStocksMap.get(stock.symbol);
          // If stock is newer than what we have, replace it
          if (!existing || new Date(stock.timestamp) > new Date(existing.timestamp)) {
            latestStocksMap.set(stock.symbol, stock);
          }
        });

        const distinctStocks = Array.from(latestStocksMap.values()) as StockData[];

        setStocks(distinctStocks);
        setLastUpdated(new Date().toLocaleTimeString());
      }
    } catch (error) {
      console.error("Error fetching Nifty 50:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchScraperStatus = async () => {
    try {
      const data = await stockApi.getScraperStatus();
      if (data.success) setScraperStatus(data.status);
    } catch (error) {
      setScraperStatus("Unknown");
    }
  };

  const handleManualScrape = async () => {
    setIsScraping(true);
    try {
      const data = await stockApi.triggerManualScrape();
      if (data.success) {
        alert("Market Data Update Triggered.");
        setTimeout(fetchStocks, 5000);
      }
    } catch (error) {
      alert("Failed to trigger update.");
    } finally {
      setIsScraping(false);
    }
  };

  useEffect(() => {
    fetchStocks();
    fetchScraperStatus();
    const interval = setInterval(() => { fetchStocks(); fetchScraperStatus(); }, 60000);
    return () => clearInterval(interval);
  }, []);

  const filteredStocks = stocks.filter(s =>
    s.symbol.toLowerCase().includes(search.toLowerCase()) ||
    s.name.toLowerCase().includes(search.toLowerCase())
  );

  const showEmptyState = !loading && filteredStocks.length === 0;

  return (
    <div className="min-h-screen bg-[#030712] text-slate-200 p-6 md:p-10 font-sans selection:bg-cyan-500/30 overflow-hidden relative">

      {/* Background Blobs */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-[-20%] right-[-10%] w-[800px] h-[800px] bg-cyan-600/10 rounded-full blur-[150px] animate-pulse" />
        <div className="absolute bottom-[-20%] left-[-10%] w-[600px] h-[600px] bg-slate-700/10 rounded-full blur-[150px] animate-pulse delay-1000" />
      </div>

      <div className="max-w-[1600px] mx-auto relative z-10">

        {/* HEADER */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
          <div>
            <motion.h1
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-white via-cyan-100 to-cyan-400 tracking-tight"
            >
              Nifty 50 Index
            </motion.h1>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="flex flex-wrap items-center gap-4 mt-2 text-slate-500 text-sm font-medium"
            >
              <span className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-white/5 border border-white/5">
                <Briefcase size={14} className="text-cyan-400" />
                Top 50 Bluechip
              </span>
              <span className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-white/5 border border-white/5">
                <Clock size={14} className="text-indigo-400" />
                Updated: {lastUpdated || "--:--"}
              </span>
              <span className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-white/5 border border-white/5">
                <Server size={14} className={scraperStatus === 'Running' ? "text-emerald-400" : "text-rose-400"} />
                System: <span className={scraperStatus === 'Running' ? "text-emerald-400" : "text-rose-400"}>{scraperStatus}</span>
              </span>
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-3"
          >
            <div className="relative group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 h-4 w-4 group-focus-within:text-cyan-400 transition-colors" />
              <input
                type="text"
                placeholder="Find company..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 pr-4 py-3 bg-[#0B1121] border border-white/10 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500/50 w-full md:w-64 transition-all"
              />
            </div>

            {hasScrapePermission && (
              <button
                onClick={handleManualScrape}
                disabled={isScraping}
                className="flex items-center gap-2 px-4 py-3 bg-cyan-600/10 border border-cyan-500/20 hover:bg-cyan-600/20 text-cyan-400 rounded-xl transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isScraping ? <Loader2 size={18} className="animate-spin" /> : <Database size={18} />}
                <span className="hidden sm:inline font-medium text-xs">Update</span>
              </button>
            )}

            <button
              onClick={() => { setLoading(true); fetchStocks(); fetchScraperStatus(); }}
              className="p-3 bg-[#0B1121] border border-white/10 rounded-xl hover:bg-white/5 hover:text-white text-slate-400 transition-all active:scale-95"
            >
              <RefreshCw size={18} className={cn(loading && "animate-spin")} />
            </button>
          </motion.div>
        </div>

        {/* LIST VIEW (Table Header) */}
        <div className="grid grid-cols-12 gap-4 px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest border-b border-white/5 bg-[#0B1121]/50 rounded-t-2xl">
          <div className="col-span-4">Company</div>
          <div className="col-span-2 text-right">Price</div>
          <div className="col-span-2 text-right">24h Change</div>
          <div className="col-span-2 text-center">Trend</div>
          <div className="col-span-2 text-right">Volume</div>
        </div>

        {/* LIST CONTENT */}
        {loading && stocks.length === 0 ? (
          <div className="flex h-[50vh] items-center justify-center border border-white/5 border-t-0 bg-[#0B1121]/30 rounded-b-2xl">
            <Loader2 className="h-10 w-10 text-cyan-500 animate-spin" />
          </div>
        ) : (
          <motion.div
            variants={listContainerVariants}
            initial="hidden"
            animate="visible"
            className="flex flex-col gap-1 pb-10"
          >
            {filteredStocks.map((stock) => {
              const isPositive = stock.change >= 0;
              return (
                <motion.div
                  key={stock.symbol}
                  layoutId={`stock-row-${stock.symbol}`}
                  variants={rowVariants}
                  whileHover="hover"
                  onClick={() => setSelectedStock(stock)}
                  className="grid grid-cols-12 gap-4 px-6 py-4 items-center bg-[#0F111A] border border-white/5 first:border-t-0 cursor-pointer group rounded-xl"
                >
                  {/* Company Name & Symbol */}
                  <div className="col-span-4 flex items-center gap-4">
                    <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-slate-800 to-slate-900 border border-white/10 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                      <span className="font-bold text-white text-[10px] tracking-tighter">{stock.symbol.substring(0, 1)}</span>
                    </div>
                    <div>
                      <h3 className="font-bold text-white text-sm group-hover:text-cyan-400 transition-colors">{stock.symbol}</h3>
                      <p className="text-xs text-slate-500 truncate max-w-[200px]">{stock.name}</p>
                    </div>
                  </div>

                  {/* Price */}
                  <div className="col-span-2 text-right">
                    <span className="font-mono font-bold text-slate-200">₹{stock.price.toLocaleString()}</span>
                  </div>

                  {/* Change */}
                  <div className="col-span-2 flex justify-end">
                    <div className={cn(
                      "flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-bold w-fit",
                      isPositive ? "bg-emerald-500/10 text-emerald-400" : "bg-red-500/10 text-red-400"
                    )}>
                      {isPositive ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                      {stock.changePercent.toFixed(2)}%
                    </div>
                  </div>

                  {/* Sparkline (Visual Only) */}
                  <div className="col-span-2 flex justify-center items-center">
                    <MiniSparkline isPositive={isPositive} />
                  </div>

                  {/* Volume */}
                  <div className="col-span-2 text-right">
                    <span className="text-xs font-medium text-slate-400 group-hover:text-white transition-colors">
                      {(stock.volume / 100000).toFixed(2)}M
                    </span>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        )}

        {showEmptyState && (
          <div className="flex flex-col items-center justify-center py-20 text-slate-500">
            <Search className="h-12 w-12 mb-4 opacity-50" />
            <p>No Nifty 50 companies found.</p>
          </div>
        )}
      </div>

      {/* DETAIL MODAL */}
      <StockDetailModal
        stock={selectedStock}
        isOpen={!!selectedStock}
        onClose={() => setSelectedStock(null)}
      />
    </div>
  );
}