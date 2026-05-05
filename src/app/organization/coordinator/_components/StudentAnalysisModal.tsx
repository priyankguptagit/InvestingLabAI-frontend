"use client";

import React, { useState, useEffect } from 'react';
import { X, Brain, AlertCircle, FileText, CheckCircle, Lightbulb, Star, Send, Loader2 } from 'lucide-react';
import { coordinatorApi } from '@/lib/api';

interface StudentAnalysisModalProps {
    isOpen: boolean;
    onClose: () => void;
    student: any;
}

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

    if (analysisText.includes("Portfolio analysis unavailable") || analysisText.includes("Unable to generate portfolio analysis")) {
        return new Array(7).fill("Unable to analyze portfolio. Ensure the student has active trades.");
    }
    if (analysisText.includes("Your portfolio is empty")) {
        return new Array(7).fill("Student has no trades in their portfolio yet.");
    }

    const parts = analysisText.split(/(?:^|\n)\s*\**[1-7]\.\**\s*(?:\*\*)?[^\n*]*?(?:\*\*)?:?\s*/);

    for (let i = 1; i <= 7; i++) {
        if (parts[i] && parts[i].trim() !== "") {
            result[i - 1] = parts[i].trim();
        }
    }

    return result;
};

export default function StudentAnalysisModal({ isOpen, onClose, student }: StudentAnalysisModalProps) {
    const [reviewState, setReviewState] = useState({ f1: 0, f2: 0, f3: 0, suggestions: '' });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [notification, setNotification] = useState<{ type: 'success' | 'error', message: string } | null>(null);
    const [localStudent, setLocalStudent] = useState<any>(null);

    useEffect(() => {
        if (student) {
            setLocalStudent(student);
            setReviewState({
                f1: student.teacherReview?.factor1Rating || 0,
                f2: student.teacherReview?.factor2Rating || 0,
                f3: student.teacherReview?.factor3Rating || 0,
                suggestions: student.teacherReview?.suggestions || ""
            });
            setNotification(null);
        }
    }, [student, isOpen]);

    if (!isOpen || !localStudent) return null;

    const hasAnalysis = !!localStudent.portfolioReport?.analysis;
    const isReviewed = localStudent.teacherReview?.aggregateScore !== undefined;

    const sections = parseReportSections(localStudent.portfolioReport?.analysis || "");

    const handleRatingChange = (factor: 'f1' | 'f2' | 'f3', value: number) => {
        setReviewState(prev => ({ ...prev, [factor]: value }));
    };

    const handleSubmitReview = async () => {
        if (reviewState.f1 === 0 || reviewState.f2 === 0 || reviewState.f3 === 0) {
            setNotification({ type: 'error', message: 'Please provide ratings for all 3 critical factors.' });
            return;
        }

        setIsSubmitting(true);
        try {
            const result = await coordinatorApi.submitReview(localStudent._id, {
                factor1Rating: reviewState.f1,
                factor2Rating: reviewState.f2,
                factor3Rating: reviewState.f3,
                suggestions: reviewState.suggestions
            });

            if (result.success) {
                setNotification({ type: 'success', message: 'Review submitted successfully!' });

                // Update local variant so the UI reflects the new score and status
                setLocalStudent({
                    ...localStudent,
                    teacherReview: {
                        factor1Rating: reviewState.f1,
                        factor2Rating: reviewState.f2,
                        factor3Rating: reviewState.f3,
                        suggestions: reviewState.suggestions,
                        aggregateScore: result.aggregateScore
                    }
                });

                // Mutate original student object so parent gets updated values without passing a callback
                if (student) {
                    student.teacherReview = {
                        factor1Rating: reviewState.f1,
                        factor2Rating: reviewState.f2,
                        factor3Rating: reviewState.f3,
                        suggestions: reviewState.suggestions,
                        aggregateScore: result.aggregateScore
                    };
                }

                setTimeout(() => setNotification(null), 3000);
            }
        } catch (e: any) {
            setNotification({ type: 'error', message: e.response?.data?.message || 'Failed to submit review' });
        } finally {
            setIsSubmitting(false);
        }
    };

    const renderStars = (factor: 'f1' | 'f2' | 'f3', currentValue: number) => {
        return (
            <div className="flex gap-1 mt-0.5 group/stars relative">
                {[1, 2, 3, 4, 5].map(star => {
                    const isActive = currentValue >= star;
                    return (
                        <button
                            key={star}
                            onClick={() => handleRatingChange(factor, star)}
                            className={`transition-all duration-300 transform flex-shrink-0 relative outline-none focus:outline-none 
                            ${isActive
                                    ? 'text-amber-400 hover:scale-110 drop-shadow-[0_0_8px_rgba(251,191,36,0.6)]'
                                    : 'text-slate-600 hover:text-amber-400/80 hover:scale-110 hover:drop-shadow-[0_0_5px_rgba(251,191,36,0.3)]'}`}
                            title={`Rate ${star} out of 5`}
                        >
                            <Star className={`w-4 h-4 sm:w-5 sm:h-5 ${isActive ? 'fill-current' : 'fill-transparent stroke-[1.5]'}`} />
                        </button>
                    );
                })}
            </div>
        );
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-2 sm:p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-200">
            <div className="bg-[#0F172A] border border-white/10 rounded-2xl w-full max-w-6xl max-h-[95vh] h-full flex flex-col shadow-2xl shadow-black/50 scale-100 animate-in zoom-in-95 duration-200 overflow-hidden relative">

                {/* Header */}
                <div className="flex items-center justify-between p-4 md:p-6 border-b border-white/5 bg-gradient-to-r from-slate-900/80 via-indigo-950/30 to-slate-900/80 rounded-t-2xl flex-shrink-0">
                    <div>
                        <h2 className="text-lg md:text-xl font-bold text-white flex items-center gap-2.5">
                            <div className="p-1.5 bg-indigo-500/20 rounded-lg hidden sm:block">
                                <Brain className="w-5 h-5 text-indigo-400" />
                            </div>
                            Student Analysis Details
                        </h2>
                        <p className="text-xs md:text-sm text-slate-400 mt-1 sm:mt-1.5 sm:ml-0.5">
                            Performance review for <span className="text-indigo-300 font-medium">{localStudent.name}</span>
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 sm:p-2.5 bg-white/5 hover:bg-white/10 rounded-xl text-slate-400 hover:text-white transition-all duration-200"
                    >
                        <X className="w-4 h-4 sm:w-5 sm:h-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-4 md:p-6 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
                    {notification && (
                        <div className={`mb-6 px-4 py-3 rounded-xl border flex items-center gap-3 animate-in fade-in slide-in-from-top-2 ${notification.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-red-500/10 border-red-500/20 text-red-400'
                            }`}>
                            {notification.type === 'success' ? <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5" /> : <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5" />}
                            <span className="font-medium text-xs sm:text-sm">{notification.message}</span>
                            <button onClick={() => setNotification(null)} className="ml-auto opacity-70 hover:opacity-100">&times;</button>
                        </div>
                    )}

                    {hasAnalysis ? (
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-6 h-full">
                            {/* Left Column: First 3 Critical Factors with Ratings */}
                            <div className="lg:col-span-7 space-y-4">
                                <h3 className="text-xs sm:text-sm font-bold text-indigo-400 uppercase tracking-widest flex items-center gap-2 px-1">
                                    <Brain className="w-4 h-4" /> Core Evaluation Metrics
                                </h3>
                                <div className="space-y-3 sm:space-y-4">
                                    {(['f1', 'f2', 'f3'] as const).map((factor, i) => (
                                        <div key={factor} className="bg-gradient-to-br from-[#020617]/80 to-[#0F172A]/80 border border-white/5 rounded-2xl p-4 sm:p-5 hover:border-indigo-500/30 transition-colors flex flex-col group">
                                            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3 sm:gap-4 mb-3">
                                                <h4 className="text-sm font-bold text-slate-200 flex items-center gap-2">
                                                    <span className="w-6 h-6 rounded-md bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-300 text-xs flex-shrink-0">
                                                        {i + 1}
                                                    </span>
                                                    {['Portfolio Health Assessment', 'Diversification Analysis', 'Risk Assessment'][i]}
                                                </h4>
                                                <div className="flex-shrink-0 bg-[#020617] sm:bg-transparent p-2 sm:p-0 rounded-lg sm:rounded-none">
                                                    {renderStars(factor, reviewState[factor])}
                                                </div>
                                            </div>
                                            <div className="text-[13px] sm:text-sm text-slate-400 leading-relaxed CustomScrollbar overflow-y-auto max-h-32 sm:max-h-40 pr-2">
                                                {sections[i]}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Right Column: Next 4 Factors + Evaluation Form */}
                            <div className="lg:col-span-5 flex flex-col space-y-4 h-full">
                                <div className="space-y-3 sm:space-y-4">
                                    <h3 className="text-xs sm:text-sm font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2 px-1">
                                        <FileText className="w-4 h-4" /> Additional AI Insights
                                    </h3>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                                        {[3, 4, 5, 6].map(i => (
                                            <div key={`sec-${i}`} className="bg-[#020617]/50 border border-white/5 rounded-2xl p-4 hover:border-white/10 transition-colors flex flex-col">
                                                <h4 className="text-[11px] sm:text-xs font-bold text-slate-300 mb-2 flex items-center gap-2">
                                                    <span className="w-5 h-5 rounded-md bg-white/5 border border-white/10 flex items-center justify-center text-slate-400 flex-shrink-0">
                                                        {i + 1}
                                                    </span>
                                                    <span className="truncate" title={['Rebalancing', 'Consider Selling', 'Invest More In', 'Overall Strategy'][i - 3]}>
                                                        {['Rebalancing', 'Consider Selling', 'Invest More In', 'Overall Strategy'][i - 3]}
                                                    </span>
                                                </h4>
                                                <div className="text-[12px] sm:text-[13px] text-slate-400 leading-relaxed CustomScrollbar overflow-y-auto h-24 sm:h-28 pr-1">
                                                    {sections[i]}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Evaluation Form / Marking */}
                                <div className="mt-auto pt-4 flex-1 flex flex-col">
                                    <div className="bg-gradient-to-br from-indigo-500/10 to-slate-900/80 rounded-2xl border border-indigo-500/20 p-4 sm:p-5 flex flex-col h-full shadow-inner">
                                        <div className="flex justify-between items-center mb-3">
                                            <h4 className="text-[13px] sm:text-sm font-bold text-white flex items-center gap-2">
                                                <Lightbulb className="w-4 h-4 text-emerald-400" />
                                                Coordinator Remarks & Review
                                            </h4>
                                            {isReviewed && localStudent.teacherReview?.aggregateScore !== undefined && (
                                                <div className={`px-2.5 py-1 rounded-lg border flex items-center gap-1.5 ${localStudent.teacherReview.aggregateScore >= 80 ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                                                    localStudent.teacherReview.aggregateScore >= 60 ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' :
                                                        localStudent.teacherReview.aggregateScore >= 40 ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                                                            'bg-red-500/10 text-red-500 border-red-500/20'}`}>
                                                    <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider opacity-80">Score</span>
                                                    <span className="text-[13px] sm:text-sm font-bold">{localStudent.teacherReview.aggregateScore}/100</span>
                                                </div>
                                            )}
                                        </div>
                                        <textarea
                                            className="w-full flex-1 min-h-[100px] sm:min-h-[120px] resize-none bg-[#020617]/60 border border-white/10 rounded-xl p-3 text-xs sm:text-sm text-slate-200 focus:ring-2 focus:ring-indigo-500/50 outline-none placeholder:text-slate-500 transition-all mb-4 CustomScrollbar"
                                            placeholder="Type your feedback, marks, and remarks here. Evaluate student's performance..."
                                            value={reviewState.suggestions}
                                            onChange={(e) => setReviewState(prev => ({ ...prev, suggestions: e.target.value }))}
                                        ></textarea>

                                        <button
                                            onClick={handleSubmitReview}
                                            disabled={isSubmitting || reviewState.f1 === 0 || reviewState.f2 === 0 || reviewState.f3 === 0}
                                            className={`w-full py-2.5 sm:py-3 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all duration-300 relative overflow-hidden group/btn disabled:opacity-50 disabled:cursor-not-allowed ${isReviewed
                                                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/30'
                                                    : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-500/20'
                                                }`}
                                        >
                                            {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : (isReviewed ? <CheckCircle className="w-4 h-4" /> : <Send className="w-4 h-4" />)}
                                            <span>{isSubmitting ? "Saving..." : (isReviewed ? "Update Evaluation" : "Submit Evaluation")}</span>
                                        </button>
                                        {!isReviewed && (reviewState.f1 === 0 || reviewState.f2 === 0 || reviewState.f3 === 0) && (
                                            <p className="text-[10px] text-amber-500/80 text-center mt-2 flex items-center justify-center gap-1">
                                                <AlertCircle className="w-3 h-3" /> Rate the 3 core metrics to submit
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        /* Please Reconcile State */
                        <div className="flex flex-col items-center justify-center py-20 px-4 text-center h-full">
                            <div className="relative mb-6">
                                <div className="absolute inset-0 bg-indigo-500/20 rounded-full blur-xl animate-pulse" />
                                <div className="h-20 w-20 bg-slate-800/80 rounded-full flex items-center justify-center border border-white/10 relative z-10">
                                    <Brain className="w-10 h-10 text-indigo-400" />
                                </div>
                            </div>
                            <h3 className="text-xl sm:text-2xl font-bold text-white mb-3">Please Reconcile</h3>
                            <p className="text-sm sm:text-base text-slate-400 max-w-md mx-auto leading-relaxed">
                                No AI analysis has been generated for this student yet. Click the <span className="text-indigo-400 font-semibold px-1">Reconcile</span> button on the main dashboard to generate insights and enable coordinator review.
                            </p>
                        </div>
                    )}
                </div>

                <style dangerouslySetInnerHTML={{
                    __html: `
                    .CustomScrollbar::-webkit-scrollbar {
                        width: 4px;
                    }
                    .CustomScrollbar::-webkit-scrollbar-track {
                        background: transparent;
                    }
                    .CustomScrollbar::-webkit-scrollbar-thumb {
                        background: rgba(255, 255, 255, 0.1);
                        border-radius: 4px;
                    }
                    .CustomScrollbar::-webkit-scrollbar-thumb:hover {
                        background: rgba(255, 255, 255, 0.2);
                    }
                `}} />
            </div>
        </div>
    );
}
