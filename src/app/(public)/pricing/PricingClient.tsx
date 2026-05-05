"use client";

import { useState } from "react";
import {
  Check,
  Zap,
  Crown,
  Shield,
  Rocket,
  Sparkles,
  ArrowRight,
  BadgeCheck,
  Users,
  TrendingUp as TrendingIcon,
  ShieldCheck,
} from "lucide-react";
import { motion } from "framer-motion";
import {
  PLAN_PRICES,
  DURATION_LABELS,
  DURATION_SAVINGS,
  PRICING_FAQ,
  type PlanName,
  type Duration,
} from "@/config/pricing.config";
import LoginModal from "@/app/user/_components/LoginModal";
import RegisterModal from "@/app/user/_components/RegisterModal";
import { Badge } from "@/shared-components/ui/badge";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/shared-components/ui/accordion";

const DURATIONS: Duration[] = [1, 3, 6];

const planMeta: Record<
  PlanName,
  { icon: any; desc: string; features: string[]; highlight?: boolean }
> = {
  Silver: {
    icon: Zap,
    desc: "Essential tools to start your trading journey.",
    features: [
      "Basic News & ETFs",
      "₹1 Lac Virtual Balance",
      "Basic Paper Trading",
      "Trading Level Badge",
      "No News Based AI Analysis",
      "No Certificate",
    ],
  },
  Gold: {
    icon: Rocket,
    desc: "Advanced insights for the serious trader.",
    highlight: true,
    features: [
      "Premium News Feed",
      "Virtual Amount — ₹5 Lac",
      "News Based AI Analysis — 5×/month",
      "Certificate",
      "Paper Investment Portal",
      "ChatBot — 10k tokens",
      "AI Based Analysis — 2×/month",
      "News & Share Prices",
    ],
  },
  Diamond: {
    icon: Crown,
    desc: "Full power for ambitious learners.",
    features: [
      "Real-Time Data Feed",
      "Virtual Amount — ₹10 Lac",
      "News Based AI Analysis — 10×/month",
      "Certificate",
      "Paper Investment Portal",
      "ChatBot — 20k tokens",
      "AI Based Analysis — 4×/month",
      "News, Shares & ETF Prices",
      "1:1 Expert Session — 2×/month",
    ],
  },
};

const stats = [
  {
    label: "Active Subscribers",
    value: "15,000+",
    icon: <Users className="w-5 h-5 text-indigo-400" />,
    desc: "Trusting our signals daily",
  },
  {
    label: "Premium Members",
    value: "8,500+",
    icon: <ShieldCheck className="w-5 h-5 text-emerald-400" />,
    desc: "Unlocking advanced alpha",
  },
  {
    label: "Monthly Savings",
    value: "Up to 17%",
    icon: <TrendingIcon className="w-5 h-5 text-fuchsia-400" />,
    desc: "On longer-duration plans",
  },
];

