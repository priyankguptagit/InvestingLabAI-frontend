"use client";

import { useState, use } from "react";
import { useRouter } from "next/navigation";
import { coordinatorApi } from "@/lib/api/coordinator.api";
import {
  Loader2, Eye, EyeOff, Lock, CheckCircle2,
  CheckCircle, AlertCircle, X, Check, GraduationCap
} from "lucide-react";
import { z } from "zod";

// --- Zod Schema ---
const passwordSchema = z.object({
  newPassword: z
    .string()
    .min(8, "Must be at least 8 characters")
    .regex(/[A-Z]/, "Must include an uppercase letter")
    .regex(/[a-z]/, "Must include a lowercase letter")
    .regex(/[0-9]/, "Must include a number")
    .regex(/[^A-Za-z0-9]/, "Must include a special character"),
  confirmPassword: z.string().min(1, "Please confirm your password"),
}).refine((d) => d.newPassword === d.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

// --- Password Strength ---
function getStrength(pw: string): { score: number; label: string; color: string } {
  if (!pw) return { score: 0, label: "", color: "" };
  let s = 0;
  if (pw.length >= 8) s++;
  if (pw.length >= 12) s++;
  if (/[A-Z]/.test(pw)) s++;
  if (/[0-9]/.test(pw)) s++;
  if (/[^A-Za-z0-9]/.test(pw)) s++;
  if (s <= 2) return { score: s, label: "Weak", color: "bg-red-500" };
  if (s <= 3) return { score: s, label: "Fair", color: "bg-amber-400" };
  if (s === 4) return { score: s, label: "Good", color: "bg-blue-500" };
  return { score: s, label: "Strong", color: "bg-emerald-500" };
}

export default function CoordinatorVerifyPage({ params }: { params: Promise<{ token: string }> }) {
  const router = useRouter();
  const { token } = use(params);

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState("");
  const [pwErrors, setPwErrors] = useState<{ newPassword?: string; confirmPassword?: string }>({});

  const strength = getStrength(password);

  const handleVerification = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const parsed = passwordSchema.safeParse({
      newPassword: password,
      confirmPassword: confirmPassword,
    });

    if (!parsed.success) {
      const fieldErrors: { newPassword?: string; confirmPassword?: string } = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path[0] as "newPassword" | "confirmPassword";
        if (key && !fieldErrors[key]) fieldErrors[key] = issue.message;
      }
      setPwErrors(fieldErrors);
      return;
    }

    setPwErrors({});
    setIsLoading(true);

    try {
      await coordinatorApi.verify({ token, password });
      setIsSuccess(true);
      setTimeout(() => {
        router.push("/organization/coordinator/dashboard");
      }, 2500);
    } catch (err: any) {
      setError(err.response?.data?.message || "Link expired or invalid. Please contact your organization admin.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-slate-50 dark:bg-[#0B1120] p-4 font-sans selection:bg-indigo-500/30">

      {/* Background Blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] rounded-full bg-indigo-500/20 dark:bg-indigo-600/20 blur-[100px] mix-blend-multiply dark:mix-blend-screen animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] rounded-full bg-teal-500/20 dark:bg-teal-600/20 blur-[120px] mix-blend-multiply dark:mix-blend-screen animate-pulse delay-1000" />
      </div>

      <div className="relative z-10 w-full max-w-[480px]">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2rem] shadow-2xl shadow-indigo-500/10 p-8 sm:p-10">

          {isSuccess ? (
            <div className="flex flex-col items-center justify-center text-center py-10 space-y-6 animate-in fade-in zoom-in duration-500">
              <div className="w-24 h-24 bg-emerald-50 dark:bg-emerald-500/10 rounded-full flex items-center justify-center border-[8px] border-emerald-100 dark:border-emerald-500/20">
                <CheckCircle2 className="w-12 h-12 text-emerald-500" />
              </div>
              <div>
                <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Welcome Aboard!</h2>
                <p className="text-slate-500 mt-2 font-medium">Your coordinator account is now active.<br />Redirecting to your dashboard...</p>
              </div>
              <div className="w-full max-w-[200px] bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden mx-auto mt-4">
                <div className="h-full bg-emerald-500 animate-[width_2.5s_ease-in-out_forwards] w-0"></div>
              </div>
            </div>
          ) : (
            <div>
              <div className="mb-8 text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-100 dark:border-indigo-500/20 mb-6 text-indigo-600 dark:text-indigo-400">
                  <GraduationCap className="w-8 h-8" />
                </div>
                <h1 className="text-3xl font-black text-slate-900 dark:text-white mb-3 tracking-tight">Coordinator Setup</h1>
                <p className="text-slate-500 font-medium text-sm px-4">Create a secure password to activate your coordinator account.</p>
              </div>

              {error && (
                <div className="mb-6 p-4 rounded-xl bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-red-700 dark:text-red-400 text-sm font-semibold flex items-start gap-3 animate-in fade-in slide-in-from-top-2">
                  <AlertCircle size={18} className="shrink-0 mt-0.5" />
                  <p>{error}</p>
                </div>
              )}

              <form onSubmit={handleVerification} className="space-y-6">

                {/* New Password */}
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500 ml-1">New Password</label>
                  <div className="relative">
                    <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type={showPassword ? "text" : "password"}
                      placeholder="Create a strong password"
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        setPwErrors(p => ({ ...p, newPassword: undefined }));
                      }}
                      className={`w-full bg-slate-50 dark:bg-slate-950 border rounded-xl pl-12 pr-12 py-3.5 text-sm font-medium text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all duration-300 ${
                        pwErrors.newPassword
                          ? "border-red-300 dark:border-red-500/50 focus:border-red-500"
                          : "border-slate-200 dark:border-slate-800 focus:border-indigo-500"
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                  {pwErrors.newPassword && (
                    <p className="text-xs text-red-500 font-semibold ml-1 flex items-center gap-1 mt-1.5 animate-in fade-in">
                      <AlertCircle size={12} /> {pwErrors.newPassword}
                    </p>
                  )}

                  {/* Strength Checklist */}
                  {password.length > 0 && (
                    <div className="bg-slate-50 dark:bg-slate-950 rounded-xl p-4 mt-3 border border-slate-100 dark:border-slate-800 animate-in fade-in slide-in-from-top-2">
                      <div className="flex gap-1.5 mb-3">
                        {[1, 2, 3, 4, 5].map(i => (
                          <div key={i} className={`h-1.5 flex-1 rounded-full transition-all duration-500 ${i <= strength.score ? strength.color : "bg-slate-200 dark:bg-slate-800"}`} />
                        ))}
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
                        {[
                          { label: "At least 8 characters", pass: password.length >= 8 },
                          { label: "Uppercase letter", pass: /[A-Z]/.test(password) },
                          { label: "Lowercase letter", pass: /[a-z]/.test(password) },
                          { label: "Number (0–9)", pass: /[0-9]/.test(password) },
                          { label: "Special character", pass: /[^A-Za-z0-9]/.test(password) },
                        ].map((check, idx) => (
                          <div key={idx} className={`flex items-center gap-2 text-[11px] font-bold transition-colors ${check.pass ? "text-emerald-600 dark:text-emerald-400" : "text-slate-400 dark:text-slate-500"}`}>
                            {check.pass ? <CheckCircle size={14} /> : <div className="w-[14px] h-[14px] rounded-full border border-slate-300 dark:border-slate-700" />}
                            {check.label}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Confirm Password */}
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500 ml-1">Confirm Password</label>
                  <div className="relative">
                    <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="Repeat new password"
                      value={confirmPassword}
                      onChange={(e) => {
                        setConfirmPassword(e.target.value);
                        setPwErrors(p => ({ ...p, confirmPassword: undefined }));
                      }}
                      className={`w-full bg-slate-50 dark:bg-slate-950 border rounded-xl pl-12 pr-12 py-3.5 text-sm font-medium text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all duration-300 ${
                        confirmPassword && password !== confirmPassword
                          ? "border-red-300 dark:border-red-500/50 focus:border-red-500 focus:ring-red-500/20"
                          : confirmPassword && password === confirmPassword
                            ? "border-emerald-500/50 focus:border-emerald-500 focus:ring-emerald-500/20"
                            : pwErrors.confirmPassword
                              ? "border-red-300 dark:border-red-500/50 focus:border-red-500"
                              : "border-slate-200 dark:border-slate-800 focus:border-indigo-500"
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                    >
                      {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                  {confirmPassword && password !== confirmPassword && (
                    <p className="text-xs text-red-500 font-semibold flex items-center gap-1 ml-1 mt-1.5 animate-in fade-in">
                      <X size={12} strokeWidth={3} /> Passwords do not match
                    </p>
                  )}
                  {confirmPassword && password === confirmPassword && (
                    <p className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1 ml-1 mt-1.5 animate-in fade-in">
                      <Check size={12} strokeWidth={3} /> Passwords match perfectly
                    </p>
                  )}
                  {pwErrors.confirmPassword && !confirmPassword && (
                    <p className="text-xs text-red-500 font-semibold ml-1 flex items-center gap-1 mt-1.5 animate-in fade-in">
                      <AlertCircle size={12} /> {pwErrors.confirmPassword}
                    </p>
                  )}
                </div>

                {/* Submit */}
                <button
                  type="submit"
                  disabled={isLoading || !password || !confirmPassword || password !== confirmPassword}
                  className="w-full h-12 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/25 transition-all duration-300 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed mt-4"
                >
                  {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Activate Coordinator Account"}
                </button>

              </form>

              <p className="text-center text-[11px] font-medium text-slate-400 mt-8">
                By verifying, you agree to our Terms of Service & Privacy Policy.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
