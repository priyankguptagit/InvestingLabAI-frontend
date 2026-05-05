"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Lock, Crown, Sparkles, X, CheckCircle2 } from "lucide-react";
import Link from "next/link";

interface Props {
    isOpen: boolean;
    onClose: () => void;
}

export default function PremiumFeatureModal({ isOpen, onClose }: Props) {
    if (!isOpen) return null;

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100]"
                        onClick={onClose}
                    />

                    {/* Modal */}
                    <div className="fixed inset-0 z-[101] flex items-center justify-center p-4 pointer-events-none">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            transition={{ type: "spring", duration: 0.5 }}
                            className="w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden pointer-events-auto relative border border-white/20"
                        >
                            {/* Decorative Background */}
                            <div className="absolute inset-0 bg-gradient-to-br from-indigo-50 via-white to-purple-50 z-0" />

                            {/* Close Button */}
                            <button
                                onClick={onClose}
                                className="absolute top-4 right-4 p-2 rounded-full bg-white/50 hover:bg-white text-slate-400 hover:text-slate-600 transition-colors z-20 backdrop-blur-sm"
                            >
                                <X size={20} />
                            </button>

                            <div className="relative z-10 p-8 text-center">

                                {/* Icon Circle */}
                                <div className="mx-auto w-20 h-20 bg-gradient-to-tr from-indigo-600 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-500/30 mb-6 rotate-3">
                                    <Lock className="text-white w-10 h-10" />
                                    <div className="absolute -top-2 -right-2 bg-yellow-400 p-1.5 rounded-full border-4 border-white">
                                        <Crown size={14} className="text-yellow-900 fill-current" />
                                    </div>
                                </div>

                                <h2 className="text-2xl font-black text-slate-900 mb-3 tracking-tight">
                                    Premium Feature
                                </h2>

                                <p className="text-slate-600 mb-8 leading-relaxed">
                                    The <span className="font-semibold text-indigo-600">AI Stock Assistant</span> is exclusive to Premium members. Upgrade to unlock chart analysis, portfolio advice, and real-time insights.
                                </p>

                                {/* Features List */}
                                <div className="bg-white/60 rounded-xl p-4 mb-8 text-left space-y-3 border border-indigo-100/50">
                                    {[
                                        "Unlimited AI Chat Queries",
                                        "Real-time Stock Analysis",
                                        "Custom Portfolio Recommendations",
                                        "Risk Assessment"
                                    ].map((feature, i) => (
                                        <div key={i} className="flex items-center gap-3 text-sm text-slate-700">
                                            <CheckCircle2 size={16} className="text-emerald-500 flex-shrink-0" />
                                            <span>{feature}</span>
                                        </div>
                                    ))}
                                </div>

                                {/* Actions */}
                                <div className="space-y-3">
                                    <Link href="/user/premium">
                                        <button className="w-full py-3.5 px-6 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 group">
                                            <Sparkles size={18} className="fill-indigo-400 text-indigo-100 group-hover:animate-pulse" />
                                            Upgrade to Unlock
                                        </button>
                                    </Link>

                                    <button
                                        onClick={onClose}
                                        className="w-full py-3 rounded-xl text-slate-500 font-semibold hover:bg-slate-50 transition-colors text-sm"
                                    >
                                        Maybe Later
                                    </button>
                                </div>

                            </div>
                        </motion.div>
                    </div>
                </>
            )}
        </AnimatePresence>
    );
}
