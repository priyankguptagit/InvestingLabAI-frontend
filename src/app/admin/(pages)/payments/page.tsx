"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  CreditCard, Search, RefreshCcw, ChevronLeft, ChevronRight,
  CheckCircle2, XCircle, Clock, Download, IndianRupee,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { paymentApi } from "@/lib/api/payment.api";

// ── helpers ──────────────────────────────────────────────────────────────────
const toRupees = (paise: number) => (paise / 100).toLocaleString("en-IN");

const STATUS_META: Record<string, { label: string; color: string; icon: LucideIcon }> = {
  paid:    { label: "Paid",    color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20", icon: CheckCircle2 },
  created: { label: "Pending", color: "text-amber-400  bg-amber-500/10  border-amber-500/20",  icon: Clock },
  failed:  { label: "Failed",  color: "text-rose-400   bg-rose-500/10   border-rose-500/20",   icon: XCircle },
};

const PLAN_COLORS: Record<string, string> = {
  Silver:  "text-slate-300 bg-slate-500/10 border-slate-500/20",
  Gold:    "text-amber-400 bg-amber-500/10 border-amber-500/20",
  Diamond: "text-violet-400 bg-violet-500/10 border-violet-500/20",
};

// ── invoice generator ────────────────────────────────────────────────────────
function downloadInvoice(record: any) {
  const amountRs = (record.amountPaise / 100).toLocaleString("en-IN", { minimumFractionDigits: 2 });
  const date = new Date(record.createdAt).toLocaleDateString("en-IN", {
    day: "numeric", month: "long", year: "numeric",
  });
  const expiryStr = record.expiresAt
    ? new Date(record.expiresAt).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })
    : "N/A";

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<title>Invoice – Praedico Global Research</title>
<style>
  * { margin:0; padding:0; box-sizing:border-box; }
  body { font-family: 'Segoe UI', sans-serif; background:#f8f9fe; color:#1e293b; padding:40px; }
  .container { max-width:680px; margin:0 auto; background:#fff; border-radius:16px; overflow:hidden; box-shadow:0 4px 40px rgba(0,0,0,0.1); }
  .header { background:linear-gradient(135deg,#4f46e5,#7c3aed); padding:36px 40px; color:#fff; }
  .header h1 { font-size:22px; font-weight:700; margin-bottom:4px; }
  .header p { font-size:13px; opacity:.7; }
  .badge { display:inline-block; background:rgba(255,255,255,.2); border:1px solid rgba(255,255,255,.3); border-radius:8px; padding:4px 12px; font-size:12px; font-weight:700; margin-top:12px; }
  .body { padding:36px 40px; }
  .section-title { font-size:11px; font-weight:700; letter-spacing:.1em; text-transform:uppercase; color:#94a3b8; margin-bottom:12px; }
  .row { display:flex; justify-content:space-between; align-items:center; padding:10px 0; border-bottom:1px solid #f1f5f9; font-size:14px; }
  .row:last-child { border-bottom:none; }
  .row .label { color:#64748b; }
  .row .value { font-weight:600; color:#1e293b; }
  .total-box { margin-top:20px; background:linear-gradient(135deg,#f0f4ff,#ede9fe); border:1px solid #c7d2fe; border-radius:12px; padding:20px 24px; display:flex; justify-content:space-between; align-items:center; }
  .total-box .amount { font-size:26px; font-weight:800; color:#4f46e5; }
  .footer { background:#f8f9fe; padding:20px 40px; text-align:center; font-size:12px; color:#94a3b8; border-top:1px solid #e2e8f0; }
  .chip { display:inline-block; background:#dcfce7; color:#16a34a; border:1px solid #bbf7d0; border-radius:6px; padding:3px 10px; font-size:11px; font-weight:700; }
</style>
</head>
<body>
<div class="container">
  <div class="header">
    <h1>Praedico Global Research</h1>
    <p>Tax Invoice / Payment Receipt</p>
    <div class="badge">INVOICE #${record._id?.toString().slice(-8).toUpperCase()}</div>
  </div>
  <div class="body">
    <p class="section-title">Payment Details</p>
    <div class="row"><span class="label">Date</span><span class="value">${date}</span></div>
    <div class="row"><span class="label">Plan</span><span class="value">${record.planName}</span></div>
    <div class="row"><span class="label">Duration</span><span class="value">${record.duration} Month${record.duration > 1 ? "s" : ""}</span></div>
    <div class="row"><span class="label">Access Valid Until</span><span class="value">${expiryStr}</span></div>
    ${record.referralCode ? `<div class="row"><span class="label">Referral Code Applied</span><span class="value">${record.referralCode}</span></div>` : ""}
    ${record.discountPaise ? `<div class="row"><span class="label">Discount</span><span class="value" style="color:#16a34a">−₹${(record.discountPaise/100).toLocaleString("en-IN",{minimumFractionDigits:2})}</span></div>` : ""}
    <div class="row"><span class="label">Payment ID</span><span class="value" style="font-family:monospace;font-size:12px">${record.razorpayPaymentId || "N/A"}</span></div>
    <div class="row"><span class="label">Status</span><span class="chip">PAID</span></div>

    <div class="total-box">
      <div>
        <div style="font-size:12px;color:#64748b;margin-bottom:4px">Total Paid</div>
        <div class="amount">₹${amountRs}</div>
      </div>
      <div style="text-align:right;font-size:12px;color:#64748b">
        <div>One-time payment</div>
        <div>No auto-renewal</div>
      </div>
    </div>
  </div>
  <div class="footer">
    Praedico Global Research · support@praedico.com<br/>
    This is a computer-generated receipt and does not require a signature.
  </div>
</div>
</body>
</html>`;

  const blob = new Blob([html], { type: "text/html" });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement("a");
  a.href     = url;
  a.download = `praedico-invoice-${record._id?.toString().slice(-8)}.html`;
  a.click();
  URL.revokeObjectURL(url);
}

// ── page component ────────────────────────────────────────────────────────────
export default function AdminPaymentHistoryPage() {
  const [records, setRecords]   = useState<any[]>([]);
  const [loading, setLoading]   = useState(true);
  const [search,  setSearch]    = useState("");
  const [page,    setPage]      = useState(1);
  const [total,   setTotal]     = useState(0);
  const [pages,   setPages]     = useState(1);
  const LIMIT = 20;

  const fetchHistory = async (p = 1) => {
    setLoading(true);
    try {
      const data = await paymentApi.getHistory(p, LIMIT);
      if (data.success) {
        setRecords(data.data);
        setTotal(data.pagination.total);
        setPages(data.pagination.pages);
        setPage(p);
      }
    } catch (e) {
      console.error("Failed to load payment history", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchHistory(1); }, []);

  // client-side search filter
  const filtered = records.filter((r) => {
    const q = search.toLowerCase();
    return (
      r.planName?.toLowerCase().includes(q) ||
      r.status?.toLowerCase().includes(q) ||
      (r.userId?.name  || "").toLowerCase().includes(q) ||
      (r.userId?.email || "").toLowerCase().includes(q) ||
      (r.razorpayPaymentId || "").toLowerCase().includes(q)
    );
  });

  // metrics
  const paidRecords  = records.filter((r) => r.status === "paid");
  const totalRevenue = paidRecords.reduce((s, r) => s + (r.amountPaise || 0), 0);

  return (
    <div className="space-y-8 animate-in fade-in duration-700 p-6 lg:p-8 pb-10 text-slate-200 w-full max-w-7xl mx-auto">

      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white">Payment History</h1>
          <p className="text-slate-400 text-sm mt-1">Full ledger of all Razorpay transactions.</p>
        </div>
        <button
          onClick={() => fetchHistory(page)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-300 hover:bg-slate-700 hover:text-white text-sm transition-colors"
        >
          <RefreshCcw size={14} /> Refresh
        </button>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        {([
          { label: "Total Transactions", value: total.toString(), icon: CreditCard, color: "#6366f1" },
          { label: "Successful Payments", value: paidRecords.length.toString(), icon: CheckCircle2, color: "#10b981" },
          { label: "Total Revenue", value: `₹${toRupees(totalRevenue)}`, icon: IndianRupee, color: "#f59e0b" },
        ] as Array<{ label: string; value: string; icon: LucideIcon; color: string }>).map((m) => {
          const MetricIcon = m.icon;
          return (
          <motion.div
            key={m.label}
            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
            className="bg-[#0f172a] border border-slate-800 rounded-2xl p-5 flex items-center gap-4"
          >
            <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: `${m.color}20`, border: `1px solid ${m.color}40` }}>
              <MetricIcon className="w-5 h-5" style={{ color: m.color }} />
            </div>
            <div>
              <p className="text-slate-400 text-xs font-medium">{m.label}</p>
              <p className="text-white text-xl font-bold">{m.value}</p>
            </div>
          </motion.div>
          );
        })}
      </div>

      {/* Table Card */}
      <div className="bg-[#0f172a] border border-slate-800 rounded-2xl overflow-hidden">
        {/* Toolbar */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-slate-800">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type="text"
              placeholder="Search user, plan, payment ID…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>
          <span className="text-slate-500 text-xs ml-auto">{filtered.length} records</span>
        </div>

        {/* Table */}
        {loading ? (
          <div className="text-center py-16 text-slate-500">Loading transactions…</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-slate-500">No payment records found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-800/50">
                <tr className="border-b border-slate-800">
                  <th className="h-10 px-5 text-slate-400 font-medium">Date</th>
                  <th className="h-10 px-5 text-slate-400 font-medium">User</th>
                  <th className="h-10 px-5 text-slate-400 font-medium text-center">Plan</th>
                  <th className="h-10 px-5 text-slate-400 font-medium text-center">Duration</th>
                  <th className="h-10 px-5 text-slate-400 font-medium text-right">Amount</th>
                  <th className="h-10 px-5 text-slate-400 font-medium text-center">Status</th>
                  <th className="h-10 px-5 text-slate-400 font-medium text-right">Invoice</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((r, i) => {
                  const sm = STATUS_META[r.status] ?? STATUS_META.created;
                  const StatusIcon = sm.icon;
                  const planColor = PLAN_COLORS[r.planName] ?? "text-slate-300 bg-slate-500/10 border-slate-500/20";
                  return (
                    <tr key={i} className="border-b border-slate-800/50 hover:bg-slate-800/20 transition-colors last:border-0">
                      <td className="px-5 py-3.5 text-slate-400 whitespace-nowrap">
                        {new Date(r.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                      </td>
                      <td className="px-5 py-3.5">
                        <p className="font-medium text-white">{r.userId?.name || "Unknown"}</p>
                        <p className="text-xs text-slate-500">{r.userId?.email || "—"}</p>
                      </td>
                      <td className="px-5 py-3.5 text-center">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold border ${planColor}`}>
                          {r.planName}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-center text-slate-300">
                        {r.duration} mo
                      </td>
                      <td className="px-5 py-3.5 text-right font-semibold text-white">
                        ₹{toRupees(r.amountPaise || 0)}
                        {r.discountPaise > 0 && (
                          <div className="text-[10px] text-emerald-400">−₹{toRupees(r.discountPaise)} off</div>
                        )}
                      </td>
                      <td className="px-5 py-3.5 text-center">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold border ${sm.color}`}>
                          <StatusIcon className="w-3 h-3" /> {sm.label}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        {r.status === "paid" ? (
                          <button
                            onClick={() => downloadInvoice(r)}
                            title="Download Invoice"
                            className="p-2 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 hover:bg-indigo-500/20 hover:text-indigo-300 transition-colors"
                          >
                            <Download className="w-3.5 h-3.5" />
                          </button>
                        ) : (
                          <span className="text-slate-600">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {pages > 1 && (
          <div className="flex items-center justify-between px-5 py-4 border-t border-slate-800">
            <span className="text-xs text-slate-500">
              Page {page} of {pages} · {total} total records
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => fetchHistory(page - 1)}
                disabled={page === 1}
                className="px-3 py-1.5 rounded-lg text-sm bg-slate-800 border border-slate-700 text-slate-300 hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1"
              >
                <ChevronLeft size={14} /> Prev
              </button>
              <button
                onClick={() => fetchHistory(page + 1)}
                disabled={page === pages}
                className="px-3 py-1.5 rounded-lg text-sm bg-slate-800 border border-slate-700 text-slate-300 hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1"
              >
                Next <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
