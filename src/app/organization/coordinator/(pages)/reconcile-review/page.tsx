"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Loader2, Star, CheckCircle, AlertCircle, RefreshCcw, Send, ChevronDown, ChevronUp } from 'lucide-react';
import { coordinatorApi } from '@/lib/api';

interface Student {
    _id: string;
    name: string;
    email: string;
    portfolioReport?: {
        analysis: string;
        generatedAt: string;
    };
    teacherReview?: {
        factor1Rating: number;
        factor2Rating: number;
        factor3Rating: number;
        aggregateScore: number;
        suggestions: string;
    };
    portfolioSummary?: {
        totalInvested: number;
        currentValue: number;
        totalPL: number;
        totalPLPercent: number;
        unrealizedPL?: number;
        realizedPL?: number;
        portfolioAllocation?: Record<string, number>;
        portfolioTurnover?: number;
        maxDrawdown?: number;
    };
    totalPaperTradesCount: number;
    profitablePaperTrades: number;
    tradingLevel: string;
}

// Helper to parse the 7 sections from the AI text
const parseReportSections = (analysisText: string) => {
    const sections = [
        "Portfolio Health Assessment",
        "Diversification Analysis",
        "Risk Assessment",
        "Recommendations for Rebalancing",
        "Stocks to Consider Selling",
        "Categories to Invest More In",
        "Overall Strategy Suggestions"
    ];

    const result: string[] = new Array(7).fill("No data found.");
    if (!analysisText) return result;

    // Check if it's the fallback AI error message
    if (analysisText.includes("Portfolio analysis unavailable") || analysisText.includes("Unable to generate portfolio analysis")) {
        return new Array(7).fill("Unable to analyze portfolio. Ensure the student has active trades.");
    }

    // Check if it's the empty portfolio message
    if (analysisText.includes("Your portfolio is empty")) {
        return new Array(7).fill("Student has no trades in their portfolio yet.");
    }

    // A more robust regex approach: look for "1. ", " 1. ", "\n1.", "**1.**", etc.
    const parts = analysisText.split(/(?:^|\n)\s*\**[1-7]\.\**\s*(?:\*\*)?[^\n*]*?(?:\*\*)?:?\s*/);

    // parts[0] is usually intro text. parts[1] to parts[7] are the actual content.
    for (let i = 1; i <= 7; i++) {
        if (parts[i] && parts[i].trim() !== "") {
            result[i - 1] = parts[i].trim();
        }
    }

    return result;
};

