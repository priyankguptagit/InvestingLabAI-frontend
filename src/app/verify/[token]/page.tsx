"use client";

import { useState, use } from "react";
import { useRouter } from "next/navigation";
// REMOVED: import axios from "axios"; 
import { authApi } from "@/lib/api/auth.api"; // 👈 IMPORT CENTRALIZED API
import { Loader2, Eye, EyeOff, Lock, CheckCircle2, ShieldCheck } from "lucide-react";

// Next.js 15+ Params Handling
export default function VerifyAccountPage({ params }: { params: Promise<{ token: string }> }) {
  const router = useRouter();
  const { token } = use(params);

  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState("");

  const handleVerification = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      // ✅ FIXED: Use authApi.verify instead of direct axios
      // This ensures it uses the correct Proxy URL on Vercel
      await authApi.verify({
        token: token,
        password: password 
      });

      setIsSuccess(true);
      setTimeout(() => {
        router.push("/?openLogin=true");
      }, 2500);

    } catch (err: any) {
      // Improved error handling to match axios response structure
      setError(err.response?.data?.message || "Link expired or invalid.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center bg-black overflow-hidden font-sans text-white">
      
      {/* =========================================
          BACKGROUND: DARK AURORA FLOW
      ========================================= */}
      <div className="absolute inset-0 z-0">
        {/* Deep, rich gradients moving in the background */}
        <div className="absolute top-[-20%] left-[-10%] w-[800px] h-[800px] bg-blue-600/30 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[800px] h-[800px] bg-purple-600/30 rounded-full blur-[120px] animate-pulse delay-1000" />
        <div className="absolute top-[30%] left-[30%] w-[600px] h-[600px] bg-rose-600/20 rounded-full blur-[150px] animate-bounce duration-[10000ms]" />
        
        {/* Noise overlay for texture */}
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay"></div>
      </div>

      {/* =========================================
          GLASS CARD: THE MAIN CONTENT
      ========================================= */}
      <div className="relative z-10 w-full max-w-[440px] px-6">
        
        {/* Close Button Mockup (Visual only, to match reference) */}
        <div className="absolute -top-12 right-6 w-8 h-8 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center cursor-pointer hover:bg-white/20 transition-all">
          <span className="text-white/70 text-lg leading-none">&times;</span>
        </div>

        <div className="w-full bg-white/5 backdrop-blur-[40px] border border-white/10 rounded-[32px] p-8 shadow-[0_30px_60px_rgba(0,0,0,0.5)] relative overflow-hidden group">
          
          {/* Subtle inner sheen */}
          <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none"></div>

          {isSuccess ? (
            /* --- SUCCESS STATE --- */
            <div className="relative z-10 flex flex-col items-center justify-center text-center py-8 space-y-6 animate-in fade-in zoom-in duration-500">
              <div className="w-20 h-20 bg-emerald-500/20 rounded-full flex items-center justify-center ring-1 ring-emerald-500/50 shadow-[0_0_30px_rgba(16,185,129,0.3)]">
                <CheckCircle2 className="w-10 h-10 text-emerald-400" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white tracking-tight">All Set!</h2>
                <p className="text-white/50 text-sm mt-2">Your password has been secured.<br/>Redirecting to login...</p>
              </div>
              <div className="w-full bg-white/10 h-1 rounded-full overflow-hidden w-32 mx-auto">
                 <div className="h-full bg-emerald-500 animate-[width_2.5s_ease-in-out_forwards] w-0"></div>
              </div>
            </div>
          ) : (
            /* --- VERIFICATION FORM --- */
            <div className="relative z-10">
              
              {/* Header */}
              <div className="mb-8 text-center sm:text-left">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-br from-white/10 to-white/5 border border-white/10 mb-6 shadow-inner">
                  <ShieldCheck className="w-6 h-6 text-white/90" />
                </div>
                <h1 className="text-3xl font-bold text-white mb-2 tracking-tight">Secure your account</h1>
                <p className="text-white/50 text-sm font-medium">Create a strong password to verify your identity.</p>
              </div>

              {/* Error Message */}
              {error && (
                <div className="mb-6 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-200 text-xs flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-red-400"></div>
                  {error}
                </div>
              )}

              <form onSubmit={handleVerification} className="space-y-6">
                
                {/* Single Column: Password Input */}
                <div className="space-y-2">
                  <div className="relative group">
                    <input 
                      type={showPassword ? "text" : "password"} 
                      placeholder=" "
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="peer w-full bg-[#0a0a0a]/60 border border-white/10 rounded-xl px-4 pt-6 pb-2 text-white placeholder-transparent focus:outline-none focus:border-white/30 focus:bg-[#0a0a0a]/80 transition-all duration-300"
                      required
                      minLength={6}
                    />
                    {/* Floating Label */}
                    <label className="absolute left-4 top-4 text-xs font-medium text-white/40 transition-all peer-placeholder-shown:text-sm peer-placeholder-shown:top-4 peer-placeholder-shown:text-white/40 peer-focus:top-1.5 peer-focus:text-[10px] peer-focus:text-white/70 peer-valid:top-1.5 peer-valid:text-[10px] peer-valid:text-white/70 pointer-events-none">
                      New Password
                    </label>
                    
                    {/* Toggle Icon */}
                    <button 
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/80 transition-colors"
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                  
                  {/* Password Strength Hint */}
                  <div className="flex items-center gap-2 px-1">
                    <div className="flex gap-1 h-1 w-24">
                      <div className={`h-full rounded-full flex-1 transition-all duration-500 ${password.length > 0 ? (password.length > 5 ? 'bg-emerald-500' : 'bg-red-500') : 'bg-white/10'}`}></div>
                      <div className={`h-full rounded-full flex-1 transition-all duration-500 ${password.length > 7 ? 'bg-emerald-500' : 'bg-white/10'}`}></div>
                      <div className={`h-full rounded-full flex-1 transition-all duration-500 ${password.length > 10 ? 'bg-emerald-500' : 'bg-white/10'}`}></div>
                    </div>
                    <span className="text-[10px] text-white/30 font-medium uppercase tracking-wider">
                      {password.length === 0 ? 'Strength' : password.length < 6 ? 'Weak' : 'Strong'}
                    </span>
                  </div>
                </div>

                {/* Submit Button */}
                <button 
                  type="submit" 
                  disabled={isLoading}
                  className="relative w-full h-12 bg-white text-black font-bold rounded-xl overflow-hidden group/btn hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 shadow-[0_0_20px_rgba(255,255,255,0.2)] hover:shadow-[0_0_30px_rgba(255,255,255,0.4)] disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  <span className="relative z-10 flex items-center justify-center gap-2">
                    {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Complete Setup"}
                  </span>
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent -translate-x-full group-hover/btn:animate-[shimmer_1.5s_infinite]"></div>
                </button>

              </form>

              {/* Footer text */}
              <p className="text-center text-[10px] text-white/30 mt-8">
                By verifying, you agree to our Terms of Service & Privacy Policy.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}