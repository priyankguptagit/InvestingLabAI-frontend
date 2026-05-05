"use client";

import { useState, useEffect, useMemo } from "react";
import { newsApi, stockApi } from "@/lib/api";
import { NewsArticle } from "@/lib/types/news.types";
import { Stock } from "@/lib/types/stock.types";
import NewsDashboardCard from "./_components/NewsDashboardCard";
import StockDetailModal from "@/app/user/_components/StockDetailModal";
import { Search, RefreshCw, Filter, TrendingUp, Zap, Globe, Newspaper, ArrowUpRight, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "next-themes";

export default function UserNewsPage() {
  const [news, setNews] = useState<NewsArticle[]>([]);
  const [filteredNews, setFilteredNews] = useState<NewsArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState('ALL');
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Stock modal state
  const [selectedStock, setSelectedStock] = useState<Stock | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loadingSymbol, setLoadingSymbol] = useState<string | null>(null);

  // 🌙 Global Dark Mode
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Prevent hydration mismatch
  useEffect(() => setMounted(true), []);

  const isDark = mounted ? resolvedTheme === 'dark' : true; // Default to dark during SSR to match initial state preference if any

  // Fetch News
  const fetchNews = async () => {
    try {
      const response = await newsApi.getLatestNews({ limit: 50 });
      setNews(response.data);
      setFilteredNews(response.data);
    } catch (error) {
      console.error("Failed to fetch news", error);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchNews();
  }, []);

  // Filter Logic
  useEffect(() => {
    let result = news;
    if (activeTab !== 'ALL') {
      result = result.filter(n => n.category === activeTab);
    }
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(n =>
        n.title.toLowerCase().includes(q) ||
        n.description.toLowerCase().includes(q)
      );
    }
    setFilteredNews(result);
  }, [activeTab, searchQuery, news]);

  // Calculate Trending Symbols from News Data
  const trendingSymbols = useMemo(() => {
    const counts: Record<string, number> = {};
    news.forEach(article => {
      article.relatedSymbols.forEach(sym => {
        counts[sym] = (counts[sym] || 0) + 1;
      });
    });
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1]) // Sort by frequency
      .slice(0, 5); // Top 5
  }, [news]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchNews();
  };

  const handleTrendingClick = async (symbol: string) => {
    setLoadingSymbol(symbol);
    try {
      const res = await stockApi.getStockBySymbol(symbol);
      if (res.success && res.data) {
        setSelectedStock(res.data);
        setIsModalOpen(true);
      }
    } catch (err) {
      console.error("Failed to fetch stock:", err);
    } finally {
      setLoadingSymbol(null);
    }
  };

  const tabs = [
    { id: 'ALL', label: 'All Updates', icon: Newspaper },
    { id: 'MARKET', label: 'Market Pulse', icon: TrendingUp },
    { id: 'STOCKS', label: 'Stocks', icon: Zap },
    { id: 'IPO', label: 'IPO Watch', icon: Globe }
  ];

  // Dynamic Theme Classes
  const theme = {
    bg: isDark ? "bg-[#0a0a0a]" : "bg-slate-50",
    text: isDark ? "text-white" : "text-slate-900",
    subText: isDark ? "text-slate-400" : "text-slate-500",
    cardBg: isDark ? "bg-slate-900/50" : "bg-white",
    border: isDark ? "border-white/10" : "border-slate-200",
    inputBg: isDark ? "bg-slate-900 border-slate-800 focus:border-indigo-500" : "bg-white border-slate-200 focus:border-indigo-500",
    tabActive: isDark ? "bg-indigo-600 text-white shadow-indigo-500/20" : "bg-indigo-600 text-white shadow-indigo-200",
    tabInactive: isDark ? "bg-slate-900/50 text-slate-400 hover:bg-slate-800 hover:text-white" : "bg-white text-slate-500 hover:bg-slate-50 hover:text-slate-900",
    sidebarBg: isDark ? "bg-slate-900/40 border-white/5" : "bg-white border-slate-200 shadow-sm",
  };

  if (!mounted) return null;

  return (
    <div className={`min-h-screen transition-colors duration-500 ${theme.bg} p-6 md:p-8 pt-32 lg:pt-36`}>
      <div className="max-w-7xl mx-auto">

        {/* HEADER */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
          <div>
            <h1 className={`text-3xl font-bold tracking-tight mb-2 ${theme.text}`}>Market Insights</h1>
            <p className={theme.subText}>Real-time financial intelligence curated for you.</p>
          </div>

          <div className="flex items-center gap-3">
            {/* THEME TOGGLE */}


            <button
              onClick={handleRefresh}
              className={`p-2.5 rounded-xl border transition-all ${isDark ? 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'} ${isRefreshing ? 'animate-spin text-indigo-500' : ''}`}
            >
              <RefreshCw className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* --- 3-COLUMN LAYOUT --- */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

          {/* LEFT SIDEBAR (Sticky) */}
          <div className="hidden lg:block lg:col-span-3 sticky top-32 space-y-6">

            {/* Search Widget */}
            <div className={`rounded-2xl p-4 border backdrop-blur-md ${theme.sidebarBg}`}>
              <div className="relative group">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                <input
                  type="text"
                  placeholder="Search news..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className={`w-full pl-10 pr-4 py-2.5 rounded-xl text-sm outline-none transition-all border ${theme.inputBg} ${theme.text}`}
                />
              </div>
            </div>

            {/* Categories Menu */}
            <div className={`rounded-2xl p-2 border backdrop-blur-md overflow-hidden ${theme.sidebarBg}`}>
              <div className={`px-4 py-2 text-xs font-bold uppercase tracking-wider mb-1 ${theme.subText}`}>Feeds</div>
              <div className="space-y-1">
                {tabs.map(tab => {
                  const Icon = tab.icon;
                  const isActive = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`
                            w-full px-4 py-3 rounded-xl text-sm font-bold transition-all flex items-center gap-3
                            ${isActive ? theme.tabActive : theme.tabInactive}
                            `}
                    >
                      <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'opacity-70'}`} />
                      {tab.label}
                    </button>
                  )
                })}
              </div>
            </div>
          </div>

          {/* CENTER FEED (Main Content) */}
          <div className="lg:col-span-6 space-y-8">

            {/* Mobile Tabs (Horizontal Scroll) */}
            <div className="lg:hidden flex items-center gap-3 mb-4 overflow-x-auto pb-2 scrollbar-hide">
              {tabs.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap border ${activeTab === tab.id ? theme.tabActive : theme.tabInactive}`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Feed Cards */}
            <div className="space-y-8 min-h-[500px]">
              {loading ? (
                // SKELETON LOADER
                [...Array(3)].map((_, i) => (
                  <div key={i} className={`h-80 rounded-[24px] animate-pulse ${isDark ? 'bg-slate-900 border border-slate-800' : 'bg-white border border-slate-200'}`} />
                ))
              ) : filteredNews.length === 0 ? (
                // EMPTY STATE
                <div className={`text-center py-20 rounded-[24px] border border-dashed ${isDark ? 'bg-slate-900/50 border-slate-800' : 'bg-white border-slate-200'}`}>
                  <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${isDark ? 'bg-slate-800' : 'bg-slate-50'}`}>
                    <Filter className="w-8 h-8 text-slate-400" />
                  </div>
                  <h3 className={`text-lg font-bold mb-1 ${theme.text}`}>No stories found</h3>
                  <p className={theme.subText}>Try adjusting your filters</p>
                </div>
              ) : (
                // NEWS FEED
                <AnimatePresence mode='popLayout'>
                  {filteredNews.map((article, index) => (
                    <NewsDashboardCard
                      key={article._id}
                      article={article}
                      index={index}
                      isDark={isDark}
                    />
                  ))}
                </AnimatePresence>
              )}
            </div>
          </div>

          {/* RIGHT SIDEBAR (Sticky) */}
          <div className="hidden lg:block lg:col-span-3 sticky top-32 space-y-6">

            {/* Trending Assets Widget */}
            <div className={`rounded-2xl p-5 border backdrop-blur-md ${theme.sidebarBg}`}>
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp className="w-4 h-4 text-indigo-500" />
                <h3 className={`text-sm font-bold uppercase tracking-wider ${theme.text}`}>Trending Assets</h3>
              </div>

              <div className="space-y-3">
                {trendingSymbols.length > 0 ? trendingSymbols.map(([symbol, count], i) => (
                  <button
                    key={symbol}
                    onClick={() => handleTrendingClick(symbol)}
                    disabled={!!loadingSymbol}
                    className={`w-full group flex items-center justify-between p-3 rounded-xl border transition-all cursor-pointer text-left ${isDark ? 'bg-slate-950/50 border-slate-800 hover:border-indigo-500/30 hover:bg-slate-900' : 'bg-slate-50 border-slate-100 hover:border-indigo-200 hover:bg-white'} disabled:opacity-60`}>
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold ${isDark ? 'bg-slate-900 text-slate-300' : 'bg-white text-slate-600 shadow-sm'}`}>
                        {loadingSymbol === symbol ? <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-500" /> : i + 1}
                      </div>
                      <div>
                        <div className={`text-sm font-bold group-hover:text-indigo-500 transition-colors ${theme.text}`}>{symbol}</div>
                        <div className="text-[10px] text-slate-500">{count} mention{count !== 1 ? 's' : ''}</div>
                      </div>
                    </div>
                    {loadingSymbol === symbol
                      ? <Loader2 className="w-4 h-4 text-indigo-500 animate-spin" />
                      : <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-indigo-500 opacity-0 group-hover:opacity-100 transition-all" />}
                  </button>
                )) : (
                  <div className="text-xs text-slate-500 italic py-2">No trending data available.</div>
                )}
              </div>
            </div>

            {/* Status / Promo Widget */}
            <div className="bg-gradient-to-br from-indigo-600 to-violet-600 rounded-2xl p-6 text-center text-white shadow-lg shadow-indigo-500/20">
              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-3 backdrop-blur-sm">
                <Zap className="w-5 h-5 text-white" />
              </div>
              <h3 className="text-sm font-bold mb-1">Market Pulse</h3>
              <p className="text-xs text-indigo-100 mb-4 opacity-90">AI-driven sentiment analysis is running on live data.</p>
              <div className="flex items-center justify-center gap-2 text-[10px] font-medium bg-black/20 rounded-lg py-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse"></span>
                System Online
              </div>
            </div>

          </div>

        </div>

      </div>

      {/* Stock Detail Modal */}
      <StockDetailModal
        isOpen={isModalOpen}
        onClose={() => { setIsModalOpen(false); setSelectedStock(null); }}
        stock={selectedStock}
      />
    </div>
  );
}