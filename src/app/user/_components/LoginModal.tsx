"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Mail, Lock, UserCircle2, Trash2, ChevronRight, Bookmark, Zap } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { authApi, organizationApi, coordinatorApi } from "@/lib/api";
import { getSavedAccounts, saveAccount, removeSavedAccount, type SavedAccount } from "@/lib/savedAccounts";

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/shared-components/ui/dialog";
import { Input } from "@/shared-components/ui/input";
import { Button } from "@/shared-components/ui/button";
import { Checkbox } from "@/shared-components/ui/checkbox";
import { Label } from "@/shared-components/ui/label";
import { Separator } from "@/shared-components/ui/separator";
import { Tabs, TabsList, TabsTrigger } from "@/shared-components/ui/tabs";

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSwitchToRegister: () => void;
}

// Shape of what we need to act on after the save-prompt
interface PendingNavigation {
  email: string;
  name: string;
  loginMode: "user" | "organization";
  role: "user" | "org_admin" | "coordinator";
  route: string;
}

export default function LoginModal({ isOpen, onClose, onSwitchToRegister }: LoginModalProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loginMode, setLoginMode] = useState<'user' | 'organization'>('user');
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    rememberMe: false,
  });
  const [savedAccounts, setSavedAccounts] = useState<SavedAccount[]>([]);
  const [showSavedAccounts, setShowSavedAccounts] = useState(true);
  const [managingAccounts, setManagingAccounts] = useState(false);

  // Post-login "save account?" prompt state
  const [savePrompt, setSavePrompt] = useState<PendingNavigation | null>(null);

  // Session expiry message
  const [sessionExpiredMsg, setSessionExpiredMsg] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      const accounts = getSavedAccounts();
      setSavedAccounts(accounts);
      setShowSavedAccounts(accounts.length > 0);
      setManagingAccounts(false);
      setError("");
      setSavePrompt(null);

      // Check if we were redirected due to session expiry
      const reason = sessionStorage.getItem("session_expired_reason");
      if (reason) {
        setSessionExpiredMsg(
          "Your session expired due to inactivity. Please log in again."
        );
        sessionStorage.removeItem("session_expired_reason");
      } else {
        setSessionExpiredMsg(null);
      }
    }
  }, [isOpen]);

  const handleSelectSavedAccount = (account: SavedAccount) => {
    setFormData({ email: account.email, password: "", rememberMe: true });
    setLoginMode(account.loginMode);
    setShowSavedAccounts(false);
    setError("");
  };

  const handleRemoveSavedAccount = (email: string) => {
    removeSavedAccount(email);
    const updated = getSavedAccounts();
    setSavedAccounts(updated);
    if (updated.length === 0) {
      setManagingAccounts(false);
      setShowSavedAccounts(false);
    }
  };

  const doNavigate = (route: string) => {
    setSavePrompt(null);
    onClose();
    // Dispatch login_success so GlobalAuthListener (opened via open-login-modal event)
    // can intercept and do a hard redirect if needed.
    window.dispatchEvent(new CustomEvent('login_success', { detail: { route } }));
    router.push(route);
  };

  const handleSaveAndNavigate = (pending: PendingNavigation) => {
    saveAccount({
      email: pending.email,
      name: pending.name,
      loginMode: pending.loginMode,
      role: pending.role,
    });
    doNavigate(pending.route);
  };

  const shouldPromptToSave = (email: string) => {
    return !savedAccounts.some(
      (account) => account.email.toLowerCase() === email.toLowerCase()
    );
  };

  const completeLogin = (pending: PendingNavigation) => {
    if (shouldPromptToSave(pending.email)) {
      setSavePrompt(pending);
      return;
    }

    saveAccount({
      email: pending.email,
      name: pending.name,
      loginMode: pending.loginMode,
      role: pending.role,
    });
    doNavigate(pending.route);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      if (loginMode === 'user') {
        const result = await authApi.login({
          email: formData.email,
          password: formData.password,
          rememberMe: formData.rememberMe,
        });

        const name = result.user?.name || formData.email.split("@")[0];
        completeLogin({ email: formData.email, name, loginMode: "user", role: "user", route: "/user/dashboard" });
      } else {
        try {
          const response = await organizationApi.login({
            email: formData.email,
            password: formData.password,
            rememberMe: formData.rememberMe,
          });

          const name = response.admin?.name || formData.email.split("@")[0];
          completeLogin({ email: formData.email, name, loginMode: "organization", role: "org_admin", route: "/organization/dashboard" });
        } catch (orgError: any) {
          console.log('Organization login failed:', orgError.response?.data);
          try {
            const coordResult = await coordinatorApi.login({
              email: formData.email,
              password: formData.password,
              rememberMe: formData.rememberMe,
            });

            const name = coordResult.coordinator?.name || formData.email.split("@")[0];
            completeLogin({ email: formData.email, name, loginMode: "organization", role: "coordinator", route: "/organization/coordinator/dashboard" });
          } catch (coordError: any) {
            console.log('Coordinator login also failed:', coordError.response?.data);
            throw coordError;
          }
        }
      }
    } catch (err: any) {
      setError(err.response?.data?.message || "Login failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const getInitials = (name: string) =>
    name.split(" ").map(n => n.charAt(0)).slice(0, 2).join("").toUpperCase();

  const getRoleBadge = (account: SavedAccount) => {
    if (account.role === "coordinator") return { label: "Coordinator", color: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400 border-purple-200 dark:border-purple-800" };
    if (account.role === "org_admin") return { label: "Org Admin", color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border-blue-200 dark:border-blue-800" };
    return { label: "Student", color: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border-green-200 dark:border-green-800" };
  };

  return (
    <>
      {/* ─── Main Login Dialog ─── */}
      <Dialog open={isOpen && !savePrompt} onOpenChange={(open) => !open && onClose()}>
        <DialogContent className="sm:max-w-md p-0 overflow-hidden bg-white dark:bg-slate-950 border-gray-200 dark:border-slate-800 shadow-2xl rounded-2xl">
          <div className="h-1.5 w-full bg-gradient-to-r from-green-500 via-emerald-500 to-teal-500" />

          <div className="p-6 pt-8 pb-8">
            <DialogHeader className="text-center sm:text-center pb-6">
              <div className="mx-auto mb-4">
                <Image
                  src="/praedico-logo.png"
                  alt="Praedico Logo"
                  width={64}
                  height={64}
                  className="rounded-xl mx-auto"
                />
              </div>
              <DialogTitle className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
                Welcome Back
              </DialogTitle>
              <DialogDescription className="text-gray-500 dark:text-slate-400 pt-1.5">
                Sign in to continue your journey
              </DialogDescription>
            </DialogHeader>

            {/* Session expiry notification */}
            {sessionExpiredMsg && (
              <div className="mb-4 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 text-amber-800 dark:text-amber-300 px-4 py-3 rounded-lg text-sm flex items-center gap-2">
                <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {sessionExpiredMsg}
              </div>
            )}

            {/* ═══ SAVED ACCOUNTS ═══ */}
            {showSavedAccounts && savedAccounts.length > 0 && (
              <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                <div className="flex items-center justify-between mb-3 px-1">
                  <p className="text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider">
                    Saved Accounts
                  </p>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setManagingAccounts(!managingAccounts)}
                    className="h-7 px-2 text-xs font-medium text-gray-500 hover:text-red-500"
                  >
                    {managingAccounts ? "Done" : "Manage"}
                  </Button>
                </div>

                <div className="space-y-2">
                  {savedAccounts.map((account) => {
                    const badge = getRoleBadge(account);
                    return (
                      <div
                        key={account.email}
                        className="group flex items-center gap-3 p-3 rounded-xl border border-gray-200 dark:border-slate-800 hover:border-green-300 dark:hover:border-green-500/50 bg-gray-50/50 dark:bg-slate-900/50 hover:bg-green-50 dark:hover:bg-green-500/10 cursor-pointer transition-all duration-200 shadow-sm"
                        onClick={() => !managingAccounts && handleSelectSavedAccount(account)}
                      >
                        <div className="h-10 w-10 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center text-white font-semibold text-sm shadow-sm flex-shrink-0">
                          {getInitials(account.name)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{account.name}</p>
                          <p className="text-[11px] text-gray-500 dark:text-slate-400 truncate">{account.email}</p>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium border ${badge.color}`}>
                            {badge.label}
                          </span>
                          {managingAccounts ? (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/20"
                              onClick={(e) => { e.stopPropagation(); handleRemoveSavedAccount(account.email); }}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          ) : (
                            <ChevronRight className="h-4 w-4 text-gray-400 group-hover:text-green-500 transition-colors" />
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="mt-6 flex items-center gap-4">
                  <Separator className="flex-1" />
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowSavedAccounts(false)}
                    className="text-xs text-gray-500 hover:text-gray-900 dark:hover:text-white font-medium"
                  >
                    Use a different account
                  </Button>
                  <Separator className="flex-1" />
                </div>
              </div>
            )}

            {/* ═══ LOGIN FORM ═══ */}
            {(!showSavedAccounts || savedAccounts.length === 0) && (
              <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                {savedAccounts.length > 0 && !showSavedAccounts && (
                  <Button
                    variant="link"
                    className="mb-4 h-auto p-0 flex items-center gap-1.5 text-xs font-medium text-green-600 hover:text-green-700"
                    onClick={() => {
                      setShowSavedAccounts(true);
                      setFormData({ email: "", password: "", rememberMe: false });
                      setError("");
                    }}
                  >
                    <UserCircle2 className="h-3.5 w-3.5" />
                    Back to saved accounts
                  </Button>
                )}

                <Tabs
                  defaultValue="user"
                  value={loginMode}
                  onValueChange={(val) => setLoginMode(val as 'user' | 'organization')}
                  className="w-full mb-6"
                >
                  <TabsList className="grid w-full grid-cols-2 p-1 bg-gray-100 dark:bg-slate-900/80 rounded-lg">
                    <TabsTrigger value="user" className="rounded-md font-medium text-sm data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800 data-[state=active]:text-green-600 dark:data-[state=active]:text-green-400 data-[state=active]:shadow-sm transition-all duration-200">User</TabsTrigger>
                    <TabsTrigger value="organization" className="rounded-md font-medium text-sm data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800 data-[state=active]:text-blue-600 dark:data-[state=active]:text-blue-400 data-[state=active]:shadow-sm transition-all duration-200">Organization</TabsTrigger>
                  </TabsList>
                </Tabs>

                {error && (
                  <div className="mb-6 bg-red-50 dark:bg-red-500/10 border-l-2 border-red-500 text-red-700 dark:text-red-400 px-4 py-3 rounded-r-md text-sm flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" />
                    {error}
                  </div>
                )}

                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-sm font-medium">Email Address</Label>
                    <div className="relative">
                      <Mail className="absolute left-3.5 top-2.5 h-4 w-4 text-gray-400" />
                      <Input
                        id="email"
                        type="email"
                        placeholder="name@example.com"
                        required
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="pl-10 pb-0 pt-0 h-11 bg-white dark:bg-slate-950 border-gray-200 dark:border-slate-800 focus-visible:ring-1 focus-visible:ring-green-500 focus-visible:border-green-500 dark:focus-visible:ring-green-500 dark:focus-visible:border-green-500 transition-all rounded-lg"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="password" className="text-sm font-medium">Password</Label>
                      <Link
                        href="/forgot-password"
                        className="text-xs font-semibold text-green-600 hover:text-green-700 hover:underline transition-colors"
                        onClick={onClose}
                      >
                        Forgot password?
                      </Link>
                    </div>
                    <div className="relative">
                      <Lock className="absolute left-3.5 top-2.5 h-4 w-4 text-gray-400" />
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        placeholder="••••••••"
                        required
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        className="pl-10 pr-10 pb-0 pt-0 h-11 bg-white dark:bg-slate-950 border-gray-200 dark:border-slate-800 focus-visible:ring-1 focus-visible:ring-green-500 focus-visible:border-green-500 dark:focus-visible:ring-green-500 dark:focus-visible:border-green-500 transition-all rounded-lg"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute right-1 top-1 h-9 w-9 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-3 pt-2">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="rememberMe"
                        checked={formData.rememberMe}
                        onCheckedChange={(c) => setFormData({ ...formData, rememberMe: !!c })}
                        className="data-[state=checked]:bg-green-600 data-[state=checked]:border-green-600"
                      />
                      <Label htmlFor="rememberMe" className="text-sm font-medium leading-none cursor-pointer">
                        Remember me
                      </Label>
                    </div>
                  </div>

                  <Button
                    type="submit"
                    disabled={isLoading}
                    className="w-full h-11 mt-4 bg-green-600 hover:bg-green-700 text-white transition-all shadow-md rounded-lg"
                  >
                    {isLoading ? (
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        <span>Signing in...</span>
                      </div>
                    ) : (
                      "Sign In"
                    )}
                  </Button>
                </form>


                <div className="mt-8 text-center text-sm text-gray-500">
                  Don't have an account?{" "}
                  <Button
                    variant="link"
                    className="p-0 h-auto font-semibold text-green-600 hover:text-green-700"
                    onClick={() => { onClose(); onSwitchToRegister(); }}
                  >
                    Create one
                  </Button>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* ─── Post-Login Save Account Prompt ─── */}
      <Dialog open={!!savePrompt} onOpenChange={(open) => { if (!open && savePrompt) doNavigate(savePrompt.route); }}>
        <DialogContent className="sm:max-w-sm p-0 overflow-hidden bg-white dark:bg-slate-950 border-gray-200 dark:border-slate-800 shadow-2xl rounded-2xl" showCloseButton={false}>
          <div className="h-1 w-full bg-gradient-to-r from-green-500 via-emerald-500 to-teal-500" />

          <div className="p-6 text-center">
            {/* Icon */}
            <div className="mx-auto bg-amber-50 dark:bg-amber-500/10 h-14 w-14 rounded-full flex items-center justify-center mb-4 ring-6 ring-white dark:ring-slate-950">
              <Zap className="h-6 w-6 text-amber-500" />
            </div>

            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1.5">
              Save for quick login?
            </h3>
            <p className="text-sm text-gray-500 dark:text-slate-400 mb-1">
              Next time, skip typing — just tap your profile.
            </p>

            {/* Account preview */}
            {savePrompt && (
              <div className="mt-4 mb-6 flex items-center gap-3 p-3 rounded-xl bg-gray-50 dark:bg-slate-900 border border-gray-100 dark:border-slate-800 text-left">
                <div className="h-9 w-9 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center text-white font-semibold text-xs flex-shrink-0">
                  {savePrompt.name.split(" ").map(n => n.charAt(0)).slice(0, 2).join("").toUpperCase()}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{savePrompt.name}</p>
                  <p className="text-[11px] text-gray-500 dark:text-slate-400 truncate">{savePrompt.email}</p>
                </div>
              </div>
            )}

            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1 h-10 rounded-lg border-gray-200 dark:border-slate-800 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-900 text-sm"
                onClick={() => savePrompt && doNavigate(savePrompt.route)}
              >
                Skip
              </Button>
              <Button
                className="flex-1 h-10 rounded-lg bg-green-600 hover:bg-green-700 text-white text-sm shadow-sm"
                onClick={() => savePrompt && handleSaveAndNavigate(savePrompt)}
              >
                <Bookmark className="h-3.5 w-3.5 mr-1.5" />
                Save account
              </Button>
            </div>

            <p className="mt-4 text-[11px] text-gray-400 dark:text-slate-500">
              Only your name &amp; email are stored locally — never your password.
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
