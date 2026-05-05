"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import { Eye, EyeOff, ShieldCheck, CheckCircle2, XCircle, ArrowRight } from "lucide-react";
import { companyApi } from "@/lib/api";

// ── Password requirements (same as Change Password modal) ────────────────────
const RULES = [
    { id: "len", label: "Minimum 8 characters", test: (p: string) => p.length >= 8 },
    { id: "upper", label: "At least one uppercase (A–Z)", test: (p: string) => /[A-Z]/.test(p) },
    { id: "lower", label: "At least one lowercase (a–z)", test: (p: string) => /[a-z]/.test(p) },
    { id: "number", label: "At least one number (0–9)", test: (p: string) => /[0-9]/.test(p) },
    { id: "special", label: "At least one special character (!@#$…)", test: (p: string) => /[^A-Za-z0-9]/.test(p) },
];

function getStrength(pw: string): number {
    const passed = RULES.filter(r => r.test(pw)).length;
    if (!pw) return 0;
    if (passed <= 2) return 1;
    if (passed === 3) return 2;
    if (passed === 4) return 3;
    return 4;
}

const STRENGTH_LABEL = ["", "Weak", "Fair", "Good", "Strong"];
const STRENGTH_COLORS = [
    "",
    "bg-red-500",
    "bg-amber-500",
    "bg-yellow-400",
    "bg-emerald-500",
];

