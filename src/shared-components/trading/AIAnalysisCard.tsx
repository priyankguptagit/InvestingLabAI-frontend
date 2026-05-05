"use client";

import React from "react";
import { motion } from "framer-motion";
import {
    TrendingUp,
    TrendingDown,
    AlertTriangle,
    CheckCircle2,
    Target,
    Shield,
    Brain,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { AIAnalysis } from "@/lib/types/trading.types";

interface AIAnalysisCardProps {
    analysis: AIAnalysis | null;
    loading?: boolean;
}

export const AIAnalysisCard: React.FC<AIAnalysisCardProps> = ({
    analysis,
    loading = false,
}) => {
    if (loading) {
        return (
            <div className="bg-[#0B1121] border border-white/10 rounded-xl p-6">
                <div className="flex items-center gap-3 mb-4">
                    <Brain className="h-5 w-5 text-cyan-400 animate-pulse" />
                    <h3 className="font-semibold text-white">AI Analysis</h3>
                </div>
                <div className="space-y-3">
                    <div className="h-4 bg-white/5 rounded animate-pulse" />
                    <div className="h-4 bg-white/5 rounded animate-pulse w-3/4" />
                    <div className="h-20 bg-white/5 rounded animate-pulse" />
                </div>
            </div>
        );
    }

    if (!analysis) {
        return (
            <div className="bg-[#0B1121] border border-white/10 rounded-xl p-6">
                <div className="flex items-center gap-3 mb-4">
                    <Brain className="h-5 w-5 text-slate-400" />
                    <h3 className="font-semibold text-white">AI Analysis</h3>
                </div>
                <p className="text-sm text-slate-500">
                    AI analysis unavailable for this stock
                </p>
            </div>
        );
    }

    const { recommendation, confidenceScore, riskLevel, reasoning, keyFactors } =
        analysis;

    // Recommendation colors and icons
    const getRecommendationStyle = () => {
        switch (recommendation) {
            case "BUY":
                return {
                    color: "text-emerald-400",
                    bg: "bg-emerald-500/10",
                    border: "border-emerald-500/20",
                    icon: TrendingUp,
                };
            case "SELL":
                return {
                    color: "text-red-400",
                    bg: "bg-red-500/10",
                    border: "border-red-500/20",
                    icon: TrendingDown,
                };
            case "HOLD":
                return {
                    color: "text-amber-400",
                    bg: "bg-amber-500/10",
                    border: "border-amber-500/20",
                    icon: CheckCircle2,
                };
        }
    };

    const getRiskStyle = () => {
        switch (riskLevel) {
            case "LOW":
                return { color: "text-emerald-400", bg: "bg-emerald-500/10" };
            case "MEDIUM":
                return { color: "text-amber-400", bg: "bg-amber-500/10" };
            case "HIGH":
                return { color: "text-red-400", bg: "bg-red-500/10" };
        }
    };

    const recStyle = getRecommendationStyle();
    const riskStyle = getRiskStyle();
    const RecIcon = recStyle.icon;

    // Signal bar position (0 = Strong Sell, 100 = Strong Buy)
    const getSignalPosition = () => {
        if (recommendation === "SELL") return 15;
        if (recommendation === "HOLD") return 50;
        if (recommendation === "BUY") return 85;
        return 50;
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-[#0B1121] border border-white/10 rounded-xl p-6 space-y-6"
        >
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <Brain className="h-5 w-5 text-cyan-400" />
                    <h3 className="font-semibold text-white">AI Analysis</h3>
                </div>
                <div
                    className={cn(
                        "px-3 py-1.5 rounded-full text-xs font-bold border flex items-center gap-2",
                        recStyle.bg,
                        recStyle.border,
                        recStyle.color
                    )}
                >
                    <RecIcon size={14} />
                    {recommendation}
                </div>
            </div>

            {/* Confidence Score */}
            <div>
                <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-slate-400 font-medium">
                        Confidence Score
                    </span>
                    <span className="text-sm font-bold text-white">
                        {confidenceScore}%
                    </span>
                </div>
                <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                    <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${confidenceScore}%` }}
                        transition={{ duration: 1, ease: "easeOut" }}
                        className={cn(
                            "h-full rounded-full",
                            confidenceScore >= 70
                                ? "bg-emerald-500"
                                : confidenceScore >= 40
                                    ? "bg-amber-500"
                                    : "bg-red-500"
                        )}
                    />
                </div>
            </div>

            {/* Risk Level */}
            <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400 font-medium">Risk Level</span>
                <div
                    className={cn(
                        "px-3 py-1 rounded-md text-xs font-bold flex items-center gap-2",
                        riskStyle.bg,
                        riskStyle.color
                    )}
                >
                    <Shield size={12} />
                    {riskLevel}
                </div>
            </div>

            {/* Signal Bar */}
            <div>
                <div className="text-xs text-slate-400 font-medium mb-3">
                    Sentiment Analysis
                </div>
                <div className="relative h-8">
                    {/* Gradient bar */}
                    <div className="absolute inset-0 rounded-lg overflow-hidden">
                        <div className="w-full h-full bg-gradient-to-r from-red-500 via-amber-500 to-emerald-500 opacity-20" />
                    </div>
                    {/* Labels */}
                    <div className="absolute inset-0 flex items-center justify-between px-2 text-[10px] font-bold">
                        <span className="text-red-400">Strong Sell</span>
                        <span className="text-amber-400">Hold</span>
                        <span className="text-emerald-400">Strong Buy</span>
                    </div>
                    {/* Indicator */}
                    <motion.div
                        initial={{ left: "50%" }}
                        animate={{ left: `${getSignalPosition()}%` }}
                        transition={{ duration: 0.8, ease: "easeOut" }}
                        className="absolute top-0 -translate-x-1/2 h-full w-1 bg-white rounded-full shadow-lg"
                    >
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full shadow-md" />
                    </motion.div>
                </div>
            </div>

            {/* Reasoning */}
            {reasoning && (
                <div>
                    <div className="text-xs text-slate-400 font-medium mb-2">
                        Analysis Reasoning
                    </div>
                    <p className="text-sm text-slate-300 leading-relaxed">{reasoning}</p>
                </div>
            )}

            {/* Key Factors */}
            {keyFactors && keyFactors.length > 0 && (
                <div>
                    <div className="text-xs text-slate-400 font-medium mb-3">
                        Key Factors
                    </div>
                    <div className="space-y-2">
                        {keyFactors.map((factor, index) => (
                            <div key={index} className="flex items-start gap-2">
                                <div className="mt-1 h-1.5 w-1.5 rounded-full bg-cyan-400 flex-shrink-0" />
                                <span className="text-xs text-slate-300">{factor}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Price Targets */}
            {(analysis.suggestedPrice || analysis.stopLoss || analysis.target) && (
                <div className="grid grid-cols-3 gap-3 pt-4 border-t border-white/5">
                    {analysis.suggestedPrice && (
                        <div className="text-center">
                            <div className="text-[10px] text-slate-500 uppercase font-bold mb-1">
                                Entry
                            </div>
                            <div className="text-sm font-bold text-cyan-400">
                                ₹{analysis.suggestedPrice.toFixed(2)}
                            </div>
                        </div>
                    )}
                    {analysis.stopLoss && (
                        <div className="text-center">
                            <div className="text-[10px] text-slate-500 uppercase font-bold mb-1">
                                Stop Loss
                            </div>
                            <div className="text-sm font-bold text-red-400">
                                ₹{analysis.stopLoss.toFixed(2)}
                            </div>
                        </div>
                    )}
                    {analysis.target && (
                        <div className="text-center">
                            <div className="text-[10px] text-slate-500 uppercase font-bold mb-1">
                                Target
                            </div>
                            <div className="text-sm font-bold text-emerald-400">
                                ₹{analysis.target.toFixed(2)}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </motion.div>
    );
};
