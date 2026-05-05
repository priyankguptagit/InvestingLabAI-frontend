"use client";

import React, { useState } from "react";
import { ShoppingCart, Loader2, AlertCircle, FileText } from "lucide-react";
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
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    const MIN_REASON_LENGTH = 50;
    const isReasonValid = reason.trim().length >= MIN_REASON_LENGTH;

    const effectivePrice = orderType === 'LIMIT' && limitPrice
        ? parseFloat(limitPrice)
        : currentPrice;
    const totalAmount = quantity * effectivePrice;

    const canBuy = tradeType === 'BUY' && totalAmount <= availableBalance;
    const canSell = tradeType === 'SELL' && userHolding && quantity <= userHolding.quantity;
    const isTradeValid = tradeType === 'BUY' ? canBuy : canSell;
    const isValid = isTradeValid && isReasonValid;

    const quickQuantities = [5, 10, 25, 50];

    const handleExecuteTrade = async () => {
        setError(null);
        setSuccess(null);

        if (!isValid) {
            setError(tradeType === 'BUY' ? 'Insufficient balance' : 'Insufficient holdings');
            return;
        }

        setLoading(true);
        try {
            const request: TradeRequest = { symbol, type: tradeType, quantity, orderType, reason: reason.trim() };
            if (orderType === 'LIMIT' && limitPrice) request.limitPrice = parseFloat(limitPrice);
            if (orderType === 'STOP_LOSS' && stopLossPrice) request.stopLossPrice = parseFloat(stopLossPrice);

            const response = await tradingApi.executeTrade(request);
            if (response.success) {
                setSuccess(response.message);
                setQuantity(1);
                setLimitPrice('');
                setStopLossPrice('');
                setReason('');
                onTradeExecuted?.();
                setTimeout(() => setSuccess(null), 3000);
            }
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to execute trade');
        } finally {
            setLoading(false);
        }
    };

    // Theme-aware class map
    const t = {
        label: isDark ? 'text-slate-400' : 'text-slate-600',
        text: isDark ? 'text-white' : 'text-slate-900',
        inputBg: isDark ? 'bg-white/5' : 'bg-white',
        inputBorder: isDark ? 'border-white/10' : 'border-slate-300',
        inputText: isDark ? 'text-white' : 'text-slate-900',
        inputPh: isDark ? 'placeholder:text-slate-600' : 'placeholder:text-slate-400',
        summaryBg: isDark ? 'bg-white/5' : 'bg-slate-50',
        summaryBorder: isDark ? 'border-white/10' : 'border-slate-200',
        divider: isDark ? 'border-white/10' : 'border-slate-200',
        qtyBtn: isDark
            ? 'bg-white/5 border-white/5 text-slate-400 hover:bg-white/10 hover:text-white'
            : 'bg-slate-100 border-slate-200 text-slate-600 hover:bg-slate-200 hover:text-slate-900',
        orderBtn: (active: boolean) => active
            ? 'bg-cyan-500/20 text-cyan-600 border border-cyan-500/50'
            : isDark
                ? 'bg-white/5 text-slate-400 border border-white/5 hover:bg-white/10'
                : 'bg-slate-100 text-slate-600 border border-slate-200 hover:bg-slate-200',
        tradeBtn: (active: boolean, type: 'buy' | 'sell') => {
            if (active) return type === 'buy'
                ? 'bg-emerald-500/20 text-emerald-600 border-2 border-emerald-500/50'
                : 'bg-red-500/20 text-red-500 border-2 border-red-500/50';
            return isDark
                ? 'bg-white/5 text-slate-400 border border-white/10 hover:bg-white/10'
                : 'bg-slate-100 text-slate-600 border border-slate-200 hover:bg-slate-200';
        },
        disabledBtn: isDark ? 'bg-white/5 text-slate-500' : 'bg-slate-100 text-slate-400',
    };

    const inputClass = cn('w-full px-4 py-3 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/50', t.inputBg, t.inputBorder, t.inputText, t.inputPh);

    return (
        <div className="space-y-6">
            {currentPlan === 'Free' ? (
                <div className="rounded-2xl border border-red-500/20 bg-red-500/5 p-5 text-center flex flex-col items-center justify-center">
                    <AlertCircle className="w-8 h-8 text-red-400 mb-3" />
                    <h4 className="text-red-400 font-bold mb-2">Paper Trading Locked</h4>
                    <p className="text-slate-400 text-sm mb-4">You need a Silver, Gold, or Diamond plan to access Paper Trading.</p>
                </div>
            ) : (
                <>
                    {/* Buy / Sell toggle */}
                    <div className="flex gap-2">
                        <button onClick={() => setTradeType('BUY')} className={cn('flex-1 py-3 px-4 rounded-xl font-bold text-sm transition-all', t.tradeBtn(tradeType === 'BUY', 'buy'))}>Buy</button>
                        <button onClick={() => setTradeType('SELL')} className={cn('flex-1 py-3 px-4 rounded-xl font-bold text-sm transition-all', t.tradeBtn(tradeType === 'SELL', 'sell'))} disabled={!userHolding || userHolding.quantity === 0}>Sell</button>
                    </div>

                    {/* Order Type */}
                    <div>
                        <label className={cn('text-xs font-medium mb-2 block', t.label)}>Order Type</label>
                        <div className="flex gap-2">
                            {(['MARKET', 'LIMIT', 'STOP_LOSS'] as const).map((type) => (
                                <button key={type} onClick={() => setOrderType(type)} className={cn('flex-1 py-2 px-3 rounded-lg text-xs font-medium transition-all', t.orderBtn(orderType === type))}>
                                    {type === 'MARKET' ? 'Market' : type === 'LIMIT' ? 'Limit' : 'Stop Loss'}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Quantity */}
                    <div>
                        <label className={cn('text-xs font-medium mb-2 block', t.label)}>Quantity</label>
                        <input type="number" min="1" value={quantity} onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))} className={inputClass} />
                        <div className="flex gap-2 mt-2">
                            {quickQuantities.map((q) => (
                                <button key={q} onClick={() => setQuantity(q)} className={cn('flex-1 py-1.5 px-3 border rounded-md text-xs transition-all', t.qtyBtn)}>{q}</button>
                            ))}
                        </div>
                    </div>

                    {/* Limit Price */}
                    {orderType === 'LIMIT' && (
                        <div>
                            <label className={cn('text-xs font-medium mb-2 block', t.label)}>Limit Price (₹)</label>
                            <input type="number" step="0.01" value={limitPrice} onChange={(e) => setLimitPrice(e.target.value)} placeholder={currentPrice.toFixed(2)} className={inputClass} />
                        </div>
                    )}

                    {/* Stop Loss Price */}
                    {orderType === 'STOP_LOSS' && (
                        <div>
                            <label className={cn('text-xs font-medium mb-2 block', t.label)}>Stop Loss Price (₹)</label>
                            <input type="number" step="0.01" value={stopLossPrice} onChange={(e) => setStopLossPrice(e.target.value)} placeholder={(currentPrice * 0.95).toFixed(2)} className={inputClass} />
                        </div>
                    )}

                    {/* Reason / Thesis */}
                    <div>
                        <label className={cn('text-xs font-medium mb-2 flex items-center gap-1.5', t.label)}>
                            <FileText className="w-3.5 h-3.5" />
                            Trading Reason / Thesis
                            <span className="text-red-400">*</span>
                        </label>
                        <textarea
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            placeholder={tradeType === 'BUY'
                                ? "Why are you buying this stock? Explain your thesis (min 50 characters)..."
                                : "Why are you selling this stock? Explain your reasoning (min 50 characters)..."}
                            rows={3}
                            maxLength={1000}
                            className={cn('w-full px-4 py-3 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/50 resize-none', t.inputBg, t.inputBorder, t.inputText, t.inputPh)}
                        />
                        <div className="flex justify-between items-center mt-1.5">
                            <span className={cn('text-xs font-medium transition-colors', isReasonValid ? 'text-emerald-500' : 'text-amber-500')}>
                                {isReasonValid ? '✓ Valid reason' : 'Min 50 chars required'}
                            </span>
                            <span className={cn('text-xs font-medium tabular-nums transition-colors', isReasonValid ? 'text-emerald-500' : 'text-amber-500')}>
                                {reason.length} / 1000
                            </span>
                        </div>
                    </div>

                    {/* Order Summary */}
                    <div className={cn('border rounded-xl p-4 space-y-3', t.summaryBg, t.summaryBorder)}>
                        <div className={cn('text-xs font-bold uppercase mb-3', t.label)}>Order Summary</div>
                        <div className="flex justify-between text-sm">
                            <span className={t.label}>Stock Price</span>
                            <span className={cn('font-medium', t.text)}>₹{currentPrice.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className={t.label}>Quantity</span>
                            <span className={cn('font-medium', t.text)}>{quantity}</span>
                        </div>
                        <div className={cn('flex justify-between text-sm pt-3 border-t', t.divider)}>
                            <span className={cn('font-bold', t.label)}>Total Amount</span>
                            <span className={cn('font-bold', t.text)}>₹{totalAmount.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between text-xs">
                            <span className={t.label}>Available Balance</span>
                            <span className={cn('font-medium', totalAmount > availableBalance ? 'text-red-500' : 'text-emerald-500')}>
                                ₹{availableBalance.toLocaleString()}
                            </span>
                        </div>
                    </div>

                    {/* Error / Success */}
                    {error && (
                        <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                            <AlertCircle className="h-4 w-4 text-red-400" />
                            <span className="text-sm text-red-400">{error}</span>
                        </div>
                    )}
                    {success && (
                        <div className="flex items-center gap-2 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
                            <ShoppingCart className="h-4 w-4 text-emerald-400" />
                            <span className="text-sm text-emerald-400">{success}</span>
                        </div>
                    )}

                    {/* Execute Button */}
                    <button
                        onClick={handleExecuteTrade}
                        disabled={!isValid || loading}
                        className={cn(
                            'w-full py-4 px-6 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2',
                            isValid && !loading
                                ? tradeType === 'BUY'
                                    ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                                    : 'bg-red-600 hover:bg-red-700 text-white'
                                : cn('cursor-not-allowed opacity-50', t.disabledBtn)
                        )}
                    >
                        {loading ? (
                            <><Loader2 className="h-5 w-5 animate-spin" />Executing...</>
                        ) : (
                            <><ShoppingCart className="h-5 w-5" />Execute {tradeType === 'BUY' ? 'Buy' : 'Sell'} Order</>
                        )}
                    </button>
                </>
            )}
        </div>
    );
};
