"use client";

import { useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Zap, Crown, Gem, CheckCircle2, Tag, Clock, CreditCard, Lock } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { PLAN_PRICES, DURATION_LABELS, PlanName, Duration } from "@/config/pricing.config";

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  planName: PlanName;
  duration: Duration;
  appliedReferral: { code: string; discountPercent: number } | null;
  loading: boolean;
}

const PLAN_META: Record<PlanName, { icon: LucideIcon; color: string; gradient: string; features: string[] }> = {
  Silver: {
    icon: Zap,
    color: "#94a3b8",
    gradient: "from-slate-400 to-slate-600",
    features: ["Premium News Feed", "₹1 Lac Virtual Balance", "News Based AI Analysis (5/month)", "Certificate", "Paper Investment Portal"],
  },
  Gold: {
    icon: Crown,
    color: "#f59e0b",
    gradient: "from-amber-400 to-orange-500",
    features: ["Virtual Amount – 5 Lac", "ChatBot – Token 10k", "AI Based Analysis (2/month)", "All Silver Features", "Priority Support"],
  },
  Diamond: {
    icon: Gem,
    color: "#a78bfa",
    gradient: "from-violet-400 to-purple-600",
    features: ["Virtual Amount – 10 Lac", "ChatBot – Token 20k", "AI Based Analysis (4/month)", "News, Shares & ETF Price", "All Gold Features"],
  },
};

export default function CheckoutModal({
  isOpen, onClose, onConfirm, planName, duration, appliedReferral, loading,
}: CheckoutModalProps) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const meta = PLAN_META[planName];
  const Icon = meta.icon;

  const basePrice = PLAN_PRICES[planName][duration];
  const discountAmount = appliedReferral
    ? Math.floor((basePrice * appliedReferral.discountPercent) / 100)
    : 0;
  const finalPrice = basePrice - discountAmount;
  const pricePerMonth = Math.round(finalPrice / duration);

  useEffect(() => {
    if (isOpen) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => { document.body.style.overflow = ""; };
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          ref={overlayRef}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[100] flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(8px)" }}
          onClick={(e) => { if (e.target === overlayRef.current) onClose(); }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 24 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 24 }}
            transition={{ type: "spring", stiffness: 380, damping: 32 }}
            className="relative w-full max-w-md bg-[#0f0f1a] border border-white/10 rounded-2xl overflow-hidden shadow-2xl"
          >
            {/* Glow accent */}
            <div
              className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-1 rounded-full opacity-80"
              style={{ background: `linear-gradient(90deg, transparent, ${meta.color}, transparent)` }}
            />

            {/* Header */}
            <div className={`relative px-6 pt-6 pb-5 bg-gradient-to-br ${meta.gradient} bg-opacity-10`}
              style={{ background: `linear-gradient(135deg, ${meta.color}18, ${meta.color}08)` }}>
              <button
                onClick={onClose}
                className="absolute top-4 right-4 p-1.5 rounded-full bg-white/10 hover:bg-white/20 transition-colors text-white/60 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="flex items-center gap-4">
                <div
                  className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg"
                  style={{ background: `linear-gradient(135deg, ${meta.color}40, ${meta.color}20)`, border: `1px solid ${meta.color}40` }}
                >
                  <Icon className="w-7 h-7" style={{ color: meta.color } as React.CSSProperties} />
                </div>
                <div>
                  <p className="text-white/50 text-xs font-medium uppercase tracking-widest mb-0.5">Order Summary</p>
                  <h2 className="text-white text-2xl font-bold">{planName} Plan</h2>
                  <p className="text-white/60 text-sm">{DURATION_LABELS[duration]} · One-time payment</p>
                </div>
              </div>
            </div>

            {/* Features */}
            <div className="px-6 py-4 border-b border-white/[0.07]">
              <p className="text-white/40 text-xs uppercase tracking-widest font-semibold mb-3">What you get</p>
              <div className="space-y-2">
                {meta.features.map((f) => (
                  <div key={f} className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0" style={{ color: meta.color }} />
                    <span className="text-white/75 text-sm">{f}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Price Breakdown */}
            <div className="px-6 py-4 space-y-2.5">
              <div className="flex justify-between items-center text-sm">
                <span className="text-white/50">Base price</span>
                <span className="text-white/80">₹{basePrice.toLocaleString("en-IN")}</span>
              </div>

              {appliedReferral && (
                <div className="flex justify-between items-center text-sm">
                  <span className="flex items-center gap-1.5 text-emerald-400">
                    <Tag className="w-3.5 h-3.5" />
                    Referral ({appliedReferral.discountPercent}% off)
                  </span>
                  <span className="text-emerald-400">−₹{discountAmount.toLocaleString("en-IN")}</span>
                </div>
              )}

              <div
                className="flex justify-between items-center pt-2.5 mt-1 border-t"
                style={{ borderColor: `${meta.color}30` }}
              >
                <div>
                  <p className="text-white font-bold text-lg">
                    ₹{finalPrice.toLocaleString("en-IN")}
                  </p>
                  {duration > 1 && (
                    <p className="text-white/40 text-xs">
                      ₹{pricePerMonth.toLocaleString("en-IN")} / month
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-1.5 text-white/40 text-xs">
                  <Clock className="w-3.5 h-3.5" />
                  <span>No auto-renewal</span>
                </div>
              </div>
            </div>

            {/* CTA */}
            <div className="px-6 pb-6 space-y-3">
              <motion.button
                onClick={onConfirm}
                disabled={loading}
                whileTap={{ scale: 0.97 }}
                className="w-full flex items-center justify-center gap-2.5 py-3.5 rounded-xl font-bold text-white text-base transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                style={{
                  background: loading
                    ? `${meta.color}60`
                    : `linear-gradient(135deg, ${meta.color}, ${meta.color}cc)`,
                  boxShadow: loading ? "none" : `0 8px 32px ${meta.color}40`,
                }}
              >
                {loading ? (
                  <>
                    <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                    </svg>
                    Processing…
                  </>
                ) : (
                  <>
                    <CreditCard className="w-5 h-5" />
                    Pay ₹{finalPrice.toLocaleString("en-IN")}
                  </>
                )}
              </motion.button>

              <div className="flex items-center justify-center gap-1.5 text-white/30 text-xs">
                <Lock className="w-3 h-3" />
                <span>Secured by Razorpay · 256-bit SSL</span>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
