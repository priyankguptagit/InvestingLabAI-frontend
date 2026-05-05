"use client";

import { useState, useEffect, useMemo } from "react";
import { newsApi } from "@/lib/api";
import { NewsArticle } from "@/lib/types/news.types";
import NewsCard from "./_components/NewsCard";
import { Search, RefreshCw, Filter, TrendingUp, Zap, Globe, Newspaper, ArrowUpRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Badge } from "@/shared-components/ui/badge";

export default function NewsClient() {
    const [news, setNews] = useState<NewsArticle[]>([]);
    const [filteredNews, setFilteredNews] = useState<NewsArticle[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [activeTab, setActiveTab] = useState('ALL');
    const [isRefreshing, setIsRefreshing] = useState(false);

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

    const tabs = [
        { id: 'ALL', label: 'All Updates', icon: Newspaper },
        { id: 'MARKET', label: 'Market Pulse', icon: TrendingUp },
        { id: 'STOCKS', label: 'Stocks', icon: Zap },
        { id: 'ECONOMY', label: 'Economy', icon: Globe }
    ];

    // Static Dark Theme Classes
    const theme = {
        bg: "bg-[#0a0a0a]",
        text: "text-white",
        subText: "text-slate-400",
        cardBg: "bg-slate-900/50",
        border: "border-white/10",
        inputBg: "bg-slate-900 border-slate-800 focus:border-indigo-500",
        tabActive: "bg-indigo-600 text-white shadow-indigo-500/20",
        tabInactive: "bg-slate-900/50 text-slate-400 hover:bg-slate-800 hover:text-white",
        sidebarBg: "bg-slate-900/40 border-white/5",
    };

    return (
        <div className={`min-h-screen transition-colors duration-500 ${theme.bg} p-6 md:p-8 pt-32 lg:pt-40`}>
            <div className="max-w-7xl mx-auto">

                {/* HEADER */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
                    <div className="space-y-3">
                        <Badge variant="outline" className="text-xs font-bold uppercase tracking-[0.4em] text-indigo-400 border-indigo-500/30 bg-indigo-500/5 px-4 py-1">
                            Market Intelligence
                        </Badge>
                        <h1 className="text-3xl md:text-5xl font-black tracking-tight text-white">Market <span className="text-indigo-500">Insights</span></h1>
                        <div className="h-1 w-20 bg-indigo-600 rounded-full shadow-[0_0_20px_rgba(79,70,229,0.5)]" />
                        <p className="text-slate-400 text-sm font-medium">Real-time financial intelligence curated for you.</p>
                    </div>

                    <div className="flex items-center gap-3">
                        <button
                            onClick={handleRefresh}
                            className={`p-2.5 rounded-xl border transition-all bg-slate-900 border-slate-800 text-slate-400 hover:text-white ${isRefreshing ? 'animate-spin text-indigo-500' : ''}`}
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
                                    <div key={i} className={`h-80 rounded-[24px] animate-pulse bg-slate-900 border border-slate-800`} />
                                ))
                            ) : filteredNews.length === 0 ? (
                                // EMPTY STATE
                                <div className={`text-center py-20 rounded-[24px] border border-dashed bg-slate-900/50 border-slate-800`}>
                                    <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 bg-slate-800`}>
                                        <Filter className="w-8 h-8 text-slate-400" />
                                    </div>
                                    <h3 className={`text-lg font-bold mb-1 ${theme.text}`}>No stories found</h3>
                                    <p className={theme.subText}>Try adjusting your filters</p>
                                </div>
                            ) : (
                                // NEWS FEED
                                <AnimatePresence mode='popLayout'>
                                    {filteredNews.map((article, index) => (
                                        <NewsCard
                                            key={article._id}
                                            article={article}
                                            index={index}
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
                                    <div key={symbol} className={`group flex items-center justify-between p-3 rounded-xl border transition-all cursor-pointer bg-slate-950/50 border-slate-800 hover:border-indigo-500/30 hover:bg-slate-900`}>
                                        <div className="flex items-center gap-3">
                                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold bg-slate-900 text-slate-300`}>
                                                {i + 1}
                                            </div>
                                            <div>
                                                <div className={`text-sm font-bold group-hover:text-indigo-500 transition-colors ${theme.text}`}>{symbol}</div>
                                                <div className="text-[10px] text-slate-500">{count} mentions</div>
                                            </div>
                                        </div>
                                        <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-indigo-500 opacity-0 group-hover:opacity-100 transition-all" />
                                    </div>
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
        </div>
    );
}