export default function AdminResetPasswordPage() {
    const params = useParams();
    const router = useRouter();
    const token = params.token as string;

    const [newPw, setNewPw] = useState("");
    const [confirmPw, setConfirmPw] = useState("");
    const [showNew, setShowNew] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState(false);

    const strength = getStrength(newPw);
    const allRulesPassed = RULES.every(r => r.test(newPw));
    const passwordsMatch = newPw === confirmPw && confirmPw.length > 0;
    const canSubmit = allRulesPassed && passwordsMatch && !loading;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!canSubmit) return;
        setLoading(true);
        setError("");
        try {
            await companyApi.resetPassword(token, newPw);
            setSuccess(true);
            setTimeout(() => router.push("/admin/staff-access-portal"), 2500);
        } catch (err: any) {
            setError(err.response?.data?.message || "Something went wrong. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen w-full flex items-center justify-center bg-[#050511] relative overflow-hidden">
            {/* Ambient Glows */}
            <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] bg-violet-600/20 rounded-full blur-[120px]" />
            <div className="absolute bottom-[-20%] right-[-10%] w-[600px] h-[600px] bg-indigo-600/20 rounded-full blur-[120px]" />

            <div className="relative w-full max-w-[460px] mx-4">
                {/* Neon Top Border */}
                <div className="absolute -top-[2px] left-0 right-0 h-1 bg-gradient-to-r from-violet-500 via-indigo-500 to-blue-500 rounded-t-2xl z-10" />

                <div className="backdrop-blur-2xl bg-[#0a0a16]/80 border border-white/10 rounded-2xl p-8 shadow-2xl shadow-black/50">

                    {/* HEADER */}
                    <div className="mb-8 text-center">
                        <div className="flex justify-center mb-5">
                            <div className="relative p-2 rounded-2xl bg-gradient-to-b from-white/10 to-white/5 border border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.5)] backdrop-blur-xl">
                                <Image src="/praedico-logo.png" alt="Praedico Logo" width={48} height={48} className="rounded-xl drop-shadow-md" />
                            </div>
                        </div>
                        <h1 className="text-2xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-b from-white to-slate-400 mb-2">
                            Set New Access Key
                        </h1>
                        <div className="flex items-center justify-center gap-2">
                            <div className="h-[1px] w-8 bg-gradient-to-r from-transparent to-violet-500/50" />
                            <span className="text-violet-400/80 text-[10px] font-medium tracking-[0.2em] uppercase">
                                Staff Portal · Password Reset
                            </span>
                            <div className="h-[1px] w-8 bg-gradient-to-l from-transparent to-violet-500/50" />
                        </div>
                    </div>

                    {success ? (
                        /* ── SUCCESS STATE ── */
                        <div className="text-center py-6">
                            <div className="h-16 w-16 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto mb-5">
                                <CheckCircle2 className="h-7 w-7 text-emerald-400" />
                            </div>
                            <h3 className="text-white font-bold text-lg mb-2">Password Updated!</h3>
                            <p className="text-slate-400 text-sm leading-relaxed mb-1">
                                Your new password has been set successfully.
                            </p>
                            <p className="text-slate-600 text-xs">Redirecting to login…</p>
                            <div className="mt-5 flex justify-center">
                                <div className="h-1 w-16 bg-violet-500/30 rounded-full overflow-hidden">
                                    <div className="h-full bg-violet-500 animate-pulse" />
                                </div>
                            </div>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-5">

                            {error && (
                                <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-300 text-xs font-medium flex items-start gap-2">
                                    <XCircle className="h-4 w-4 mt-0.5 shrink-0" />
                                    {error}
                                </div>
                            )}

                            {/* NEW PASSWORD */}
                            <div className="space-y-2">
                                <label className="text-xs font-semibold text-violet-400 tracking-wider uppercase ml-1">New Access Key</label>
                                <div className="relative group">
                                    <div className="absolute inset-0 bg-violet-500/20 blur-md rounded-xl opacity-0 group-focus-within:opacity-100 transition-opacity duration-300" />
                                    <input
                                        id="reset-new-password"
                                        type={showNew ? "text" : "password"}
                                        required
                                        value={newPw}
                                        onChange={(e) => { setNewPw(e.target.value); setError(""); }}
                                        placeholder="Enter new password"
                                        className="relative w-full bg-[#0a0a16] border border-violet-500/30 rounded-xl px-5 py-4 text-sm text-white font-mono placeholder:text-slate-600 focus:outline-none focus:border-violet-400 focus:ring-1 focus:ring-violet-400 transition-all pr-12 shadow-[inset_0_0_20px_rgba(0,0,0,0.5)]"
                                    />
                                    <button type="button" onClick={() => setShowNew(!showNew)}
                                        className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-violet-400 transition-colors z-10">
                                        {showNew ? <EyeOff size={18} /> : <Eye size={18} />}
                                    </button>
                                </div>

                                {/* Strength Bar */}
                                {newPw && (
                                    <div className="space-y-1.5 pt-1">
                                        <div className="flex gap-1 h-1">
                                            {[1, 2, 3, 4].map(i => (
                                                <div key={i} className={`flex-1 rounded-full transition-all duration-300 ${strength >= i ? STRENGTH_COLORS[strength] : "bg-white/10"}`} />
                                            ))}
                                        </div>
                                        <p className={`text-[10px] font-semibold ml-0.5 ${strength >= 4 ? "text-emerald-400" : strength >= 3 ? "text-yellow-400" : strength >= 2 ? "text-amber-500" : "text-red-400"}`}>
                                            {STRENGTH_LABEL[strength]}
                                        </p>
                                    </div>
                                )}
                            </div>

                            {/* CONFIRM PASSWORD */}
                            <div className="space-y-2">
                                <label className="text-xs font-semibold text-violet-400 tracking-wider uppercase ml-1">Confirm Access Key</label>
                                <div className="relative group">
                                    <div className="absolute inset-0 bg-violet-500/20 blur-md rounded-xl opacity-0 group-focus-within:opacity-100 transition-opacity duration-300" />
                                    <input
                                        id="reset-confirm-password"
                                        type={showConfirm ? "text" : "password"}
                                        required
                                        value={confirmPw}
                                        onChange={(e) => { setConfirmPw(e.target.value); setError(""); }}
                                        placeholder="Re-enter new password"
                                        className={`relative w-full bg-[#0a0a16] border rounded-xl px-5 py-4 text-sm text-white font-mono placeholder:text-slate-600 focus:outline-none transition-all pr-12 shadow-[inset_0_0_20px_rgba(0,0,0,0.5)] ${confirmPw
                                                ? passwordsMatch
                                                    ? "border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50"
                                                    : "border-red-500/50 focus:ring-1 focus:ring-red-500/50"
                                                : "border-violet-500/30 focus:border-violet-400 focus:ring-1 focus:ring-violet-400"
                                            }`}
                                    />
                                    <button type="button" onClick={() => setShowConfirm(!showConfirm)}
                                        className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-violet-400 transition-colors z-10">
                                        {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
                                    </button>
                                </div>
                                {confirmPw && !passwordsMatch && (
                                    <p className="text-red-400 text-[11px] ml-1">Passwords do not match</p>
                                )}
                            </div>

                            {/* REQUIREMENTS CHECKLIST */}
                            <div className="bg-white/3 border border-white/5 rounded-xl p-4 space-y-2">
                                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Password Requirements</p>
                                {RULES.map(rule => {
                                    const passed = rule.test(newPw);
                                    return (
                                        <div key={rule.id} className="flex items-center gap-2">
                                            {passed
                                                ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                                                : <XCircle className="h-3.5 w-3.5 text-slate-600 shrink-0" />
                                            }
                                            <span className={`text-xs transition-colors ${passed ? "text-emerald-400" : "text-slate-500"}`}>
                                                {rule.label}
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>

                            {/* SUBMIT */}
                            <div className="pt-1">
                                <button
                                    type="submit"
                                    disabled={!canSubmit}
                                    className="relative w-full overflow-hidden rounded-xl font-bold py-4 active:scale-[0.98] transition-all duration-200 group disabled:opacity-40 disabled:cursor-not-allowed disabled:active:scale-100"
                                >
                                    <div className="absolute inset-0 bg-gradient-to-r from-violet-600 to-indigo-600 group-enabled:group-hover:from-violet-500 group-enabled:group-hover:to-indigo-500 transition-all duration-300" />
                                    <div className="absolute inset-0 bg-white/5 opacity-20 bg-[linear-gradient(rgba(255,255,255,.1)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.1)_1px,transparent_1px)] bg-[size:16px_16px]" />
                                    <span className="relative flex items-center justify-center gap-2 text-white tracking-widest uppercase text-sm">
                                        {loading ? (
                                            <>
                                                <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                                Updating...
                                            </>
                                        ) : (
                                            <>
                                                <ShieldCheck size={16} />
                                                Set New Password
                                                <ArrowRight size={14} />
                                            </>
                                        )}
                                    </span>
                                </button>
                            </div>

                            <div className="text-center pt-1">
                                <a href="/admin/staff-access-portal" className="text-[11px] text-slate-600 hover:text-slate-400 transition-colors">
                                    ← Back to login
                                </a>
                            </div>

                        </form>
                    )}
                </div>
            </div>
        </div>
    );
}
