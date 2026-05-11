"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Briefcase,
    TrendingUp,
    TrendingDown,
    RefreshCw,
    Loader2,
    Brain,
    Clock,
    ArrowUp,
    ArrowDown,
    Wallet,
    PieChart,
    Activity,
    DollarSign,
    Zap,
    Lock,
    Download
} from "lucide-react";
import { cn } from "@/lib/utils";
import { tradingApi } from "@/lib/api/trading.api";
import { authApi } from "@/lib/api/auth.api";
import { useTradingWebSocket } from "@/hooks/useTradingWebSocket";
import {
    Portfolio,
    PortfolioHolding,
    Trade,
} from "@/lib/types/trading.types";
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/shared-components/ui/accordion";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/shared-components/ui/card";
import { Button } from "@/shared-components/ui/button";
import { Badge } from "@/shared-components/ui/badge";

const parseAiAnalysis = (text: string) => {
    if (!text) return [];
    
    // We expect sections starting with numbers like "1. Title\n content"
    const regex = /(?:^|\n)(\d+\.\s+.*?)\n([\s\S]*?)(?=(?:\n\d+\.\s+)|$)/g;
    let match;
    const sections = [];
    while ((match = regex.exec(text)) !== null) {
        sections.push({
            title: match[1].replace(/^\d+\.\s*/, '').trim(),
            content: match[2].trim()
        });
    }
    
    // Fallback if parsing fails
    if (sections.length === 0) {
        return [{ title: "Analysis Insights", content: text }];
    }
    
    return sections;
};

