"use client";

import React, { useState, useEffect, useMemo } from 'react';
import {
    X, Loader2, TrendingUp, TrendingDown, DollarSign,
    PieChart, ChevronDown, ChevronRight, History,
    ArrowDownRight, ArrowUpRight, Calendar, BarChart3,
    Layers, Package, Info
} from 'lucide-react';
import { organizationApi } from '@/lib/api';

interface ViewPortfolioModalProps {
    isOpen: boolean;
    onClose: () => void;
    student: any;
}

export default function ViewPortfolioModal({ isOpen, onClose, student }: ViewPortfolioModalProps) {
    const [portfolio, setPortfolio] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Track which rows are expanded by their symbol
    const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

    useEffect(() => {
        if (isOpen && student) {
            fetchPortfolio();
            // Reset expanded rows when a new student is viewed
            setExpandedRows(new Set());
        }
    }, [isOpen, student]);

    const fetchPortfolio = async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await organizationApi.getStudentPortfolio(student._id);
            if (response.success) {
                setPortfolio(response.portfolio);
            }
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to fetch portfolio');
        } finally {
            setLoading(false);
        }
    };

    const toggleRow = (symbol: string) => {
        const newExpanded = new Set(expandedRows);
        if (newExpanded.has(symbol)) {
            newExpanded.delete(symbol);
        } else {
            newExpanded.add(symbol);
        }
        setExpandedRows(newExpanded);
    };

    // Compute transaction summary for a holding
    const getTransactionSummary = useMemo(() => {
        return (transactions: any[]) => {
            if (!transactions || transactions.length === 0) return null;
            const totalBuys = transactions.filter((t: any) => t.type === 'BUY').reduce((s: number, t: any) => s + t.quantity, 0);
            const totalSells = transactions.filter((t: any) => t.type === 'SELL').reduce((s: number, t: any) => s + t.quantity, 0);
            const buyCount = transactions.filter((t: any) => t.type === 'BUY').length;
            const sellCount = transactions.filter((t: any) => t.type === 'SELL').length;
            return { totalBuys, totalSells, buyCount, sellCount };
        };
    }, []);

    if (!isOpen || !student) return null;

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 2
        }).format(value);
    };

    const formatDate = (dateString: string) => {
        return new Intl.DateTimeFormat('en-IN', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        }).format(new Date(dateString));
    };

    const getPLColor = (pl: number) => {
        if (pl > 0) return 'text-emerald-400';
        if (pl < 0) return 'text-red-400';
        return 'text-slate-400';
    };

    const getPLBg = (pl: number) => {
        if (pl > 0) return 'bg-emerald-500/10';
        if (pl < 0) return 'bg-red-500/10';
        return 'bg-slate-500/10';
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-200">
            <div className="bg-[#0F172A] border border-white/10 rounded-2xl w-full max-w-6xl max-h-[90vh] flex flex-col shadow-2xl shadow-black/50 scale-100 animate-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-white/5 bg-gradient-to-r from-slate-900/80 via-indigo-950/30 to-slate-900/80 rounded-t-2xl">
                    <div>
                        <h2 className="text-xl font-bold text-white flex items-center gap-2.5">
                            <div className="p-1.5 bg-indigo-500/20 rounded-lg">
                                <PieChart className="w-5 h-5 text-indigo-400" />
                            </div>
                            Portfolio Analysis
                        </h2>
                        <p className="text-sm text-slate-400 mt-1.5 ml-0.5">
                            Viewing portfolio for <span className="text-indigo-300 font-medium">{student.name}</span>
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2.5 bg-white/5 hover:bg-white/10 rounded-xl text-slate-400 hover:text-white transition-all duration-200 hover:rotate-90"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-20">
                            <div className="relative">
                                <div className="absolute inset-0 rounded-full bg-indigo-500/20 blur-xl animate-pulse" />
                                <Loader2 className="w-12 h-12 text-indigo-500 animate-spin relative" />
                            </div>
                            <p className="text-slate-400 font-medium mt-6">Analyzing portfolio data...</p>
                            <p className="text-slate-500 text-sm mt-1">Fetching holdings & transaction history</p>
                        </div>
                    ) : error ? (
                        <div className="p-5 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-center flex items-center justify-center gap-3">
                            <TrendingDown className="w-5 h-5 flex-shrink-0" />
                            <span>{error}</span>
                        </div>
                    ) : portfolio ? (
                        <div className="space-y-8">
                            {/* Summary Cards */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                                {/* Total Holdings Card */}
                                <div className="p-5 rounded-xl bg-gradient-to-br from-indigo-500/10 via-slate-800/50 to-slate-900/50 border border-indigo-500/10 relative overflow-hidden group hover:border-indigo-500/20 transition-colors">
                                    <div className="absolute top-3 right-3 opacity-10 group-hover:opacity-20 transition-opacity">
                                        <Layers className="w-10 h-10 text-indigo-400" />
                                    </div>
                                    <p className="text-slate-400 text-xs uppercase tracking-wider font-semibold mb-2">Holdings</p>
                                    <p className="text-3xl font-bold text-white tracking-tight">{portfolio.summary?.totalHoldings || 0}</p>
                                    <p className="text-xs text-slate-500 mt-1">Active stocks</p>
                                </div>

                                {/* Total Invested Card */}
                                <div className="p-5 rounded-xl bg-gradient-to-br from-slate-800/50 to-slate-900/50 border border-white/5 relative overflow-hidden group hover:border-white/10 transition-colors">
                                    <div className="absolute top-3 right-3 opacity-10 group-hover:opacity-20 transition-opacity">
                                        <Package className="w-10 h-10 text-slate-300" />
                                    </div>
                                    <p className="text-slate-400 text-xs uppercase tracking-wider font-semibold mb-2">Total Invested</p>
                                    <p className="text-2xl font-bold text-white tracking-tight">{formatCurrency(portfolio.summary?.totalInvested || 0)}</p>
                                </div>

                                {/* Current Value Card */}
                                <div className="p-5 rounded-xl bg-gradient-to-br from-slate-800/50 to-slate-900/50 border border-white/5 relative overflow-hidden group hover:border-white/10 transition-colors">
                                    <div className="absolute top-3 right-3 opacity-10 group-hover:opacity-20 transition-opacity">
                                        <BarChart3 className="w-10 h-10 text-slate-300" />
                                    </div>
                                    <p className="text-slate-400 text-xs uppercase tracking-wider font-semibold mb-2">Current Value</p>
                                    <p className="text-2xl font-bold text-white tracking-tight">{formatCurrency(portfolio.summary?.currentValue || 0)}</p>
                                </div>

                                {/* Total P&L Card */}
                                <div className={`p-5 rounded-xl border relative overflow-hidden group transition-colors
                                    ${(portfolio.summary?.totalPL || 0) >= 0
                                        ? 'bg-gradient-to-br from-emerald-500/10 via-slate-800/50 to-slate-900/50 border-emerald-500/10 hover:border-emerald-500/20'
                                        : 'bg-gradient-to-br from-red-500/10 via-slate-800/50 to-slate-900/50 border-red-500/10 hover:border-red-500/20'
                                    }`}>
                                    <div className="absolute top-3 right-3 opacity-10 group-hover:opacity-20 transition-opacity">
                                        {(portfolio.summary?.totalPL || 0) >= 0
                                            ? <TrendingUp className="w-10 h-10 text-emerald-400" />
                                            : <TrendingDown className="w-10 h-10 text-red-400" />}
                                    </div>
                                    <p className="text-slate-400 text-xs uppercase tracking-wider font-semibold mb-2">Total P&L</p>
                                    <p className={`text-2xl font-bold ${getPLColor(portfolio.summary?.totalPL || 0)} flex items-center gap-2 tracking-tight`}>
                                        {(portfolio.summary?.totalPL || 0) >= 0 ? <TrendingUp className="w-5 h-5" /> : <TrendingDown className="w-5 h-5" />}
                                        {formatCurrency(Math.abs(portfolio.summary?.totalPL || 0))}
                                    </p>
                                </div>

                                {/* Return % Card */}
                                <div className={`p-5 rounded-xl border relative overflow-hidden group transition-colors
                                    ${(portfolio.summary?.totalPLPercentage || portfolio.summary?.totalPLPercent || 0) >= 0
                                        ? 'bg-gradient-to-br from-emerald-500/5 via-slate-800/50 to-slate-900/50 border-emerald-500/10 hover:border-emerald-500/20'
                                        : 'bg-gradient-to-br from-red-500/5 via-slate-800/50 to-slate-900/50 border-red-500/10 hover:border-red-500/20'
                                    }`}>
                                    <p className="text-slate-400 text-xs uppercase tracking-wider font-semibold mb-2">Return</p>
                                    <div className={`inline-flex items-center px-3 py-1 rounded-full text-xl font-bold mt-1 
                                        ${(portfolio.summary?.totalPLPercentage || portfolio.summary?.totalPLPercent || 0) >= 0
                                            ? 'bg-emerald-500/15 text-emerald-400'
                                            : 'bg-red-500/15 text-red-400'}`}>
                                        {(portfolio.summary?.totalPLPercentage || portfolio.summary?.totalPLPercent || 0) > 0 ? '+' : ''}
                                        {(portfolio.summary?.totalPLPercentage || portfolio.summary?.totalPLPercent || 0).toFixed(2)}%
                                    </div>
                                </div>
                            </div>

                            {/* Holdings Table */}
                            <div>
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                                        <BarChart3 className="w-5 h-5 text-indigo-400" />
                                        Holdings Breakdown
                                    </h3>
                                    <span className="text-xs font-medium px-3 py-1.5 bg-indigo-500/10 border border-indigo-500/20 rounded-full text-indigo-300 flex items-center gap-1.5">
                                        <ChevronDown className="w-3 h-3" />
                                        Click a row to view history
                                    </span>
                                </div>

                                {portfolio.holdings && portfolio.holdings.length > 0 ? (
                                    <div className="rounded-xl border border-white/5 bg-slate-900/30 overflow-hidden shadow-xl">
                                        <div className="overflow-x-auto">
                                            <table className="w-full text-left border-collapse min-w-[800px]">
                                                <thead className="bg-gradient-to-r from-slate-800/80 to-slate-800/60 text-xs uppercase text-slate-400 font-semibold tracking-wider">
                                                    <tr>
                                                        <th className="p-4 w-12"></th>
                                                        <th className="p-4">Stock</th>
                                                        <th className="p-4 text-right">Qty</th>
                                                        <th className="p-4 text-right">Avg. Price</th>
                                                        <th className="p-4 text-right">Current Price</th>
                                                        <th className="p-4 text-right">Invested</th>
                                                        <th className="p-4 text-right">Current Value</th>
                                                        <th className="p-4 text-right">P&L</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-white/5 text-sm">
                                                    {portfolio.holdings.map((holding: any, idx: number) => {
                                                        const isExpanded = expandedRows.has(holding.symbol);
                                                        const pl = holding.pl ?? holding.unrealizedPL ?? (holding.currentValue - holding.totalInvested);
                                                        const plPercent = holding.plPercentage ?? holding.unrealizedPLPercent ?? (holding.totalInvested > 0 ? ((holding.currentValue - holding.totalInvested) / holding.totalInvested) * 100 : 0);
                                                        const txnSummary = getTransactionSummary(holding.transactions);

                                                        return (
                                                            <React.Fragment key={idx}>
                                                                {/* Main Holding Row */}
                                                                <tr
                                                                    onClick={() => toggleRow(holding.symbol)}
                                                                    className={`cursor-pointer transition-all duration-200 group
                                                                        ${isExpanded
                                                                            ? 'bg-indigo-500/[0.07] border-l-2 border-l-indigo-500'
                                                                            : 'hover:bg-white/[0.03] border-l-2 border-l-transparent'
                                                                        }`}
                                                                >
                                                                    <td className="p-4 text-center">
                                                                        <div className={`p-1.5 rounded-lg transition-all duration-300
                                                                            ${isExpanded
                                                                                ? 'bg-indigo-500/20 text-indigo-400 shadow-lg shadow-indigo-500/10'
                                                                                : 'text-slate-500 group-hover:bg-white/10 group-hover:text-white'
                                                                            }`}
                                                                        >
                                                                            <ChevronDown className={`w-4 h-4 transition-transform duration-300 ${isExpanded ? 'rotate-0' : '-rotate-90'}`} />
                                                                        </div>
                                                                    </td>
                                                                    <td className="p-4">
                                                                        <div>
                                                                            <div className="font-bold text-white text-base flex items-center gap-2">
                                                                                {holding.symbol}
                                                                                {txnSummary && (
                                                                                    <span className="text-[10px] font-medium px-1.5 py-0.5 bg-white/5 rounded text-slate-400">
                                                                                        {txnSummary.buyCount + txnSummary.sellCount} txns
                                                                                    </span>
                                                                                )}
                                                                            </div>
                                                                            <div className="text-xs text-slate-400 mt-0.5">{holding.stockName}</div>
                                                                        </div>
                                                                    </td>
                                                                    <td className="p-4 text-right text-slate-200 font-mono font-medium">{holding.quantity}</td>
                                                                    <td className="p-4 text-right text-slate-300 font-mono">{formatCurrency(holding.averageBuyPrice)}</td>
                                                                    <td className="p-4 text-right text-slate-300 font-mono">{formatCurrency(holding.currentPrice)}</td>
                                                                    <td className="p-4 text-right text-slate-300 font-mono">{formatCurrency(holding.totalInvested)}</td>
                                                                    <td className="p-4 text-right text-slate-200 font-mono font-medium">{formatCurrency(holding.currentValue)}</td>
                                                                    <td className={`p-4 text-right font-bold font-mono ${getPLColor(pl)}`}>
                                                                        <div className="flex flex-col items-end gap-1">
                                                                            <span>{(pl > 0 ? '+' : '')}{formatCurrency(pl)}</span>
                                                                            <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${getPLBg(pl)} ${getPLColor(pl)}`}>
                                                                                {(plPercent > 0 ? '+' : '')}{(plPercent || 0).toFixed(2)}%
                                                                            </span>
                                                                        </div>
                                                                    </td>
                                                                </tr>

                                                                {/* Nested History Row */}
                                                                {isExpanded && (
                                                                    <tr>
                                                                        <td colSpan={8} className="p-0">
                                                                            <div className="bg-[#0B1120] border-l-2 border-l-indigo-500 shadow-[inset_0_2px_15px_rgba(0,0,0,0.3)]">
                                                                                <div className="p-6 animate-in slide-in-from-top-2 duration-300">
                                                                                    <div className="flex items-center justify-between mb-4">
                                                                                        <h4 className="text-white text-sm font-semibold flex items-center gap-2">
                                                                                            <div className="p-1 bg-indigo-500/20 rounded-md">
                                                                                                <History className="w-4 h-4 text-indigo-400" />
                                                                                            </div>
                                                                                            Transaction History
                                                                                            <span className="text-xs font-normal text-slate-400">
                                                                                                — {holding.symbol}
                                                                                            </span>
                                                                                        </h4>
                                                                                        {txnSummary && (
                                                                                            <div className="flex items-center gap-3">
                                                                                                <span className="text-xs px-2 py-1 bg-emerald-500/10 text-emerald-400 rounded-md font-medium">
                                                                                                    {txnSummary.buyCount} Buys · {txnSummary.totalBuys} qty
                                                                                                </span>
                                                                                                {txnSummary.sellCount > 0 && (
                                                                                                    <span className="text-xs px-2 py-1 bg-red-500/10 text-red-400 rounded-md font-medium">
                                                                                                        {txnSummary.sellCount} Sells · {txnSummary.totalSells} qty
                                                                                                    </span>
                                                                                                )}
                                                                                            </div>
                                                                                        )}
                                                                                    </div>

                                                                                    {holding.transactions && holding.transactions.length > 0 ? (
                                                                                        <div className="rounded-lg border border-white/5 bg-slate-900/20">
                                                                                            <table className="w-full text-left">
                                                                                                <thead className="bg-slate-800/50 text-[11px] uppercase text-slate-400 tracking-wider">
                                                                                                    <tr>
                                                                                                        <th className="px-4 py-3 font-semibold rounded-tl-lg">#</th>
                                                                                                        <th className="px-4 py-3 font-semibold">Date & Time</th>
                                                                                                        <th className="px-4 py-3 font-semibold">Type</th>
                                                                                                        <th className="px-4 py-3 text-right font-semibold">Quantity</th>
                                                                                                        <th className="px-4 py-3 text-right font-semibold">Price</th>
                                                                                                        <th className="px-4 py-3 text-right font-semibold rounded-tr-lg">Total Value</th>
                                                                                                    </tr>
                                                                                                </thead>
                                                                                                <tbody className="divide-y divide-white/[0.03] text-sm">
                                                                                                    {holding.transactions.map((txn: any, tIdx: number) => (
                                                                                                        <tr
                                                                                                            key={tIdx}
                                                                                                            className={`relative hover:z-50 transition-colors duration-150 hover:bg-white/[0.02]
                                                                                                                ${tIdx % 2 === 0 ? 'bg-transparent' : 'bg-white/[0.01]'}`}
                                                                                                        >
                                                                                                            <td className="px-4 py-3 text-slate-500 font-mono text-xs">{tIdx + 1}</td>
                                                                                                            <td className="px-4 py-3 text-slate-300">
                                                                                                                <div className="flex items-center gap-2">
                                                                                                                    <Calendar className="w-3.5 h-3.5 text-slate-500 flex-shrink-0" />
                                                                                                                    <span className="text-xs">{formatDate(txn.date)}</span>
                                                                                                                </div>
                                                                                                            </td>
                                                                                                            <td className="px-4 py-3">
                                                                                                                <div className="flex items-center gap-2">
                                                                                                                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold tracking-wide
                                                                                                                        ${txn.type === 'BUY'
                                                                                                                            ? 'bg-emerald-500/15 text-emerald-400 ring-1 ring-emerald-500/20'
                                                                                                                            : 'bg-red-500/15 text-red-400 ring-1 ring-red-500/20'
                                                                                                                        }`}
                                                                                                                    >
                                                                                                                        {txn.type === 'BUY'
                                                                                                                            ? <ArrowDownRight className="w-3 h-3" />
                                                                                                                            : <ArrowUpRight className="w-3 h-3" />
                                                                                                                        }
                                                                                                                        {txn.type}
                                                                                                                    </span>
                                                                                                                    {/* Reason Tooltip */}
                                                                                                                    <div className="relative hover:z-50 group/reason flex items-center">
                                                                                                                        <Info className={`w-4 h-4 cursor-help transition-all duration-300 ${txn.reason ? 'text-slate-400 hover:text-indigo-400 hover:scale-110 drop-shadow-md' : 'text-slate-600 hover:text-slate-400'}`} />

                                                                                                                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 pointer-events-none opacity-0 group-hover/reason:opacity-100 translate-y-2 group-hover/reason:translate-y-0 transition-all duration-300 z-[999] w-max max-w-[320px]">
                                                                                                                            {/* Tooltip Card */}
                                                                                                                            <div className="relative p-4 rounded-xl bg-gradient-to-b from-slate-800/95 to-slate-900/95 backdrop-blur-xl border border-white/10 shadow-[0_8px_30px_rgb(0,0,0,0.5)] ring-1 ring-white/5">
                                                                                                                                {/* Glow effect */}
                                                                                                                                <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-indigo-500/10 opacity-0 group-hover/reason:opacity-100 transition-opacity duration-500" />

                                                                                                                                <div className="relative flex flex-col gap-1.5">
                                                                                                                                    <div className="flex items-center gap-2 mb-1">
                                                                                                                                        <div className="p-1 rounded-md bg-indigo-500/20">
                                                                                                                                            <Info className="w-3 h-3 text-indigo-400" />
                                                                                                                                        </div>
                                                                                                                                        <span className="font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-300 to-purple-300 text-[11px] uppercase tracking-widest">
                                                                                                                                            Reason for Trade
                                                                                                                                        </span>
                                                                                                                                    </div>
                                                                                                                                    <div className="text-[13px] leading-relaxed text-slate-300 whitespace-pre-wrap font-medium">
                                                                                                                                        {txn.reason ? (
                                                                                                                                            <span className="text-slate-200">{txn.reason}</span>
                                                                                                                                        ) : (
                                                                                                                                            <span className="text-slate-500 italic">No reason provided for this trade.</span>
                                                                                                                                        )}
                                                                                                                                    </div>
                                                                                                                                </div>

                                                                                                                                {/* Custom Triangle Arrow */}
                                                                                                                                <div className="absolute -bottom-2 left-1/2 -translate-x-1/2">
                                                                                                                                    <div className="w-4 h-4 rotate-45 bg-slate-900/95 border-r border-b border-white/10" />
                                                                                                                                </div>
                                                                                                                            </div>
                                                                                                                        </div>
                                                                                                                    </div>
                                                                                                                </div>
                                                                                                            </td>
                                                                                                            <td className="px-4 py-3 text-right text-slate-200 font-mono font-medium">{txn.quantity}</td>
                                                                                                            <td className="px-4 py-3 text-right text-slate-300 font-mono">{formatCurrency(txn.price)}</td>
                                                                                                            <td className="px-4 py-3 text-right text-white font-mono font-medium">
                                                                                                                {formatCurrency(txn.totalAmount || (txn.quantity * txn.price))}
                                                                                                            </td>
                                                                                                        </tr>
                                                                                                    ))}
                                                                                                </tbody>
                                                                                                {/* Summary Footer */}
                                                                                                <tfoot className="border-t border-white/10 bg-slate-800/30">
                                                                                                    <tr>
                                                                                                        <td colSpan={3} className="px-4 py-3 text-xs text-slate-400 font-semibold uppercase tracking-wider rounded-bl-lg">
                                                                                                            Total — {holding.transactions.length} transaction{holding.transactions.length > 1 ? 's' : ''}
                                                                                                        </td>
                                                                                                        <td className="px-4 py-3 text-right text-slate-300 font-mono text-xs font-bold">
                                                                                                            Net: {txnSummary ? txnSummary.totalBuys - txnSummary.totalSells : 0} qty
                                                                                                        </td>
                                                                                                        <td className="px-4 py-3"></td>
                                                                                                        <td className="px-4 py-3 text-right text-white font-mono text-xs font-bold rounded-br-lg">
                                                                                                            {formatCurrency(
                                                                                                                holding.transactions.reduce(
                                                                                                                    (sum: number, t: any) => sum + (t.totalAmount || t.quantity * t.price), 0
                                                                                                                )
                                                                                                            )}
                                                                                                        </td>
                                                                                                    </tr>
                                                                                                </tfoot>
                                                                                            </table>
                                                                                        </div>
                                                                                    ) : (
                                                                                        <div className="text-center py-10 bg-slate-900/50 rounded-lg border border-white/5 border-dashed">
                                                                                            <History className="w-8 h-8 text-slate-600 mx-auto mb-3" />
                                                                                            <p className="text-slate-400 text-sm font-medium">No transaction history available</p>
                                                                                            <p className="text-slate-500 text-xs mt-1">Transaction records for this stock have not been recorded yet.</p>
                                                                                        </div>
                                                                                    )}
                                                                                </div>
                                                                            </div>
                                                                        </td>
                                                                    </tr>
                                                                )}
                                                            </React.Fragment>
                                                        );
                                                    })}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="text-center py-16 bg-slate-900/30 rounded-xl border border-white/5 border-dashed">
                                        <div className="h-16 w-16 bg-slate-800/50 rounded-full flex items-center justify-center mx-auto mb-4">
                                            <DollarSign className="h-8 w-8 text-slate-500" />
                                        </div>
                                        <p className="text-slate-300 font-medium">No active holdings</p>
                                        <p className="text-slate-500 text-sm mt-1">This user currently has an empty portfolio.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="text-center py-20 text-slate-400">
                            Failed to load portfolio data.
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}