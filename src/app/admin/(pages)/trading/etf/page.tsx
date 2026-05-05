"use client";

import React, { useState, useEffect } from "react";
import axios from "axios"; // Kept for modal's specific query
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  TrendingUp,
  TrendingDown,
  Activity,
  X,
  RefreshCw,
  Clock,
  DollarSign,
  BarChart2,
  Loader2,
  Database,
  Server,
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

interface ETFData {
  _id?: string;
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  open: number;
  high: number;
  low: number;
  volume: number;
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
  const path = isPositive
    ? "M0 25 Q10 20 20 22 T40 15 T60 10 T80 5 L100 2"
    : "M0 5 Q10 10 20 8 T40 15 T60 20 T80 25 L100 28";

  return (
    <svg width="100" height="30" viewBox="0 0 100 30" className="opacity-80">
      <path d={path} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d={`${path} L100 30 L0 30 Z`} fill={color} fillOpacity="0.1" stroke="none" />
    </svg>
  );
};

// ==========================================
// COMPONENT: ETF HISTORY MODAL
// ==========================================

const ETFDetailModal = ({ etf, isOpen, onClose }: { etf: ETFData | null; isOpen: boolean; onClose: () => void }) => {
  const [history, setHistory] = useState<ETFData[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && etf) {
      const fetchHistory = async () => {
        setLoading(true);
        try {
          // ✅ FIXED: Ensure this is a relative path (no localhost)
          const response = await axios.get(`/api/stocks`, {
            params: { category: 'ETF', limit: 2000 },
            withCredentials: true
          });

          if (response.data.success) {
            const filteredHistory = response.data.data
              .filter((item: any) => item.symbol === etf.symbol)
              .reverse();

            setHistory(filteredHistory.length ? filteredHistory : [etf, etf, etf]);
          }
        } catch (error) {
          console.error("Failed to fetch history", error);
        } finally {
          setLoading(false);
        }
      };
      fetchHistory();
    }
  }, [isOpen, etf]);

  if (!isOpen || !etf) return null;

  const isPositive = etf.change >= 0;
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
              layoutId={`etf-row-${etf.symbol}`}
              className="w-full max-w-4xl bg-[#0B0C15] border border-white/10 rounded-[24px] shadow-2xl overflow-hidden pointer-events-auto flex flex-col md:flex-row max-h-[90vh]"
            >
              {/* LEFT SIDE: INFO */}
              <div className="w-full md:w-1/3 p-8 bg-[#0F111A] border-r border-white/5 flex flex-col relative overflow-hidden">
                <div className={`absolute top-0 left-0 w-full h-1/2 bg-gradient-to-b ${isPositive ? 'from-emerald-500/10' : 'from-rose-500/10'} to-transparent pointer-events-none`} />

                <div className="relative z-10">
                  <button onClick={onClose} className="absolute -top-2 -left-2 p-2 rounded-full bg-white/5 hover:bg-white/10 text-slate-400 transition-colors">
                    <X size={20} />
                  </button>

                  <div className="mt-12 mb-8">
                    <div className="h-16 w-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mb-6 shadow-xl">
                      <Activity className={cn("h-8 w-8", isPositive ? "text-emerald-400" : "text-rose-400")} />
                    </div>
                    <h2 className="text-3xl font-bold text-white tracking-tight">{etf.symbol}</h2>
                    <p className="text-sm text-slate-500 font-medium mt-1">{etf.name}</p>
                  </div>

                  <div className="space-y-6">
                    <div>
                      <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Current Price</p>
                      <div className="flex items-baseline gap-3">
                        <span className="text-4xl font-bold text-white">₹{etf.price.toLocaleString()}</span>
                        <span className={cn("text-sm font-bold px-2 py-1 rounded-lg", isPositive ? "bg-emerald-500/10 text-emerald-400" : "bg-rose-500/10 text-rose-400")}>
                          {isPositive ? "+" : ""}{etf.changePercent.toFixed(2)}%
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-4 rounded-2xl bg-white/5 border border-white/5">
                        <div className="flex items-center gap-2 mb-2 text-slate-400">
                          <TrendingUp size={14} />
                          <span className="text-xs font-medium">Day High</span>
                        </div>
                        <span className="text-lg font-bold text-slate-200">{etf.high.toLocaleString()}</span>
                      </div>
                      <div className="p-4 rounded-2xl bg-white/5 border border-white/5">
                        <div className="flex items-center gap-2 mb-2 text-slate-400">
                          <TrendingDown size={14} />
                          <span className="text-xs font-medium">Day Low</span>
                        </div>
                        <span className="text-lg font-bold text-slate-200">{etf.low.toLocaleString()}</span>
                      </div>
                      <div className="p-4 rounded-2xl bg-white/5 border border-white/5">
                        <div className="flex items-center gap-2 mb-2 text-slate-400">
                          <BarChart2 size={14} />
                          <span className="text-xs font-medium">Volume</span>
                        </div>
                        <span className="text-lg font-bold text-slate-200">{(etf.volume / 1000).toFixed(1)}k</span>
                      </div>
                      <div className="p-4 rounded-2xl bg-white/5 border border-white/5">
                        <div className="flex items-center gap-2 mb-2 text-slate-400">
                          <DollarSign size={14} />
                          <span className="text-xs font-medium">Open</span>
                        </div>
                        <span className="text-lg font-bold text-slate-200">{etf.open.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* RIGHT SIDE: CHART */}
              <div className="w-full md:w-2/3 bg-[#0B0C15] flex flex-col">
                <div className="p-6 border-b border-white/5 flex justify-between items-center">
                  <h3 className="font-semibold text-slate-200">Price History</h3>
                  <div className="flex gap-2">
                    {['1H', '1D', '1W', '1M'].map((period) => (
                      <button key={period} className="px-3 py-1 rounded-lg text-xs font-medium bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white transition-colors">
                        {period}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex-1 p-6 relative min-h-[300px]">
                  {loading ? (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={history}>
                        <defs>
                          <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor={Color} stopOpacity={0.3} />
                            <stop offset="95%" stopColor={Color} stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.2} vertical={false} />
                        <XAxis dataKey="timestamp" hide />
                        <YAxis
                          domain={['auto', 'auto']}
                          orientation="right"
                          tick={{ fill: '#64748b', fontSize: 11 }}
                          axisLine={false}
                          tickLine={false}
                          tickFormatter={(val) => `₹${val}`}
                        />
                        <Tooltip
                          contentStyle={{ backgroundColor: '#0F172A', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '12px' }}
                          itemStyle={{ color: '#fff' }}
                          labelStyle={{ display: 'none' }}
                          formatter={(value: any) => [`₹${value}`, 'Price']}
                        />
                        <Area type="monotone" dataKey="price" stroke={Color} strokeWidth={2} fillOpacity={1} fill="url(#colorPrice)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  )}
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

export default function ETFPage() {
  const [etfs, setEtfs] = useState<ETFData[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedETF, setSelectedETF] = useState<ETFData | null>(null);
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

  const fetchETFs = async () => {
    if (etfs.length === 0) setLoading(true);
    try {
      // ✅ FIXED: Use stockApi
      const data = await stockApi.getETFStocks();
      if (data.success) {
        setEtfs(data.data);
        setLastUpdated(new Date().toLocaleTimeString());
      }
    } catch (error) {
      console.error("Error fetching ETFs:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchScraperStatus = async () => {
    try {
      // ✅ FIXED: Use stockApi instead of localhost URL
      const data = await stockApi.getScraperStatus();
      if (data.success) {
        setScraperStatus(data.status);
      }
    } catch (error) {
      setScraperStatus("Unknown");
    }
  };

  const handleManualScrape = async () => {
    setIsScraping(true);
    try {
      // ✅ FIXED: Use stockApi instead of localhost URL
      const data = await stockApi.triggerManualScrape();
      if (data.success) {
        alert("Scraping started successfully!");
        setTimeout(fetchETFs, 5000);
      }
    } catch (error) {
      alert("Failed to start scraper");
    } finally {
      setIsScraping(false);
    }
  };

  useEffect(() => {
    fetchETFs();
    fetchScraperStatus();
    const interval = setInterval(() => { fetchETFs(); fetchScraperStatus(); }, 60000);
    return () => clearInterval(interval);
  }, []);

  const filteredETFs = etfs.filter(etf =>
    etf.symbol.toLowerCase().includes(search.toLowerCase()) ||
    etf.name.toLowerCase().includes(search.toLowerCase())
  );

  const showEmptyState = !loading && filteredETFs.length === 0;

  return (
    <div className="min-h-screen bg-[#030712] text-slate-200 p-6 md:p-10 font-sans selection:bg-indigo-500/30 overflow-hidden relative">

      {/* Background Blobs */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[800px] h-[800px] bg-indigo-600/10 rounded-full blur-[150px] animate-pulse" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[600px] h-[600px] bg-purple-600/10 rounded-full blur-[150px] animate-pulse delay-1000" />
      </div>

      <div className="max-w-[1600px] mx-auto relative z-10">

        {/* HEADER */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
          <div>
            <motion.h1
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-white via-indigo-200 to-indigo-400 tracking-tight"
            >
              ETF Market
            </motion.h1>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="flex flex-wrap items-center gap-4 mt-2 text-slate-500 text-sm font-medium"
            >
              <span className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-white/5 border border-white/5">
                <Activity size={14} className="text-emerald-400" />
                Live Data
              </span>
              <span className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-white/5 border border-white/5">
                <Clock size={14} className="text-indigo-400" />
                Updated: {lastUpdated || "Syncing..."}
              </span>
              <span className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-white/5 border border-white/5">
                <Server size={14} className={scraperStatus === 'Running' ? "text-emerald-400" : "text-rose-400"} />
                Scraper: <span className={scraperStatus === 'Running' ? "text-emerald-400" : "text-rose-400"}>{scraperStatus}</span>
              </span>
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-3"
          >
            <div className="relative group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 h-4 w-4 group-focus-within:text-indigo-400 transition-colors" />
              <input
                type="text"
                placeholder="Search symbol..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 pr-4 py-3 bg-[#0F111A] border border-white/10 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500/50 w-full md:w-64 transition-all"
              />
            </div>

            {hasScrapePermission && (
              <button
                onClick={handleManualScrape}
                disabled={isScraping}
                className="flex items-center gap-2 px-4 py-3 bg-indigo-600/10 border border-indigo-500/20 hover:bg-indigo-600/20 text-indigo-400 rounded-xl transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isScraping ? <Loader2 size={18} className="animate-spin" /> : <Database size={18} />}
                <span className="hidden sm:inline font-medium text-xs">Scrape</span>
              </button>
            )}

            <button
              onClick={() => { setLoading(true); fetchETFs(); fetchScraperStatus(); }}
              className="p-3 bg-[#0F111A] border border-white/10 rounded-xl hover:bg-white/5 hover:text-white text-slate-400 transition-all active:scale-95"
            >
              <RefreshCw size={18} className={cn(loading && "animate-spin")} />
            </button>
          </motion.div>
        </div>

        {/* LIST VIEW (Table Header) */}
        <div className="grid grid-cols-12 gap-4 px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest border-b border-white/5 bg-[#0F111A]/50 rounded-t-2xl">
          <div className="col-span-4">ETF Name</div>
          <div className="col-span-2 text-right">Price</div>
          <div className="col-span-2 text-right">24h Change</div>
          <div className="col-span-2 text-center">Trend</div>
          <div className="col-span-2 text-right">Volume</div>
        </div>

        {/* LIST CONTENT */}
        {loading && etfs.length === 0 ? (
          <div className="flex h-[50vh] items-center justify-center border border-white/5 border-t-0 bg-[#0F111A]/30 rounded-b-2xl">
            <Loader2 className="h-10 w-10 text-indigo-500 animate-spin" />
          </div>
        ) : (
          <motion.div
            variants={listContainerVariants}
            initial="hidden"
            animate="visible"
            className="flex flex-col gap-1 pb-10"
          >
            {filteredETFs.map((etf) => {
              const isPositive = etf.change >= 0;
              return (
                <motion.div
                  key={etf.symbol}
                  layoutId={`etf-row-${etf.symbol}`}
                  variants={rowVariants}
                  whileHover="hover"
                  onClick={() => setSelectedETF(etf)}
                  className="grid grid-cols-12 gap-4 px-6 py-4 items-center bg-[#0F111A] border border-white/5 first:border-t-0 cursor-pointer group rounded-xl"
                >
                  {/* ETF Name & Symbol */}
                  <div className="col-span-4 flex items-center gap-4">
                    <div className="h-10 w-10 rounded-lg bg-white/5 flex items-center justify-center border border-white/5 shadow-inner group-hover:bg-indigo-500/20 transition-colors">
                      <span className="font-bold text-white text-[10px] tracking-tighter">{etf.symbol.substring(0, 2)}</span>
                    </div>
                    <div>
                      <h3 className="font-bold text-white text-sm group-hover:text-indigo-400 transition-colors">{etf.symbol}</h3>
                      <p className="text-xs text-slate-500 truncate max-w-[200px]">{etf.name}</p>
                    </div>
                  </div>

                  {/* Price */}
                  <div className="col-span-2 text-right">
                    <span className="font-mono font-bold text-slate-200">₹{etf.price.toLocaleString()}</span>
                  </div>

                  {/* Change */}
                  <div className="col-span-2 flex justify-end">
                    <div className={cn(
                      "flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-bold w-fit",
                      isPositive ? "bg-emerald-500/10 text-emerald-400" : "bg-rose-500/10 text-rose-400"
                    )}>
                      {isPositive ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                      {etf.changePercent.toFixed(2)}%
                    </div>
                  </div>

                  {/* Sparkline (Visual Only) */}
                  <div className="col-span-2 flex justify-center items-center">
                    <MiniSparkline isPositive={isPositive} />
                  </div>

                  {/* Volume */}
                  <div className="col-span-2 text-right">
                    <span className="text-xs font-medium text-slate-400 group-hover:text-white transition-colors">
                      {(etf.volume / 1000).toFixed(2)}k
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
            <p>No ETFs found matching your search.</p>
          </div>
        )}
      </div>

      {/* DETAIL MODAL */}
      <ETFDetailModal
        etf={selectedETF}
        isOpen={!!selectedETF}
        onClose={() => setSelectedETF(null)}
      />
    </div>
  );
}