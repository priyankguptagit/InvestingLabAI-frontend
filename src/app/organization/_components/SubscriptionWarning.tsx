"use client";

import { useState, useEffect } from 'react';
import { AlertTriangle, Clock, X, ChevronRight } from 'lucide-react';

interface SubscriptionWarningProps {
    expiryDate: string;
    planName: string;
}

export default function SubscriptionWarning({ expiryDate, planName }: SubscriptionWarningProps) {
    const [isVisible, setIsVisible] = useState(false);
    const [daysRemaining, setDaysRemaining] = useState<number | null>(null);

    useEffect(() => {
        // Calculate days remaining
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const expiry = new Date(expiryDate);
        expiry.setHours(0, 0, 0, 0);

        const diffTime = expiry.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        setDaysRemaining(diffDays);

        // Show popup if 7 days or less remaining, and haven't dismissed it today
        if (diffDays <= 7) {
            const lastDismissed = localStorage.getItem('praedico_sub_warning_dismissed');
            const todayStr = today.toISOString().split('T')[0];

            // If never dismissed, or dismissed on a previous day, show it
            if (lastDismissed !== todayStr) {
                setIsVisible(true);
            }
        }
    }, [expiryDate]);

    const handleDismiss = () => {
        setIsVisible(false);
        const today = new Date();
        localStorage.setItem('praedico_sub_warning_dismissed', today.toISOString().split('T')[0]);
    };

    if (!isVisible || daysRemaining === null || daysRemaining > 7) {
        return null;
    }

    const isCritical = daysRemaining <= 1;

    return (
        <div className="fixed bottom-6 right-6 z-50 max-w-sm w-full animate-fade-in-up">
            <div className={`
                relative overflow-hidden rounded-2xl shadow-2xl border p-5 pl-6
                ${isCritical
                    ? 'bg-rose-950/90 border-rose-500/50 shadow-rose-900/50'
                    : 'bg-amber-950/90 border-amber-500/50 shadow-amber-900/50'}
                backdrop-blur-xl
            `}>
                {/* Decorative border strip */}
                <div className={`absolute left-0 top-0 bottom-0 w-1 ${isCritical ? 'bg-rose-500' : 'bg-amber-500'}`} />

                <button
                    onClick={handleDismiss}
                    className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors"
                >
                    <X className="w-5 h-5" />
                </button>

                <div className="flex gap-4 items-start">
                    <div className={`
                        p-3 rounded-xl shrink-0
                        ${isCritical ? 'bg-rose-500/20 text-rose-400' : 'bg-amber-500/20 text-amber-400'}
                    `}>
                        {isCritical ? <AlertTriangle className="w-6 h-6" /> : <Clock className="w-6 h-6" />}
                    </div>

                    <div>
                        <h3 className={`font-bold text-lg mb-1 leading-tight ${isCritical ? 'text-rose-400' : 'text-amber-400'}`}>
                            {daysRemaining < 0 ? 'Subscription Expired' :
                                daysRemaining === 0 ? 'Expires Today!' :
                                    `Expires in ${daysRemaining} Days`}
                        </h3>
                        <p className="text-slate-300 text-sm leading-relaxed mb-4">
                            Your <strong className="text-white">{planName}</strong> will {daysRemaining < 0 ? 'stay expired' : 'expire'} on{' '}
                            <strong className="text-white">
                                {new Date(expiryDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                            </strong>.
                            Please contact Praedico administration to renew.
                        </p>

                        <button
                            onClick={handleDismiss}
                            className={`
                                text-sm font-semibold flex items-center gap-1 transition-colors
                                ${isCritical ? 'text-rose-300 hover:text-rose-200' : 'text-amber-300 hover:text-amber-200'}
                            `}
                        >
                            Dismiss for now <ChevronRight className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
