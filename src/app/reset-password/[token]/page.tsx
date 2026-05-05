"use client";

import { useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { authApi } from "@/lib/api/auth.api";
// 👇 Import Login Modal
import LoginModal from "@/app/user/_components/LoginModal"; 

import { 
  ArrowRight, CheckCircle2, ChevronLeft, KeyRound, 
  Lock, ShieldCheck, Eye, EyeOff, Sparkles, Loader2, AlertCircle
} from "lucide-react";
import { Button } from "@/shared-components/ui/button";
import { Input } from "@/shared-components/ui/input";
import { Label } from "@/shared-components/ui/label";

export default function ResetPasswordPage() {
  const router = useRouter();
  const params = useParams<{ token: string }>();
  const token = params.token; 

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [isLoginOpen, setIsLoginOpen] = useState(false);

  // Visual Strength Logic
  const strength = Math.min(password.length * 12, 100);
  const getStrengthColor = () => {
    if (strength < 40) return "bg-rose-500";
    if (strength < 80) return "bg-amber-500";
    return "bg-emerald-500";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!token) {
        setError("Invalid link. Token is missing.");
        return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    setIsLoading(true);

    // Smooth UX delay
    await new Promise(r => setTimeout(r, 800));

    try {
      await authApi.resetPassword({
        token: token, 
        newPassword: password
      });
      
      setSuccess(true);
      
      // Auto-open Login Modal
      setTimeout(() => {
        setIsLoginOpen(true);
      }, 2000);

    } catch (err: any) {
      setError(err.response?.data?.message || "Link expired or invalid.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center bg-[#030712] text-slate-200 font-sans overflow-hidden selection:bg-indigo-500/30">
      
      {/* --- BACKGROUND BLOBS (Exact match to Forgot Password) --- */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-indigo-500/10 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-purple-500/10 rounded-full blur-[120px] animate-pulse delay-1000" />
        <div className="absolute top-[40%] left-[50%] -translate-x-1/2 w-[800px] h-[400px] bg-blue-500/5 rounded-full blur-[100px]" />
      </div>

      {/* --- MAIN CONTENT --- */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="relative z-10 w-full max-w-[440px] px-4"
      >
        <div className="group relative">
          
          {/* Animated Glow Border */}
          <div className="absolute -inset-0.5 bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-500 rounded-[24px] opacity-30 group-hover:opacity-60 blur transition duration-1000"></div>
          
          {/* Glass Card Container */}
          <div className="relative bg-[#0F172A]/90 backdrop-blur-xl border border-white/10 rounded-[22px] p-8 shadow-2xl overflow-hidden">
            
            <AnimatePresence mode="wait">
              {success ? (
                /* --- SUCCESS STATE --- */
                <motion.div
                  key="success"
                  initial={{ opacity: 0, y: 10, filter: "blur(4px)" }}
                  animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="text-center space-y-8 py-4"
                >
                  <motion.div 
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ type: "spring", stiffness: 200, damping: 15 }}
                    className="w-20 h-20 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto border border-emerald-500/20 shadow-[0_0_30px_rgba(16,185,129,0.2)]"
                  >
                    <CheckCircle2 className="h-10 w-10 text-emerald-400" />
                  </motion.div>
                  
                  <div className="space-y-3">
                    <h3 className="text-2xl font-bold tracking-tight text-white">
                      Password Updated
                    </h3>
                    <p className="text-slate-400 text-sm leading-relaxed max-w-xs mx-auto">
                      Your account has been successfully secured. <br/>
                      <span className="font-medium text-emerald-400">Opening login...</span>
                    </p>
                  </div>

                  <Button 
                    className="w-full h-12 bg-white/5 hover:bg-white/10 text-white border border-white/10 rounded-xl transition-all active:scale-95"
                    onClick={() => setIsLoginOpen(true)}
                  >
                    Log in now
                  </Button>
                </motion.div>
              ) : (
                /* --- FORM STATE --- */
                <motion.div
                  key="form"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0, x: -20, filter: "blur(4px)" }}
                >
                  {/* Header */}
                  <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-14 h-14 rounded-xl bg-indigo-500/10 border border-indigo-500/20 mb-4 shadow-inner">
                      <KeyRound className="h-7 w-7 text-indigo-400" />
                    </div>
                    <h1 className="text-2xl font-bold tracking-tight text-white mb-2">
                      Set New Password
                    </h1>
                    <p className="text-slate-400 text-sm font-medium leading-relaxed">
                      Create a strong password to secure your account.
                    </p>
                  </div>

                  {/* Form */}
                  <form onSubmit={handleSubmit} className="space-y-6">
                    
                    {/* New Password */}
                    <div className="space-y-2">
                      <Label htmlFor="password" className="text-xs font-semibold text-slate-400 uppercase tracking-wider ml-1">
                        New Password
                      </Label>
                      <div className="relative group">
                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500 group-focus-within:text-indigo-400 transition-colors" />
                        <Input 
                          type={showPassword ? "text" : "password"} 
                          className="h-12 pl-11 pr-11 bg-[#020617]/50 border-white/10 text-white rounded-xl focus:bg-[#020617] focus:border-indigo-500/50 focus:ring-2 focus:ring-indigo-500/20 transition-all placeholder:text-slate-600"
                          placeholder="Min. 6 characters" 
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          required
                        />
                        <button 
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors"
                        >
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                      
                      {/* Strength Meter */}
                      <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden mt-1">
                        <motion.div 
                          className={`h-full ${getStrengthColor()}`}
                          initial={{ width: 0 }}
                          animate={{ width: `${strength}%` }}
                          transition={{ duration: 0.3 }}
                        />
                      </div>
                    </div>

                    {/* Confirm Password */}
                    <div className="space-y-2">
                      <Label htmlFor="confirm" className="text-xs font-semibold text-slate-400 uppercase tracking-wider ml-1">
                        Confirm Password
                      </Label>
                      <div className="relative group">
                        <ShieldCheck className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500 group-focus-within:text-indigo-400 transition-colors" />
                        <Input 
                          id="confirm"
                          type="password" 
                          className="h-12 pl-11 pr-11 bg-[#020617]/50 border-white/10 text-white rounded-xl focus:bg-[#020617] focus:border-indigo-500/50 focus:ring-2 focus:ring-indigo-500/20 transition-all placeholder:text-slate-600"
                          placeholder="Re-enter password" 
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          required
                        />
                        {/* Match Indicator */}
                        {confirmPassword && confirmPassword === password && (
                          <motion.div 
                            initial={{ scale: 0 }} 
                            animate={{ scale: 1 }}
                            className="absolute right-4 top-1/2 -translate-y-1/2 text-emerald-400 pointer-events-none"
                          >
                            <Sparkles className="h-4 w-4" />
                          </motion.div>
                        )}
                      </div>
                    </div>

                    {/* Error Message */}
                    <AnimatePresence>
                      {error && (
                        <motion.div 
                          initial={{ opacity: 0, height: 0, marginBottom: 0 }}
                          animate={{ opacity: 1, height: "auto", marginBottom: 16 }}
                          exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                          className="overflow-hidden"
                        >
                          <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center gap-3">
                            <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                            <span className="text-red-200 text-xs font-medium">{error}</span>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Submit Button */}
                    <Button 
                      type="submit" 
                      disabled={isLoading}
                      className="w-full h-12 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-semibold rounded-xl shadow-lg shadow-indigo-500/20 transition-all active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                      {isLoading ? (
                        <div className="flex items-center gap-2">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          <span>Updating...</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          Reset Password 
                          <ArrowRight className="h-4 w-4 opacity-70 group-hover:translate-x-1 transition-transform" />
                        </div>
                      )}
                    </Button>
                  </form>

                  {/* Footer */}
                  <div className="mt-8 pt-6 border-t border-white/5 text-center">
                    <button 
                      onClick={() => setIsLoginOpen(true)}
                      className="inline-flex items-center gap-2 text-sm font-medium text-slate-400 hover:text-white transition-all hover:gap-3 group"
                    >
                      <ChevronLeft className="h-4 w-4 text-indigo-500 group-hover:-translate-x-1 transition-transform" />
                      Back to Login
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
        
        {/* Footer Copy */}
        <div className="mt-8 text-center">
          <div className="flex items-center justify-center gap-2 text-[10px] text-white/20 uppercase tracking-[0.2em] font-medium">
            <ShieldCheck className="w-3 h-3" />
            Secured by Praedico
          </div>
        </div>
      </motion.div>

      {/* Global Login Modal */}
      <LoginModal 
        isOpen={isLoginOpen} 
        onClose={() => setIsLoginOpen(false)} 
        onSwitchToRegister={() => {}}
      />
    </div>
  );
}