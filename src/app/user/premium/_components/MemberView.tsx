"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import {
  CheckCircle2, Calendar, Zap, Crown, Gem, Download,
  ShieldCheck, Sparkles, ArrowRight, Clock,
} from "lucide-react";
import type { PlanName } from "@/config/pricing.config";

interface MemberViewProps {
  planName: PlanName;
  isOnTrial: boolean;
  expiryDate: string | null;
  userName?: string;
  paymentHistory: any[];
  onDownloadInvoice: (record: any) => void;
  onUpgradeClick: () => void;
}

/* ── Plan metadata ──────────────────────────────────────────────── */
const PLAN_CONFIG = {
  Silver: {
    bgImage: "/silver-plan-bg.png",
    accent: "#94a3b8",
    accentDark: "#64748b",
    gradient: "from-slate-500 via-slate-400 to-slate-300",
    glowColor: "rgba(148,163,184,0.25)",
    icon: Zap,
    badge: "Silver Member",
    tagline: "Your premium journey has begun.",
    features: [
      "Premium News Feed",
      "₹1 Lac Virtual Balance",
      "AI News Analysis (5/month)",
      "Digital Certificate",
      "Paper Investment Portal",
    ],
  },
  Gold: {
    bgImage: "/gold-plan-bg.png",
    accent: "#f59e0b",
    accentDark: "#d97706",
    gradient: "from-amber-500 via-yellow-400 to-amber-300",
    glowColor: "rgba(245,158,11,0.3)",
    icon: Crown,
    badge: "Gold Member",
    tagline: "You've unlocked the wealth tier.",
    features: [
      "₹5 Lac Virtual Balance",
      "ChatBot — 10k Tokens",
      "AI Analysis (2/month)",
      "All Silver Features",
      "Priority Support",
    ],
  },
  Diamond: {
    bgImage: "/diamond-plan-bg.png",
    accent: "#a78bfa",
    accentDark: "#7c3aed",
    gradient: "from-violet-500 via-purple-400 to-fuchsia-400",
    glowColor: "rgba(167,139,250,0.3)",
    icon: Gem,
    badge: "Diamond Member",
    tagline: "You're at the apex of the platform.",
    features: [
      "₹10 Lac Virtual Balance",
      "ChatBot — 20k Tokens",
      "AI Analysis (4/month)",
      "Live Share & ETF Prices",
      "All Gold Features",
    ],
  },
} satisfies Record<PlanName, any>;

function downloadInvoiceLocal(record: any) {
  const color = record.planName === "Gold" ? "#f59e0b" : record.planName === "Diamond" ? "#a78bfa" : "#94a3b8";
  const amtRs = (record.amountPaise / 100).toLocaleString("en-IN", { minimumFractionDigits: 2 });
  const expiry = record.expiresAt
    ? new Date(record.expiresAt).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })
    : "N/A";
  const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"/><title>Invoice</title>