export default function PortfolioPage() {
    // ------------------------------------------------------------------
    // State Management (Explicit & Full)
    // ------------------------------------------------------------------
    const [portfolio, setPortfolio] = useState<Portfolio | null>(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    // AI Section State
    const [currentPlan, setCurrentPlan] = useState<string>("Free");
    const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);
    const [aiError, setAiError] = useState<string | null>(null);
    const [aiLoading, setAiLoading] = useState(false);

    // Trades Section State
    const [recentTrades, setRecentTrades] = useState<Trade[]>([]);
    const [tradesLoading, setTradesLoading] = useState(false);
    const [exportingTrades, setExportingTrades] = useState(false);

    // ------------------------------------------------------------------
    // WebSocket & Data Fetching Logic
    // ------------------------------------------------------------------
    const { isConnected, subscribeToPortfolio } = useTradingWebSocket({
        autoConnect: true,
        onPortfolioUpdate: (data) => {
            // Background update - do not trigger full page loader
            fetchPortfolio(true);
        },
        onTradeExecuted: (data) => {
            fetchPortfolio(true);
            fetchRecentTrades();
        },
    });

    // Fetch Portfolio Data
    const fetchPortfolio = async (isBackground = false) => {
        if (!isBackground) {
            setRefreshing(true);
        }
        try {
            const response = await tradingApi.getPortfolio();
            if (response.success) {
                setPortfolio(response.data);
            }
        } catch (error) {
            console.error("Failed to fetch portfolio:", error);
        } finally {
            if (!isBackground) {
                setLoading(false);
                setRefreshing(false);
            }
        }
    };

    // Fetch AI Analysis
    const fetchAIAnalysis = async () => {
        setAiLoading(true);
        setAiError(null);
        try {
            const response = await tradingApi.getAIPortfolioAnalysis();
            if (response.success) {
                setAiAnalysis(response.data.analysis);
            }
        } catch (error: any) {
            setAiAnalysis(null);
            setAiError(error.response?.data?.message || "Failed to fetch AI analysis.");
            console.error("Failed to fetch AI analysis:", error);
        } finally {
            setAiLoading(false);
        }
    };

    // Fetch Recent Trades History
    const fetchRecentTrades = async () => {
        setTradesLoading(true);
        try {
            const response = await tradingApi.getTradeHistory({ limit: 10, page: 1 });
            if (response.success) {
                setRecentTrades(response.data.trades);
            }
        } catch (error) {
            console.error("Failed to fetch trades:", error);
        } finally {
            setTradesLoading(false);
        }
    };

    // Fetch User Plan
    const fetchUserPlan = async () => {
        try {
            const data = await authApi.getMe();
            if (data.success && data.user) {
                setCurrentPlan(data.user.currentPlan || "Free");
            }
        } catch (error) {
            console.error("Failed to fetch user plan", error);
        }
    };

    const handleExportLedger = async () => {
        setExportingTrades(true);
        try {
            const response = await tradingApi.getTradeHistory({ limit: 10000, page: 1 });
            if (response.success && response.data.trades) {
                const trades = response.data.trades;
                const headers = ["Date", "Symbol", "Type", "Quantity", "Price", "Total Value", "Status", "Reason"];
                const csvRows = [headers.join(",")];
                
                for (const trade of trades) {
                    const row = [
                        new Date(trade.createdAt).toLocaleString().replace(/,/g, ""),
                        trade.symbol,
                        trade.type,
                        trade.quantity,
                        trade.price,
                        trade.totalAmount || (trade.price * trade.quantity),
                        trade.status,
                        `"${(trade.reason || "").replace(/"/g, '""')}"`
                    ];
                    csvRows.push(row.join(","));
                }
                
                const csvString = csvRows.join("\\n");
                const blob = new Blob([csvString], { type: "text/csv;charset=utf-8;" });
                const url = URL.createObjectURL(blob);
                
                const link = document.createElement("a");
                link.href = url;
                link.setAttribute("download", `Trade_Ledger_${new Date().toISOString().split('T')[0]}.csv`);
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                URL.revokeObjectURL(url);
            }
        } catch (error) {
            console.error("Failed to export trades:", error);
        } finally {
            setExportingTrades(false);
        }
    };

    // Initial Load Effect
    useEffect(() => {
        fetchUserPlan();
        fetchPortfolio();
        fetchRecentTrades();

        if (isConnected) {
            subscribeToPortfolio();
        }
    }, [isConnected]);

    // ------------------------------------------------------------------
    // Helper Logic & Calculations
    // ------------------------------------------------------------------
    
    // 1. Invested Amount: Total money put into active holdings
    const totalInvested = portfolio?.summary?.totalInvested || 0;
    
    // 2. Current Holdings Value: Present market value of all active holdings
    const currentValue = portfolio?.summary?.currentValue || 0;

    // 3. Buying Power: Available cash balance
    const buyingPower = portfolio?.availableBalance || 0;

    // 4. Total Account Value = Cash + Current Value of Holdings
    const totalAccountValue = buyingPower + currentValue;

    // 5. Overall Returns (Unrealized P&L of active holdings)
    const totalPL = portfolio?.summary?.totalPL || 0;

    // 6. Return Percentage: P&L relative to the invested amount
    const totalPLPercent = totalInvested > 0
        ? (totalPL / totalInvested) * 100
        : 0;

    const isProfitable = totalPL >= 0;

    // ------------------------------------------------------------------
    // Components (Internal for styling)
    // ------------------------------------------------------------------

    // 1. Loading Pulse for Numbers
    const ValueSkeleton = () => (
        <div className="h-8 w-32 bg-muted animate-pulse rounded-lg" />
    );

    // ------------------------------------------------------------------
    // Render
    // ------------------------------------------------------------------
    return (
        <div className="min-h-screen bg-background relative overflow-hidden font-sans selection:bg-primary/30">
            {/* Ambient Background Elements */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none -z-10">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-primary/5 blur-[120px]" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-indigo-500/5 blur-[120px]" />
            </div>

            <div className="max-w-[1600px] mx-auto px-4 md:px-8 pt-24 pb-12 space-y-8 relative z-10">

                {/* Page Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <motion.div 
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.5 }}
                    >
                        <h1 className="text-4xl font-extrabold tracking-tight text-foreground drop-shadow-sm">Portfolio</h1>
                        <p className="text-muted-foreground text-sm mt-1 font-medium">Real-time performance metrics & advanced insights</p>
                    </motion.div>

                    <Button
                        variant="outline"
                        onClick={() => fetchPortfolio(false)}
                        disabled={refreshing}
                        className="gap-2 backdrop-blur-sm bg-background/50 border-primary/20 hover:bg-primary/5 transition-all duration-300 shadow-sm"
                    >
                        <RefreshCw size={16} className={cn(refreshing && "animate-spin")} />
                        <span>Sync Data</span>
                    </Button>
                </div>

                {/* SECTION 1: HIGH-LEVEL METRICS */}
                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">

                    {/* CARD 1: TOTAL ACCOUNT VALUE */}
                    <Card className="group relative overflow-hidden backdrop-blur-md bg-card/60 border-border/50 hover:border-primary/50 transition-all duration-500 hover:shadow-2xl hover:shadow-primary/10 hover:-translate-y-1">
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 to-primary opacity-70" />
                        <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                            <CardTitle className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Total Account Value</CardTitle>
                            <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-500 group-hover:bg-indigo-500 group-hover:text-white transition-colors duration-300">
                                <Wallet className="w-4 h-4" />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-black tracking-tight xl:text-3xl">
                                {portfolio ? `₹${totalAccountValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : <ValueSkeleton />}
                            </div>
                            <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1.5">
                                <span className="flex items-center gap-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-2.5 py-1 text-[10px] uppercase font-black tracking-widest border border-emerald-500/20 shadow-sm">
                                    <Activity size={10} className="animate-pulse" /> Cash + Stocks
                                </span>
                            </p>
                        </CardContent>
                    </Card>

                    {/* CARD 2: BUYING POWER */}
                    <Card className="group relative overflow-hidden backdrop-blur-md bg-card/60 border-border/50 hover:border-amber-500/50 transition-all duration-500 hover:shadow-2xl hover:shadow-amber-500/10 hover:-translate-y-1">
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-amber-400 to-orange-600 opacity-70" />
                        <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                            <CardTitle className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Buying Power</CardTitle>
                            <div className="p-2 rounded-lg bg-amber-500/10 text-amber-500 group-hover:bg-amber-500 group-hover:text-white transition-colors duration-300">
                                <DollarSign className="w-4 h-4" />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-black tracking-tight xl:text-3xl">
                                {currentPlan === 'Free' ? (
                                    <span className="text-2xl text-muted-foreground flex items-center gap-2 font-bold italic opacity-40">
                                        <Lock size={20} /> Locked
                                    </span>
                                ) : portfolio ? (
                                    `₹${buyingPower.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                                ) : <ValueSkeleton />}
                            </div>
                        </CardContent>
                    </Card>

                    {/* CARD 3: CURRENT HOLDINGS VALUE */}
                    <Card className="group relative overflow-hidden backdrop-blur-md bg-card/60 border-border/50 hover:border-cyan-500/50 transition-all duration-500 hover:shadow-2xl hover:shadow-cyan-500/10 hover:-translate-y-1">
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-cyan-400 to-blue-500 opacity-70" />
                        <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                            <CardTitle className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Current Holdings</CardTitle>
                            <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-500 group-hover:bg-cyan-500 group-hover:text-white transition-colors duration-300">
                                <PieChart className="w-4 h-4" />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-black tracking-tight xl:text-3xl">
                                {portfolio ? `₹${currentValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : <ValueSkeleton />}
                            </div>
                        </CardContent>
                    </Card>

                    {/* CARD 4: TOTAL INVESTED */}
                    <Card className="group relative overflow-hidden backdrop-blur-md bg-card/60 border-border/50 hover:border-purple-500/50 transition-all duration-500 hover:shadow-2xl hover:shadow-purple-500/10 hover:-translate-y-1">
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-purple-500 to-pink-500 opacity-70" />
                        <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                            <CardTitle className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Invested Amount</CardTitle>
                            <div className="p-2 rounded-lg bg-purple-500/10 text-purple-500 group-hover:bg-purple-500 group-hover:text-white transition-colors duration-300">
                                <Briefcase className="w-4 h-4" />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-black tracking-tight xl:text-3xl">
                                {portfolio ? `₹${totalInvested.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : <ValueSkeleton />}
                            </div>
                        </CardContent>
                    </Card>

                    {/* CARD 5: PROFIT & LOSS */}
                    <Card className={cn(
                        "group relative overflow-hidden backdrop-blur-md bg-card/60 border-border/50 transition-all duration-500 hover:shadow-2xl hover:-translate-y-1",
                        isProfitable ? "hover:border-emerald-500/50 hover:shadow-emerald-500/10" : "hover:border-red-500/50 hover:shadow-red-500/10"
                    )}>
                        <div className={cn(
                            "absolute top-0 left-0 w-full h-1 opacity-70",
                            isProfitable ? "bg-gradient-to-r from-emerald-500 to-teal-500" : "bg-gradient-to-r from-red-500 to-orange-500"
                        )} />
                        <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                            <CardTitle className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Overall Returns</CardTitle>
                            <div className={cn(
                                "p-2 rounded-lg transition-colors duration-300",
                                isProfitable ? "bg-emerald-500/10 text-emerald-500 group-hover:bg-emerald-500 group-hover:text-white" : "bg-red-500/10 text-red-500 group-hover:bg-red-500 group-hover:text-white"
                            )}>
                                {isProfitable ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className={cn("text-2xl font-black tracking-tight xl:text-3xl", isProfitable ? "text-emerald-500" : "text-red-500")}>
                                {portfolio ? `${isProfitable ? "+" : "-"}₹${Math.abs(totalPL).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : <ValueSkeleton />}
                            </div>
                            {portfolio && (
                                <p className="text-xs mt-2 font-bold inline-flex px-2 py-1 bg-muted/50 border border-border/50 rounded-lg items-center gap-1 shadow-sm">
                                    {isProfitable ? <ArrowUp size={12} className="text-emerald-500" /> : <ArrowDown size={12} className="text-red-500" />}
                                    <span className={isProfitable ? "text-emerald-500" : "text-red-500"}>{Math.abs(totalPLPercent).toFixed(2)}%</span>
                                    <span className="text-muted-foreground ml-1 opacity-60">all time</span>
                                </p>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* SECTION 2: HOLDINGS TABLE */}
                <Card className="backdrop-blur-md bg-card/60 border-border/50 shadow-xl">
                    <CardHeader className="border-b border-border/50 pb-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle className="text-xl font-black flex items-center gap-2">
                                    <Briefcase className="h-5 w-5 text-primary" /> Current Holdings
                                </CardTitle>
                                <CardDescription className="font-medium">Portfolio diversification and active exposure</CardDescription>
                            </div>
                            <Badge variant="outline" className="bg-primary/5 border-primary/20 text-primary font-bold px-3 py-1">
                                {(portfolio?.holdings || []).length} Assets
                            </Badge>
                        </div>
                    </CardHeader>
                    <CardContent className="px-6 pb-6 pt-6">
                        {loading && !portfolio ? (
                            <div className="space-y-4 pt-2">
                                {[...Array(3)].map((_, i) => (
                                    <div key={i} className="h-20 w-full bg-muted/40 rounded-xl animate-pulse border border-border/50" />
                                ))}
                            </div>
                        ) : (portfolio?.holdings || []).length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-24 bg-muted/20 rounded-2xl border border-dashed border-border/50">
                                <div className="p-6 rounded-full bg-muted/30 mb-4">
                                    <Briefcase size={48} className="text-muted-foreground opacity-30" />
                                </div>
                                <p className="text-xl font-black text-muted-foreground uppercase tracking-tighter">No active positions</p>
                                <p className="text-sm text-muted-foreground/60 mt-1 font-medium">Your investment journey starts with your first trade.</p>
                            </div>
                        ) : (
                            <Accordion type="single" collapsible className="space-y-3">
                                {portfolio!.holdings.map((holding) => {
                                    const isProfit = holding.unrealizedPL >= 0;
                                    const holdingTrades = recentTrades.filter(t => t.symbol === holding.symbol);
                                    const priceDiffPercent = holding.averageBuyPrice > 0
                                        ? ((holding.currentPrice - holding.averageBuyPrice) / holding.averageBuyPrice * 100)
                                        : 0;
                                    const totalCost = holding.averageBuyPrice * holding.quantity;

                                    return (
                                        <AccordionItem
                                            key={holding.symbol}
                                            value={holding.symbol}
                                            className="border border-border/50 rounded-2xl bg-background/40 overflow-hidden hover:bg-muted/10 transition-colors duration-300 shadow-sm"
                                        >
                                            <AccordionTrigger className="px-6 py-5 hover:no-underline group">
                                                <div className="flex items-center gap-5 flex-1 min-w-0">
                                                    <div className={cn(
                                                        "w-12 h-12 shrink-0 rounded-2xl flex items-center justify-center font-black text-xs tracking-tighter border shadow-lg transition-transform duration-500 group-hover:scale-110 group-hover:rotate-3",
                                                        isProfit
                                                            ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-500"
                                                            : "bg-red-500/10 border-red-500/30 text-red-500"
                                                    )}>
                                                        {holding.symbol.substring(0, 2)}
                                                    </div>
                                                    <div className="text-left min-w-0">
                                                        <div className="font-black text-foreground text-lg tracking-tight group-hover:text-primary transition-colors">{holding.symbol}</div>
                                                        <div className="text-xs text-muted-foreground font-bold truncate max-w-[150px] opacity-70 group-hover:opacity-100">{holding.stockName}</div>
                                                    </div>
                                                </div>

                                                <div className="hidden md:flex items-center gap-10 shrink-0">
                                                    <div className="text-right">
                                                        <div className="text-[10px] text-muted-foreground font-black uppercase tracking-widest mb-1 opacity-50">Quantity</div>
                                                        <div className="font-mono font-black text-foreground text-sm">{holding.quantity}</div>
                                                    </div>
                                                    <div className="text-right">
                                                        <div className="text-[10px] text-muted-foreground font-black uppercase tracking-widest mb-1 opacity-50">LTP</div>
                                                        <div className="font-mono font-black text-foreground text-sm">₹{holding.currentPrice.toLocaleString()}</div>
                                                    </div>
                                                    <div className={cn(
                                                        "flex flex-col items-center px-4 py-2 rounded-2xl border-2 font-black font-mono shadow-sm transition-all duration-300",
                                                        isProfit
                                                            ? "bg-emerald-500/5 border-emerald-500/20 text-emerald-500 group-hover:bg-emerald-500 group-hover:text-white group-hover:border-emerald-500"
                                                            : "bg-red-500/5 border-red-500/20 text-red-500 group-hover:bg-red-500 group-hover:text-white group-hover:border-red-500"
                                                    )}>
                                                        <span className="text-xs flex items-center gap-1">
                                                            {isProfit ? <ArrowUp size={12} /> : <ArrowDown size={12} />}
                                                            {holding.unrealizedPLPercent.toFixed(2)}%
                                                        </span>
                                                        <span className="text-[9px] uppercase tracking-tighter opacity-70">
                                                            {isProfit ? "+" : "-"}₹{Math.abs(holding.unrealizedPL).toLocaleString()}
                                                        </span>
                                                    </div>
                                                </div>
                                            </AccordionTrigger>

                                            <AccordionContent className="px-6 pb-6">
                                                <div className="pt-6 border-t border-border/50 grid grid-cols-1 md:grid-cols-3 gap-6">
                                                    {/* Price Details */}
                                                    <div className="bg-muted/10 border border-border/50 rounded-2xl p-5 space-y-4 shadow-inner">
                                                        <h4 className="text-[11px] font-black text-muted-foreground uppercase tracking-widest flex items-center gap-2 pb-2 border-b border-border/30">
                                                            <div className="w-1.5 h-1.5 rounded-full" />
                                                            Price Dynamics
                                                        </h4>
                                                        <div className="space-y-3">
                                                            <div className="flex justify-between items-center text-sm">
                                                                <span className="text-muted-foreground font-medium">Average Buy</span>
                                                                <span className="font-mono font-bold">₹{holding.averageBuyPrice.toLocaleString()}</span>
                                                            </div>
                                                            <div className="flex justify-between items-center text-sm">
                                                                <span className="text-muted-foreground font-medium">Market LTP</span>
                                                                <span className={cn("font-mono font-black", isProfit ? "text-emerald-500" : "text-red-500")}>
                                                                    ₹{holding.currentPrice.toLocaleString()}
                                                                </span>
                                                            </div>
                                                            <div className="flex justify-between items-center pt-2">
                                                                <Badge variant="secondary" className={cn("font-black tracking-tighter px-3 h-6", isProfit ? "bg-emerald-500/10 text-emerald-600" : "bg-red-500/10 text-red-600")}>
                                                                    {isProfit ? "+" : ""}{priceDiffPercent.toFixed(2)}% Spread
                                                                </Badge>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Value Analysis */}
                                                    <div className="bg-muted/10 border border-border/50 rounded-2xl p-5 space-y-4 shadow-inner">
                                                        <h4 className="text-[11px] font-black text-muted-foreground uppercase tracking-widest flex items-center gap-2 pb-2 border-b border-border/30">
                                                            <div className="w-1.5 h-1.5 rounded-full bg-purple-500" />
                                                            Value Analysis
                                                        </h4>
                                                        <div className="space-y-3 text-sm">
                                                            <div className="flex justify-between items-center">
                                                                <span className="text-muted-foreground font-medium">Total Cost</span>
                                                                <span className="font-mono font-bold">₹{totalCost.toLocaleString()}</span>
                                                            </div>
                                                            <div className="flex justify-between items-center">
                                                                <span className="text-muted-foreground font-medium">Current Value</span>
                                                                <span className="font-mono font-bold">₹{holding.currentValue.toLocaleString()}</span>
                                                            </div>
                                                            <div className="flex justify-between items-center border-t border-border/30 pt-3">
                                                                <span className="text-muted-foreground font-bold">Unrealized P&L</span>
                                                                <span className={cn("font-mono font-black", isProfit ? "text-emerald-500" : "text-red-500")}>
                                                                    {isProfit ? "+" : "-"}₹{Math.abs(holding.unrealizedPL).toLocaleString()}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Symbol History */}
                                                    <div className="bg-muted/10 border border-border/50 rounded-2xl p-5 flex flex-col shadow-inner">
                                                        <h4 className="text-[11px] font-black text-muted-foreground uppercase tracking-widest flex items-center gap-2 pb-3 mb-2 border-b border-border/30">
                                                            <div className="w-1.5 h-1.5 rounded-full bg-cyan-500" />
                                                            Trade History
                                                        </h4>
                                                        <div className="flex-1 overflow-y-auto custom-scrollbar space-y-2 max-h-[120px] pr-2">
                                                            {holdingTrades.length === 0 ? (
                                                                <div className="flex flex-col items-center justify-center py-6 opacity-40">
                                                                    <Activity size={24} className="mb-2" />
                                                                    <span className="text-[10px] font-black uppercase text-center">No recent data</span>
                                                                </div>
                                                            ) : holdingTrades.map(trade => (
                                                                <div key={trade._id} className="flex items-center justify-between text-[10px] bg-background/50 border border-border/30 rounded-xl px-3 py-2 hover:border-primary/30 transition-colors">
                                                                    <div className="flex items-center gap-2">
                                                                        <Badge variant="outline" className={cn("font-black h-4 px-1 leading-none uppercase text-[8px] border-0 rounded-md", trade.type === "BUY" ? "bg-emerald-500/10 text-emerald-600 shadow-[0_0_10px_rgba(16,185,129,0.1)]" : "bg-red-500/10 text-red-600 shadow-[0_0_10px_rgba(239,68,68,0.1)]")}>
                                                                            {trade.type}
                                                                        </Badge>
                                                                        <span className="text-muted-foreground font-bold">{new Date(trade.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short" })}</span>
                                                                    </div>
                                                                    <div className="text-right">
                                                                        <span className="font-mono font-black text-foreground">{trade.quantity} <span className="opacity-30">×</span> ₹{trade.price.toLocaleString()}</span>
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                </div>
                                            </AccordionContent>
                                        </AccordionItem>
                                    );
                                })}
                            </Accordion>
                        )}
                    </CardContent>
                </Card>

                {/* SECTION 3: AI & TRADES */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                    {/* AI ANALYSIS PANEL */}
                    <Card className="lg:col-span-2 flex flex-col min-h-[500px] backdrop-blur-md bg-card/60 border-border/50 relative overflow-hidden shadow-2xl group">
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary via-indigo-500 to-purple-600 opacity-70 animate-pulse" />
                        <CardHeader className="flex flex-row items-center justify-between pb-6 border-b border-border/50">
                            <div className="flex items-start gap-4">
                                <div className="p-3 rounded-2xl bg-primary/10 text-primary shadow-inner group-hover:bg-primary group-hover:text-white transition-all duration-500 animate-pulse-slow">
                                    <Brain className="h-6 w-6" />
                                </div>
                                <div>
                                    <CardTitle className="text-xl font-black tracking-tight">AI Portfolio Insights</CardTitle>
                                    <CardDescription className="font-bold flex items-center gap-1.5">
                                        Powered by Neural Analysis Models
                                    </CardDescription>
                                </div>
                            </div>

                            {['Free', 'Silver'].includes(currentPlan) ? (
                                <Button disabled variant="secondary" className="gap-2 bg-muted/50 border border-border/50 font-black uppercase text-[10px] tracking-widest px-4 h-10">
                                    <Lock className="h-4 w-4" /> Go Gold/Diamond
                                </Button>
                            ) : (
                                <Button
                                    onClick={fetchAIAnalysis}
                                    disabled={aiLoading}
                                    className="gap-2 font-black uppercase text-[10px] tracking-widest px-6 h-10 shadow-lg shadow-primary/20 hover:shadow-primary/40 transition-all active:scale-95"
                                >
                                    {aiLoading ? (
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                        <Zap className="h-4 w-4" />
                                    )}
                                    <span>{aiLoading ? "Consulting AI..." : "Extract Insights"}</span>
                                </Button>
                            )}
                        </CardHeader>
                        <CardContent className="flex-1 flex flex-col pt-6">
                            <div className="flex-1 bg-gradient-to-br from-background/40 to-muted/20 border border-border/50 rounded-3xl p-8 overflow-hidden flex flex-col relative shadow-inner">
                                {aiLoading ? (
                                    <div className="flex-1 flex flex-col items-center justify-center space-y-8 min-h-[300px]">
                                        <div className="relative">
                                            <div className="absolute inset-[-15px] border-2 border-dashed border-primary/30 rounded-full animate-[spin_10s_linear_infinite]" />
                                            <div className="absolute inset-0 border-t-4 border-primary rounded-full animate-spin w-20 h-20" />
                                            <div className="w-20 h-20 flex items-center justify-center p-5">
                                                <Brain className="h-10 w-10 text-primary animate-pulse" />
                                            </div>
                                        </div>
                                        <div className="space-y-2 text-center">
                                            <p className="font-black text-sm tracking-[0.2em] uppercase animate-pulse text-primary">Scanning Holdings...</p>
                                            <p className="text-[10px] font-bold text-muted-foreground uppercase opacity-60">Modeling volatility & risk-adjusted returns</p>
                                        </div>
                                    </div>
                                ) : aiAnalysis ? (
                                    <div className="flex flex-col gap-4 custom-scrollbar overflow-y-auto max-h-[450px] pr-4 pb-4">
                                        {parseAiAnalysis(aiAnalysis).map((section, idx) => (
                                            <div key={idx} className="bg-background/60 hover:bg-background/80 transition-all duration-300 border border-border/40 hover:border-primary/30 rounded-2xl p-5 shadow-sm hover:shadow-md group/section">
                                                <div className="flex items-start gap-4">
                                                    <div className="flex items-center justify-center w-8 h-8 shrink-0 rounded-xl bg-primary/10 text-primary font-black text-sm border border-primary/20 group-hover/section:scale-110 group-hover/section:bg-primary group-hover/section:text-white transition-all duration-300 shadow-sm">
                                                        {idx + 1}
                                                    </div>
                                                    <div className="flex-1 pt-0.5">
                                                        <h3 className="font-black text-foreground text-[15px] tracking-tight group-hover/section:text-primary transition-colors">
                                                            {section.title}
                                                        </h3>
                                                        <div className="text-sm font-medium leading-relaxed text-muted-foreground mt-2 whitespace-pre-wrap">
                                                            {section.content}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : aiError ? (
                                    <div className="flex-1 flex flex-col items-center justify-center text-center space-y-4 min-h-[300px]">
                                        <div className="p-6 rounded-full bg-red-500/10 border border-red-500/20 text-red-500">
                                            <Brain className="h-10 w-10" />
                                        </div>
                                        <div className="space-y-2 max-w-md">
                                            <p className="text-lg font-black text-foreground">AI analysis unavailable</p>
                                            <p className="text-sm text-muted-foreground font-medium">{aiError}</p>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground space-y-6 min-h-[300px]">
                                        <div className="p-8 rounded-full bg-background/50 border border-border/50 shadow-sm opacity-20 group-hover:opacity-40 transition-opacity duration-1000 group-hover:scale-110">
                                            <Brain className="h-20 w-20" />
                                        </div>
                                        <div className="text-center space-y-2">
                                            <p className="text-2xl font-black tracking-tight text-foreground/40">Knowledge Base Idle</p>
                                            <p className="text-sm font-bold max-w-sm mx-auto tracking-tight opacity-40">Execute analysis to generate a deep technical breakdown of your current market exposure.</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    {/* RECENT TRADES PANEL */}
                    <Card className="flex flex-col min-h-[500px] backdrop-blur-md bg-card/60 border-border/50 shadow-2xl group overflow-hidden">
                        <CardHeader className="border-b border-border/50 pb-6 flex flex-row items-start justify-between space-y-0">
                            <div className="flex items-start gap-4">
                                <div className="p-3 rounded-2xl bg-amber-500/10 text-amber-500 shadow-inner group-hover:bg-amber-500 group-hover:text-white transition-all duration-500">
                                    <Clock className="h-6 w-6" />
                                </div>
                                <div>
                                    <CardTitle className="text-xl font-black tracking-tight">Recent Activity</CardTitle>
                                    <CardDescription className="font-bold uppercase text-[10px] tracking-widest opacity-60">Log of market interactions</CardDescription>
                                </div>
                            </div>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={handleExportLedger}
                                disabled={exportingTrades}
                                className="gap-2 bg-background/50 border border-border/50 hover:bg-muted text-xs h-9 rounded-xl shadow-sm transition-all shadow-amber-500/5 hover:shadow-amber-500/10 hover:border-amber-500/30 font-bold uppercase tracking-widest px-3"
                            >
                                {exportingTrades ? <Loader2 className="h-3 w-3 animate-spin"/> : <Download className="h-3 w-3" />}
                                <span className="hidden sm:inline">{exportingTrades ? "Exporting..." : "Export CSV"}</span>
                            </Button>
                        </CardHeader>
                        <CardContent className="flex-1 overflow-hidden flex flex-col px-6 pb-6 pt-6 bg-muted/5">
                            <div className="flex-1 overflow-y-auto custom-scrollbar pr-3 space-y-4 max-h-[400px]">
                                {tradesLoading && recentTrades.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center py-20 space-y-4">
                                        <Loader2 className="h-10 w-10 text-primary animate-spin opacity-40" />
                                        <span className="text-[10px] font-black uppercase tracking-widest opacity-40">Fetching Ledger...</span>
                                    </div>
                                ) : recentTrades.length === 0 ? (
                                    <div className="text-center py-20 flex flex-col items-center gap-4 bg-background/40 rounded-3xl border border-dashed border-border/50 m-2">
                                        <Activity className="h-12 w-12 text-muted-foreground opacity-20" />
                                        <div className="space-y-1">
                                            <p className="font-black text-lg tracking-tight text-muted-foreground opacity-40">Empty Ledger</p>
                                            <p className="text-[10px] font-bold text-muted-foreground uppercase opacity-20">Market activity will be logged here</p>
                                        </div>
                                    </div>
                                ) : (
                                    recentTrades.map((trade) => (
                                        <div
                                            key={trade._id}
                                            className="group/item bg-background/60 border border-border/30 hover:border-primary/40 hover:bg-background rounded-2xl p-4 flex items-center justify-between transition-all duration-300 shadow-sm hover:shadow-md hover:-translate-x-1"
                                        >
                                            <div className="flex items-center gap-4">
                                                <div className={cn(
                                                    "w-10 h-10 rounded-xl flex items-center justify-center font-black text-[10px] border shadow-sm transition-all duration-300 group-hover/item:rotate-12",
                                                    trade.type === "BUY" ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" : "bg-red-500/10 text-red-600 border-red-500/20"
                                                )}>
                                                    {trade.type.substring(0, 1)}
                                                </div>
                                                <div>
                                                    <div className="font-black text-foreground text-sm tracking-tight">{trade.symbol}</div>
                                                    <div className="text-[10px] font-bold text-muted-foreground opacity-60 uppercase tracking-tighter">
                                                        {new Date(trade.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <div className="font-mono font-black text-xs text-foreground bg-muted/30 px-2 py-1 rounded-lg border border-border/30 tracking-tighter">
                                                    {trade.quantity} <span className="opacity-30">@</span> ₹{trade.price.toLocaleString()}
                                                </div>
                                                <div className={cn(
                                                    "text-[8px] font-black tracking-[0.2em] uppercase mt-2 px-2 py-0.5 rounded-full border inline-block",
                                                    trade.status === "EXECUTED" ? "text-primary border-primary/20 bg-primary/5" : "text-amber-500 border-amber-500/20 bg-amber-500/5"
                                                )}>
                                                    {trade.status}
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>

            </div>
        </div>
    );
}