export default function ReconcileReviewPage() {
    const router = useRouter();
    const [students, setStudents] = useState<Student[]>([]);
    const [loading, setLoading] = useState(true);
    const [submittingIds, setSubmittingIds] = useState<Set<string>>(new Set());
    const [notification, setNotification] = useState<{ type: 'success' | 'error', message: string } | null>(null);
    const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

    // Form state (mapped by student ID)
    const [reviews, setReviews] = useState<Record<string, { f1: number, f2: number, f3: number, suggestions: string }>>({});

    useEffect(() => {
        fetchStudents();
    }, []);

    const fetchStudents = async () => {
        setLoading(true);
        try {
            const data = await coordinatorApi.getMyStudents({ includePortfolio: true });
            if (data.success && data.students) {
                // Only show students who have a report
                const studentsWithReports = data.students.filter((s: Student) => !!s.portfolioReport?.analysis);
                setStudents(studentsWithReports);

                // Initialize form state for those who aren't reviewed yet, or load existing review to edit
                const initialReviews: Record<string, any> = {};
                studentsWithReports.forEach((s: Student) => {
                    initialReviews[s._id] = {
                        f1: s.teacherReview?.factor1Rating || 0,
                        f2: s.teacherReview?.factor2Rating || 0,
                        f3: s.teacherReview?.factor3Rating || 0,
                        suggestions: s.teacherReview?.suggestions || ""
                    };
                });
                setReviews(initialReviews);
            }
        } catch (e: any) {
            console.error(e);
            setNotification({ type: 'error', message: 'Failed to fetch students for review' });
        } finally {
            setLoading(false);
        }
    };

    const handleRatingChange = (studentId: string, factor: 'f1' | 'f2' | 'f3', value: number) => {
        setReviews(prev => ({
            ...prev,
            [studentId]: { ...prev[studentId], [factor]: value }
        }));
    };

    const handleSuggestionChange = (studentId: string, value: string) => {
        setReviews(prev => ({
            ...prev,
            [studentId]: { ...prev[studentId], suggestions: value }
        }));
    };

    const handleSubmitReview = async (studentId: string) => {
        const review = reviews[studentId];
        if (!review || review.f1 === 0 || review.f2 === 0 || review.f3 === 0) {
            setNotification({ type: 'error', message: 'Please provide ratings for all 3 factors.' });
            return;
        }

        setSubmittingIds(prev => new Set(prev).add(studentId));
        try {
            const result = await coordinatorApi.submitReview(studentId, {
                factor1Rating: review.f1,
                factor2Rating: review.f2,
                factor3Rating: review.f3,
                suggestions: review.suggestions
            });

            if (result.success) {
                setNotification({ type: 'success', message: 'Review submitted successfully!' });

                // Update local student state to show it's reviewed
                setStudents(prev => prev.map(s => {
                    if (s._id === studentId) {
                        return {
                            ...s,
                            teacherReview: {
                                factor1Rating: review.f1,
                                factor2Rating: review.f2,
                                factor3Rating: review.f3,
                                suggestions: review.suggestions,
                                aggregateScore: result.aggregateScore
                            }
                        };
                    }
                    return s;
                }));
            }
        } catch (e: any) {
            setNotification({ type: 'error', message: e.response?.data?.message || 'Failed to submit review' });
        } finally {
            setSubmittingIds(prev => {
                const next = new Set(prev);
                next.delete(studentId);
                return next;
            });
        }
    };

    const renderStars = (studentId: string, factor: 'f1' | 'f2' | 'f3', currentValue: number) => {
        return (
            <div className="flex gap-1.5 mt-3 group/stars relative">
                {[1, 2, 3, 4, 5].map(star => {
                    const isActive = currentValue >= star;
                    return (
                        <button
                            key={star}
                            onClick={() => handleRatingChange(studentId, factor, star)}
                            className={`transition-all duration-300 transform flex-shrink-0 relative outline-none focus:outline-none 
                            ${isActive
                                    ? 'text-amber-400 hover:scale-110 drop-shadow-[0_0_8px_rgba(251,191,36,0.6)]'
                                    : 'text-slate-600 hover:text-amber-400/80 hover:scale-110 hover:drop-shadow-[0_0_5px_rgba(251,191,36,0.3)]'}`}
                            title={`Rate ${star} out of 5`}
                        >
                            <Star className={`w-6 h-6 ${isActive ? 'fill-current' : 'fill-transparent stroke-[1.5]'}`} />
                        </button>
                    );
                })}
            </div>
        );
    };

    return (
        <div className="min-h-screen w-full bg-[#030712] text-slate-200 font-sans selection:bg-indigo-500/30 relative overflow-hidden p-6 md:p-10">
            {/* Background Effects */}
            <div className="fixed inset-0 pointer-events-none z-0">
                <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-indigo-500/10 rounded-full blur-[120px] animate-pulse-slow" />
            </div>

            <div className="relative z-10 w-full mx-auto space-y-8" style={{ maxWidth: '100%' }}>
                {/* Header */}
                <div className="flex items-center gap-4 animate-slide-down border-b border-white/10 pb-6">
                    <button
                        onClick={() => router.push('/organization/coordinator/students')}
                        className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-all border border-white/5"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <div>
                        <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-400">
                            Reconcile Review
                        </h1>
                        <p className="text-slate-500 mt-1 text-sm font-medium">
                            Evaluate AI Portfolio Reports and provide teacher feedback
                        </p>
                    </div>
                    {loading && <RefreshCcw className="w-5 h-5 text-indigo-500 animate-spin ml-auto" />}
                </div>

                {loading && students.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-32">
                        <Loader2 className="h-12 w-12 text-indigo-500 animate-spin" />
                        <p className="mt-4 text-slate-400 font-medium">Loading reports for review...</p>
                    </div>
                ) : students.length === 0 ? (
                    <div className="bg-[#0F172A]/80 border border-white/5 rounded-2xl p-12 text-center">
                        <CheckCircle className="w-12 h-12 text-emerald-500 mx-auto mb-4" />
                        <h3 className="text-xl font-bold text-white mb-2">No Reports Pending Review</h3>
                        <p className="text-slate-400">All students have been reviewed or no students have reports yet. Make sure to run the Reconciliation Engine first.</p>
                    </div>
                ) : (
                    <div className="bg-[#0F172A]/80 border border-white/5 rounded-2xl shadow-2xl overflow-hidden overflow-x-auto w-full">
                        <table className="w-full text-left border-collapse whitespace-nowrap lg:whitespace-normal min-w-[1000px]">
                            <thead>
                                <tr className="text-slate-400 text-xs font-bold uppercase tracking-wider bg-[#020617]/50 border-b border-white/10">
                                    <th className="py-3 px-4 w-1/4 border-r border-white/5 sticky left-0 bg-[#020617] z-20 shadow-sm shadow-black/50">Student</th>
                                    <th className="py-3 px-4 w-1/5 border-r border-white/5">Score / Status</th>
                                    <th className="py-3 px-4 w-1/5 border-r border-white/5">Portfolio</th>
                                    <th className="py-3 px-4 w-1/5 border-r border-white/5">Return</th>
                                    <th className="py-3 px-4 w-16 text-center">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5 relative">
                                {students.map((student, idx) => {
                                    const expanded = expandedRows.has(student._id);
                                    const sections = parseReportSections(student.portfolioReport?.analysis || "");
                                    const isReviewed = student.teacherReview?.aggregateScore !== undefined;
                                    const reviewState = reviews[student._id] || { f1: 0, f2: 0, f3: 0, suggestions: '' };
                                    const isSubmitting = submittingIds.has(student._id);
                                    const summary = student.portfolioSummary || { totalInvested: 0, currentValue: 0, totalPL: 0, totalPLPercent: 0 };
                                    const isProfitable = summary.totalPL >= 0;

                                    return (
                                        <React.Fragment key={student._id}>
                                            <tr
                                                onClick={() => {
                                                    setExpandedRows(prev => {
                                                        const next = new Set(prev);
                                                        if (next.has(student._id)) next.delete(student._id);
                                                        else next.add(student._id);
                                                        return next;
                                                    });
                                                }}
                                                className={`group cursor-pointer transition-all duration-300 ${expanded ? 'bg-[#0f172a] shadow-inner' : 'hover:bg-white/[0.04] bg-white/[0.01]'}`}
                                            >
                                                {/* Column: Student Info (Sticky) */}
                                                <td className={`p-4 min-w-[250px] border-r border-white/5 sticky left-0 z-10 align-middle shadow-sm transition-colors duration-300 ${expanded ? 'bg-[#0f172a]' : 'bg-[#0F172A] group-hover:bg-[#151e32]'}`}>
                                                    <div className="flex items-center gap-3">
                                                        <div className="relative flex-shrink-0">
                                                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center font-bold text-white text-sm shadow-lg shadow-indigo-500/20 ring-2 ring-indigo-500/10">
                                                                {student.name.charAt(0).toUpperCase()}
                                                            </div>
                                                            {isReviewed && (
                                                                <div className="absolute -top-1 -right-1 bg-emerald-500 p-0.5 rounded-full border-2 border-[#0F172A]" title="Reviewed">
                                                                    <CheckCircle className="w-3 h-3 text-white" />
                                                                </div>
                                                            )}
                                                        </div>
                                                        <div className="overflow-hidden">
                                                            <p className="font-bold text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-200 truncate text-sm" title={student.name}>{student.name}</p>
                                                            <p className="text-xs text-slate-500 truncate mt-0.5">{student.email}</p>
                                                        </div>
                                                    </div>
                                                </td>

                                                {/* Column: Score / Status */}
                                                <td className="p-4 border-r border-white/5 align-middle">
                                                    {isReviewed ? (
                                                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-bold text-xs shadow-[0_0_15px_rgba(16,185,129,0.1)]">
                                                            <span>Score: <span className="text-emerald-300">{student.teacherReview!.aggregateScore}/100</span></span>
                                                        </div>
                                                    ) : (
                                                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 font-bold text-xs shadow-[0_0_15px_rgba(245,158,11,0.1)]">
                                                            <span className="relative flex h-1.5 w-1.5">
                                                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                                                                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-amber-500"></span>
                                                            </span>
                                                            <span>Pending Review</span>
                                                        </div>
                                                    )}
                                                </td>

                                                {/* Column: Portfolio Details */}
                                                <td className="p-4 border-r border-white/5 align-middle">
                                                    <div className="flex flex-col gap-1 w-40">
                                                        <div className="flex justify-between items-center text-xs">
                                                            <span className="text-slate-500">Invested:</span>
                                                            <span className="text-slate-200 font-medium font-mono">₹{summary.totalInvested.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</span>
                                                        </div>
                                                        <div className="flex justify-between items-center text-xs">
                                                            <span className="text-slate-500">Current:</span>
                                                            <span className="text-slate-200 font-medium font-mono">₹{summary.currentValue.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</span>
                                                        </div>
                                                    </div>
                                                </td>

                                                {/* Column: Return (Combined Absolute & %) */}
                                                <td className="p-4 border-r border-white/5 align-middle">
                                                    <div className={`inline-flex gap-1.5 px-3 py-1.5 rounded-xl border flex-col items-start shadow-sm min-w-[120px]
                                                        ${isProfitable
                                                            ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.05)]'
                                                            : summary.totalPL < 0
                                                                ? 'bg-rose-500/10 border-rose-500/20 text-rose-400 shadow-[0_0_15px_rgba(244,63,94,0.05)]'
                                                                : 'bg-slate-500/10 border-slate-500/20 text-slate-400'}`}>
                                                        <span className="font-bold font-mono text-sm tracking-wide">
                                                            {isProfitable ? '+' : ''}₹{Math.abs(summary.totalPL).toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                                                        </span>
                                                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${isProfitable ? 'bg-emerald-500/20 text-emerald-300' : summary.totalPL < 0 ? 'bg-rose-500/20 text-rose-300' : 'bg-slate-500/20 text-slate-300'}`}>
                                                            {isProfitable ? '↑' : summary.totalPL < 0 ? '↓' : ''} {isProfitable ? '+' : ''}{summary.totalPLPercent}%
                                                        </span>
                                                    </div>
                                                </td>

                                                {/* Column: Action Toggle */}
                                                <td className="p-4 align-middle text-center">
                                                    <button className={`w-8 h-8 rounded-full flex items-center justify-center mx-auto transition-all duration-300 ${expanded ? 'bg-indigo-500/20 text-indigo-400' : 'bg-white/5 text-slate-400 group-hover:bg-white/10 group-hover:text-white'}`}>
                                                        <ChevronDown className={`w-4 h-4 transition-transform duration-300 ${expanded ? 'rotate-180' : ''}`} />
                                                    </button>
                                                </td>
                                            </tr>

                                            {/* Expanded Content: Premium Deep Glassmorphism Panel */}
                                            {expanded && (
                                                <tr className="bg-[#020617]/80 border-b border-indigo-500/20 relative shadow-inner overflow-hidden">
                                                    <td colSpan={5} className="p-0 border-none m-0 max-w-0">
                                                        <div className="absolute inset-0 bg-indigo-500/5 backdrop-blur-3xl pointer-events-none"></div>
                                                        <div className="p-6 animate-in slide-in-from-top-4 fade-in duration-500 relative z-10 w-full">

                                                            {/* Portfolio Quick Metrics Bar (Grid Layout) */}
                                                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 mb-6">

                                                                {/* Cell 1: Realized vs Unrealized P&L */}
                                                                <div className="p-3.5 bg-[#0F172A]/80 border border-white/10 rounded-2xl shadow-xl backdrop-blur-md flex flex-col justify-between">
                                                                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Realized vs. Unrealized</p>
                                                                    <div className="space-y-1.5">
                                                                        <div className="flex justify-between items-center text-xs">
                                                                            <span className="text-slate-400">Realized:</span>
                                                                            <span className={`font-mono font-medium ${(summary.realizedPL || 0) >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                                                                                {(summary.realizedPL || 0) >= 0 ? '+' : ''}₹{(summary.realizedPL || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                                                                            </span>
                                                                        </div>
                                                                        <div className="flex justify-between items-center text-xs">
                                                                            <span className="text-slate-400">Unrealized:</span>
                                                                            <span className={`font-mono font-medium ${(summary.unrealizedPL || 0) >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                                                                                {(summary.unrealizedPL || 0) >= 0 ? '+' : ''}₹{(summary.unrealizedPL || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                                                                            </span>
                                                                        </div>
                                                                    </div>
                                                                </div>

                                                                {/* Cell 2: Volume & Turnover */}
                                                                <div className="p-3.5 bg-[#0F172A]/80 border border-white/10 rounded-2xl shadow-xl backdrop-blur-md flex flex-col justify-between">
                                                                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Volume & Turnover</p>
                                                                    <div className="flex items-end justify-between">
                                                                        <div>
                                                                            <p className="text-xl font-bold font-mono text-slate-200">{student.totalPaperTradesCount || 0}</p>
                                                                            <p className="text-[10px] text-slate-500">Orders</p>
                                                                        </div>
                                                                        <div className="text-right">
                                                                            <p className="text-lg font-bold font-mono text-indigo-400">{summary.portfolioTurnover || 0}%</p>
                                                                            <p className="text-[10px] text-slate-500">Turnover</p>
                                                                        </div>
                                                                    </div>
                                                                </div>

                                                                {/* Cell 3: Maximum Drawdown */}
                                                                <div className="p-3.5 bg-[#0F172A]/80 border border-rose-500/20 rounded-2xl shadow-[0_0_15px_rgba(244,63,94,0.05)] backdrop-blur-md flex flex-col justify-between">
                                                                    <div className="flex justify-between items-start">
                                                                        <p className="text-[10px] font-bold text-rose-500/80 uppercase tracking-wider mb-2">Risk: Max Drawdown</p>
                                                                        <AlertCircle className="w-3.5 h-3.5 text-rose-500/50" />
                                                                    </div>
                                                                    <div className="flex items-baseline gap-1 mt-auto">
                                                                        <p className="text-xl font-bold font-mono text-rose-400">-{summary.maxDrawdown || 0}%</p>
                                                                    </div>
                                                                </div>

                                                                {/* Cell 4: Compact Portfolio Allocation */}
                                                                <div className="p-3.5 bg-[#0F172A]/80 border border-white/10 rounded-2xl shadow-xl backdrop-blur-md flex flex-col justify-between overflow-hidden">
                                                                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Compact Allocation</p>
                                                                    {summary.totalInvested > 0 && summary.portfolioAllocation ? (
                                                                        <div className="flex flex-wrap gap-1.5">
                                                                            {Object.entries(summary.portfolioAllocation).map(([cat, amount]) => {
                                                                                const catPercent = Math.round(((amount as number) / summary.totalInvested) * 100);
                                                                                return (
                                                                                    <div key={cat} className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-white/5 border border-white/10">
                                                                                        <span className="text-[10px] font-bold text-slate-400">{cat}</span>
                                                                                        <span className="text-[11px] font-bold text-slate-200 font-mono">{catPercent}%</span>
                                                                                    </div>
                                                                                )
                                                                            })}
                                                                        </div>
                                                                    ) : (
                                                                        <p className="text-xs text-slate-500">No active allocations</p>
                                                                    )}
                                                                </div>

                                                            </div>

                                                            <div className="flex overflow-x-auto gap-4 pb-4 w-full snap-x pt-2">
                                                                {/* AI Sections 1-3 (Ratable Core Metrics) */}
                                                                {(['f1', 'f2', 'f3'] as const).map((factor, i) => (
                                                                    <div key={factor} className="w-[280px] flex-shrink-0 flex flex-col bg-[#0f172a]/90 backdrop-blur-xl border border-indigo-500/20 rounded-2xl p-4 shadow-lg shadow-indigo-900/10 hover:border-indigo-500/40 transition-colors group snap-start relative overflow-hidden">
                                                                        <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/10 rounded-full blur-[40px] -translate-y-1/2 translate-x-1/2 group-hover:bg-indigo-500/20 transition-colors"></div>
                                                                        <h4 className="text-xs font-bold text-indigo-300 uppercase tracking-widest mb-3 flex items-center gap-2 relative z-10">
                                                                            <span className="w-5 h-5 rounded-md bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-200">
                                                                                {i + 1}
                                                                            </span>
                                                                            {['Health Assessment', 'Diversification', 'Risk Assessment'][i]}
                                                                        </h4>
                                                                        <div className="flex-grow overflow-y-auto pr-3 custom-scrollbar text-[13px] text-slate-300/90 leading-relaxed mb-4 h-40 relative z-10">
                                                                            {sections[i]}
                                                                        </div>
                                                                        <div className="mt-auto bg-[#020617]/50 rounded-xl p-3 border border-indigo-500/10 relative z-10 flex flex-col gap-1.5">
                                                                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest text-center w-full block">Your Rating</span>
                                                                            <div className="flex justify-center flex-wrap">
                                                                                {renderStars(student._id, factor, reviewState[factor])}
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                ))}

                                                                {/* AI Sections 4-7 (Read only Insights) */}
                                                                {[3, 4, 5, 6].map(i => (
                                                                    <div key={`sec-${i}`} className="w-[260px] flex-shrink-0 flex flex-col bg-[#0F172A]/60 backdrop-blur-md border border-white/10 rounded-2xl p-4 shadow-lg hover:border-white/20 transition-colors snap-start relative overflow-hidden">
                                                                        <h4 className="text-xs font-bold text-slate-300 uppercase tracking-widest mb-3 flex items-center gap-2 relative z-10">
                                                                            <span className="w-5 h-5 rounded-md bg-white/5 border border-white/10 flex items-center justify-center text-slate-400">
                                                                                {i + 1}
                                                                            </span>
                                                                            {['Rebalancing', 'Consider Selling', 'Invest More In', 'Overall Strategy'][i - 3]}
                                                                        </h4>
                                                                        <div className="flex-grow overflow-y-auto pr-2 custom-scrollbar text-[13px] text-slate-400 leading-relaxed h-40 relative z-10">
                                                                            {sections[i]}
                                                                        </div>
                                                                    </div>
                                                                ))}

                                                                {/* Submit Form (Premium Design) */}
                                                                <div className="w-[320px] flex-shrink-0 flex flex-col bg-gradient-to-br from-[#0F172A] to-[#020617] border border-emerald-500/20 rounded-2xl p-5 shadow-2xl shadow-emerald-900/10 snap-start relative overflow-hidden group">
                                                                    <div className="absolute top-0 right-0 w-48 h-48 bg-emerald-500/5 rounded-full blur-[60px] -translate-y-1/2 translate-x-1/2"></div>
                                                                    <h4 className="text-xs font-bold text-emerald-400 uppercase tracking-widest mb-4 flex items-center gap-2 relative z-10">
                                                                        <Send className="w-4 h-4" /> Final Evaluation
                                                                    </h4>

                                                                    <div className="flex-grow flex flex-col relative z-10">
                                                                        <label className="text-[10px] font-bold text-slate-400 mb-2 block uppercase tracking-wider">Teacher Remarks & Suggestions</label>
                                                                        <textarea
                                                                            className="w-full flex-grow h-28 resize-none bg-[#0F172A]/80 border border-white/10 rounded-xl p-3 text-xs text-slate-200 focus:ring-2 focus:ring-emerald-500/50 outline-none custom-scrollbar shadow-inner placeholder:text-slate-600 focus:bg-[#020617] transition-all"
                                                                            placeholder="Type your feedback here. Mention specific areas for improvement based on the AI analysis..."
                                                                            value={reviewState.suggestions}
                                                                            onChange={(e) => handleSuggestionChange(student._id, e.target.value)}
                                                                            onClick={(e) => e.stopPropagation()}
                                                                        ></textarea>

                                                                        <button
                                                                            onClick={(e) => {
                                                                                e.stopPropagation();
                                                                                handleSubmitReview(student._id);
                                                                            }}
                                                                            disabled={isSubmitting || reviewState.f1 === 0 || reviewState.f2 === 0 || reviewState.f3 === 0}
                                                                            className={`mt-5 w-full py-3.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all duration-300 relative overflow-hidden group/btn ${isReviewed
                                                                                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/30'
                                                                                : 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/40 hover:-translate-y-0.5'
                                                                                } disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-none`}
                                                                        >
                                                                            {/* Button Glow Effect */}
                                                                            {!isReviewed && !isSubmitting && (
                                                                                <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover/btn:animate-[shimmer_1.5s_infinite]"></div>
                                                                            )}

                                                                            {isSubmitting ? (
                                                                                <Loader2 className="w-4 h-4 animate-spin relative z-10" />
                                                                            ) : isReviewed ? (
                                                                                <CheckCircle className="w-4 h-4 relative z-10" />
                                                                            ) : (
                                                                                <Send className="w-4 h-4 relative z-10" />
                                                                            )}
                                                                            <span className="relative z-10 tracking-wide">{isSubmitting ? "Submitting Review..." : isReviewed ? "Update Evaluation" : "Submit Evaluation"}</span>
                                                                        </button>
                                                                    </div>
                                                                </div>
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
                )}

                {/* Notification Toast */}
                {notification && (
                    <div className={`fixed bottom-6 right-6 px-6 py-4 rounded-xl shadow-2xl border flex items-center gap-3 animate-in slide-in-from-bottom-5 duration-300 z-[100] ${notification.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-red-500/10 border-red-500/20 text-red-400'
                        }`}>
                        {notification.type === 'success' ? <CheckCircle className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
                        <span className="font-medium">{notification.message}</span>
                        <button onClick={() => setNotification(null)} className="ml-2 opacity-70 hover:opacity-100">&times;</button>
                    </div>
                )}

                <style dangerouslySetInnerHTML={{
                    __html: `
                    .custom-scrollbar::-webkit-scrollbar {
                        width: 4px;
                        height: 4px;
                    }
                    .custom-scrollbar::-webkit-scrollbar-track {
                        background: transparent;
                    }
                    .custom-scrollbar::-webkit-scrollbar-thumb {
                        background: rgba(255, 255, 255, 0.1);
                        border-radius: 4px;
                    }
                    .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                        background: rgba(255, 255, 255, 0.2);
                    }
                `}} />
            </div>
        </div>
    );
}
