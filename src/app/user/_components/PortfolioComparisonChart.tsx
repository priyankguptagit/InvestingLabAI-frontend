"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import { TrendingUp, TrendingDown, AlertCircle, RefreshCw } from "lucide-react";
import { tradingApi } from "@/lib/api/trading.api";

// ─── Types ───────────────────────────────────────────────────────────────────
type SeriesKey = "portfolio" | "nifty50" | "nifty100" | "nifty500";
type TimeRange = "1w" | "1m" | "3m" | "1y";

// ─── Series config — single source of truth for colors/styles ────────────────
const SERIES = [
  { key: "portfolio" as SeriesKey, label: "My Portfolio", color: "#818CF8", strokeDasharray: undefined as string | undefined, strokeWidth: 3 },
  { key: "nifty50"   as SeriesKey, label: "Nifty 50",    color: "#34D399", strokeDasharray: undefined as string | undefined, strokeWidth: 2 },
  { key: "nifty100"  as SeriesKey, label: "Nifty 100",   color: "#F59E0B", strokeDasharray: "6 3",                           strokeWidth: 2 },
  { key: "nifty500"  as SeriesKey, label: "Nifty 500",   color: "#F472B6", strokeDasharray: "3 3",                           strokeWidth: 2 },
] as const;

const TIME_RANGE_LABELS: Record<TimeRange, string> = {
  "1w": "1W", "1m": "1M", "3m": "3M", "1y": "1Y",
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
function LineIndicator({ series, active }: { series: (typeof SERIES)[number]; active: boolean }) {
  return (
    <svg width="24" height="12" viewBox="0 0 24 12" className="shrink-0">
      <line
        x1="0" y1="6" x2="24" y2="6"
        stroke={active ? series.color : "#94A3B8"}
        strokeWidth={series.strokeWidth}
        strokeDasharray={series.strokeDasharray}
      />
      <circle cx="12" cy="6" r="3" fill={active ? series.color : "#94A3B8"} />
    </svg>
  );
}

function PctBadge({ value, className = "" }: { value: number; className?: string }) {
  const isPos = value >= 0;
  return (
    <span
      className={`text-[11px] font-bold px-1.5 py-0.5 rounded-md ${
        isPos
          ? "bg-emerald-100 dark:bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
          : "bg-red-100 dark:bg-red-500/15 text-red-600 dark:text-red-400"
      } ${className}`}
    >
      {isPos ? "+" : ""}{value.toFixed(2)}%
    </span>
  );
}

// ─── Custom Tooltip ──────────────────────────────────────────────────────────
function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  const valid = payload.filter((p: any) => p.value !== null && p.value !== undefined);
  if (!valid.length) return null;

  return (
    <div className="bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-700 rounded-xl p-3 shadow-2xl min-w-[200px]">
      <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest mb-3">{label}</p>
      <div className="flex flex-col gap-2.5">
        {valid.map((entry: any) => {
          const s = SERIES.find(x => x.key === entry.dataKey);
          if (!s) return null;
          const val = entry.value as number;
          const isPos = val >= 0;
          return (
            <div key={s.key} className="flex items-center justify-between gap-6">
              <div className="flex items-center gap-2">
                <svg width="20" height="10" viewBox="0 0 20 10">
                  <line x1="0" y1="5" x2="20" y2="5"
                    stroke={s.color} strokeWidth={s.strokeWidth} strokeDasharray={s.strokeDasharray} />
                </svg>
                <span className="text-[12px] font-medium text-slate-600 dark:text-slate-300">{s.label}</span>
              </div>
              <span className={`text-[13px] font-bold tabular-nums ${isPos ? "text-emerald-500 dark:text-emerald-400" : "text-red-500 dark:text-red-400"}`}>
                {isPos ? "+" : ""}{val.toFixed(2)}%
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Toggle Button ────────────────────────────────────────────────────────────
function SeriesToggle({
  series, active, periodPct, onToggle, hasData,
}: {
  series: (typeof SERIES)[number];
  active: boolean;
  periodPct: number | null;
  onToggle: () => void;
  hasData: boolean;
}) {
  return (
    <button
      onClick={onToggle}
      disabled={!hasData}
      title={!hasData ? "No data available" : `Toggle ${series.label}`}
      className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition-all duration-200 ${
        !hasData
          ? "opacity-25 cursor-not-allowed border-transparent"
          : active
          ? "border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 shadow-sm"
          : "border-transparent opacity-50 hover:opacity-80 hover:bg-slate-50 dark:hover:bg-slate-800/40"
      }`}
    >
      <LineIndicator series={series} active={active && hasData} />
      <span className={`text-[12px] font-semibold whitespace-nowrap ${
        active && hasData ? "text-slate-800 dark:text-white" : "text-slate-400 dark:text-slate-500"
      }`}>
        {series.label}
      </span>
      {active && hasData && periodPct !== null && (
        <PctBadge value={periodPct} className="ml-1" />
      )}
    </button>
  );
}

// ─── Empty / No-Data State ───────────────────────────────────────────────────
function EmptyState({ message }: { message: string }) {
  return (
    <div className="h-full flex flex-col items-center justify-center gap-3">
      <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
        <AlertCircle size={18} className="text-slate-400" />
      </div>
      <p className="text-slate-500 dark:text-slate-400 text-sm text-center max-w-xs leading-relaxed">{message}</p>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function PortfolioComparisonChart() {
  const [activeRange, setActiveRange] = useState<TimeRange>("1w");
  const [activeLines, setActiveLines] = useState<Set<SeriesKey>>(
    new Set(["portfolio", "nifty50", "nifty100", "nifty500"])
  );
  const [loading, setLoading] = useState(true);
  const [chartData, setChartData] = useState<any[]>([]);
  const [hasPortfolioData, setHasPortfolioData] = useState(false);
  const [portfolioStartDate, setPortfolioStartDate] = useState<string | null>(null);
  // Period cumulative % — same scale as the chart lines (not daily change)
  const [periodPcts, setPeriodPcts] = useState<Record<SeriesKey, number | null>>({
    portfolio: null, nifty50: null, nifty100: null, nifty500: null,
  });

  // ── Fetch ─────────────────────────────────────────────────────────────────
  const fetchData = useCallback(async (range: TimeRange) => {
    setLoading(true);
    try {
      const res = await tradingApi.getPortfolioChart(range);
      if (res?.success) {
        const { chartPoints, hasPortfolioData: hpd, portfolioStartDate: psd, periodPcts: pp } = res.data;
        setChartData(chartPoints ?? []);
        setHasPortfolioData(hpd ?? false);
        setPortfolioStartDate(psd ?? null);
        setPeriodPcts({
          portfolio: pp?.portfolio ?? null,
          nifty50:   pp?.nifty50   ?? null,
          nifty100:  pp?.nifty100  ?? null,
          nifty500:  pp?.nifty500  ?? null,
        });
      } else {
        setChartData([]);
        setHasPortfolioData(false);
        setPeriodPcts({ portfolio: null, nifty50: null, nifty100: null, nifty500: null });
      }
    } catch (err) {
      console.error("Portfolio chart error:", err);
      setChartData([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(activeRange); }, [fetchData, activeRange]);

  // ── Toggles ───────────────────────────────────────────────────────────────
  const toggleLine = (key: SeriesKey) => {
    setActiveLines(prev => {
      const next = new Set(prev);
      if (next.has(key)) {
        if (next.size > 1) next.delete(key); // always keep at least one
      } else {
        next.add(key);
      }
      return next;
    });
  };

  // ── Derived: which series have at least one real data point ───────────────
  const seriesHasData = useMemo(() => {
    const has: Record<SeriesKey, boolean> = { portfolio: false, nifty50: false, nifty100: false, nifty500: false };
    chartData.forEach(pt => {
      (Object.keys(has) as SeriesKey[]).forEach(k => {
        if (pt[k] !== null && pt[k] !== undefined) has[k] = true;
      });
    });
    return has;
  }, [chartData]);

  // ── Derived: how many real points per series (for dot-display decision) ───
  const dataCounts = useMemo(() => {
    const counts: Record<SeriesKey, number> = { portfolio: 0, nifty50: 0, nifty100: 0, nifty500: 0 };
    chartData.forEach(pt => {
      (Object.keys(counts) as SeriesKey[]).forEach(k => {
        if (pt[k] !== null && pt[k] !== undefined) counts[k]++;
      });
    });
    return counts;
  }, [chartData]);

  const hasAnyData = SERIES.some(s => activeLines.has(s.key) && seriesHasData[s.key]);

  // ── Y-axis domain (tight padding around actual values) ───────────────────
  const yDomain = useMemo((): [number, number] => {
    const vals: number[] = [];
    chartData.forEach(d => {
      SERIES.forEach(s => {
        if (activeLines.has(s.key) && d[s.key] !== null && d[s.key] !== undefined) {
          vals.push(d[s.key] as number);
        }
      });
    });
    if (!vals.length) return [-1, 1];
    const min = Math.min(...vals);
    const max = Math.max(...vals);
    const span = Math.abs(max - min) || 1;
    const pad = Math.max(span * 0.15, 0.2);
    return [parseFloat((min - pad).toFixed(2)), parseFloat((max + pad).toFixed(2))];
  }, [chartData, activeLines]);

  // ── X-axis tick interval ─────────────────────────────────────────────────
  const xAxisInterval = useMemo(() => {
    // Count only non-empty rows for better spacing
    const nonEmpty = chartData.filter(d =>
      SERIES.some(s => d[s.key] !== null && d[s.key] !== undefined)
    ).length;
    if (nonEmpty <= 7) return 0;
    if (nonEmpty <= 20) return Math.floor(nonEmpty / 5);
    return Math.floor(nonEmpty / 7);
  }, [chartData]);

  // ── Empty-state message logic ─────────────────────────────────────────────
  const emptyMessage = useMemo(() => {
    if (!hasPortfolioData && !seriesHasData.nifty50) {
      return "No chart data yet. Make your first trade and check back after market hours.";
    }
    if (!hasPortfolioData) {
      return "Your portfolio line will appear once you have active stock holdings with market price data.";
    }
    const activeWithNoData = SERIES.filter(s => activeLines.has(s.key) && !seriesHasData[s.key]);
    if (activeWithNoData.length === SERIES.length) {
      return "No data available for this time range. Try a shorter range.";
    }
    return "Select at least one series with data.";
  }, [hasPortfolioData, seriesHasData, activeLines]);

  // Format Y-axis label
  const formatY = (v: number) => `${v >= 0 ? "+" : ""}${v.toFixed(1)}%`;

  return (
    <div className="bg-white dark:bg-slate-900/50 rounded-[20px] p-6 border border-slate-100 dark:border-white/10 shadow-sm h-full flex flex-col">

      {/* ── Header ── */}
      <div className="flex flex-wrap items-start justify-between gap-4 mb-5">
        <div>
          <h3 className="font-bold text-slate-900 dark:text-white text-base">Portfolio Analytics</h3>
          <p className="text-slate-500 dark:text-slate-400 text-xs mt-0.5">
            Cumulative % return vs. market indices
            {portfolioStartDate && (
              <span className="ml-1 text-indigo-400">
                · portfolio since{" "}
                {new Date(portfolioStartDate).toLocaleDateString("en-IN", {
                  day: "numeric", month: "short", year: "numeric",
                })}
              </span>
            )}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => fetchData(activeRange)}
            disabled={loading}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors disabled:opacity-50"
            title="Refresh"
          >
            <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
          </button>

          <div className="flex bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg">
            {(Object.keys(TIME_RANGE_LABELS) as TimeRange[]).map(range => (
              <button
                key={range}
                onClick={() => setActiveRange(range)}
                className={`text-[11px] font-bold px-3 py-1.5 rounded-md transition-all ${
                  activeRange === range
                    ? "bg-white dark:bg-slate-700 text-indigo-500 shadow-sm"
                    : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                }`}
              >
                {TIME_RANGE_LABELS[range]}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Series Toggles ── */}
      <div className="flex flex-wrap gap-1.5 mb-5 pb-5 border-b border-slate-100 dark:border-slate-800">
        {SERIES.map(s => (
          <SeriesToggle
            key={s.key}
            series={s}
            active={activeLines.has(s.key)}
            periodPct={periodPcts[s.key]}
            onToggle={() => toggleLine(s.key)}
            hasData={seriesHasData[s.key]}
          />
        ))}
      </div>

      {/* ── Chart ── */}
      <div className="flex-1 min-h-[260px]">
        {loading ? (
          <div className="h-full flex flex-col items-center justify-center gap-3">
            <div className="w-8 h-8 rounded-full border-[3px] border-indigo-500/20 border-t-indigo-500 animate-spin" />
            <p className="text-slate-400 text-xs">Loading data…</p>
          </div>
        ) : !hasAnyData ? (
          <EmptyState message={emptyMessage} />
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 8, right: 12, left: 0, bottom: 4 }}>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="rgba(148,163,184,0.12)"
                vertical={false}
              />

              {/* 0% baseline */}
              <ReferenceLine
                y={0}
                stroke="rgba(148,163,184,0.35)"
                strokeWidth={1}
                label={{ value: "0%", position: "insideLeft", fontSize: 9, fill: "#94A3B8", dx: 4 }}
              />

              <XAxis
                dataKey="label"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 10, fill: "#94A3B8" }}
                dy={8}
                interval={xAxisInterval}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 10, fill: "#94A3B8" }}
                tickFormatter={formatY}
                domain={yDomain}
                width={52}
              />

              <Tooltip
                content={<CustomTooltip />}
                cursor={{ stroke: "rgba(148,163,184,0.3)", strokeWidth: 1, strokeDasharray: "4 2" }}
              />

              {SERIES.map(s => {
                if (!activeLines.has(s.key) || !seriesHasData[s.key]) return null;
                const isPortfolio = s.key === "portfolio";
                // Show dots if sparse (≤ 5 points) or always for portfolio to mark real data days
                const useDots = isPortfolio || dataCounts[s.key] <= 5;
                return (
                  <Line
                    key={s.key}
                    type="monotone"
                    dataKey={s.key}
                    stroke={s.color}
                    strokeWidth={s.strokeWidth}
                    strokeDasharray={s.strokeDasharray}
                    // Portfolio gaps = no real data; index lines bridge weekends cleanly
                    connectNulls={!isPortfolio}
                    dot={useDots ? { r: 3, fill: s.color, stroke: "white", strokeWidth: 1.5 } : false}
                    activeDot={{ r: 5, fill: s.color, stroke: "white", strokeWidth: 2 }}
                    isAnimationActive={true}
                    animationDuration={600}
                    animationEasing="ease-out"
                  />
                );
              })}
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* ── Footer Stats ── */}
      {!loading && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-5 pt-5 border-t border-slate-100 dark:border-slate-800">
          {SERIES.map(s => {
            const pct = periodPcts[s.key];
            const isPos = (pct ?? 0) >= 0;
            const isActive = activeLines.has(s.key) && seriesHasData[s.key];
            return (
              <div
                key={s.key}
                className={`text-center transition-opacity duration-200 ${isActive ? "opacity-100" : "opacity-35"}`}
              >
                <div className="flex items-center justify-center gap-1.5 mb-1">
                  <svg width="16" height="8" viewBox="0 0 16 8">
                    <line x1="0" y1="4" x2="16" y2="4"
                      stroke={s.color} strokeWidth={s.strokeWidth} strokeDasharray={s.strokeDasharray} />
                  </svg>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-wider font-semibold">
                    {s.label}
                  </p>
                </div>
                <div className="flex items-center justify-center gap-1">
                  {pct !== null ? (
                    <>
                      {isPos
                        ? <TrendingUp size={12} className="text-emerald-500" />
                        : <TrendingDown size={12} className="text-red-500" />
                      }
                      <span className={`text-sm font-bold tabular-nums ${
                        isPos ? "text-emerald-500 dark:text-emerald-400" : "text-red-500 dark:text-red-400"
                      }`}>
                        {isPos ? "+" : ""}{pct.toFixed(2)}%
                      </span>
                    </>
                  ) : (
                    <span className="text-sm font-bold text-slate-400">—</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
