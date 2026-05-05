"use client";

import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, Download, X, Calendar, CreditCard, Package } from "lucide-react";
import type { PlanName, Duration } from "@/config/pricing.config";
import { DURATION_LABELS } from "@/config/pricing.config";

interface PostPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  planName: PlanName;
  duration: Duration;
  amountPaid: number; // rupees
  paymentId: string;
  expiresAt: string;
}

const PLAN_COLOR: Record<PlanName, string> = {
  Silver:  "#94a3b8",
  Gold:    "#f59e0b",
  Diamond: "#a78bfa",
};

function downloadInvoice(p: PostPaymentModalProps) {
  const color = PLAN_COLOR[p.planName];
  const html = `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"/>
<title>Invoice – Praedico</title><style>
*{margin:0;padding:0;box-sizing:border-box;}
body{font-family:'Segoe UI',sans-serif;background:#f8f9fe;padding:40px;color:#1e293b;}
.box{max-width:640px;margin:auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 32px rgba(0,0,0,.12);}
.hdr{background:linear-gradient(135deg,${color},${color}99);padding:32px 36px;color:#fff;}
.hdr h1{font-size:20px;font-weight:700;}
.hdr p{font-size:12px;opacity:.75;margin-top:4px;}
.inv{display:inline-block;margin-top:10px;background:rgba(255,255,255,.2);border:1px solid rgba(255,255,255,.3);border-radius:8px;padding:3px 12px;font-size:12px;font-weight:700;}
.body{padding:32px 36px;}
.lbl{font-size:11px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:#94a3b8;margin-bottom:10px;}
.row{display:flex;justify-content:space-between;padding:9px 0;border-bottom:1px solid #f1f5f9;font-size:14px;}
.row:last-child{border:none;}
.row .k{color:#64748b;}
.row .v{font-weight:600;}
.total{margin-top:18px;background:linear-gradient(135deg,#f0f4ff,#ede9fe);border:1px solid #c7d2fe;border-radius:12px;padding:18px 22px;display:flex;justify-content:space-between;align-items:center;}
.amt{font-size:24px;font-weight:800;color:#4f46e5;}
.chip{display:inline-block;background:#dcfce7;color:#16a34a;border:1px solid #bbf7d0;border-radius:6px;padding:2px 10px;font-size:11px;font-weight:700;}
.ftr{background:#f8f9fe;padding:16px 36px;text-align:center;font-size:11px;color:#94a3b8;border-top:1px solid #e2e8f0;}
</style></head><body>
<div class="box">
  <div class="hdr">
    <h1>Praedico Global Research</h1>
    <p>Tax Invoice / Payment Receipt</p>
    <div class="inv">INVOICE #${p.paymentId.slice(-8).toUpperCase()}</div>
  </div>
  <div class="body">
    <p class="lbl">Payment Details</p>
    <div class="row"><span class="k">Plan</span><span class="v">${p.planName}</span></div>
    <div class="row"><span class="k">Duration</span><span class="v">${DURATION_LABELS[p.duration]}</span></div>
    <div class="row"><span class="k">Valid Until</span><span class="v">${p.expiresAt}</span></div>
    <div class="row"><span class="k">Payment ID</span><span class="v" style="font-family:monospace;font-size:12px">${p.paymentId}</span></div>
    <div class="row"><span class="k">Status</span><span class="chip">PAID</span></div>
    <div class="total">
      <div><div style="font-size:11px;color:#64748b;margin-bottom:4px">Total Paid</div>
      <div class="amt">₹${p.amountPaid.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</div></div>
      <div style="text-align:right;font-size:11px;color:#64748b"><div>One-time payment</div><div>No auto-renewal</div></div>
    </div>
  </div>
  <div class="ftr">Praedico Global Research · support@praedico.com<br/>Computer-generated receipt — no signature required.</div>
</div></body></html>`;
  const a = Object.assign(document.createElement("a"), {
    href: URL.createObjectURL(new Blob([html], { type: "text/html" })),
    download: `praedico-invoice-${p.paymentId.slice(-8)}.html`,
  });
  a.click();
}

export default function PostPaymentModal(props: PostPaymentModalProps) {
  const { isOpen, onClose, planName, duration, amountPaid, paymentId, expiresAt } = props;
  const color = PLAN_COLOR[planName];

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 z-[200] flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,.8)", backdropFilter: "blur(10px)" }}
        >
          <motion.div
            initial={{ scale: 0.88, y: 32, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.88, y: 32, opacity: 0 }}
            transition={{ type: "spring", stiffness: 360, damping: 30 }}
            className="relative w-full max-w-md bg-[#0a0a14] border border-white/10 rounded-3xl overflow-hidden shadow-2xl"
          >
            {/* Top glow line */}
            <div className="absolute top-0 inset-x-0 h-px" style={{ background: `linear-gradient(90deg,transparent,${color},transparent)` }} />

            {/* Success burst */}
            <div className="flex flex-col items-center pt-8 pb-4 px-6 text-center">
              <motion.div
                initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.15, type: "spring", stiffness: 300 }}
                className="w-20 h-20 rounded-full flex items-center justify-center mb-5"
                style={{ background: `radial-gradient(circle,${color}30,${color}10)`, border: `2px solid ${color}50`, boxShadow: `0 0 40px ${color}30` }}
              >
                <CheckCircle2 className="w-10 h-10" style={{ color }} />
              </motion.div>
              <h2 className="text-2xl font-extrabold text-white mb-1">Payment Successful!</h2>
              <p className="text-slate-400 text-sm">Welcome to <span className="font-bold" style={{ color }}>{planName}</span> membership</p>
            </div>

            {/* Details */}
            <div className="mx-6 mb-5 rounded-2xl overflow-hidden border border-white/8" style={{ background: "rgba(255,255,255,0.04)" }}>
              {[
                { icon: Package,    label: "Plan",         value: `${planName} · ${DURATION_LABELS[duration]}` },
                { icon: Calendar,   label: "Valid Until",  value: expiresAt },
                { icon: CreditCard, label: "Amount Paid",  value: `₹${amountPaid.toLocaleString("en-IN", { minimumFractionDigits: 2 })}` },
              ].map(({ icon: Icon, label, value }, i) => (
                <div key={i} className="flex items-center gap-3 px-4 py-3 border-b border-white/5 last:border-0">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: `${color}15`, border: `1px solid ${color}25` }}>
                    <Icon className="w-4 h-4" style={{ color }} />
                  </div>
                  <div>
                    <p className="text-slate-500 text-xs">{label}</p>
                    <p className="text-white text-sm font-semibold">{value}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* CTA */}
            <div className="px-6 pb-7 space-y-3">
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={() => downloadInvoice(props)}
                className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-bold text-white text-sm"
                style={{ background: `linear-gradient(135deg,${color},${color}cc)`, boxShadow: `0 8px 24px ${color}40` }}
              >
                <Download className="w-4 h-4" /> Download Invoice
              </motion.button>
              <button
                onClick={onClose}
                className="w-full py-3 rounded-xl text-slate-400 text-sm hover:text-white hover:bg-white/5 transition-colors"
              >
                Continue to Dashboard
              </button>
            </div>

            <button onClick={onClose} className="absolute top-4 right-4 p-1.5 rounded-full bg-white/8 hover:bg-white/15 text-white/50 hover:text-white transition-colors">
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
