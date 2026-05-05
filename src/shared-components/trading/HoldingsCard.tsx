"use client";

import React from "react";
import { motion } from "framer-motion";
import { TrendingUp, TrendingDown, Briefcase } from "lucide-react";
import { cn } from "@/lib/utils";
import { PortfolioHolding } from "@/lib/types/trading.types";

interface HoldingsCardProps {
    holding: PortfolioHolding | null;
    loading?: boolean;
}

export const HoldingsCard: React.FC<HoldingsCardProps> = ({
    holding,
    loading = false,
}) => {
    if (loading) {
        return (
            <div className="bg-[#0B1121] border border-white/10 rounded-xl p-6">
                <div className="flex items-center gap-3 mb-4">
                    <Briefcase className="h-5 w-5 text-cyan-400 animate-pulse" />
                    <h3 className="font-semibold text-white">Your Holdings</h3>
                </div>
                <div className="space-y-3">
                    <div className="h-4 bg-white/5 rounded animate-pulse" />
                    <div className="h-4 bg-white/5 rounded animate-pulse w-2/3" />
                </div>
            </div>
        );
    }

    if (!holding || holding.quantity === 0) {
        return (
            <div className="bg-[#0B1121] border border-white/10 rounded-xl p-6">
                <div className="flex items-center gap-3 mb-4">
                    <Briefcase className="h-5 w-5 text-slate-400" />
                    <h3 className="font-semibold text-white">Your Holdings</h3>
                </div>
                <p className="text-sm text-slate-500">
                    You don't own this stock yet. Place a buy order to start trading!
                </p>
            </div>
        );
    }

    const {
        quantity,
        averageBuyPrice,
        currentPrice,
        currentValue,
        totalInvested,
        unrealizedPL,
        unrealizedPLPercent,
    } = holding;

    const isProfit = unrealizedPL >= 0;

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-[#0B1121] border border-white/10 rounded-xl p-6 space-y-4"
        >
            {/* Header */}
            <div className="flex items-center gap-3">
                <Briefcase className="h-5 w-5 text-cyan-400" />
                <h3 className="font-semibold text-white">Your Holdings</h3>
            </div>

            {/* Quantity */}
            <div className="flex justify-between items-center">
                <span className="text-sm text-slate-400">Quantity Owned</span>
                <span className="text-lg font-bold text-white">{quantity} shares</span>
            </div>

            {/* Average Buy Price */}
            <div className="flex justify-between items-center">
                <span className="text-sm text-slate-400">Avg. Buy Price</span>
                <span className="text-sm font-medium text-white">
                    ₹{averageBuyPrice.toLocaleString()}
                </span>
            </div>

            {/* Current Price */}
            <div className="flex justify-between items-center">
                <span className="text-sm text-slate-400">Current Price</span>
                <span className="text-sm font-medium text-white">
                    ₹{currentPrice.toLocaleString()}
                </span>
            </div>

            {/* Divider */}
            <div className="border-t border-white/10" />

            {/* Current Value */}
            <div className="flex justify-between items-center">
                <span className="text-sm text-slate-400">Current Value</span>
                <span className="text-base font-bold text-white">
                    ₹{currentValue.toLocaleString()}
                </span>
            </div>

            {/* Invested Amount */}
            <div className="flex justify-between items-center">
                <span className="text-sm text-slate-400">Invested</span>
                <span className="text-sm font-medium text-slate-300">
                    ₹{totalInvested.toLocaleString()}
                </span>
            </div>

            {/* Unrealized P&L */}
            <div className={cn(
                "p-4 rounded-xl border",
                isProfit
                    ? "bg-emerald-500/10 border-emerald-500/20"
                    : "bg-red-500/10 border-red-500/20"
            )}>
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        {isProfit ? (
                            <TrendingUp className="h-5 w-5 text-emerald-400" />
                        ) : (
                            <TrendingDown className="h-5 w-5 text-red-400" />
                        )}
                        <span className="text-xs text-slate-400 font-medium">
                            Unrealized P&L
                        </span>
                    </div>
                    <div className="text-right">
                        <div className={cn(
                            "text-base font-bold",
                            isProfit ? "text-emerald-400" : "text-red-400"
                        )}>
                            {isProfit ? '+' : ''}₹{unrealizedPL.toLocaleString()}
                        </div>
                        <div className={cn(
                            "text-xs font-medium",
                            isProfit ? "text-emerald-400" : "text-red-400"
                        )}>
                            {isProfit ? '+' : ''}{unrealizedPLPercent.toFixed(2)}%
                        </div>
                    </div>
                </div>
            </div>
        </motion.div>
    );
};
