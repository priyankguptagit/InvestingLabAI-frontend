"use client";

import React, { useEffect, useState, useCallback } from "react";
import PortfolioComparisonChart from "@/app/user/_components/PortfolioComparisonChart";
import { useRouter } from "next/navigation";
import Watchlist from "@/app/user/_components/Watchlist";
import StockDetailModal from "@/app/user/_components/StockDetailModal";
import {
  TrendingUp,
  TrendingDown,
  ChevronRight,
  Lock,
  ArrowUpRight,
  ArrowDownRight,
  BarChart2,
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
} from "recharts";
import { authApi } from "@/lib/api";
import { tradingApi } from "@/lib/api/trading.api";
import { stockApi } from "@/lib/api/stock.api";



// ── Rupee formatter ───────────────────────────────────────────────────────────
const formatRupee = (value: number | undefined | null, decimals = 2) => {
  if (value === undefined || value === null) return "₹—";
  return `₹${value.toLocaleString("en-IN", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })}`;
};

const formatPercent = (value: number | undefined | null) => {
  if (value === undefined || value === null) return "—";
  const sign = value >= 0 ? "+" : "";
  return `${sign}${value.toFixed(2)}%`;
};

// ── Types ─────────────────────────────────────────────────────────────────────
interface Holding {
  symbol: string;
  stockName: string;
  quantity: number;
  averageBuyPrice: number;
  totalInvested: number;
  currentPrice: number;
  currentValue: number;
  unrealizedPL: number;
  unrealizedPLPercent: number;
  category?: string;
}

export default function UserDashboard() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [isAuthorized, setIsAuthorized] = useState(false);

  // Portfolio / stats states
  const [topStock, setTopStock] = useState<Holding | null>(null);
  const [portfolioEmpty, setPortfolioEmpty] = useState(false);
  const [sparklineData, setSparklineData] = useState<{ v: number }[]>([]);
  const [loadingPortfolio, setLoadingPortfolio] = useState(true);

  // Trading stats for real balance / invested values
  const [totalBalance, setTotalBalance] = useState<number | null>(null);
  const [investedValue, setInvestedValue] = useState<number | null>(null);
  const [balanceChange, setBalanceChange] = useState<number | null>(null);
  const [loadingStats, setLoadingStats] = useState(true);
  const [bestStocks, setBestStocks] = useState<any[]>([]);
  const [worstStocks, setWorstStocks] = useState<any[]>([]);
  const [loadingMarket, setLoadingMarket] = useState(true);
  const [holdingsBreakdown, setHoldingsBreakdown] = useState<{ label: string; value: number; color: string }[]>([]);
  const [tooltipOpen, setTooltipOpen] = useState(false);
  const [tooltipPos, setTooltipPos] = useState({ top: 0, right: 0 });
  const [selectedStock, setSelectedStock] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleStockClick = (stock: any) => {
    setSelectedStock(stock);
    setIsModalOpen(true);
  };

  // ── Auth ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await authApi.getMe();
        if (response.success) {
          setUser(response.user);
          setIsAuthorized(true);
        }
      } catch (error) {
        console.error("Auth check failed:", error);
        router.push("/");
      }
    };
    checkAuth();
  }, [router]);

  // ── Fetch portfolio once authorised ───────────────────────────────────────
  const fetchPortfolioData = useCallback(async () => {
    setLoadingPortfolio(true);
    try {
      const res = await tradingApi.getPortfolio();
      if (res.success && res.data) {
        const holdings: Holding[] = res.data.holdings ?? [];
        if (holdings.length === 0) {
          setPortfolioEmpty(true);
        } else {
          // Pick holding with highest unrealizedPLPercent
          const best = [...holdings].sort(
            (a, b) => b.unrealizedPLPercent - a.unrealizedPLPercent
          )[0];
          setTopStock(best);
          setPortfolioEmpty(false);

          // ── Compute category breakdown (hierarchical inclusion) ──────────
          // NIFTY50 stocks are also counted in NIFTY100 and NIFTY500.
          // NIFTY100 stocks are also counted in NIFTY500.
          // ETF stocks are only counted in ETF.
          const totals: Record<string, number> = { NIFTY50: 0, NIFTY100: 0, NIFTY500: 0, ETF: 0 };
          holdings.forEach(h => {
            const cat = (h.category || 'NIFTY500').toUpperCase();
            if (cat === 'NIFTY50') {
              totals['NIFTY50']  += h.totalInvested;
              totals['NIFTY100'] += h.totalInvested;
              totals['NIFTY500'] += h.totalInvested;
            } else if (cat === 'NIFTY100') {
              totals['NIFTY100'] += h.totalInvested;
              totals['NIFTY500'] += h.totalInvested;
            } else if (cat === 'NIFTY500') {
              totals['NIFTY500'] += h.totalInvested;
            } else if (cat === 'ETF') {
              totals['ETF'] += h.totalInvested;
            } else {
              totals['NIFTY500'] += h.totalInvested;
            }
          });
          const CATEGORIES = [
            { key: 'NIFTY50',  label: 'Nifty 50',  color: '#6366F1' },
            { key: 'NIFTY100', label: 'Nifty 100', color: '#22C55E' },
            { key: 'NIFTY500', label: 'Nifty 500', color: '#F59E0B' },
            { key: 'ETF',      label: 'ETF',        color: '#EC4899' },
          ];
          const breakdown = CATEGORIES
            .map(c => ({ label: c.label, value: totals[c.key], color: c.color }))
            .filter(c => c.value > 0);
          setHoldingsBreakdown(breakdown);
        }
      } else {
        setPortfolioEmpty(true);
      }
    } catch (err) {
      console.error("Portfolio fetch error:", err);
      setPortfolioEmpty(true);
    } finally {
      setLoadingPortfolio(false);
    }
  }, []);

  // ── Fetch trading stats ────────────────────────────────────────────────────
  

  // ── Fetch Market Movers ───────────────────────────────────────────────────
  const fetchMarketMovers = useCallback(async () => {
    setLoadingMarket(true);
    try {
      const res = await stockApi.getNifty500Stocks();
      if (res.success && res.data) {
        const sorted = [...res.data].sort((a, b) => (b.changePercent || 0) - (a.changePercent || 0));
        setBestStocks(sorted.slice(0, 10));
        setWorstStocks(sorted.slice(-10).reverse());
      }
    } catch (err) {
      console.error("Error fetching market movers:", err);
    } finally {
      setLoadingMarket(false);
    }
  }, []);
