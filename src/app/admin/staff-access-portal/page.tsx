"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Eye, EyeOff, UserCircle2, Trash2, ChevronRight, Calendar, Mail, ArrowLeft, CheckCircle, ShieldAlert, Fingerprint, Activity, Lock } from "lucide-react";
import { companyApi } from "@/lib/api";
import { getSavedAccounts, saveAccount, removeSavedAccount, type SavedAccount } from "@/lib/savedAccounts";

export default function HiddenAdminLogin() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [saveInfo, setSaveInfo] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [savedAccounts, setSavedAccounts] = useState<SavedAccount[]>([]);
  const [showSavedAccounts, setShowSavedAccounts] = useState(true);
  const [managingAccounts, setManagingAccounts] = useState(false);
  const [loginError, setLoginError] = useState("");
  const [joiningDateBlock, setJoiningDateBlock] = useState<string | null>(null);

  // Forgot password state
  const [showForgotPw, setShowForgotPw] = useState(false);
  const [fpEmail, setFpEmail] = useState("");
  const [fpLoading, setFpLoading] = useState(false);
  const [fpSent, setFpSent] = useState(false);
  const [fpError, setFpError] = useState("");


  useEffect(() => {
    const accounts = getSavedAccounts().filter(a => a.role === "admin");
    setSavedAccounts(accounts);
    setShowSavedAccounts(accounts.length > 0);
  }, []);

  const handleSelectSaved = (account: SavedAccount) => {
    setEmail(account.email);
    setPassword("");
    setRememberMe(true);
    setSaveInfo(true);
    setShowSavedAccounts(false);
  };

  const handleRemoveSaved = (emailToRemove: string) => {
    removeSavedAccount(emailToRemove);
    const updated = getSavedAccounts().filter(a => a.role === "admin");
    setSavedAccounts(updated);
    if (updated.length === 0) {
      setManagingAccounts(false);
      setShowSavedAccounts(false);
    }
  };

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setLoginError("");

    try {
      const data = await companyApi.login({ email, password });

      if (saveInfo && data.user) {
        saveAccount({
          email: email,
          name: data.user.name || email.split("@")[0],
          loginMode: "user",
          role: "admin",
        });
      }

      router.push("/admin/dashboard");

    } catch (err: any) {
      const message = err.response?.data?.message || "Invalid Credentials";

      if (message.startsWith("ACCESS_BEFORE_JOINING:")) {
        setJoiningDateBlock(message.replace("ACCESS_BEFORE_JOINING:", ""));
      } else {
        setLoginError(message);
      }
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setFpLoading(true);
    setFpError("");
    try {
      await companyApi.forgotPassword(fpEmail);
      setFpSent(true);
    } catch (err: any) {
      setFpError(err.response?.data?.message || "Something went wrong. Please try again.");
    } finally {
      setFpLoading(false);
    }
  };

  const getInitials = (name: string) =>
    name.split(" ").map(n => n.charAt(0)).slice(0, 2).join("").toUpperCase();

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-[#030712] relative overflow-hidden font-sans selection:bg-blue-500/30">
      
      {/* ── ALIVE BACKGROUND SYSTEM ── */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-[10%] left-[20%] w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-[100px] mix-blend-screen animate-pulse" style={{ animationDuration: '8s' }} />
        <div className="absolute bottom-[10%] right-[20%] w-[600px] h-[600px] bg-indigo-600/10 rounded-full blur-[120px] mix-blend-screen animate-pulse" style={{ animationDuration: '12s', animationDelay: '2s' }} />
        <div className="absolute top-[40%] left-[50%] -translate-x-1/2 w-[800px] h-[400px] bg-purple-900/10 rounded-full blur-[150px] mix-blend-screen animate-pulse" style={{ animationDuration: '10s', animationDelay: '1s' }} />
        
        {/* Subtle grid pattern overlay */}
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.03] mix-blend-overlay"></div>
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:64px_64px] [mask-image:radial-gradient(ellipse_80%_80%_at_50%_50%,#000_20%,transparent_100%)]"></div>
      </div>

      {/* ── Joining Date Block Modal ── */}
      {joiningDateBlock && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xl transition-all duration-300">
          <div className="bg-[#0f172a]/90 border border-amber-500/20 rounded-3xl p-8 w-full max-w-md shadow-[0_0_50px_-12px_rgba(245,158,11,0.25)] text-center relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-amber-500 via-orange-400 to-amber-500"></div>
            <div className="h-20 w-20 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mx-auto mb-6 relative">
              <div className="absolute inset-0 bg-amber-500/20 blur-xl rounded-full"></div>
              <Calendar className="h-8 w-8 text-amber-400 relative z-10" />
            </div>
            <h3 className="text-2xl font-bold text-white mb-3">Access Scheduled</h3>
            <p className="text-slate-400 text-sm leading-relaxed mb-6 px-4">
              Your administrative clearance is active, but your designated joining date has not yet commenced.
            </p>
            <div className="bg-black/40 border border-white/5 rounded-2xl p-4 mb-8">
               <p className="text-slate-500 text-xs uppercase tracking-widest mb-1">Authorized Access Date</p>
               <p className="text-amber-400 font-mono font-bold text-lg tracking-wide">{joiningDateBlock}</p>
            </div>
            <button
              onClick={() => setJoiningDateBlock(null)}
              className="w-full py-4 rounded-xl bg-white text-black hover:bg-slate-200 font-bold text-sm transition-all shadow-[0_0_20px_rgba(255,255,255,0.2)] hover:shadow-[0_0_30px_rgba(255,255,255,0.4)]"
            >
              Acknowledge
            </button>
          </div>
        </div>
      )}

      {/* ── THE GLASS CARD CONTAINER ── */}
      <div className="relative w-full max-w-[440px] mx-4 z-10 perspective-1000">
        
        {/* Glow behind card */}
        <div className="absolute -inset-1 bg-gradient-to-b from-blue-500 to-purple-600 rounded-[2rem] blur-2xl opacity-20 animate-pulse" style={{ animationDuration: '4s' }}></div>

        <div className="relative backdrop-blur-2xl bg-[#0b0f19]/80 border border-white/[0.08] rounded-[2rem] p-8 sm:p-10 shadow-[0_8px_32px_0_rgba(0,0,0,0.6)] overflow-hidden">
          
          {/* Subtle light reflection on top edge */}
          <div className="absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>
          {/* Side reflections */}
          <div className="absolute inset-y-0 left-0 w-[1px] bg-gradient-to-b from-transparent via-white/10 to-transparent"></div>
          <div className="absolute inset-y-0 right-0 w-[1px] bg-gradient-to-b from-transparent via-white/10 to-transparent"></div>

          {/* ── HEADER ── */}
          <div className="mb-10 text-center relative">
            <div className="flex justify-center mb-8 relative">
              {/* Logo Glow container */}
              <div className="relative group">
                <div className="absolute inset-0 bg-blue-500/30 blur-2xl rounded-full opacity-60 group-hover:opacity-100 transition-opacity duration-700"></div>
                <div className="absolute inset-[-10px] border border-blue-500/20 rounded-full animate-[spin_10s_linear_infinite]"></div>
                <div className="absolute inset-[-20px] border border-purple-500/10 rounded-full animate-[spin_15s_linear_infinite_reverse]"></div>
                
                {/* Logo Pedestal */}
                <div className="relative p-4 rounded-3xl bg-gradient-to-br from-white/10 to-white/5 border border-white/10 shadow-[inset_0_1px_1px_rgba(255,255,255,0.2),0_8px_32px_rgba(0,0,0,0.5)] backdrop-blur-xl">
                  <Image
                    src="/praedico-logo.png"
                    alt="Praedico Logo"
                    width={56}
                    height={56}
                    className="rounded-xl drop-shadow-xl"
                  />
                </div>
              </div>
            </div>

            <h1 className="text-[28px] font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-b from-white via-white to-slate-400 mb-4 drop-shadow-sm">
              Staff Access Portal
            </h1>
            
            <div className="flex items-center justify-center gap-3">
              <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent to-blue-500/30" />
              <div className="flex items-center gap-2 px-3 py-1 rounded-full border border-blue-500/20 bg-blue-500/5">
                <ShieldAlert className="h-3 w-3 text-blue-400" />
                <span className="text-blue-400 text-[10px] font-bold tracking-[0.2em] uppercase">
                  Secure Access
                </span>
              </div>
              <div className="h-[1px] flex-1 bg-gradient-to-l from-transparent to-blue-500/30" />
            </div>
          </div>

          {/* ═══ SAVED ACCOUNTS SECTION ═══ */}
          {showSavedAccounts && savedAccounts.length > 0 && !showForgotPw && (
            <div className="mb-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="flex items-center justify-between mb-4 px-1">
                <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                  <Fingerprint className="h-3.5 w-3.5" /> Saved Accounts
                </p>
                <button
                  type="button"
                  onClick={() => setManagingAccounts(!managingAccounts)}
                  className="text-[11px] font-bold text-slate-400 hover:text-white transition-colors px-2 py-1 rounded-md hover:bg-white/5"
                >
                  {managingAccounts ? "Done" : "Manage"}
                </button>
              </div>

              <div className="space-y-3">
                {savedAccounts.map((account) => (
                  <div
                    key={account.email}
                    className="group relative flex items-center gap-4 p-4 rounded-2xl border border-white/[0.05] bg-black/40 hover:bg-white/[0.02] cursor-pointer transition-all duration-300 overflow-hidden"
                    onClick={() => !managingAccounts && handleSelectSaved(account)}
                  >
                    {/* Hover highlight line */}
                    <div className="absolute left-0 top-0 bottom-0 w-[2px] bg-blue-500 scale-y-0 group-hover:scale-y-100 transition-transform duration-300 origin-center"></div>

                    <div className="h-12 w-12 rounded-full bg-gradient-to-br from-slate-800 to-slate-900 border border-white/10 flex items-center justify-center text-white font-bold text-sm shadow-inner flex-shrink-0 relative">
                       <div className="absolute inset-0 rounded-full border-[1.5px] border-transparent group-hover:border-blue-500/50 transition-colors duration-300"></div>
                      {getInitials(account.name)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[15px] font-bold text-slate-200 truncate group-hover:text-white transition-colors">{account.name}</p>
                      <p className="text-[12px] text-slate-500 font-mono truncate">{account.email}</p>
                    </div>
                    {managingAccounts ? (
                      <button
                         onClick={(e) => { e.stopPropagation(); handleRemoveSaved(account.email); }}
                        className="h-8 w-8 rounded-full flex items-center justify-center text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-all z-10"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    ) : (
                      <div className="h-8 w-8 rounded-full flex items-center justify-center bg-white/5 group-hover:bg-blue-500/10 text-slate-500 group-hover:text-blue-400 transition-all">
                        <ChevronRight className="h-4 w-4" />
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Divider */}
              <div className="relative mt-8 mb-2">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-white/[0.06]"></span>
                </div>
                <div className="relative flex justify-center text-xs">
                  <button
                    type="button"
                    onClick={() => setShowSavedAccounts(false)}
                    className="bg-[#0b0f19] px-4 text-slate-500 font-semibold hover:text-white transition-colors tracking-wide"
                  >
                    Sign in with another account
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ═══ LOGIN FORM ═══ */}
          {(!showSavedAccounts || savedAccounts.length === 0) && !showForgotPw && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              
              {/* Back to saved accounts */}
              {savedAccounts.length > 0 && !showSavedAccounts && (
                <button
                  type="button"
                  onClick={() => {
                    setShowSavedAccounts(true);
                    setEmail("");
                    setPassword("");
                  }}
                  className="mb-6 flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-white transition-colors bg-white/5 hover:bg-white/10 px-3 py-1.5 rounded-lg w-fit"
                >
                  <ArrowLeft className="h-3.5 w-3.5" />
                  Back to Saved Accounts
                </button>
              )}

              {/* Inline error */}
              {loginError && (
                <div className="mb-6 flex items-center gap-3 p-4 rounded-xl bg-red-500/10 border border-red-500/20 animate-in fade-in zoom-in-95">
                  <ShieldAlert className="h-5 w-5 text-red-400 flex-shrink-0" />
                  <p className="text-red-300 text-sm font-medium leading-snug">{loginError}</p>
                </div>
              )}

              <form onSubmit={handleAdminLogin} className="space-y-6">

                {/* EMAIL INPUT */}
                <div className="space-y-2">
                  <label className="text-[11px] font-bold text-slate-400 tracking-widest uppercase ml-1 flex items-center gap-2">
                    <UserCircle2 className="h-3.5 w-3.5 text-blue-400" /> Email Address
                  </label>
                  <div className="relative group">
                    <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl blur opacity-0 group-focus-within:opacity-30 transition duration-500"></div>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => { setEmail(e.target.value); setLoginError(""); }}
                      placeholder="admin@praedico.com"
                      className="relative w-full bg-black/50 backdrop-blur-sm border border-white/10 rounded-xl px-5 py-4 text-[15px] text-white font-mono placeholder:text-slate-600 focus:outline-none focus:border-blue-500/50 transition-all shadow-[inset_0_2px_10px_rgba(0,0,0,0.5)]"
                    />
                  </div>
                </div>

                {/* PASSWORD INPUT */}
                <div className="space-y-2">
                  <label className="text-[11px] font-bold text-slate-400 tracking-widest uppercase ml-1 flex items-center gap-2">
                     <Lock className="h-3.5 w-3.5 text-blue-400" /> Password
                  </label>
                  <div className="relative group">
                    <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl blur opacity-0 group-focus-within:opacity-30 transition duration-500"></div>
                    <input
                      type={showPassword ? "text" : "password"}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="relative w-full bg-black/50 backdrop-blur-sm border border-white/10 rounded-xl px-5 py-4 text-[15px] text-white font-mono placeholder:text-slate-600 focus:outline-none focus:border-blue-500/50 transition-all shadow-[inset_0_2px_10px_rgba(0,0,0,0.5)] pr-12"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white bg-transparent hover:bg-white/10 p-1.5 rounded-md transition-all z-10"
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                {/* SUBMIT BUTTON */}
                <div className="pt-6">
                  <button
                    disabled={isLoading}
                    className="relative w-full overflow-hidden rounded-xl font-bold p-[1px] active:scale-[0.98] transition-all duration-300 group shadow-[0_0_40px_-10px_rgba(59,130,246,0.5)] hover:shadow-[0_0_60px_-15px_rgba(59,130,246,0.7)]"
                  >
                    {/* Animated gradient border */}
                    <span className="absolute inset-[-1000%] animate-[spin_3s_linear_infinite] bg-[conic-gradient(from_90deg_at_50%_50%,#E2CBFF_0%,#393BB2_50%,#E2CBFF_100%)]" />
                    
                    {/* Button Body */}
                    <div className="relative flex items-center justify-center h-14 w-full bg-slate-950/90 backdrop-blur-xl rounded-xl transition-colors group-hover:bg-slate-900/90">
                      
                      {/* Subtle inner glow */}
                      <div className="absolute inset-0 rounded-xl bg-gradient-to-b from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                      
                      <span className="relative flex items-center justify-center gap-3 text-white tracking-[0.15em] uppercase text-sm font-extrabold z-10">
                        {isLoading ? (
                          <>
                            <Activity className="h-5 w-5 animate-pulse text-blue-400" />
                            Authenticating...
                          </>
                        ) : (
                          "Sign In"
                        )}
                      </span>
                    </div>
                  </button>
                </div>

                {/* FORGOT PASSWORD LINK */}
                <div className="pt-4 text-center">
                  <button
                    type="button"
                    onClick={() => { setShowForgotPw(true); setFpSent(false); setFpError(""); setFpEmail(""); }}
                    className="text-[12px] font-bold text-slate-500 hover:text-white transition-colors border-b border-transparent hover:border-white/30 pb-0.5"
                  >
                    Forgot Password?
                  </button>
                </div>

              </form>
            </div>
          )}

          {/* ═══ FORGOT PASSWORD PANEL ═══ */}
          {showForgotPw && (
            <div className="animate-in fade-in slide-in-from-right-8 duration-500">
              {/* Back button */}
              <button
                type="button"
                onClick={() => setShowForgotPw(false)}
                className="mb-8 flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-white transition-colors bg-white/5 hover:bg-white/10 px-3 py-1.5 rounded-lg w-fit"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                Back to Sign In
              </button>

              {!fpSent ? (
                <>
                  <div className="mb-8 text-center">
                     <div className="relative w-16 h-16 mx-auto mb-4">
                        <div className="absolute inset-0 bg-blue-500/20 blur-xl rounded-full animate-pulse"></div>
                        <div className="relative h-16 w-16 rounded-full bg-slate-900 border border-blue-500/30 flex items-center justify-center shadow-inner">
                          <Mail className="h-7 w-7 text-blue-400" />
                        </div>
                     </div>
                    <h3 className="text-xl font-bold text-white mb-2">Reset Password</h3>
                    <p className="text-slate-400 text-[13px] leading-relaxed px-4">
                      Enter your email address to receive a secure password reset link.
                    </p>
                  </div>

                  {fpError && (
                    <div className="mb-6 flex items-center gap-3 p-4 rounded-xl bg-red-500/10 border border-red-500/20 animate-in fade-in zoom-in-95">
                      <ShieldAlert className="h-5 w-5 text-red-400 flex-shrink-0" />
                      <p className="text-red-300 text-sm font-medium">{fpError}</p>
                    </div>
                  )}

                  <form onSubmit={handleForgotPassword} className="space-y-6">
                    <div className="space-y-2">
                      <label className="text-[11px] font-bold text-slate-400 tracking-widest uppercase ml-1 flex items-center gap-2">
                        <UserCircle2 className="h-3.5 w-3.5 text-blue-400" /> Email Address
                      </label>
                      <div className="relative group">
                        <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl blur opacity-0 group-focus-within:opacity-30 transition duration-500"></div>
                        <input
                          type="email"
                          required
                          value={fpEmail}
                          onChange={(e) => { setFpEmail(e.target.value); setFpError(""); }}
                          placeholder="admin@praedico.com"
                          className="relative w-full bg-black/50 backdrop-blur-sm border border-white/10 rounded-xl px-5 py-4 text-[15px] text-white font-mono placeholder:text-slate-600 focus:outline-none focus:border-blue-500/50 transition-all shadow-[inset_0_2px_10px_rgba(0,0,0,0.5)]"
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={fpLoading}
                      className="relative w-full overflow-hidden rounded-xl font-bold py-4 active:scale-[0.98] transition-all duration-300 group shadow-[0_0_30px_-10px_rgba(59,130,246,0.3)] hover:shadow-[0_0_40px_-10px_rgba(59,130,246,0.5)] bg-slate-900 border border-white/10 hover:border-blue-500/50"
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-indigo-600/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                      <span className="relative flex items-center justify-center gap-2 text-white tracking-[0.15em] uppercase text-sm font-extrabold">
                        {fpLoading ? (
                          <>
                            <Activity className="h-4 w-4 animate-pulse text-blue-400" />
                            Sending...
                          </>
                        ) : (
                          "Send Reset Link"
                        )}
                      </span>
                    </button>
                  </form>
                </>
              ) : (
                /* SUCCESS STATE */
                <div className="text-center py-6 animate-in zoom-in-95 duration-500">
                  <div className="relative w-20 h-20 mx-auto mb-6">
                     <div className="absolute inset-0 bg-emerald-500/20 blur-xl rounded-full animate-pulse"></div>
                     <div className="relative h-20 w-20 rounded-full bg-slate-900 border border-emerald-500/30 flex items-center justify-center">
                       <CheckCircle className="h-10 w-10 text-emerald-400" />
                     </div>
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-3">Check your inbox</h3>
                  <p className="text-slate-400 text-sm leading-relaxed mb-6 px-2">
                    A secure password reset link has been sent to <br/><span className="text-emerald-400 font-mono mt-1 block">{fpEmail}</span>
                  </p>
                  
                  <div className="bg-black/30 border border-white/5 rounded-xl p-4 mb-8">
                    <p className="text-slate-500 text-[11px] uppercase tracking-widest flex items-center justify-center gap-2">
                       <ShieldAlert className="h-3 w-3" /> Security Notice
                    </p>
                    <p className="text-slate-300 text-xs mt-2">Token expires in 60 minutes. Do not share this link with unauthorized personnel.</p>
                  </div>

                  <button
                    type="button"
                    onClick={() => setShowForgotPw(false)}
                    className="w-full py-4 rounded-xl bg-white text-black font-bold text-sm hover:bg-slate-200 transition-all shadow-[0_0_20px_rgba(255,255,255,0.1)] hover:shadow-[0_0_30px_rgba(255,255,255,0.3)]"
                  >
                    Back to Sign In
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
        
        {/* Subtle footer */}
        <p className="text-center text-[10px] text-slate-600 font-medium tracking-[0.2em] uppercase mt-8 drop-shadow-md">
          Praedico Global Research © {new Date().getFullYear()}
        </p>
      </div>
    </div>
  );
}
