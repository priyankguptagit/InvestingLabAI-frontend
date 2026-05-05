"use client";

import React, { useEffect, useState, useRef } from "react";
import { Plus, TrendingUp, TrendingDown, Trash2, X, Search } from "lucide-react";
import { watchlistApi, stockApi } from "@/lib/api";

const getCategoryColor = (category: string) => {
    switch (category) {
        case 'NIFTY50': return 'bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-400 border border-blue-200 dark:border-blue-800';
        case 'NIFTY100': return 'bg-fuchsia-100 text-fuchsia-600 dark:bg-fuchsia-900/40 dark:text-fuchsia-400 border border-fuchsia-200 dark:border-fuchsia-800';
        case 'NIFTY500': return 'bg-cyan-100 text-cyan-600 dark:bg-cyan-900/40 dark:text-cyan-400 border border-cyan-200 dark:border-cyan-800';
        case 'ETF': return 'bg-orange-100 text-orange-600 dark:bg-orange-900/40 dark:text-orange-400 border border-orange-200 dark:border-orange-800';
        default: return 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border border-slate-200 dark:border-slate-700';
    }
};

// Nifty 50 ⊆ Nifty 100 ⊆ Nifty 500, so expand to all applicable labels
const getCategories = (category: string): string[] => {
    if (category === 'NIFTY50') return ['NIFTY50', 'NIFTY100', 'NIFTY500'];
    if (category === 'NIFTY100') return ['NIFTY100', 'NIFTY500'];
    if (category === 'NIFTY500') return ['NIFTY500'];
    if (category === 'ETF') return ['ETF'];
    return category ? [category] : [];
};

const WatchlistItem = React.memo(function WatchlistItem({ name, ticker, price, change, isNegative, category, onRemove }: any) {
    return (
        <div className="flex items-center justify-between p-3 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-2xl transition-colors cursor-pointer group border border-transparent hover:border-slate-100 dark:hover:border-slate-700 relative">
            <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-full flex items-center justify-center p-2 shadow-sm group-hover:scale-110 transition-transform">
                    <span className="font-bold text-xs text-slate-700 dark:text-slate-300">{name ? name[0] : ticker[0]}</span>
                </div>
                <div>
                    <p className="text-sm font-bold text-slate-800 dark:text-white truncate max-w-[120px]">{name}</p>
                    <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                        <p className="text-[10px] font-bold text-slate-400">{ticker}</p>
                        {getCategories(category).map(cat => (
                            <span key={cat} className={`text-[8px] font-bold px-1.5 py-0.5 rounded shadow-sm ${getCategoryColor(cat)}`}>
                                {cat}
                            </span>
                        ))}
                    </div>
                </div>
            </div>
            <div className="flex items-center gap-4">
                <div className="text-right">
                    <p className="text-sm font-bold text-slate-800 dark:text-white">₹{price}</p>
                    <p className={`text-xs font-bold ${isNegative ? 'text-red-500' : 'text-green-500'} flex items-center justify-end gap-0.5`}>
                        {isNegative ? <TrendingDown size={10} /> : <TrendingUp size={10} />} {change}
                    </p>
                </div>
                <button
                    onClick={(e) => { e.stopPropagation(); onRemove(ticker); }}
                    className="text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                    title="Remove"
                >
                    <Trash2 size={16} />
                </button>
            </div>
        </div>
    );
});