<style>*{margin:0;padding:0;box-sizing:border-box;}body{font-family:'Segoe UI',sans-serif;background:#f8f9fe;padding:40px;color:#1e293b;}
.box{max-width:620px;margin:auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 32px rgba(0,0,0,.1);}
.hdr{background:linear-gradient(135deg,${color},${color}88);padding:28px 32px;color:#fff;}
.hdr h1{font-size:18px;font-weight:700;}
.hdr p{font-size:11px;opacity:.8;margin-top:3px;}
.inv{display:inline-block;margin-top:8px;background:rgba(255,255,255,.2);border:1px solid rgba(255,255,255,.3);border-radius:6px;padding:2px 10px;font-size:11px;font-weight:700;}
.body{padding:28px 32px;}
.row{display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid #f1f5f9;font-size:13px;}
.row:last-child{border:none;} .k{color:#64748b;} .v{font-weight:600;}
.total{margin-top:16px;background:linear-gradient(135deg,#f0f4ff,#ede9fe);border:1px solid #c7d2fe;border-radius:10px;padding:16px 20px;display:flex;justify-content:space-between;align-items:center;}
.amt{font-size:22px;font-weight:800;color:#4f46e5;}
.chip{background:#dcfce7;color:#16a34a;border:1px solid #bbf7d0;border-radius:5px;padding:2px 8px;font-size:10px;font-weight:700;}
.ftr{background:#f8f9fe;padding:14px 32px;text-align:center;font-size:10px;color:#94a3b8;border-top:1px solid #e2e8f0;}
</style></head><body>
<div class="box">
  <div class="hdr"><h1>Praedico Global Research</h1><p>Tax Invoice / Payment Receipt</p>
  <div class="inv">INVOICE #${(record._id || record.razorpayPaymentId || "").toString().slice(-8).toUpperCase()}</div></div>
  <div class="body">
    <div class="row"><span class="k">Plan</span><span class="v">${record.planName}</span></div>
    <div class="row"><span class="k">Duration</span><span class="v">${record.duration} Month${record.duration > 1 ? "s" : ""}</span></div>
    <div class="row"><span class="k">Valid Until</span><span class="v">${expiry}</span></div>
    <div class="row"><span class="k">Payment ID</span><span class="v" style="font-family:monospace;font-size:11px">${record.razorpayPaymentId || "N/A"}</span></div>
    <div class="row"><span class="k">Status</span><span class="chip">PAID</span></div>
    <div class="total">
      <div><div style="font-size:11px;color:#64748b;margin-bottom:3px">Total Paid</div><div class="amt">₹${amtRs}</div></div>
      <div style="text-align:right;font-size:11px;color:#64748b"><div>One-time</div><div>No auto-renewal</div></div>
    </div>
  </div>
  <div class="ftr">Praedico Global Research · support@praedico.com<br/>Computer-generated receipt.</div>
</div></body></html>`;
  const a = Object.assign(document.createElement("a"), {
    href: URL.createObjectURL(new Blob([html], { type: "text/html" })),
    download: `praedico-invoice-${(record._id || "").toString().slice(-8)}.html`,
  });
  a.click();
}

export default function MemberView({
  planName, isOnTrial, expiryDate, userName, paymentHistory, onUpgradeClick,
}: MemberViewProps) {
  const cfg = PLAN_CONFIG[planName];
  const PlanIcon = cfg.icon;

  return (
    <div className="min-h-screen relative overflow-hidden">

      {/* ── Background image with overlay ── */}
      <div className="fixed inset-0 z-0">
        <Image
          src={cfg.bgImage}
          alt={`${planName} background`}
          fill
          className="object-cover object-center"
          priority
          quality={90}
        />
        <div className="absolute inset-0" style={{
          background: `linear-gradient(180deg, rgba(5,5,15,0.72) 0%, rgba(5,5,15,0.85) 40%, rgba(5,5,15,0.97) 100%)`,
        }} />
        {/* Glow orb */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[300px] rounded-full blur-[120px] opacity-20 pointer-events-none"
          style={{ background: cfg.accent }} />
      </div>

      <div className="relative z-10 pt-28 pb-20 px-6 max-w-5xl mx-auto">

        {/* ── Hero Member Card ─────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 32 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="relative rounded-3xl overflow-hidden mb-10"
          style={{
            background: `linear-gradient(135deg, rgba(255,255,255,0.06), rgba(255,255,255,0.02))`,
            border: `1px solid ${cfg.accent}30`,
            boxShadow: `0 0 80px ${cfg.glowColor}, inset 0 1px 0 rgba(255,255,255,0.08)`,
          }}
        >
          {/* Top accent bar */}
          <div className="h-1 w-full" style={{ background: `linear-gradient(90deg,transparent,${cfg.accent},transparent)` }} />

          <div className="p-8 md:p-10">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="flex items-center gap-5">
                {/* Plan icon */}
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center flex-shrink-0"
                  style={{ background: `radial-gradient(circle,${cfg.accent}25,${cfg.accent}08)`, border: `1.5px solid ${cfg.accent}40`, boxShadow: `0 0 30px ${cfg.accent}20` }}>
                  <PlanIcon className="w-8 h-8" style={{ color: cfg.accent }} />
                </div>
                <div>
                  {/* Badge */}
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold mb-2"
                    style={{ background: `${cfg.accent}15`, border: `1px solid ${cfg.accent}30`, color: cfg.accent }}>
                    <ShieldCheck className="w-3 h-3" /> {cfg.badge}
                  </div>
                  <h1 className="text-3xl md:text-4xl font-extrabold text-white leading-tight">
                    {userName ? `Welcome back,` : "You're a Member"}
                  </h1>
                  {userName && (
                    <p className="text-2xl font-bold mt-0.5" style={{ color: cfg.accent }}>{userName}</p>
                  )}
                  <p className="text-slate-400 text-sm mt-1">{cfg.tagline}</p>
                </div>
              </div>

              {/* Expiry pill */}
              <div className="flex-shrink-0 rounded-2xl px-5 py-4 text-center"
                style={{ background: `${cfg.accent}10`, border: `1px solid ${cfg.accent}25` }}>
                <div className="flex items-center gap-1.5 justify-center mb-1" style={{ color: cfg.accent }}>
                  <Calendar className="w-3.5 h-3.5" />
                  <span className="text-xs font-semibold uppercase tracking-wider">
                    {isOnTrial ? "Trial Ends" : "Access Until"}
                  </span>
                </div>
                <p className="text-white font-bold text-lg">{expiryDate || "—"}</p>
                {isOnTrial && (
                  <p className="text-xs mt-1" style={{ color: cfg.accent }}>7-day free trial</p>
                )}
              </div>
            </div>
          </div>
        </motion.div>

        {/* ── Features + Invoice grid ───────────────────── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">

          {/* Features */}
          <motion.div
            initial={{ opacity: 0, x: -24 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.15 }}
            className="rounded-2xl p-6"
            style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}
          >
            <div className="flex items-center gap-2 mb-5">
              <Sparkles className="w-4 h-4" style={{ color: cfg.accent }} />
              <h2 className="text-white font-bold text-base">Your Benefits</h2>
            </div>
            <div className="space-y-3">
              {cfg.features.map((f: string, i: number) => (
                <motion.div
                  key={f}
                  initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 + i * 0.06 }}
                  className="flex items-center gap-3"
                >
                  <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0"
                    style={{ background: `${cfg.accent}20`, border: `1px solid ${cfg.accent}30` }}>
                    <CheckCircle2 className="w-3 h-3" style={{ color: cfg.accent }} />
                  </div>
                  <span className="text-slate-300 text-sm">{f}</span>
                </motion.div>
              ))}
            </div>

            {isOnTrial && (
              <div className="mt-5 pt-4 border-t border-white/8">
                <button
                  onClick={onUpgradeClick}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold transition-all"
                  style={{
                    background: `linear-gradient(135deg,${cfg.accent},${cfg.accentDark})`,
                    boxShadow: `0 6px 20px ${cfg.accent}35`,
                    color: "#fff",
                  }}
                >
                  Upgrade to Full Access <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </motion.div>

          {/* Invoice history */}
          <motion.div
            initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}
            className="rounded-2xl p-6"
            style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}
          >
            <div className="flex items-center gap-2 mb-5">
              <Clock className="w-4 h-4" style={{ color: cfg.accent }} />
              <h2 className="text-white font-bold text-base">Payment Invoices</h2>
            </div>

            {paymentHistory.length === 0 ? (
              <div className="text-center py-8 text-slate-500 text-sm">
                No paid invoices yet.
              </div>
            ) : (
              <div className="space-y-3">
                {paymentHistory.map((r, i) => (
                  <div key={i}
                    className="flex items-center justify-between p-3 rounded-xl"
                    style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}
                  >
                    <div>
                      <p className="text-white text-sm font-semibold">{r.planName} · {r.duration} mo</p>
                      <p className="text-slate-500 text-xs mt-0.5">
                        {new Date(r.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                        {" · "}
                        <span style={{ color: cfg.accent }}>₹{(r.amountPaise / 100).toLocaleString("en-IN")}</span>
                      </p>
                    </div>
                    <button
                      onClick={() => downloadInvoiceLocal(r)}
                      className="p-2 rounded-lg transition-colors"
                      style={{ background: `${cfg.accent}15`, border: `1px solid ${cfg.accent}25` }}
                      title="Download Invoice"
                    >
                      <Download className="w-3.5 h-3.5" style={{ color: cfg.accent }} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        </div>

        {/* ── Bottom trust bar ──────────────────────────── */}
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}
          className="flex flex-wrap justify-center gap-6 text-slate-500 text-xs"
        >
          {["Secured by Razorpay", "No auto-renewal", "Instant activation"].map((t) => (
            <span key={t} className="flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5" style={{ color: cfg.accent }} /> {t}
            </span>
          ))}
        </motion.div>
      </div>
    </div>
  );
}
