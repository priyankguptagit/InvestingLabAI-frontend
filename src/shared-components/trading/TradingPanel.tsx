"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ShoppingCart, Loader2, AlertCircle, FileText, CheckCircle2, Minus, Plus, TrendingUp, TrendingDown, ChevronDown, ChevronUp } from "lucide-react";
import confetti from "canvas-confetti";
import { cn } from "@/lib/utils";
import { tradingApi } from "@/lib/api/trading.api";
import { TradeRequest, PortfolioHolding } from "@/lib/types/trading.types";

interface TradingPanelProps {
    symbol: string;
    stockName: string;
    currentPrice: number;
    userHolding?: PortfolioHolding | null;
    availableBalance: number;
    onTradeExecuted?: () => void;
    currentPlan?: string;
    isDark?: boolean;
}

export const TradingPanel: React.FC<TradingPanelProps> = ({
    symbol,
    stockName,
    currentPrice,
    userHolding,
    availableBalance,
    onTradeExecuted,
    currentPlan = 'Free',
    isDark = true,
}) => {
    const [tradeType, setTradeType] = useState<'BUY' | 'SELL'>('BUY');
    const [orderType, setOrderType] = useState<'MARKET' | 'LIMIT' | 'STOP_LOSS'>('MARKET');
    const [quantity, setQuantity] = useState<number>(1);
    const [limitPrice, setLimitPrice] = useState<string>('');
    const [stopLossPrice, setStopLossPrice] = useState<string>('');
    const [reason, setReason] = useState<string>('');
    const [showReason, setShowReason] = useState(false);
    
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [successState, setSuccessState] = useState<{ show: boolean, message: string, qty: number }>({ show: false, message: '', qty: 0 });

    // Instantly valid since reason is now fully optional for speed
    const isReasonValid = true;

    const effectivePrice = orderType === 'LIMIT' && limitPrice
        ? parseFloat(limitPrice)
        : currentPrice;
    const totalAmount = quantity * effectivePrice;

    const canBuy = tradeType === 'BUY' && totalAmount <= availableBalance;
    const canSell = tradeType === 'SELL' && userHolding && quantity <= userHolding.quantity;
    const isTradeValid = (tradeType === 'BUY' ? canBuy : canSell) && quantity > 0;

    const quickQuantities = [5, 10, 25, 50];

    const fireConfetti = () => {
        const end = Date.now() + 1.5 * 1000;
        const colors = tradeType === 'BUY' ? ['#10b981', '#34d399', '#059669'] : ['#f43f5e', '#fb7185', '#e11d48'];

        (function frame() {
            confetti({
                particleCount: 4,
                angle: 60,
                spread: 55,
                origin: { x: 0 },
                colors: colors
            });
            confetti({
                particleCount: 4,
                angle: 120,
                spread: 55,
                origin: { x: 1 },
                colors: colors
            });

            if (Date.now() < end) {
                requestAnimationFrame(frame);
            }
        }());
    };

    const handleExecuteTrade = async () => {
        setError(null);

        if (!isTradeValid) {
            setError(tradeType === 'BUY' ? 'Insufficient buying power' : 'Insufficient holdings to sell');
            return;
        }

        setLoading(true);
        try {
            const request: TradeRequest = { 
                symbol, 
                type: tradeType, 
                quantity, 
                orderType, 
                reason: reason.trim() || undefined, 
                expectedPrice: currentPrice 
            };
            if (orderType === 'LIMIT' && limitPrice) request.limitPrice = parseFloat(limitPrice);
            if (orderType === 'STOP_LOSS' && stopLossPrice) request.stopLossPrice = parseFloat(stopLossPrice);

            const response = await tradingApi.executeTrade(request);
            if (response.success) {
                const executedQty = quantity;
                setQuantity(1);
                setLimitPrice('');
                setStopLossPrice('');
                setReason('');
                setShowReason(false);
                
                // Fire achievement animations!
                fireConfetti();
                setSuccessState({ show: true, message: response.message, qty: executedQty });
                
                onTradeExecuted?.();
                
                setTimeout(() => setSuccessState({ show: false, message: '', qty: 0 }), 3500);
            }
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to execute trade');
        } finally {
            setLoading(false);
        }
    };

    // Premium UI tokens
    const bg = isDark ? 'bg-[#0B1121]' : 'bg-white';
    const cardBg = isDark ? 'bg-white/[0.02]' : 'bg-slate-50';
    const border = isDark ? 'border-white/10' : 'border-slate-200';
    const textMuted = isDark ? 'text-slate-400' : 'text-slate-500';
    const textBase = isDark ? 'text-slate-200' : 'text-slate-700';
    const textStrong = isDark ? 'text-white' : 'text-slate-900';

    return (
        <div className="relative w-full h-full flex flex-col min-h-[500px]">
            <AnimatePresence>
                {successState.show && (
                    <motion.div 
                        initial={{ opacity: 0, y: 20, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -20, scale: 0.95 }}
                        className="absolute inset-0 z-50 flex flex-col items-center justify-center p-6 rounded-2xl overflow-hidden backdrop-blur-xl"
                        style={{ background: isDark ? 'rgba(11, 17, 33, 0.85)' : 'rgba(255, 255, 255, 0.85)' }}
                    >
                        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-emerald-500/10 pointer-events-none" />
                        <motion.div 
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ type: "spring", bounce: 0.5, delay: 0.1 }}
                            className={cn(
                                "w-24 h-24 rounded-full flex items-center justify-center mb-6 shadow-2xl",
                                tradeType === 'BUY' ? "bg-emerald-500/20 text-emerald-500" : "bg-blue-500/20 text-blue-500"
                            )}
                        >
                            <CheckCircle2 className="w-12 h-12" />
                        </motion.div>
                        <h2 className={cn("text-3xl font-black mb-2 text-center", textStrong)}>Order Filled!</h2>
                        <p className={cn("text-center text-lg font-medium", textMuted)}>
                            Successfully {tradeType === 'BUY' ? 'purchased' : 'sold'} <span className={cn("font-bold", textBase)}>{successState.qty} shares</span> of {symbol}.
                        </p>
                    </motion.div>
                )}
            </AnimatePresence>

            {currentPlan === 'Free' ? (
                <div className="flex-1 flex flex-col items-center justify-center p-8 rounded-2xl border border-red-500/20 bg-red-500/5 text-center">
                    <AlertCircle className="w-12 h-12 text-red-400 mb-4 opacity-80" />
                    <h4 className="text-xl font-black text-red-400 mb-2">Paper Trading Locked</h4>
                    <p className={cn("text-sm", textMuted)}>You need a Silver, Gold, or Diamond plan to access the live trading terminal.</p>
                </div>
            ) : (
                <div className="flex-1 flex flex-col space-y-6">
                    {/* Modern Segmented Control for Buy/Sell */}
                    <div className={cn("relative flex p-1 rounded-xl bg-slate-900/10", border, isDark ? "bg-black/40" : "bg-slate-100")}>
                        <button 
                            onClick={() => setTradeType('BUY')} 
                            className={cn(
                                "relative flex-1 py-3 text-sm font-bold rounded-lg transition-colors z-10",
                                tradeType === 'BUY' ? "text-emerald-500" : textMuted
                            )}
                        >
                            BUY
                        </button>
                        <button 
                            onClick={() => setTradeType('SELL')} 
                            className={cn(
                                "relative flex-1 py-3 text-sm font-bold rounded-lg transition-colors z-10 disabled:opacity-30",
                                tradeType === 'SELL' ? "text-red-500" : textMuted
                            )}
                            disabled={!userHolding || userHolding.quantity === 0}
                        >
                            SELL
                        </button>
                        {/* Animated sliding background indicator */}
                        <motion.div
                            className={cn(
                                "absolute top-1 bottom-1 w-[calc(50%-4px)] rounded-lg shadow-sm border",
                                tradeType === 'BUY' ? "bg-emerald-500/10 border-emerald-500/20" : "bg-red-500/10 border-red-500/20"
                            )}
                            animate={{ left: tradeType === 'BUY' ? '4px' : 'calc(50% + 4px)' }}
                            transition={{ type: "spring", stiffness: 300, damping: 25 }}
                        />
                    </div>

                    {/* Quantity Control - Massive typography for focus */}
                    <div className="flex flex-col items-center justify-center py-4">
                        <label className={cn("text-xs font-bold uppercase tracking-wider mb-4", textMuted)}>Quantity</label>
                        <div className="flex items-center gap-6">
                            <button 
                                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                                className={cn("w-12 h-12 flex items-center justify-center rounded-full border transition-colors hover:bg-white/5 active:scale-95", border, textMuted)}
                            >
                                <Minus className="w-5 h-5" />
                            </button>
                            <div className="relative group">
                                <input 
                                    type="number" 
                                    min="1" 
                                    value={quantity} 
                                    onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))} 
                                    className={cn(
                                        "w-28 text-center text-5xl font-black bg-transparent focus:outline-none focus:ring-0 p-0 m-0",
                                        textStrong
                                    )} 
                                />
                                <div className={cn("absolute -bottom-2 left-0 right-0 h-0.5 scale-x-0 group-focus-within:scale-x-100 transition-transform origin-center", tradeType === 'BUY' ? 'bg-emerald-500' : 'bg-red-500')} />
                            </div>
                            <button 
                                onClick={() => setQuantity(quantity + 1)}
                                className={cn("w-12 h-12 flex items-center justify-center rounded-full border transition-colors hover:bg-white/5 active:scale-95", border, textMuted)}
                            >
                                <Plus className="w-5 h-5" />
                            </button>
                        </div>
                        
                        {/* Quick amount chips */}
                        <div className="flex gap-2 mt-6">
                            {quickQuantities.map((q) => (
                                <button 
                                    key={q} 
                                    onClick={() => setQuantity(q)} 
                                    className={cn(
                                        "px-4 py-1.5 rounded-full text-xs font-medium border transition-colors hover:bg-white/5 active:scale-95",
                                        quantity === q ? (isDark ? "bg-white/10 text-white border-white/20" : "bg-slate-200 text-slate-900 border-slate-300") : cn(border, textMuted)
                                    )}
                                >
                                    +{q}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Order Details & Summary */}
                    <div className={cn("rounded-2xl border p-5 flex flex-col gap-3", border, cardBg)}>
                        <div className="flex justify-between items-center">
                            <span className={cn("text-sm font-medium", textMuted)}>Order Type</span>
                            <div className={cn("flex gap-1 p-1 rounded-lg border", border, isDark ? "bg-black/20" : "bg-white")}>
                                {(['MARKET', 'LIMIT'] as const).map((type) => (
                                    <button 
                                        key={type} 
                                        onClick={() => setOrderType(type)} 
                                        className={cn(
                                            "px-3 py-1 text-xs font-bold rounded-md transition-all",
                                            orderType === type 
                                                ? (isDark ? "bg-white/10 text-white" : "bg-slate-100 text-slate-900 shadow-sm") 
                                                : cn("text-transparent bg-clip-text bg-gradient-to-r", textMuted)
                                        )}
                                    >
                                        {type}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {orderType === 'LIMIT' && (
                            <div className="flex justify-between items-center pt-2 border-t border-white/5">
                                <span className={cn("text-sm font-medium", textMuted)}>Limit Price</span>
                                <input 
                                    type="number" 
                                    step="0.01" 
                                    value={limitPrice} 
                                    onChange={(e) => setLimitPrice(e.target.value)} 
                                    placeholder={`₹${currentPrice.toFixed(2)}`} 
                                    className={cn("w-28 px-3 py-1.5 text-right text-sm font-bold border rounded-lg focus:outline-none focus:ring-1 focus:ring-primary bg-transparent", border, textStrong)} 
                                />
                            </div>
                        )}

                        <div className="flex justify-between items-center pt-2 border-t border-white/5">
                            <span className={cn("text-sm font-medium", textMuted)}>Available {tradeType === 'BUY' ? 'Funds' : 'Shares'}</span>
                            <span className={cn("text-sm font-bold", tradeType === 'BUY' ? (totalAmount > availableBalance ? 'text-red-500' : textBase) : textBase)}>
                                {tradeType === 'BUY' ? `₹${availableBalance.toLocaleString()}` : `${userHolding?.quantity || 0} Shares`}
                            </span>
                        </div>
                    </div>

                    {/* Optional Reason Accordion - Making trading FAST by hiding it */}
                    <div className="flex flex-col">
                        <button 
                            onClick={() => setShowReason(!showReason)}
                            className={cn("flex items-center gap-2 text-xs font-bold transition-colors mb-2 w-fit", textMuted, "hover:text-primary")}
                        >
                            <FileText className="w-3.5 h-3.5" />
                            {showReason ? "Hide Trade Note" : "Add Trade Note (Optional)"}
                            {showReason ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                        </button>
                        
                        <AnimatePresence>
                            {showReason && (
                                <motion.div 
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: "auto", opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    className="overflow-hidden"
                                >
                                    <textarea
                                        value={reason}
                                        onChange={(e) => setReason(e.target.value)}
                                        placeholder="Optional: Why are you making this trade?"
                                        rows={2}
                                        className={cn('w-full px-4 py-3 border rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-primary resize-none transition-colors mb-4', isDark ? 'bg-black/20 text-white' : 'bg-white text-slate-900', border)}
                                    />
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    {error && (
                        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-xl">
                            <AlertCircle className="h-4 w-4 text-red-500" />
                            <span className="text-sm font-medium text-red-500">{error}</span>
                        </motion.div>
                    )}

                    <div className="mt-auto pt-4 flex flex-col gap-3">
                        <div className="flex justify-between items-end">
                            <div className="flex flex-col">
                                <span className={cn("text-xs font-bold uppercase tracking-wider", textMuted)}>Total Amount</span>
                                <span className={cn("text-[10px]", textMuted)}>~{quantity} × ₹{effectivePrice.toFixed(2)}</span>
                            </div>
                            <span className={cn("text-3xl font-black tracking-tight", textStrong)}>
                                ₹{totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </span>
                        </div>

                        <button
                            onClick={handleExecuteTrade}
                            disabled={!isTradeValid || loading}
                            className={cn(
                                'w-full py-5 rounded-xl font-black text-lg transition-all flex items-center justify-center gap-2 shadow-xl hover:-translate-y-0.5 active:translate-y-0 disabled:transform-none',
                                isTradeValid && !loading
                                    ? tradeType === 'BUY'
                                        ? 'bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white shadow-emerald-500/20 border border-emerald-400/50'
                                        : 'bg-gradient-to-r from-red-500 to-rose-500 hover:from-red-400 hover:to-rose-400 text-white shadow-red-500/20 border border-red-400/50'
                                    : cn('cursor-not-allowed opacity-50 bg-slate-500/20 text-slate-400', border)
                            )}
                        >
                            {loading ? (
                                <><Loader2 className="h-6 w-6 animate-spin" /> Processing...</>
                            ) : (
                                tradeType === 'BUY' 
                                    ? <><TrendingUp className="h-6 w-6" /> Complete Purchase</> 
                                    : <><TrendingDown className="h-6 w-6" /> Complete Sale</>
                            )}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};