const fetchStats = useCallback(async () => {
    setLoadingStats(true);
    try {
      const res = await tradingApi.getTradingStats();
      if (res.success && res.data) {
        const d = res.data as any; // backend shape differs from outdated frontend type
        setTotalBalance(d.totalAccountValue ?? null);
        setInvestedValue(d.totalInvested ?? null);
        setBalanceChange(d.totalProfitLossPercent ?? null);
      }
    } catch (err) {
      console.error("Stats fetch error:", err);
    } finally {
      setLoadingStats(false);
    }
  }, []);

  useEffect(() => {
    if (isAuthorized) {
      fetchPortfolioData();
      fetchStats();
      fetchMarketMovers();
    }
  }, [isAuthorized, fetchPortfolioData, fetchStats, fetchMarketMovers]);

  // ── Fetch / synthesise sparkline for top stock ────────────────────────────
  useEffect(() => {
    if (!topStock) return;

    /**
     * Build a smooth 14-point journey from `start` → `end` with subtle
     * deterministic micro-variation so the sparkline always looks lively.
     */
    const buildSyntheticSparkline = (start: number, end: number) => {
      const N = 14;
      // Micro-noise multipliers — deterministic, based on symbol chars
      const seed = topStock.symbol
        .split("")
        .reduce((acc, c) => acc + c.charCodeAt(0), 0);
      const noise = [0, 0.3, -0.2, 0.5, 0.1, -0.3, 0.4, -0.1,
        0.6, -0.2, 0.3, -0.1, 0.2, 0];
      return Array.from({ length: N }, (_, i) => {
        const t = i / (N - 1); // 0 → 1
        // Smooth easing (ease-in-out cubic)
        const eased = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
        const base = start + (end - start) * eased;
        // noise scaled to ~0.3% of range
        const range = Math.abs(end - start) || end * 0.01;
        const noiseAmt = noise[(i + seed) % noise.length] * range * 0.15;
        return { v: Math.max(0, base + noiseAmt) };
      });
    };

    const fetchHistory = async () => {
      try {
        const res = await stockApi.getStockHistory(topStock.symbol);
        const intraday = res.success ? (res.data?.intraday || []) : [];
        if (intraday.length > 0) {
          const raw = intraday.slice(-20).map((s: any) => s.price ?? s.close ?? 0);
          // Check if the data is effectively flat (all same price)
          const min = Math.min(...raw);
          const max = Math.max(...raw);
          const isFlat = (max - min) / (max || 1) < 0.001; // < 0.1% variance

          if (isFlat) {
            // Synthesise from average buy → current to show real journey
            setSparklineData(
              buildSyntheticSparkline(topStock.averageBuyPrice, topStock.currentPrice)
            );
          } else {
            setSparklineData(raw.map((v: number) => ({ v })));
          }
        } else {
          setSparklineData(
            buildSyntheticSparkline(topStock.averageBuyPrice, topStock.currentPrice)
          );
        }
      } catch {
        setSparklineData(
          buildSyntheticSparkline(topStock.averageBuyPrice, topStock.currentPrice)
        );
      }
    };
    fetchHistory();
  }, [topStock]);

  if (!isAuthorized) return null;

  const isFreePlan = user?.currentPlan === "Free";
  const isPositive = (topStock?.unrealizedPLPercent ?? 0) >= 0;

  return (
    <div className="px-6 md:px-8 lg:px-10 pb-10">
      {/* SPACER */}
      <div className="h-28 w-full" />

      {/* SECTION 2: MAIN GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-8">

        {/* COLUMN 1: STATS */}
        <div className="lg:col-span-4 flex flex-col gap-6 h-full">

          {/* Total Balance card */}
          <div className="bg-[#6366F1] rounded-[24px] p-6 text-white shadow-md relative overflow-hidden transition-all duration-300">
            <div className="relative z-10">
              <p className="text-indigo-100 text-xs font-semibold uppercase tracking-wider mb-2">
                Total Balance
              </p>
              <div className="flex items-end justify-between">
                {isFreePlan ? (
                  <div className="flex flex-col gap-1 mt-1">
                    <h3 className="text-2xl font-bold tracking-tight text-white/90 flex items-center gap-2">
                      <Lock size={20} className="text-indigo-200" /> Locked
                    </h3>
                    <span className="text-[10px] text-indigo-200 font-medium">
                      Upgrade to paper trade
                    </span>
                  </div>
                ) : loadingStats ? (
                  <div className="space-y-2 mt-1">
                    <div className="h-8 w-36 bg-white/20 animate-pulse rounded-lg" />
                    <div className="h-4 w-16 bg-white/10 animate-pulse rounded-md" />
                  </div>
                ) : (
                  <>
                    <h3 className="text-3xl font-bold tracking-tight">
                      {totalBalance !== null
                        ? formatRupee(totalBalance, 0)
                        : "₹—"}
                    </h3>
                    {balanceChange !== null && (
                      <span
                        className={`bg-white/20 backdrop-blur-md px-2 py-1 rounded-lg text-xs font-bold text-white flex items-center gap-1`}
                      >
                        {balanceChange >= 0 ? formatPercent(balanceChange) : formatPercent(balanceChange)}
                        {balanceChange >= 0 ? (
                          <TrendingUp size={12} />
                        ) : (
                          <TrendingDown size={12} />
                        )}
                      </span>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Invested Value card */}
          <div className="bg-[#1E293B] dark:bg-slate-800 rounded-[24px] p-6 text-white shadow-xl shadow-slate-900/10 flex items-center justify-between cursor-pointer hover:scale-[1.02] transition-transform duration-300">
            <div>
              <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-2">
                Invested Value
              </p>
              {loadingStats ? (
                <div className="h-8 w-32 bg-white/10 animate-pulse rounded-lg" />
              ) : (
                <h3 className="text-2xl font-bold tracking-tight">
                  {investedValue !== null ? formatRupee(investedValue, 0) : "₹—"}
                </h3>
              )}
            </div>

            {/* Info button — hover triggers fixed tooltip */}
            <div
              className="w-10 h-10 bg-[#6366F1] rounded-full flex items-center justify-center shadow-lg shadow-indigo-500/50 transition-transform duration-300 hover:rotate-45 cursor-pointer flex-shrink-0"
              onMouseEnter={(e) => {
                if (holdingsBreakdown.length === 0) return;
                const rect = e.currentTarget.getBoundingClientRect();
                setTooltipPos({ top: rect.bottom + 12, right: window.innerWidth - rect.right });
                setTooltipOpen(true);
              }}
              onMouseLeave={() => setTooltipOpen(false)}
            >
              <ChevronRight size={20} />
            </div>
          </div>

          {/* Fixed-position tooltip — escapes all overflow & stacking contexts */}
          {tooltipOpen && holdingsBreakdown.length > 0 && (
            <div
              className="fixed z-[9999] w-56"
              style={{ top: tooltipPos.top, right: tooltipPos.right }}
              onMouseEnter={() => setTooltipOpen(true)}
              onMouseLeave={() => setTooltipOpen(false)}
            >
              <div className="flex justify-end pr-4 mb-[-6px] relative z-10">
                <div className="w-3 h-3 bg-white border-l border-t border-slate-200 rotate-45" />
              </div>
              <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xl shadow-slate-900/20">
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-3">Portfolio Breakdown</p>
                <DonutChart breakdown={holdingsBreakdown} />
                <div className="mt-3 space-y-2">
                  {holdingsBreakdown.map((item) => {
                    const grandTotal = holdingsBreakdown.reduce((s, i) => s + i.value, 0);
                    const pct = grandTotal > 0 ? ((item.value / grandTotal) * 100).toFixed(1) : '0.0';
                    return (
                      <div key={item.label} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: item.color }} />
                          <span className="text-[12px] text-slate-600 font-medium">{item.label}</span>
                        </div>
                        <span className="text-[12px] font-bold text-slate-800">{pct}%</span>
                      </div>
                    );
                  })}
                </div>
                <p className="mt-2.5 text-[9px] text-slate-400 leading-relaxed border-t border-slate-100 pt-2">
                  Nifty 50 stocks are counted across all index tiers.
                </p>
              </div>
            </div>
          )}

          {/* ── TOP PERFORMING STOCK CARD ───────────────────────────────── */}
          <div className="bg-white dark:bg-slate-900/50 backdrop-blur-md rounded-[24px] p-6 border border-slate-100 dark:border-white/10 shadow-sm flex-1 flex flex-col justify-between">

            {/* Header */}
            <div className="flex justify-between items-start mb-6">
              <div>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-2">
                  Top Performing Stock
                </p>

                {/* Loading skeleton */}
                {loadingPortfolio && (
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-700 animate-pulse" />
                    <div className="space-y-1.5">
                      <div className="h-4 w-24 bg-slate-200 dark:bg-slate-700 animate-pulse rounded" />
                      <div className="h-3 w-12 bg-slate-100 dark:bg-slate-800 animate-pulse rounded" />
                    </div>
                  </div>
                )}

                {/* No holdings / Free plan */}
                {!loadingPortfolio && (isFreePlan || portfolioEmpty) && (
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                      <BarChart2 size={18} className="text-slate-400" />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-500 dark:text-slate-400 text-sm">
                        {isFreePlan ? "Locked" : "No holdings yet"}
                      </h3>
                      <span className="text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded">
                        {isFreePlan ? "Upgrade plan" : "Start trading"}
                      </span>
                    </div>
                  </div>
                )}

                {/* Real top stock */}
                {!loadingPortfolio && topStock && !isFreePlan && (
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center font-black text-sm shadow-sm border ${isPositive
                        ? "bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 border-emerald-100 dark:border-emerald-800/50"
                        : "bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 border-red-100 dark:border-red-800/50"
                        }`}
                    >
                      {topStock.stockName?.[0]?.toUpperCase() ?? topStock.symbol[0]}
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-800 dark:text-white text-sm">
                        {topStock.stockName}
                      </h3>
                      <span className="text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 px-1.5 py-0.5 rounded">
                        {topStock.symbol}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Change badge */}
              <div className="text-right">
                {loadingPortfolio ? (
                  <div className="h-5 w-16 bg-slate-200 dark:bg-slate-700 animate-pulse rounded" />
                ) : topStock && !isFreePlan ? (
                  <p
                    className={`text-sm font-bold flex items-center justify-end gap-1 ${isPositive
                      ? "text-green-600 dark:text-green-400"
                      : "text-red-500 dark:text-red-400"
                      }`}
                  >
                    {isPositive ? (
                      <ArrowUpRight size={14} />
                    ) : (
                      <ArrowDownRight size={14} />
                    )}
                    {formatPercent(topStock.unrealizedPLPercent)}
                  </p>
                ) : null}
              </div>
            </div>

            {/* Stats grid */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-slate-50 dark:bg-slate-800 p-3 rounded-xl">
                <p className="text-[10px] text-slate-400 mb-1">Invested Value</p>
                {loadingPortfolio ? (
                  <div className="h-5 w-20 bg-slate-200 dark:bg-slate-700 animate-pulse rounded" />
                ) : (
                  <p className="font-bold text-slate-800 dark:text-white">
                    {topStock && !isFreePlan
                      ? formatRupee(topStock.totalInvested)
                      : "—"}
                  </p>
                )}
              </div>
              <div className="bg-slate-50 dark:bg-slate-800 p-3 rounded-xl">
                <p className="text-[10px] text-slate-400 mb-1">Current Price</p>
                {loadingPortfolio ? (
                  <div className="h-5 w-20 bg-slate-200 dark:bg-slate-700 animate-pulse rounded" />
                ) : (
                  <p className="font-bold text-slate-800 dark:text-white">
                    {topStock && !isFreePlan
                      ? formatRupee(topStock.currentPrice)
                      : "—"}
                  </p>
                )}
              </div>
            </div>

            {/* Sparkline */}
            <div className="h-16 w-full mb-4">
              {(() => {
                const chartData =
                  sparklineData.length > 0
                    ? sparklineData
                    : [
                      { v: 10 }, { v: 20 }, { v: 15 },
                      { v: 25 }, { v: 30 }, { v: 25 }, { v: 35 },
                    ];
                const vals = chartData.map((d) => d.v);
                const minV = Math.min(...vals);
                const maxV = Math.max(...vals);
                // Tight domain: give only 5% padding so the line fills the height
                const pad = (maxV - minV) * 0.05 || maxV * 0.002;
                const domain: [number, number] = [minV - pad, maxV + pad];
                const color = isPositive ? "#22C55E" : "#EF4444";
                return (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                      data={chartData}
                      margin={{ top: 2, right: 0, left: 0, bottom: 2 }}
                    >
                      <defs>
                        <linearGradient id="miniColor" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={color} stopOpacity={0.35} />
                          <stop offset="95%" stopColor={color} stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <YAxis domain={domain} hide />
                      <Area
                        type="monotone"
                        dataKey="v"
                        stroke={color}
                        strokeWidth={2}
                        fill="url(#miniColor)"
                        dot={false}
                        isAnimationActive={true}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                );
              })()}
            </div>

            {/* CTA Button */}
            <button
              onClick={() => router.push("/user/portfolio")}
              disabled={isFreePlan || portfolioEmpty}
              className="w-full py-3 bg-[#6366F1] text-white rounded-xl font-bold text-sm hover:bg-[#4F46E5] transition-all shadow-lg shadow-indigo-500/20 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-[#6366F1]"
            >
              {isFreePlan
                ? "Upgrade to Trade"
                : portfolioEmpty
                  ? "Make Your First Trade"
                  : "View Stock Details"}
            </button>
          </div>
        </div>

        {/* COLUMN 2: PORTFOLIO COMPARISON CHART */}
        <div className="lg:col-span-8 flex flex-col h-full w-full">
          <PortfolioComparisonChart />
        </div>
      </div>

            {/* BOTTOM ROW: WATCHLIST & MARKET MOVERS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="h-full w-full">
           <MarketMoversCard title="Top 10 Gainers" stocks={bestStocks} loading={loadingMarket} type="best" onStockClick={handleStockClick} />
        </div>
        <div className="h-full w-full">
           <MarketMoversCard title="Top 10 Losers" stocks={worstStocks} loading={loadingMarket} type="worst" onStockClick={handleStockClick} />
        </div>
        <div className="h-full w-full">
          <Watchlist />
        </div>
      </div>

      <StockDetailModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedStock(null);
        }}
        stock={selectedStock}
      />
    </div>
  );
}


// ==========================================
// HELPER COMPONENTS
// ==========================================

function MarketMoversCard({ title, stocks, loading, type, onStockClick }: any) {
  const isPositive = type === "best";
  return (
    <div className="bg-white dark:bg-slate-900/50 backdrop-blur-md rounded-[24px] p-6 border border-slate-100 dark:border-white/10 shadow-sm flex flex-col h-full min-h-[450px]">
      <div className="flex items-center justify-between mb-6">
        <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-2">
          {isPositive ? <TrendingUp className="text-emerald-500" size={20} /> : <TrendingDown className="text-red-500" size={20} />}
          {title}
        </h3>
        <span className="text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-500 px-2 py-1 rounded font-bold">NIFTY 500</span>
      </div>
      
      {loading ? (
        <div className="space-y-3 mt-2">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-12 bg-slate-100 dark:bg-slate-800/50 animate-pulse rounded-xl" />
          ))}
        </div>
      ) : stocks.length === 0 ? (
        <div className="flex-1 flex items-center justify-center text-sm text-slate-400">No data available</div>
      ) : (
        <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 space-y-3 max-h-[380px]">
          {stocks.map((stock: any, i: number) => (
            <div key={stock.symbol || i} onClick={() => onStockClick && onStockClick(stock)} className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors border border-transparent hover:border-slate-100 dark:hover:border-white/5 cursor-pointer">
               <div className="flex items-center gap-3">
                 <div className={`w-10 h-10 rounded-full flex items-center justify-center font-black text-[12px] shadow-sm border ${isPositive ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 border-emerald-100 dark:border-emerald-800/50' : 'bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 border-red-100 dark:border-red-800/50'}`}>
                   {stock.symbol[0]}
                 </div>
                 <div>
                   <p className="font-bold text-sm text-slate-800 dark:text-white leading-tight">{stock.symbol}</p>
                   <p className="text-[10px] text-slate-400 truncate w-24 md:w-32">{stock.name}</p>
                 </div>
               </div>
               <div className="text-right">
                 <p className="font-bold text-sm text-slate-800 dark:text-white">₹{(stock.price || 0).toLocaleString('en-IN', {minimumFractionDigits: 2})}</p>
                 <p className={`text-xs font-bold flex items-center justify-end gap-0.5 ${isPositive ? 'text-emerald-500' : 'text-red-500'}`}>
                   {isPositive ? '+' : ''}{(stock.changePercent || 0).toFixed(2)}%
                 </p>
               </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Donut chart (pure SVG, no extra deps) ────────────────────────────────────
function DonutChart({ breakdown }: { breakdown: { label: string; value: number; color: string }[] }) {
  const size = 96;
  const cx = size / 2;
  const cy = size / 2;
  const r = 32;
  const stroke = 14;
  const circumference = 2 * Math.PI * r;
  const total = breakdown.reduce((s, i) => s + i.value, 0);

  let offset = 0;
  // Start from the top (rotate -90deg via transform)
  const segments = breakdown.map((item) => {
    const pct = total > 0 ? item.value / total : 0;
    const dash = pct * circumference;
    const gap = circumference - dash;
    const seg = { ...item, dash, gap, offset };
    offset += dash;
    return seg;
  });

  return (
    <div className="flex justify-center">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {/* Track */}
        <circle
          cx={cx} cy={cy} r={r}
          fill="none"
          stroke="#f1f5f9"
          strokeWidth={stroke}
        />
        {/* Segments */}
        {segments.map((seg) => (
          <circle
            key={seg.label}
            cx={cx} cy={cy} r={r}
            fill="none"
            stroke={seg.color}
            strokeWidth={stroke}
            strokeDasharray={`${seg.dash} ${seg.gap}`}
            strokeDashoffset={circumference / 4 - seg.offset}
            strokeLinecap="butt"
            style={{ transition: 'stroke-dasharray 0.5s ease' }}
          />
        ))}
        {/* Centre label */}
        <text
          x={cx} y={cy - 5}
          textAnchor="middle"
          fill="#1e293b"
          fontSize="11"
          fontWeight="bold"
        >
          {breakdown.length}
        </text>
        <text
          x={cx} y={cy + 8}
          textAnchor="middle"
          fill="#94a3b8"
          fontSize="7"
          fontWeight="600"
        >
          CATEGORIES
        </text>
      </svg>
    </div>
  );
}
