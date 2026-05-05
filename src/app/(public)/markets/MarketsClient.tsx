"use client";

import { useState, useEffect, useMemo, useCallback, memo } from "react";
import { Search, TrendingUp, TrendingDown, RefreshCw, Activity, ArrowUpDown, LineChart, Layers, Zap, Sparkles, BarChart3 } from "lucide-react";
import { stockApi } from "@/lib/api";
import { Stock } from "@/lib/types/stock.types";
import StockDetailModal from "@/app/user/_components/StockDetailModal";
import { motion, AnimatePresence } from "framer-motion";

type MainTabType = 'indices' | 'etfs';
type TabType = 'nifty50' | 'nifty100' | 'nifty500' | 'commodity' | 'bond' | 'sector' | 'other';

// --- 1. MEMOIZED ROW (Glass & Glow Style) ---
const StockRow = memo(({ stock, index, currentTabColor, onClick }: { stock: Stock, index: number, currentTabColor: string, onClick: (s: Stock) => void }) => {
    const isPositive = stock.change >= 0;

    // CSS-only delay for performance
    const animationDelay = `${Math.min(index * 0.03, 0.4)}s`;

    return (
        <div
            onClick={() => onClick(stock)}
            style={{ animationDelay }}
            className="group grid grid-cols-12 gap-4 px-6 py-5 border-b border-white/[0.03] hover:bg-white/[0.02] transition-all duration-300 cursor-pointer animate-fade-in-up opacity-0 fill-mode-forwards relative overflow-hidden"
        >
            {/* Hover Glow Effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[0.02] to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000 pointer-events-none" />

            {/* Symbol */}
            <div className="col-span-6 md:col-span-3 flex items-center gap-4 relative z-10">
                <div className={`
                    w-11 h-11 rounded-2xl flex items-center justify-center text-white font-bold text-sm 
                    shadow-lg shadow-black/40 ring-1 ring-white/10 group-hover:scale-105 transition-transform duration-300
                    bg-gradient-to-br from-[#1a1f2e] to-[#0f1219]
                `}>
                    <span className={`bg-gradient-to-br from-${currentTabColor}-400 to-${currentTabColor}-600 bg-clip-text text-transparent`}>
                        {stock.symbol[0]}
                    </span>
                </div>
                <div>
                    <h3 className="font-bold text-slate-100 group-hover:text-indigo-400 transition-colors tracking-tight text-sm mb-0.5">{stock.symbol}</h3>
                    <p className="text-[10px] text-slate-500 font-medium uppercase tracking-widest truncate max-w-[120px]">{stock.name}</p>
                </div>
            </div>

            <div className="hidden md:flex md:col-span-2 text-right font-medium text-slate-400 tabular-nums text-sm tracking-tight items-center justify-end">₹{stock.open.toFixed(2)}</div>
            <div className="hidden md:flex md:col-span-2 text-right font-medium text-slate-400 tabular-nums text-sm tracking-tight items-center justify-end">₹{stock.high.toFixed(2)}</div>
            <div className="hidden md:flex md:col-span-2 text-right font-medium text-slate-400 tabular-nums text-sm tracking-tight items-center justify-end">₹{stock.low.toFixed(2)}</div>

            {/* Price with subtle glow */}
            <div className="col-span-3 md:col-span-1 text-right font-bold text-white text-[15px] tabular-nums tracking-tight flex items-center justify-end drop-shadow-sm">
                ₹{stock.price.toFixed(2)}
            </div>

            {/* Change Pill */}
            <div className="col-span-3 md:col-span-2 flex justify-end relative z-10">
                <span className={`
                    inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold w-full md:w-24 justify-center backdrop-blur-md transition-all duration-300
                    ${isPositive
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-[0_0_15px_-3px_rgba(52,211,153,0.3)] group-hover:bg-emerald-500/20'
                        : 'bg-rose-500/10 text-rose-400 border border-rose-500/20 shadow-[0_0_15px_-3px_rgba(251,113,133,0.3)] group-hover:bg-rose-500/20'}
                `}>
                    {isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                    {Math.abs(stock.changePercent).toFixed(2)}%
                </span>
            </div>
        </div>
    );
});
StockRow.displayName = "StockRow";

const currentTabConfig = (color: string) => ({
    from: `${color}-600`,
    to: `${color}-800`
});

// --- 2. SKELETON LOADER (Polished) ---
const StockSkeleton = () => (
    <div className="animate-pulse space-y-0">
        {[...Array(8)].map((_, i) => (
            <div key={i} className="flex items-center justify-between border-b border-white/[0.02] px-6 py-5">
                <div className="flex items-center gap-4 w-1/3">
                    <div className="w-11 h-11 rounded-2xl bg-white/[0.05]" />
                    <div className="space-y-2">
                        <div className="h-4 w-24 bg-white/[0.05] rounded-full" />
                        <div className="h-2 w-16 bg-white/[0.03] rounded-full" />
                    </div>
                </div>
                <div className="h-6 w-24 bg-white/[0.05] rounded-full" />
            </div>
        ))}
    </div>
);

export default function MarketsClient() {
    const [activeMainTab, setActiveMainTab] = useState<MainTabType>('indices');
    const [activeTab, setActiveTab] = useState<TabType>('nifty50');
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
        setStocks([]);
        setSearchQuery("");
        fetchStocks(activeTab);
    }, [activeTab, fetchStocks]);

    useEffect(() => {
        const interval = setInterval(() => fetchStocks(activeTab), 120000);
        return () => clearInterval(interval);
    }, [activeTab, fetchStocks]);

    const processedStocks = useMemo(() => {
        let result = stocks.filter((stock) =>
            stock.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
            stock.name.toLowerCase().includes(searchQuery.toLowerCase())
        );

        return result.sort((a, b) => {
            let comparison = 0;
            if (sortBy === 'symbol') comparison = a.symbol.localeCompare(b.symbol);
            else if (sortBy === 'change') comparison = a.changePercent - b.changePercent;
            return sortOrder === 'asc' ? comparison : -comparison;
        });
    }, [stocks, searchQuery, sortBy, sortOrder]);

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
    const currentTab = currentSubTabs.find(t => t.id === activeTab) || currentSubTabs[0];

    const handleMainTabSwitch = (tabId: MainTabType) => {
        setActiveMainTab(tabId);
        setActiveTab(tabId === 'indices' ? 'nifty50' : 'commodity');
    };

    return (
        <div className="min-h-screen font-sans relative overflow-hidden bg-[#030303] text-slate-200 selection:bg-indigo-500/30">
            {/* INJECTED STYLES */}
            <style jsx global>{`
                @keyframes fadeInUp {
                    from { opacity: 0; transform: translateY(12px) scale(0.98); }
                    to { opacity: 1; transform: translateY(0) scale(1); }
                }
                .animate-fade-in-up {
                    animation-name: fadeInUp;
                    animation-duration: 0.5s;
                    animation-timing-function: cubic-bezier(0.2, 0.8, 0.2, 1);
                }
                .fill-mode-forwards { animation-fill-mode: forwards; }
                
                /* Elegant Scrollbar */
                .custom-scrollbar-dark::-webkit-scrollbar { width: 4px; }
                .custom-scrollbar-dark::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar-dark::-webkit-scrollbar-thumb { background: rgba(255, 255, 255, 0.1); border-radius: 20px; }
                .custom-scrollbar-dark::-webkit-scrollbar-thumb:hover { background: rgba(255, 255, 255, 0.2); }
                
                /* Noise Texture */
                .bg-noise {
                    background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='0.05'/%3E%3C/svg%3E");
                }
            `}</style>

            {/* --- PREMIUM AMBIENT BACKGROUND --- */}
            <div className="fixed inset-0 z-0">
                <div className="absolute inset-0 bg-[#030303]" />
                <div className="absolute inset-0 bg-noise opacity-[0.3] mix-blend-overlay pointer-events-none" />

                {/* Deep Ambient Glows */}
                <div className="absolute top-[-10%] left-1/2 -translate-x-1/2 w-[80vw] h-[500px] bg-indigo-900/20 blur-[120px] rounded-full pointer-events-none" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-blue-900/10 blur-[100px] rounded-full pointer-events-none" />
                <div className="absolute top-[20%] left-[-10%] w-[400px] h-[400px] bg-purple-900/10 blur-[100px] rounded-full pointer-events-none" />
            </div>

            <div className="relative z-10 pt-32 lg:pt-40 pb-20 px-4 md:px-8 max-w-7xl mx-auto">

                {/* --- HEADER --- */}
                <div className="flex flex-col items-center justify-center mb-16 text-center">
                    <motion.div
                        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}
                        className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/[0.03] border border-white/[0.08] backdrop-blur-md shadow-2xl mb-6 group cursor-default hover:border-indigo-500/30 transition-colors"
                    >
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                        </span>
                        <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-300 group-hover:text-white transition-colors">Market Intelligence</span>
                    </motion.div>

                    <motion.h1
                        initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.7, ease: "circOut" }}
                        className="text-5xl md:text-7xl font-medium text-white mb-6 tracking-tight"
                    >
                        Market <span className="font-serif italic text-transparent bg-clip-text bg-gradient-to-r from-indigo-300 via-white to-indigo-300">Pulse.</span>
                    </motion.h1>

                    <p className="text-slate-400 max-w-lg text-lg leading-relaxed font-light">
                        Real-time data visualization for <span className="text-white font-medium">India's leading indices</span>. Precision engineered for the modern investor.
                    </p>
                </div>
                {/* --- TWO-TIER TABS --- */}
                <div className="flex flex-col items-center gap-4 mb-10">

                    {/* PRIMARY TABS */}
                    <div className="inline-flex p-1.5 rounded-2xl bg-white/[0.04] border border-white/[0.08] backdrop-blur-3xl shadow-2xl">
                        {mainTabs.map((mTab) => {
                            const Icon = mTab.icon;
                            const isActive = activeMainTab === mTab.id;
                            return (
                                <button
                                    key={mTab.id}
                                    onClick={() => handleMainTabSwitch(mTab.id)}
                                    className={`
                                        relative px-10 py-3 rounded-xl text-base font-bold transition-all duration-300
                                        flex items-center gap-3 overflow-hidden group
                                        ${isActive ? 'text-white shadow-xl' : 'text-slate-400 hover:text-white'}
                                    `}
                                >
                                    {isActive && (
                                        <motion.div
                                            layoutId="activeMainTab"
                                            className="absolute inset-0 bg-gradient-to-r from-indigo-500/20 to-purple-500/20 border border-white/[0.1] rounded-xl"
                                            initial={false}
                                            transition={{ type: "spring", stiffness: 300, damping: 25 }}
                                        />
                                    )}
                                    <Icon className={`w-5 h-5 relative z-10 transition-colors ${isActive ? 'text-indigo-400' : 'group-hover:text-white'}`} />
                                    <span className="relative z-10">{mTab.name}</span>
                                </button>
                            );
                        })}
                    </div>

                    {/* SECONDARY TABS */}
                    <div className="inline-flex p-1 rounded-2xl bg-white/[0.01] border border-white/[0.03] backdrop-blur-xl">
                        {currentSubTabs.map((tab) => {
                            const Icon = tab.icon;
                            const isActive = activeTab === tab.id;
                            return (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`
                                        relative px-6 py-2 rounded-xl text-xs font-semibold uppercase tracking-wider transition-all duration-300
                                        flex items-center gap-2 overflow-hidden group
                                        ${isActive ? 'text-white shadow-md' : 'text-slate-500 hover:text-slate-300'}
                                    `}
                                >
                                    {isActive && (
                                        <motion.div
                                            layoutId="activeSubTab"
                                            className="absolute inset-0 bg-white/[0.06] border border-white/[0.04] rounded-xl"
                                            initial={false}
                                            transition={{ type: "spring", stiffness: 400, damping: 30 }}
                                        />
                                    )}
                                    <Icon className={`w-3.5 h-3.5 relative z-10 transition-colors ${isActive ? `text-${tab.color}-400` : 'group-hover:text-white'}`} />
                                    <span className="relative z-10">{tab.name}</span>
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* --- MAIN GLASS CARD --- */}
                <motion.div
                    layout
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="relative bg-[#0A0A0A]/60 backdrop-blur-3xl rounded-[24px] border border-white/[0.06] shadow-[0_0_100px_-20px_rgba(0,0,0,0.5)] overflow-hidden ring-1 ring-white/[0.02]"
                >
                    {/* TOP GLOW LINE */}
                    <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-indigo-500/50 to-transparent opacity-50" />

                    {/* TOOLBAR */}
                    <div className="p-5 md:p-6 flex flex-col md:flex-row gap-5 items-center justify-between border-b border-white/[0.03]">
                        <div className="relative w-full md:w-80 group">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <Search className="h-4 w-4 text-slate-600 group-focus-within:text-indigo-400 transition-colors" />
                            </div>
                            <input
                                type="text"
                                className="block w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.05] text-white placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-indigo-500/40 focus:bg-white/[0.05] transition-all text-sm"
                                placeholder={`Search ${currentTab.name}...`}
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>

                        <div className="flex items-center gap-6">
                            <div className="hidden md:flex flex-col items-end">
                                <span className="text-[10px] font-bold text-slate-600 uppercase tracking-wider mb-0.5">Last Sync</span>
                                <div className="flex items-center gap-2">
                                    <span className="text-xs font-mono font-medium text-slate-300">
                                        {lastUpdated ? new Date(lastUpdated).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", second: "2-digit" }) : "--:--:--"}
                                    </span>
                                </div>
                            </div>

                            <button
                                onClick={() => fetchStocks(activeTab)}
                                disabled={loading}
                                className="p-2.5 rounded-xl bg-white/[0.03] hover:bg-indigo-500/10 text-slate-400 hover:text-indigo-400 border border-white/[0.05] hover:border-indigo-500/30 transition-all disabled:opacity-50"
                            >
                                <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
                            </button>
                        </div>
                    </div>

                    {/* TABLE HEADER (Sticky) */}
                    <div className="grid grid-cols-12 gap-4 px-6 py-4 bg-[#0A0A0A]/80 backdrop-blur-xl border-b border-white/[0.05] text-[10px] font-bold text-slate-500 uppercase tracking-[0.1em] sticky top-0 z-20">
                        <div className="col-span-6 md:col-span-3 hover:text-white cursor-pointer flex items-center gap-1.5 transition-colors" onClick={() => toggleSort('symbol')}>
                            Symbol <ArrowUpDown className="w-2.5 h-2.5 opacity-50" />
                        </div>
                        <div className="hidden md:block md:col-span-2 text-right">Open</div>
                        <div className="hidden md:block md:col-span-2 text-right">High</div>
                        <div className="hidden md:block md:col-span-2 text-right">Low</div>
                        <div className="col-span-3 md:col-span-1 text-right">Price</div>
                        <div className="col-span-3 md:col-span-2 text-right hover:text-white cursor-pointer flex items-center justify-end gap-1.5 transition-colors" onClick={() => toggleSort('change')}>
                            Change <ArrowUpDown className="w-2.5 h-2.5 opacity-50" />
                        </div>
                    </div>

                    {/* CONTENT AREA */}
                    <div className="min-h-[400px] max-h-[650px] overflow-y-auto custom-scrollbar-dark relative">
                        {error && (
                            <div className="absolute inset-0 flex items-center justify-center z-30 bg-black/50 backdrop-blur-sm">
                                <div className="text-center bg-[#111] p-6 rounded-2xl border border-white/10 shadow-2xl">
                                    <Activity className="w-8 h-8 mx-auto mb-3 text-rose-500" />
                                    <p className="text-sm text-slate-300 mb-4">{error}</p>
                                    <button onClick={() => fetchStocks(activeTab)} className="text-xs font-bold bg-white text-black px-4 py-2 rounded-full hover:scale-105 transition-transform">Retry</button>
                                </div>
                            </div>
                        )}

                        {loading && stocks.length === 0 ? (
                            <StockSkeleton />
                        ) : filteredStocksEmpty(processedStocks) ? (
                            <div className="p-20 text-center text-slate-600 flex flex-col items-center justify-center h-full">
                                <Search className="w-12 h-12 mb-4 opacity-10" />
                                <p className="text-sm font-medium">No assets matching "<span className="text-slate-400">{searchQuery}</span>"</p>
                            </div>
                        ) : (
                            processedStocks.map((stock, i) => (
                                <StockRow
                                    key={stock.symbol}
                                    stock={stock}
                                    index={i}
                                    currentTabColor={currentTab.color}
                                    onClick={handleStockClick}
                                />
                            ))
                        )}
                    </div>
                </motion.div>

                {/* FOOTER NOTE */}
                <div className="text-center mt-8">
                    <p className="text-[10px] text-slate-600 uppercase tracking-widest">
                        Data provided for informational purposes only
                    </p>
                </div>
            </div>

            <StockDetailModal
                isOpen={isModalOpen}
                onClose={() => { setIsModalOpen(false); setSelectedStock(null); }}
                stock={selectedStock}
                forceUnauthenticated={true}
            />
        </div>
    );
}

const filteredStocksEmpty = (arr: Stock[]) => arr.length === 0;