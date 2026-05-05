"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Eye, EyeOff, Lock, CheckCircle2, Loader2, ShieldCheck, XCircle } from "lucide-react";
import { companyApi } from "@/lib/api";

export default function VerifyEmployeePage() {
    const { token } = useParams<{ token: string }>();
    const router = useRouter();

    const [password, setPassword] = useState("");
    const [confirm, setConfirm] = useState("");
    const [showPass, setShowPass] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [loading, setLoading] = useState(false);
    const [done, setDone] = useState(false);
    const [error, setError] = useState("");

    const strength = (() => {
        if (password.length === 0) return 0;
        let s = 0;
        if (password.length >= 8) s++;
        if (/[A-Z]/.test(password)) s++;
        if (/[0-9]/.test(password)) s++;
        if (/[^A-Za-z0-9]/.test(password)) s++;
        return s;
    })();

    const strengthLabel = ["", "Weak", "Fair", "Good", "Strong"][strength];
    const strengthColor = ["", "#ef4444", "#f59e0b", "#3b82f6", "#10b981"][strength];

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        if (password.length < 8) {
            setError("Password must be at least 8 characters.");
            return;
        }
        if (password !== confirm) {
            setError("Passwords do not match.");
            return;
        }
        setLoading(true);
        try {
            await companyApi.verifyEmployeeToken(token, password);
            setDone(true);
            setTimeout(() => router.push("/admin/staff-access-portal"), 2500);
        } catch (err: any) {
            setError(err.response?.data?.message || "Something went wrong. The link may have expired.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#020617] flex items-center justify-center p-4">
            {/* Background glow */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden">
                <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-indigo-600/10 rounded-full blur-3xl" />
                <div className="absolute bottom-1/4 left-1/4 w-[400px] h-[400px] bg-violet-600/10 rounded-full blur-3xl" />
            </div>

            <div className="relative w-full max-w-md">
                {/* Card */}
                <div className="bg-[#0F172A]/90 border border-white/10 rounded-3xl shadow-2xl p-8 backdrop-blur-xl">
                    {done ? (
                        <div className="text-center py-6 space-y-4">
                            <div className="h-16 w-16 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto">
                                <CheckCircle2 className="h-8 w-8 text-emerald-400" />
                            </div>
                            <h2 className="text-xl font-bold text-white">Password Set!</h2>
                            <p className="text-slate-400 text-sm">
                                Your account is activated. Redirecting to login…
                            </p>
                        </div>
                    ) : (
                        <>
                            {/* Header */}
                            <div className="text-center mb-8">
                                <div className="h-14 w-14 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center mx-auto mb-4">
                                    <ShieldCheck className="h-7 w-7 text-indigo-400" />
                                </div>
                                <h1 className="text-2xl font-bold text-white mb-1">Set Your Password</h1>
                                <p className="text-slate-500 text-sm">
                                    Create a secure password to activate your Praedico employee account.
                                </p>
                            </div>

                            {/* Error */}
                            {error && (
                                <div className="mb-5 flex items-start gap-3 p-4 rounded-xl bg-rose-500/10 border border-rose-500/20">
                                    <XCircle className="h-5 w-5 text-rose-400 shrink-0 mt-0.5" />
                                    <p className="text-rose-300 text-sm">{error}</p>
                                </div>
                            )}

                            <form onSubmit={handleSubmit} className="space-y-5">
                                {/* Password */}
                                <div>
                                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                                        New Password
                                    </label>
                                    <div className="relative">
                                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                                        <input
                                            type={showPass ? "text" : "password"}
                                            value={password}
                                            onChange={e => setPassword(e.target.value)}
                                            placeholder="Min. 8 characters"
                                            required
                                            className="w-full pl-11 pr-11 py-3 bg-[#020617] border border-white/5 rounded-xl text-sm text-slate-200 placeholder-slate-600 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500/50 outline-none transition-all"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPass(v => !v)}
                                            className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                                        >
                                            {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                        </button>
                                    </div>
                                    {/* Strength bar */}
                                    {password.length > 0 && (
                                        <div className="mt-2">
                                            <div className="flex gap-1">
                                                {[1, 2, 3, 4].map(i => (
                                                    <div
                                                        key={i}
                                                        className="h-1 flex-1 rounded-full transition-all duration-300"
                                                        style={{ backgroundColor: i <= strength ? strengthColor : '#1e293b' }}
                                                    />
                                                ))}
                                            </div>
                                            <p className="text-xs mt-1.5" style={{ color: strengthColor }}>{strengthLabel}</p>
                                        </div>
                                    )}
                                </div>

                                {/* Confirm */}
                                <div>
                                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                                        Confirm Password
                                    </label>
                                    <div className="relative">
                                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                                        <input
                                            type={showConfirm ? "text" : "password"}
                                            value={confirm}
                                            onChange={e => setConfirm(e.target.value)}
                                            placeholder="Re-enter your password"
                                            required
                                            className="w-full pl-11 pr-11 py-3 bg-[#020617] border border-white/5 rounded-xl text-sm text-slate-200 placeholder-slate-600 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500/50 outline-none transition-all"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowConfirm(v => !v)}
                                            className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                                        >
                                            {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                        </button>
                                    </div>
                                    {confirm.length > 0 && password !== confirm && (
                                        <p className="text-rose-400 text-xs mt-1.5">Passwords do not match</p>
                                    )}
                                </div>

                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60 disabled:cursor-not-allowed text-white font-bold text-sm transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-900/40"
                                >
                                    {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                                    {loading ? "Activating account…" : "Activate Account"}
                                </button>
                            </form>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
