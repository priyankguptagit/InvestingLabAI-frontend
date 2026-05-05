"use client";

import { Newspaper, ExternalLink, TrendingUp, TrendingDown, Minus, Loader2, AlertCircle, RefreshCw } from "lucide-react";

interface NewsItem {
    _id: string;
    title: string;
    description?: string;
    url: string;
    source: string;
    category: string;
    publishedAt: string;
    relatedSymbols?: string[];
}

interface AIRecommendation {
    action: 'BUY' | 'SELL' | 'HOLD';
    confidence: number;
    reasoning: string;
}

interface StockNewsCardProps {
    news: NewsItem[];
    aiRecommendation: AIRecommendation | null;
    loading: boolean;
    symbol?: string;
    newsFallbackUsed?: boolean;
    onRefresh?: () => void;
    currentPlan?: string;
}

function timeAgo(dateStr: string): string {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
}

const sourceColors: Record<string, string> = {
    NSE: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    MONEYCONTROL: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
    ECONOMIC_TIMES: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
};

export function StockNewsCard({ news, aiRecommendation, loading, symbol, newsFallbackUsed, onRefresh, currentPlan = 'Free' }: StockNewsCardProps) {
    const actionConfig = {
        BUY: {
            icon: TrendingUp,
            color: 'text-emerald-400',
            bg: 'bg-emerald-500/10 border-emerald-500/20',
            badge: 'bg-emerald-500 text-white',
            glow: 'shadow-emerald-500/10',
        },
        SELL: {
            icon: TrendingDown,
            color: 'text-rose-400',
            bg: 'bg-rose-500/10 border-rose-500/20',
            badge: 'bg-rose-500 text-white',
            glow: 'shadow-rose-500/10',
        },
        HOLD: {
            icon: Minus,
            color: 'text-amber-400',
            bg: 'bg-amber-500/10 border-amber-500/20',
            badge: 'bg-amber-500 text-white',
            glow: 'shadow-amber-500/10',
        },
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center py-16 gap-4 text-slate-500">
                <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
                <p className="text-sm font-medium">Fetching news & generating AI signal...</p>
            </div>
        );
    }

    const rec = aiRecommendation;
    const config = rec ? actionConfig[rec.action] : null;
    const RecIcon = config?.icon || Minus;

    return (
        <div className="space-y-4 h-full flex flex-col">

            {/* AI Recommendation Banner */}
            {['Free', 'Silver'].includes(currentPlan) ? (
                <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-500">
                            <AlertCircle className="w-5 h-5" />
                        </div>
                        <div>
                            <div className="text-sm font-bold text-amber-500">AI News Analysis Locked</div>
                            <div className="text-xs text-slate-400">Available on Gold & Diamond plans.</div>
                        </div>
                    </div>
                </div>
            ) : rec && config ? (
                <div className={`rounded-2xl border ${config.bg} p-4 shadow-lg ${config.glow}`}>
                    <div className="flex items-start gap-3">
                        <div className={`flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center ${config.badge} shadow-md`}>
                            <RecIcon className="w-5 h-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1 flex-wrap">
                                <span className={`text-xs font-black uppercase tracking-widest px-2.5 py-0.5 rounded-full ${config.badge} shadow`}>
                                    AI Signal: {rec.action}
                                </span>
                                <span className={`text-xs font-semibold ${config.color}`}>
                                    {rec.confidence}% confidence
                                </span>
                            </div>
                            <p className="text-xs text-slate-400 leading-relaxed line-clamp-3">{rec.reasoning}</p>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-4 text-center">
                    <AlertCircle className="w-6 h-6 text-slate-600 mx-auto mb-2" />
                    <p className="text-xs text-slate-600">AI signal unavailable</p>
                </div>
            )}

            {/* Fallback notice */}
            {newsFallbackUsed && (
                <div className="flex items-center gap-2 text-[11px] text-slate-600 px-1">
                    <AlertCircle className="w-3 h-3 flex-shrink-0" />
                    <span>No direct news for {symbol} — showing sector-related news that may impact this stock.</span>
                </div>
            )}

            {/* News header */}
            <div className="flex items-center justify-between px-0.5">
                <div className="flex items-center gap-2">
                    <Newspaper className="w-4 h-4 text-slate-500" />
                    <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                        Related News ({news.length})
                    </span>
                </div>
                {onRefresh && (
                    <button
                        onClick={onRefresh}
                        className="p-1.5 rounded-lg text-slate-600 hover:text-slate-400 hover:bg-white/5 transition-all"
                        title="Refresh"
                    >
                        <RefreshCw className="w-3.5 h-3.5" />
                    </button>
                )}
            </div>

            {/* News list */}
            {news.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 text-center text-slate-600">
                    <Newspaper className="w-8 h-8 mb-3 opacity-30" />
                    <p className="text-sm font-medium">No news available</p>
                    <p className="text-xs mt-1 text-slate-700">Check back later for updates</p>
                </div>
            ) : (
                <div className="flex-1 overflow-y-auto space-y-2 pr-1 custom-scrollbar-dark">
                    {news.map((item) => {
                        const sourceClass = sourceColors[item.source] || 'bg-slate-500/10 text-slate-400 border-slate-500/20';
                        const isSymbolDirect = item.relatedSymbols?.includes(symbol || '');

                        return (
                            <a
                                key={item._id}
                                href={item.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="group flex gap-3 p-3 rounded-xl border border-white/[0.04] bg-white/[0.02] hover:bg-white/[0.05] hover:border-white/[0.08] transition-all cursor-pointer"
                            >
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${sourceClass}`}>
                                            {item.source.replace('_', ' ')}
                                        </span>
                                        {isSymbolDirect && (
                                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded border bg-indigo-500/10 text-indigo-400 border-indigo-500/20">
                                                DIRECT
                                            </span>
                                        )}
                                        <span className="text-[10px] text-slate-600 ml-auto">
                                            {timeAgo(item.publishedAt)}
                                        </span>
                                    </div>
                                    <p className="text-xs font-semibold text-slate-300 group-hover:text-white leading-snug line-clamp-2 transition-colors">
                                        {item.title}
                                    </p>
                                    {item.description && (
                                        <p className="text-[11px] text-slate-600 mt-1 line-clamp-1">
                                            {item.description}
                                        </p>
                                    )}
                                </div>
                                <ExternalLink className="w-3.5 h-3.5 flex-shrink-0 text-slate-700 group-hover:text-slate-400 mt-0.5 transition-colors" />
                            </a>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
