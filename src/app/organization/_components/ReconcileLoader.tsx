"use client";

import Image from 'next/image';

interface ReconcileLoaderProps {
    isReconciling: boolean;
    text?: string;
}

export function ReconcileLoader({ isReconciling, text = "Reconciling Reports..." }: ReconcileLoaderProps) {
    if (!isReconciling) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            {/* Blurred dark overlay */}
            <div className="absolute inset-0 bg-[#030712]/60 backdrop-blur-md" />

            {/* Loader container */}
            <div className="relative z-10 flex flex-col items-center">
                {/* Glowing ring effects behind logo */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                    <div className="w-32 h-32 rounded-full border-2 border-indigo-500/30 border-t-indigo-500 animate-spin" style={{ animationDuration: '3s' }} />
                </div>
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                    <div className="w-40 h-40 rounded-full border-2 border-purple-500/20 border-b-purple-500 animate-spin" style={{ animationDuration: '4s', animationDirection: 'reverse' }} />
                </div>

                {/* Logo with pulsing glow */}
                <div className="relative w-24 h-24 mb-6 rounded-2xl overflow-hidden shadow-[0_0_30px_rgba(99,102,241,0.4)] animate-pulse-slow">
                    <Image
                        src="/praedico-logo.png"
                        alt="Praedico Global Research"
                        fill
                        className="object-contain bg-white"
                        priority
                    />
                </div>

                {/* Text and dots */}
                <div className="bg-[#0F172A]/80 border border-white/10 px-8 py-4 rounded-full shadow-xl shadow-black/50 backdrop-blur-md">
                    <div className="flex items-center gap-3">
                        <span className="text-lg font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">
                            {text}
                        </span>
                        <div className="flex gap-1 mt-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-bounce" style={{ animationDelay: '0ms' }} />
                            <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-bounce" style={{ animationDelay: '150ms' }} />
                            <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-bounce" style={{ animationDelay: '300ms' }} />
                        </div>
                    </div>
                    <p className="text-xs text-slate-400 text-center mt-2 font-medium">Please wait while AI analyzes portfolios</p>
                </div>
            </div>
        </div>
    );
}
