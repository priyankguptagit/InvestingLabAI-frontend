"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { authApi } from "@/lib/api/auth.api";
// 👇 Import Login Modal
import LoginModal from "@/app/user/_components/LoginModal"; 

import { 
  ArrowRight, CheckCircle2, ChevronLeft, Fingerprint, 
  Sparkles, ShieldCheck, Loader2
} from "lucide-react";
import { Button } from "@/shared-components/ui/button";
import { Input } from "@/shared-components/ui/input";
import { Label } from "@/shared-components/ui/label";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState("");
  const [isLoginOpen, setIsLoginOpen] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    // Dramatic pause for effect (optional, feels more premium)
    await new Promise(r => setTimeout(r, 800));

    try {
      await authApi.forgotPassword({ email });
      setIsSubmitted(true);
    } catch (err: any) {
      setError(err.response?.data?.message || "We couldn't find that email. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center overflow-hidden bg-black text-white font-sans selection:bg-indigo-500/30">

      {/* 1. OVERLAY GRADIENTS (Background) */}
      <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/40 z-0 pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-indigo-900/20 via-black/0 to-black z-0 pointer-events-none" />

      {/* 2. MAIN CONTENT */}
      <motion.div 
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-10 w-full max-w-[460px] px-4"
      >
        <div className="group relative">
          {/* Glass Card Border Glow */}
          <div className="absolute -inset-0.5 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-[34px] opacity-75 blur-xl group-hover:opacity-100 transition duration-1000 group-hover:duration-200 animate-tilt"></div>
          
          {/* Glass Card Container */}
          <div className="relative bg-black/60 backdrop-blur-2xl border border-white/10 rounded-[32px] p-8 md:p-10 shadow-2xl">
            
            <AnimatePresence mode="wait">
              {isSubmitted ? (
                /* --- SUCCESS STATE --- */
                <motion.div
                  key="success"
                  initial={{ opacity: 0, scale: 0.9, filter: "blur(10px)" }}
                  animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
                  exit={{ opacity: 0, scale: 1.1, filter: "blur(10px)" }}
                  transition={{ duration: 0.5 }}
                  className="text-center space-y-8"
                >
                  <div className="relative mx-auto w-24 h-24">
                    <div className="absolute inset-0 bg-emerald-500/30 rounded-full blur-xl animate-pulse" />
                    <div className="relative bg-gradient-to-tr from-emerald-500 to-teal-400 rounded-full w-full h-full flex items-center justify-center shadow-inner border border-emerald-300/20">
                      <motion.div
                        initial={{ pathLength: 0, opacity: 0 }}
                        animate={{ pathLength: 1, opacity: 1 }}
                        transition={{ duration: 0.8, delay: 0.2 }}
                      >
                        <CheckCircle2 className="h-10 w-10 text-white drop-shadow-md" />
                      </motion.div>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <h3 className="text-2xl font-bold tracking-tight text-white">
                      Check your inbox
                    </h3>
                    <p className="text-slate-400 text-sm leading-relaxed max-w-xs mx-auto">
                      We've sent a secure reset link to <br/>
                      <span className="font-semibold text-emerald-400">{email}</span>
                    </p>
                  </div>

                  <div className="pt-2">
                    <Button 
                      variant="outline" 
                      onClick={() => setIsLoginOpen(true)}
                      className="w-full h-12 rounded-xl border-white/10 bg-white/5 text-white hover:bg-white/10 hover:border-white/20 transition-all active:scale-95"
                    >
                      Return to Login
                    </Button>
                  </div>
                </motion.div>
              ) : (
                /* --- FORM STATE --- */
                <motion.div
                  key="form"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0, x: -20, filter: "blur(5px)" }}
                  transition={{ duration: 0.4 }}
                >
                  {/* Header */}
                  <div className="text-center mb-10">
                    <motion.div 
                      className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border border-indigo-500/30 mb-6 shadow-[0_0_30px_-5px_rgba(99,102,241,0.3)]"
                      animate={{ y: [0, -5, 0] }}
                      transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                    >
                      <Fingerprint className="h-8 w-8 text-indigo-400" />
                    </motion.div>
                    <h1 className="text-3xl font-bold tracking-tight text-white mb-2">
                      Reset Password
                    </h1>
                    <p className="text-slate-400 text-sm font-medium">
                      Enter your email to receive recovery instructions.
                    </p>
                  </div>

                  {/* Form */}
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-2">
                      <Label htmlFor="email" className="text-indigo-200 text-xs font-bold uppercase tracking-wider ml-1">
                        Email Address
                      </Label>
                      <div className="relative group">
                        <Input 
                          id="email" 
                          type="email" 
                          placeholder="name@company.com" 
                          className="h-14 pl-6 bg-black/40 border-white/10 text-white rounded-xl focus:bg-black/60 focus:border-indigo-500/50 focus:ring-4 focus:ring-indigo-500/10 transition-all duration-300 placeholder:text-slate-600"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          required
                        />
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 opacity-0 group-focus-within:opacity-100 transition-opacity duration-300 pointer-events-none">
                          <Sparkles className="h-4 w-4 text-indigo-400 animate-pulse" />
                        </div>
                      </div>
                    </div>

                    <AnimatePresence>
                      {error && (
                        <motion.div 
                          initial={{ opacity: 0, height: 0, marginBottom: 0 }}
                          animate={{ opacity: 1, height: "auto", marginBottom: 16 }}
                          exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                          className="overflow-hidden"
                        >
                          <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center gap-3">
                            <div className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
                            <span className="text-red-200 text-xs font-medium">{error}</span>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    <Button 
                      type="submit" 
                      disabled={isLoading}
                      className="w-full h-14 bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600 bg-[length:200%_auto] hover:bg-right transition-[background-position] duration-500 rounded-xl text-white font-bold text-base shadow-[0_0_20px_-5px_rgba(99,102,241,0.5)] hover:shadow-[0_0_30px_-5px_rgba(168,85,247,0.6)] active:scale-[0.98] disabled:opacity-70"
                    >
                      {isLoading ? (
                        <div className="flex items-center gap-2">
                          <Loader2 className="h-5 w-5 animate-spin" />
                          <span className="animate-pulse">Sending Request...</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          Send Reset Link 
                          <ArrowRight className="h-5 w-5 opacity-70 group-hover:translate-x-1 transition-transform" />
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
      </motion.div>

      {/* 4. FOOTER COPY */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1, duration: 1 }}
        className="absolute bottom-8 text-center"
      >
        <div className="flex items-center gap-2 text-[10px] text-white/20 uppercase tracking-[0.2em] font-medium">
          <ShieldCheck className="w-3 h-3" />
          Secured by Praedico
        </div>
      </motion.div>

      {/* 5. GLOBAL LOGIN MODAL */}
      <LoginModal 
        isOpen={isLoginOpen} 
        onClose={() => setIsLoginOpen(false)} 
        onSwitchToRegister={() => {}}
      />
    </div>
  );
}