export default function PricingClient() {
  const [duration, setDuration] = useState<Duration>(1);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);

  const handleGetStarted = () => setIsRegisterModalOpen(true);

  return (
    <div className="min-h-screen bg-[#020617] text-white selection:bg-indigo-500/30 font-sans pb-20 pt-32 lg:pt-40 overflow-x-hidden">

      {/* ── BACKGROUND GLOWS ─────────────────────────────── */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-500/10 blur-[120px] rounded-full animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-fuchsia-500/10 blur-[120px] rounded-full animate-pulse" />
      </div>

      <div className="container mx-auto px-6 relative z-10">

        {/* ── HERO ─────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="inline-flex items-center gap-2 mb-6"
          >
            <Badge
              variant="outline"
              className="text-xs md:text-sm font-bold uppercase tracking-[0.5em] text-indigo-400 border-indigo-500/30 bg-indigo-500/5 px-4 py-1 rounded-full"
            >
              <Sparkles size={12} className="fill-indigo-400 mr-1" />
              No recurring charges · Pay once · Access unlocked
            </Badge>
          </motion.div>

          <h1 className="text-4xl md:text-5xl lg:text-6xl font-black tracking-tight leading-tight text-white mb-6">
            Pick Your{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-fuchsia-400">
              Plan
            </span>
          </h1>

          <p className="text-lg text-slate-400 max-w-xl mx-auto leading-relaxed mb-10">
            One payment. Real access. No subscriptions, no auto-renewals, no surprises —
            just premium trading intelligence for as long as you need it.
          </p>

          {/* ── Duration Toggle ──────────────────────────── */}
          <div className="inline-flex items-center gap-1 bg-white/5 border border-white/10 rounded-2xl p-1.5">
            {DURATIONS.map((d) => (
              <button
                key={d}
                onClick={() => setDuration(d)}
                className={`relative px-5 py-2.5 rounded-xl text-sm font-bold transition-all duration-200 ${
                  duration === d
                    ? "bg-indigo-600 text-white shadow-md shadow-indigo-500/30"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                {DURATION_LABELS[d]}
                {DURATION_SAVINGS[d] && duration !== d && (
                  <span className="absolute -top-2.5 -right-1 text-[9px] font-black text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-1 py-0.5 rounded-full leading-none">
                    {DURATION_SAVINGS[d]}
                  </span>
                )}
              </button>
            ))}
          </div>
        </motion.div>

        {/* ── STATS ROW ─────────────────────────────────── */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto mb-16">
          {stats.map((stat, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1 + idx * 0.1 }}
              className="flex flex-col items-center text-center p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm"
            >
              <div className="p-2.5 rounded-xl bg-white/5 border border-white/10 mb-3">{stat.icon}</div>
              <div className="text-2xl font-black text-white leading-none">{stat.value}</div>
              <div className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-[0.2em]">{stat.label}</div>
              <p className="text-[10px] text-slate-500 font-medium mt-1">{stat.desc}</p>
            </motion.div>
          ))}
        </div>

        {/* ── PRICING CARDS ─────────────────────────────── */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto mb-20">
          {(Object.keys(planMeta) as PlanName[]).map((plan, idx) => {
            const meta = planMeta[plan];
            const price = PLAN_PRICES[plan][duration];
            const Icon = meta.icon;

            return (
              <motion.div
                key={plan}
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 + idx * 0.1, duration: 0.5, type: "spring", stiffness: 100 }}
                className={`relative flex flex-col rounded-[32px] p-8 border backdrop-blur-md transition-all duration-300 hover:shadow-2xl ${
                  meta.highlight
                    ? "bg-slate-900/60 border-indigo-500/50 shadow-2xl shadow-indigo-500/20 z-10 md:scale-105"
                    : "bg-white/5 border-white/10 hover:border-white/20 hover:bg-white/[0.07]"
                }`}
              >
                {/* Most Popular badge */}
                {meta.highlight && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-indigo-600 to-violet-600 text-white text-xs font-bold px-4 py-1.5 rounded-full shadow-lg shadow-indigo-500/30">
                    Most Popular
                  </div>
                )}

                {/* Icon */}
                <div
                  className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-6 transition-colors duration-300 ${
                    meta.highlight
                      ? "bg-indigo-500/20 text-indigo-400"
                      : "bg-white/5 text-slate-400 hover:bg-indigo-500/10 hover:text-indigo-400"
                  }`}
                >
                  <Icon size={24} />
                </div>

                {/* Title & description */}
                <h3 className="text-2xl font-bold text-white mb-2">{plan}</h3>
                <p className="text-slate-400 text-sm mb-6 h-10">{meta.desc}</p>

                {/* Price */}
                <div className="flex items-baseline gap-1 mb-2">
                  <span className="text-4xl font-black text-white tracking-tight">
                    ₹{(price).toLocaleString("en-IN")}
                  </span>
                  <span className="text-slate-400 font-medium">/{DURATION_LABELS[duration].toLowerCase()}</span>
                </div>

                {duration > 1 && (
                  <p className="text-xs text-emerald-400 font-semibold mb-6">
                    ₹{Math.round(price / duration).toLocaleString("en-IN")}/mo · {DURATION_SAVINGS[duration]}
                  </p>
                )}
                {duration === 1 && <div className="mb-6" />}

                {/* CTA */}
                <motion.button
                  onClick={handleGetStarted}
                  whileTap={{ scale: 0.98 }}
                  className={`w-full py-4 rounded-xl font-bold text-sm mb-3 transition-all shadow-lg flex items-center justify-center gap-2 ${
                    meta.highlight
                      ? "bg-gradient-to-r from-indigo-600 to-violet-600 text-white hover:brightness-110 shadow-indigo-500/30"
                      : "bg-white/5 border border-white/10 text-white hover:bg-white/10"
                  }`}
                >
                  Get Started <ArrowRight size={15} />
                </motion.button>

                <p className="text-center text-[11px] text-slate-500 mb-4">
                  Sign up or log in to activate your plan
                </p>

                {/* Feature list */}
                <div className="space-y-3 border-t border-white/10 pt-6 mt-2">
                  {meta.features.map((feat, i) => (
                    <div key={i} className="flex items-start gap-3 text-sm text-slate-300">
                      <div className="mt-0.5 p-0.5 rounded-full bg-indigo-500/20 text-indigo-400 shrink-0">
                        <Check size={12} strokeWidth={3} />
                      </div>
                      {feat}
                    </div>
                  ))}
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* ── TRUST BADGES ──────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="flex flex-wrap items-center justify-center gap-6 text-sm text-slate-400 mb-20"
        >
          {[
            "Secured by Razorpay",
            "No auto-renewals",
            "Instant activation",
            "Cancel anytime during trial",
          ].map((text) => (
            <span key={text} className="flex items-center gap-1.5">
              <BadgeCheck size={14} className="text-emerald-400" />
              {text}
            </span>
          ))}
        </motion.div>

        {/* ── FAQ ───────────────────────────────────────── */}
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-10 space-y-3">
            <h2 className="text-3xl font-black tracking-tight">Frequently Asked Questions</h2>
            <p className="text-slate-400 text-sm font-medium">
              Everything you need to know about our plans and services.
            </p>
          </div>

          <Accordion type="single" collapsible className="w-full space-y-3">
            {PRICING_FAQ.map((faq, idx) => (
              <AccordionItem
                key={idx}
                value={`item-${idx}`}
                className="rounded-2xl bg-white/5 border border-white/10 overflow-hidden transition-all duration-300"
              >
                <AccordionTrigger className="w-full p-6 flex items-center justify-between text-left hover:bg-white/[0.02] transition-colors hover:no-underline">
                  <span className="text-base font-bold text-slate-200 pr-8">{faq.question}</span>
                </AccordionTrigger>
                <AccordionContent className="px-6 pb-6 text-slate-500 leading-relaxed font-medium text-sm border-t border-white/[0.03] pt-5">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </div>

      {/* ── MODALS ────────────────────────────────────────── */}
      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        onSwitchToRegister={() => {
          setIsLoginModalOpen(false);
          setIsRegisterModalOpen(true);
        }}
      />
      <RegisterModal
        isOpen={isRegisterModalOpen}
        onClose={() => setIsRegisterModalOpen(false)}
        onSwitchToLogin={() => {
          setIsRegisterModalOpen(false);
          setIsLoginModalOpen(true);
        }}
      />
    </div>
  );
}