export default function Watchlist() {
    const [items, setItems] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isAdding, setIsAdding] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [errorMsg, setErrorMsg] = useState("");
    const [activeTab, setActiveTab] = useState("All");

    const searchRef = useRef<HTMLDivElement>(null);

    const fetchWatchlist = async () => {
        try {
            setLoading(true);
            const res = await watchlistApi.getWatchlist();
            if (res.success) {
                setItems(res.data || []);
            }
        } catch (error) {
            console.error("Failed to fetch watchlist", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchWatchlist();
    }, []);

    // Live search debounce
    useEffect(() => {
        const delayDebounce = setTimeout(async () => {
            if (searchQuery.trim().length >= 1) {
                setIsSearching(true);
                try {
                    const res = await (stockApi as any).searchStocks(searchQuery.trim());
                    if (res.success) {
                        setSearchResults(res.data || []);
                    }
                } catch (error) {
                    console.error("Search failed", error);
                } finally {
                    setIsSearching(false);
                }
            } else {
                setSearchResults([]);
            }
        }, 300);

        return () => clearTimeout(delayDebounce);
    }, [searchQuery]);

    // Close dropdown strictly when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
                setSearchResults([]);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleAdd = async (symbol: string) => {
        if (!symbol) return;
        try {
            setErrorMsg("");
            const res = await watchlistApi.addToWatchlist(symbol);
            if (res.success) {
                setSearchQuery("");
                setSearchResults([]);
                setIsAdding(false);
                fetchWatchlist();
            }
        } catch (error: any) {
            setErrorMsg(error?.response?.data?.message || "Failed to add stock");
        }
    };

    const handleRemove = async (symbol: string) => {
        try {
            const res = await watchlistApi.removeFromWatchlist(symbol);
            if (res.success) {
                setItems(items.filter(item => item.symbol !== symbol));
            }
        } catch (error) {
            console.error("Failed to remove from watchlist", error);
        }
    };

    // Filter items based on active tab — respecting index hierarchy:
    // Nifty50 ⊆ Nifty100 ⊆ Nifty500, so NIFTY100 tab shows all 100 stocks, etc.
    const tabIncludesCategory = (tab: string, category: string): boolean => {
        if (tab === 'NIFTY100') return category === 'NIFTY50' || category === 'NIFTY100';
        if (tab === 'NIFTY500') return category === 'NIFTY50' || category === 'NIFTY100' || category === 'NIFTY500';
        return category === tab; // NIFTY50 and ETF tabs are exact matches
    };

    const filteredItems = activeTab === "All"
        ? items
        : items.filter(item => tabIncludesCategory(activeTab, item.stockData?.category));

    return (
        <div className="lg:col-span-4 bg-white dark:bg-slate-900/50 backdrop-blur-md rounded-[24px] p-6 border border-slate-100 dark:border-white/10 shadow-sm flex flex-col h-full min-h-[450px]">
            <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold text-slate-800 dark:text-white text-lg">Watchlist</h3>
                {!isAdding && (
                    <button
                        onClick={() => { setIsAdding(true); setErrorMsg(""); }}
                        className="w-8 h-8 bg-[#6366F1] rounded-lg text-white flex items-center justify-center hover:bg-[#4F46E5] shadow-lg shadow-indigo-500/20 transition-all hover:-translate-y-0.5"
                        title="Add Stock">
                        <Plus size={16} />
                    </button>
                )}
            </div>

            {/* Category Tabs */}
            <div className="flex gap-2 mb-4 overflow-x-auto custom-scrollbar pb-1">
                {["All", "NIFTY50", "NIFTY100", "NIFTY500", "ETF"].map(tab => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`text-[10px] font-bold px-3 py-1.5 rounded-md transition-all whitespace-nowrap ${activeTab === tab
                            ? 'bg-slate-100 dark:bg-slate-800 text-[#6366F1] shadow-sm ring-1 ring-slate-200 dark:ring-slate-700'
                            : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
                            }`}
                    >
                        {tab}
                    </button>
                ))}
            </div>

            {isAdding && (
                <div className="mb-4 flex flex-col gap-2 relative" ref={searchRef}>
                    <div className="flex items-center gap-2">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                            <input
                                type="text"
                                placeholder="Search symbol or name..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg pl-9 pr-3 py-2 text-sm text-slate-800 dark:text-white focus:outline-none focus:border-[#6366F1]"
                                autoFocus
                            />
                        </div>
                        <button
                            onClick={() => { setIsAdding(false); setErrorMsg(""); setSearchQuery(""); setSearchResults([]); }}
                            className="w-9 h-9 shrink-0 bg-slate-200 dark:bg-slate-700 rounded-lg text-slate-600 dark:text-slate-300 flex items-center justify-center hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors"
                        >
                            <X size={16} />
                        </button>
                    </div>

                    {/* Autocomplete Dropdown */}
                    {searchResults.length > 0 && (
                        <div className="absolute top-full left-0 right-11 mt-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-xl z-50 max-h-48 overflow-y-auto">
                            {searchResults.map((res) => (
                                <div
                                    key={res.symbol}
                                    onClick={() => handleAdd(res.symbol)}
                                    className="p-3 hover:bg-slate-50 dark:hover:bg-slate-700/50 cursor-pointer flex justify-between items-center border-b border-slate-100 dark:border-slate-700/50 last:border-b-0"
                                >
                                    <div>
                                        <p className="text-sm font-bold text-slate-800 dark:text-white">{res.symbol}</p>
                                        <p className="text-[10px] text-slate-500 truncate max-w-[150px]">{res.name}</p>
                                    </div>
                                    <div className="flex items-center gap-1 flex-wrap justify-end">
                                        {getCategories(res.category).map(cat => (
                                            <span key={cat} className={`text-[8px] font-bold px-1.5 py-0.5 rounded shadow-sm ${getCategoryColor(cat)}`}>
                                                {cat}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                    {searchQuery.length > 0 && searchResults.length === 0 && !isSearching && (
                        <div className="absolute top-full left-0 right-11 mt-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-xl z-50 p-3 text-center text-xs text-slate-500">
                            No matching stocks found.
                        </div>
                    )}

                    {errorMsg && <p className="text-[10px] text-red-500 font-medium">{errorMsg}</p>}
                </div>
            )}

            <div className="flex-1 space-y-2 overflow-y-auto pr-2 custom-scrollbar">
                {loading ? (
                    <div className="flex items-center justify-center h-full text-slate-400 text-sm">Loading...</div>
                ) : filteredItems.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-center p-4">
                        <p className="text-slate-400 text-sm mb-2">No stocks found.</p>
                        <p className="text-slate-500 text-xs text-balance">
                            {activeTab === "All" ? "Click + to search and add your favorite stocks to the watchlist." : `You have no ${activeTab} stocks in your watchlist.`}
                        </p>
                    </div>
                ) : (
                    filteredItems.map((item, idx) => {
                        const stock = item.stockData || {};
                        const name = stock.name || item.symbol;
                        const change = stock.change !== undefined ? stock.change.toFixed(2) : "0.00";
                        const isNegative = stock.change < 0;
                        const price = stock.price !== undefined ? stock.price.toFixed(2) : "0.00";

                        return (
                            <WatchlistItem
                                key={item.symbol || idx}
                                name={name}
                                ticker={item.symbol}
                                price={price}
                                change={isNegative ? change : `+${change}`}
                                isNegative={isNegative}
                                category={stock.category}
                                onRemove={handleRemove}
                            />
                        );
                    })
                )}
            </div>
        </div>
    );
}
