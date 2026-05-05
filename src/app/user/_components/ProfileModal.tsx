"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { z } from "zod";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/shared-components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared-components/ui/tabs";
import { Input } from "@/shared-components/ui/input";
import { Label } from "@/shared-components/ui/label";
import { Button } from "@/shared-components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/shared-components/ui/card";
import {
  User, Lock, Camera, Check, Crown, Shield, Calendar, Clock,
  TrendingUp, TrendingDown, BarChart2, Wallet, BadgeCheck, AlertCircle, Loader2, Eye, EyeOff, CheckCircle, Mail, X, Activity
} from "lucide-react";
import axiosInstance from "@/lib/axios";
import { authApi, tradingApi } from "@/lib/api";
import { TradingStats, Portfolio } from "@/lib/types/trading.types";

// ─── Zod schema ───────────────────────────────────────────────────────────
const passwordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z
    .string()
    .min(8, "Must be at least 8 characters")
    .regex(/[A-Z]/, "Must include an uppercase letter")
    .regex(/[0-9]/, "Must include a number")
    .regex(/[^A-Za-z0-9]/, "Must include a special character"),
  confirmPassword: z.string().min(1, "Please confirm your password"),
}).refine((d) => d.newPassword === d.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

type PwFields = { currentPassword?: string; newPassword?: string; confirmPassword?: string };

// ─── Password strength ────────────────────────────────────────────────────
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

// ─── Types ──────────────────────────────────────────────────────────────

interface ProfileData {
  id: string;
  name: string;
  email: string;
  role: string;
  currentPlan: string;
  isVerified: boolean;
  subscriptionExpiry?: string;
  hasUsedTrial: boolean;
  isOnTrial: boolean;
  avatar?: string;
  preferredCurrency?: string;
  createdAt?: string;
  lastLogin?: string;
  totalPaperTradesCount?: number;
  profitablePaperTrades?: number;
  totalPaperPL?: number;
  tradingLevel?: string;
  virtualBalance?: number;
}

interface ProfileModalProps {
  open: boolean;
  onClose: () => void;
  onUpdate?: (avatarUrl?: string, name?: string) => void;
}



const PLAN_BADGE = {
  Free:    { label: "Free",    color: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300" },
  Silver:  { label: "Silver",  color: "bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-200" },
  Gold:    { label: "Gold",    color: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300" },
  Diamond: { label: "Diamond", color: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300" },
} as const;

// ─── Main Component ──────────────────────────────────────────────────────

export default function ProfileModal({ open, onClose, onUpdate }: ProfileModalProps) {
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);

  const [name, setName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [detailsSaving, setDetailsSaving] = useState(false);
  const [detailsMsg, setDetailsMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [pwSaving, setPwSaving] = useState(false);
  const [pwMsg, setPwMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);
  const [pwErrors, setPwErrors] = useState<PwFields>({});
  const strength = getStrength(newPw);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── Trading data ──────────────────────────────────────────────────────
  const [tradingStats, setTradingStats] = useState<TradingStats | null>(null);
  const [portfolio, setPortfolio] = useState<Portfolio | null>(null);
  const [statsLoading, setStatsLoading] = useState(false);

  // ── Load profile ─────────────────────────────────────────────────────
  const loadProfile = useCallback(async () => {
    setLoading(true);
    try {
      const res = await authApi.getMe();
      if (res.success && res.user) {
        const u = res.user;
        setProfile(u);
        setName(u.name || "");
        setAvatarUrl(u.avatar || null);
      }
    } catch { /* silently fail */ }
    finally { setLoading(false); }
  }, []);

  // ── Load trading stats + portfolio ───────────────────────────────────
  const loadTradingData = useCallback(async () => {
    setStatsLoading(true);
    try {
      const [statsRes, portfolioRes] = await Promise.all([
        tradingApi.getTradingStats(),
        tradingApi.getPortfolio(),
      ]);
      if (statsRes.success && statsRes.data) setTradingStats(statsRes.data);
      if (portfolioRes.success && portfolioRes.data) setPortfolio(portfolioRes.data);
    } catch { /* silently fail */ }
    finally { setStatsLoading(false); }
  }, []);

  useEffect(() => {
    if (open) {
      loadProfile();
      loadTradingData();
    }
  }, [open, loadProfile, loadTradingData]);



  // ── Avatar: click frame → pick → optimistic preview → upload ─────────
  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // 1. Validate file type and size explicitly to prevent Cloudinary AVIF/etc errors
    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!validTypes.includes(file.type)) {
      setDetailsMsg({ type: "err", text: "Invalid file type. Please upload a JPG, PNG, or WEBP image." });
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    if (file.size > 5 * 1024 * 1024) { // 5MB limit
      setDetailsMsg({ type: "err", text: "File is too large. Please upload an image under 5MB." });
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    const localPreview = URL.createObjectURL(file);
    setAvatarUrl(localPreview);
    setAvatarUploading(true);
    setDetailsMsg(null);

    try {
      const formData = new FormData();
      formData.append("image", file);
      const res = await axiosInstance.post("/api/upload?folder=praedico_avatars", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      const cloudUrl: string = res.data?.url;
      if (!cloudUrl) throw new Error("No URL returned from upload");

      setAvatarUrl(cloudUrl);
      URL.revokeObjectURL(localPreview);

      await axiosInstance.put("/api/users/update-profile", { avatar: cloudUrl });
      sessionStorage.removeItem("praedico_user_profile");
      if (profile) setProfile({ ...profile, avatar: cloudUrl });

      if (onUpdate) onUpdate(cloudUrl, undefined);
      setDetailsMsg({ type: "ok", text: "Profile photo updated!" });
    } catch (err: any) {
      setAvatarUrl(profile?.avatar || null);
      URL.revokeObjectURL(localPreview);
      setDetailsMsg({ type: "err", text: err.response?.data?.message || "Photo upload failed." });
    } finally {
      setAvatarUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  // ── Save name ──────────────────────────────────────────────
  const handleSaveDetails = async () => {
    setDetailsSaving(true);
    setDetailsMsg(null);
    const prevName = profile?.name;
    if (profile) setProfile({ ...profile, name: name.trim() });

    try {
      await axiosInstance.put("/api/users/update-profile", { name: name.trim() });
      sessionStorage.removeItem("praedico_user_profile");
      if (onUpdate) onUpdate(undefined, name.trim());
      setDetailsMsg({ type: "ok", text: "Profile updated!" });

      // Auto-close after a short delay so the user sees the success message
      setTimeout(() => {
        onClose();
      }, 800);
    } catch (err: any) {
      if (profile) setProfile({ ...profile, name: prevName! });
      setDetailsMsg({ type: "err", text: err.response?.data?.message || "Update failed." });
    } finally {
      setDetailsSaving(false);
    }
  };

  // ── Change password (Zod validated) ────────────────────────────────
  const handleChangePassword = async () => {
    setPwMsg(null);
    const parsed = passwordSchema.safeParse({
      currentPassword: currentPw,
      newPassword: newPw,
      confirmPassword: confirmPw,
    });
    if (!parsed.success) {
      const fieldErrors: PwFields = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path[0] as keyof PwFields;
        if (key && !fieldErrors[key]) fieldErrors[key] = issue.message;
      }
      setPwErrors(fieldErrors);
      return;
    }
    setPwErrors({});
    setPwSaving(true);
    try {
      await axiosInstance.put("/api/users/change-password", { currentPassword: currentPw, newPassword: newPw });
      setPwMsg({ type: "ok", text: "Password changed successfully!" });
      setCurrentPw(""); setNewPw(""); setConfirmPw("");
    } catch (err: any) {
      setPwMsg({ type: "err", text: err.response?.data?.message || "Password change failed." });
    } finally {
      setPwSaving(false);
    }
  };

  // ── Helpers ───────────────────────────────────────────────────────────
  const planBadge = PLAN_BADGE[(profile?.currentPlan as keyof typeof PLAN_BADGE) || "Free"];
  // Use live trading stats; fall back to profile fields for older accounts
  const totalTrades = tradingStats?.totalTrades ?? profile?.totalPaperTradesCount ?? 0;
  const winRate = tradingStats
    ? Math.round(tradingStats.winRate || 0)
    : (profile?.totalPaperTradesCount
        ? Math.round(((profile.profitablePaperTrades || 0) / profile.totalPaperTradesCount) * 100)
        : 0);
  const netPL = tradingStats
    ? ((tradingStats.totalProfit || 0) - (tradingStats.totalLoss || 0))
    : (profile?.totalPaperPL ?? 0);
  const tradingCapital = portfolio?.availableBalance ?? profile?.virtualBalance ?? 100000;
  const initials = (profile?.name || "U").split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2);

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-[700px] md:max-w-[850px] lg:max-w-[950px] w-full p-0 gap-0 overflow-hidden rounded-[24px] border border-slate-200/60 dark:border-slate-800 shadow-2xl shadow-indigo-500/10 bg-white dark:bg-slate-950 max-h-[90vh] flex flex-col transition-all duration-300">
        
        {/* ── Top Header ── */}
        <div className="bg-slate-50/50 dark:bg-[#0B1120] border-b border-slate-100 dark:border-slate-800 p-8 flex items-center gap-6 relative shrink-0">
          {/* Avatar */}
          <div className="relative group cursor-pointer shrink-0" onClick={() => !avatarUploading && fileInputRef.current?.click()}>
            <div className="h-28 w-28 rounded-[1.5rem] border-[4px] border-white dark:border-slate-900 shadow-lg overflow-hidden bg-gradient-to-br from-indigo-50 to-blue-50 dark:from-slate-800 dark:to-slate-800 flex items-center justify-center transition-transform duration-300 group-hover:scale-105 group-hover:shadow-xl group-hover:shadow-indigo-500/20">
              {avatarUrl ? (
                <img src={avatarUrl} alt="avatar" className="h-full w-full object-cover" />
              ) : (
                <span className="text-indigo-400 dark:text-slate-500 font-black text-4xl">{initials}</span>
              )}
              {avatarUploading && (
                <div className="absolute inset-0 bg-slate-900/60 flex items-center justify-center backdrop-blur-sm">
                  <Loader2 className="animate-spin text-white" size={28} />
                </div>
              )}
            </div>
            {!avatarUploading && (
              <div className="absolute inset-0 rounded-[1.5rem] bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center justify-center pointer-events-none backdrop-blur-[2px]">
                <Camera className="text-white scale-90 group-hover:scale-100 transition-transform duration-300" size={24} />
              </div>
            )}
            <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif" className="hidden" onChange={handleAvatarChange} />
          </div>

          {/* User Info */}
          {!loading && profile && (
            <div className="flex-1">
              <h2 className="text-3xl font-black text-slate-900 dark:text-white leading-tight mb-1.5 tracking-tight">{profile.name}</h2>
              <p className="text-slate-500 dark:text-slate-400 text-sm font-medium mb-4 flex items-center gap-2">
                <Mail size={14} className="opacity-70" /> {profile.email}
              </p>
              <div className="flex items-center gap-3">
                <span className={`text-[11px] font-bold uppercase tracking-wider px-3 py-1 rounded-full border shadow-sm ${planBadge.color}`}>
                  {planBadge.label} Plan
                </span>
                {profile.isVerified ? (
                  <span className="flex items-center gap-1.5 text-[11px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-200/50 dark:border-emerald-500/20 shadow-sm">
                    <BadgeCheck size={14} /> Verified Account
                  </span>
                ) : (
                  <span className="flex items-center gap-1.5 text-[11px] font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 px-3 py-1 rounded-full border border-amber-200/50 dark:border-amber-500/20 shadow-sm">
                    <Shield size={14} /> Verification Pending
                  </span>
                )}
              </div>
            </div>
          )}
        </div>

        {/* ── Content ── */}
        <div className="flex-1 overflow-y-auto custom-scrollbar bg-white dark:bg-slate-950">
          <DialogHeader className="sr-only">
            <DialogTitle>Profile Settings</DialogTitle>
          </DialogHeader>

          {loading ? (
            <div className="flex flex-col items-center justify-center h-64 gap-4">
              <Loader2 className="animate-spin text-indigo-500" size={40} />
              <p className="text-sm font-medium text-slate-500 animate-pulse">Loading profile data...</p>
            </div>
          ) : (
            <Tabs defaultValue="details" className="w-full h-full flex flex-col">
              <div className="px-8 pt-6 border-b border-slate-100 dark:border-slate-800/60 sticky top-0 bg-white/80 dark:bg-slate-950/80 backdrop-blur-md z-10">
                <TabsList className="flex w-full justify-start space-x-6 bg-transparent p-0 h-auto">
                  <TabsTrigger value="details" className="rounded-none border-b-[3px] border-transparent data-[state=active]:border-indigo-600 data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:text-indigo-600 dark:data-[state=active]:text-indigo-400 text-sm font-bold uppercase tracking-wider px-1 py-3 transition-colors hover:text-indigo-600 dark:hover:text-indigo-400 text-slate-500">
                    <User size={16} className="mr-2 inline-block" /> Account Details
                  </TabsTrigger>
                  <TabsTrigger value="security" className="rounded-none border-b-[3px] border-transparent data-[state=active]:border-indigo-600 data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:text-indigo-600 dark:data-[state=active]:text-indigo-400 text-sm font-bold uppercase tracking-wider px-1 py-3 transition-colors hover:text-indigo-600 dark:hover:text-indigo-400 text-slate-500">
                    <Lock size={16} className="mr-2 inline-block" /> Security
                  </TabsTrigger>
                  <TabsTrigger value="stats" className="rounded-none border-b-[3px] border-transparent data-[state=active]:border-indigo-600 data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:text-indigo-600 dark:data-[state=active]:text-indigo-400 text-sm font-bold uppercase tracking-wider px-1 py-3 transition-colors hover:text-indigo-600 dark:hover:text-indigo-400 text-slate-500">
                    <BarChart2 size={16} className="mr-2 inline-block" /> Trading Stats
                  </TabsTrigger>
                </TabsList>
              </div>

              <div className="p-8">
                {/* ── Details tab ── */}
                <TabsContent value="details" className="mt-0 outline-none animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
                    {/* Left Column: Editable Info */}
                    <div className="lg:col-span-3 space-y-6">
                      <div className="bg-white dark:bg-slate-900/40 rounded-2xl p-6 border border-slate-200/60 dark:border-slate-800 shadow-sm">
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
                          <User className="text-indigo-500" size={20} /> Personal Information
                        </h3>
                        
                        <div className="space-y-5">
                          <div className="space-y-2">
                            <Label htmlFor="profile-name" className="text-xs text-slate-500 font-bold uppercase tracking-wider ml-1">Display Name</Label>
                            <div className="relative">
                              <User size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                              <Input
                                id="profile-name"
                                value={name}
                                onChange={e => setName(e.target.value)}
                                placeholder="Your name"
                                className="pl-11 rounded-xl border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 h-12 text-sm font-medium transition-all"
                              />
                            </div>
                          </div>

                          <div className="space-y-2">
                            <Label className="text-xs text-slate-500 font-bold uppercase tracking-wider ml-1">Email Address</Label>
                            <div className="relative">
                              <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                              <Input
                                value={profile?.email}
                                disabled
                                className="pl-11 rounded-xl bg-slate-100/50 dark:bg-slate-800/30 text-slate-500 cursor-not-allowed border-slate-200 dark:border-slate-800 h-12 text-sm font-medium"
                              />
                            </div>
                            <p className="text-[11px] text-slate-400 ml-1">Email cannot be changed directly. Contact support for assistance.</p>
                          </div>
                        </div>

                        {detailsMsg && (
                          <div className={`mt-6 flex items-center gap-3 text-sm font-bold px-4 py-3 rounded-xl border animate-in fade-in ${
                            detailsMsg.type === "ok"
                              ? "bg-emerald-50 border-emerald-200 text-emerald-700 dark:bg-emerald-500/10 dark:border-emerald-500/20 dark:text-emerald-400"
                              : "bg-red-50 border-red-200 text-red-700 dark:bg-red-500/10 dark:border-red-500/20 dark:text-red-400"
                          }`}>
                            {detailsMsg.type === "ok" ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
                            {detailsMsg.text}
                          </div>
                        )}

                        <div className="mt-8 flex justify-end">
                          <Button
                            onClick={handleSaveDetails}
                            disabled={detailsSaving || name === profile?.name}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl px-8 h-12 shadow-lg shadow-indigo-500/25 transition-all duration-300 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {detailsSaving ? <Loader2 className="animate-spin mr-2" size={18} /> : null}
                            Save Profile Changes
                          </Button>
                        </div>
                      </div>
                    </div>

                    {/* Right Column: Status Cards */}
                    <div className="lg:col-span-2 space-y-5">

                      {/* Subscription Card — vivid indigo */}
                      <div className="relative rounded-2xl overflow-hidden">
                        {/* Background */}
                        <div className="absolute inset-0 bg-gradient-to-br from-indigo-500 via-indigo-600 to-violet-600" />
                        <div className="absolute top-0 right-0 w-40 h-40 bg-white rounded-full blur-3xl opacity-10 -translate-y-1/2 translate-x-1/2" />
                        <div className="absolute bottom-0 left-0 w-24 h-24 bg-violet-300 rounded-full blur-2xl opacity-20 translate-y-1/2 -translate-x-1/2" />

                        {/* Content */}
                        <div className="relative p-6">
                          <div className="flex items-center justify-between mb-4">
                            <span className="text-[10px] font-bold uppercase tracking-widest text-indigo-300/80">Subscription</span>
                            <div className="h-7 w-7 rounded-lg bg-white/10 border border-white/10 flex items-center justify-center">
                              <Crown size={14} className="text-indigo-300" />
                            </div>
                          </div>

                          <p className="text-3xl font-black text-white mb-1 tracking-tight">{profile?.currentPlan}</p>
                          <p className="text-indigo-300/70 text-xs font-medium mb-5">Active membership tier</p>

                          {profile?.subscriptionExpiry && (
                            <div className="flex items-center gap-2.5 bg-white/5 border border-white/10 rounded-xl px-3.5 py-2.5">
                              <Calendar size={13} className="text-indigo-300 shrink-0" />
                              <p className="text-xs text-indigo-200/80 font-medium">
                                Renews <span className="text-white font-bold">{new Date(profile.subscriptionExpiry).toLocaleDateString("en-IN", { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                              </p>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Identity / Verification Card */}
                      <div className="rounded-2xl border border-slate-200/60 dark:border-slate-800 bg-white dark:bg-slate-900/40 p-6">
                        <div className="flex items-center justify-between mb-4">
                          <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Account Role</span>
                          <Shield size={14} className="text-slate-400" />
                        </div>

                        <p className="text-2xl font-black text-slate-900 dark:text-white capitalize tracking-tight mb-4">{profile?.role}</p>

                        <div className={`flex items-center gap-3 rounded-xl p-3 border ${
                          profile?.isVerified
                            ? "bg-emerald-50 dark:bg-emerald-500/10 border-emerald-100 dark:border-emerald-500/20"
                            : "bg-amber-50 dark:bg-amber-500/10 border-amber-100 dark:border-amber-500/20"
                        }`}>
                          <div className={`h-8 w-8 rounded-full flex items-center justify-center shrink-0 ${
                            profile?.isVerified
                              ? "bg-emerald-500 text-white"
                              : "bg-amber-500 text-white"
                          }`}>
                            {profile?.isVerified
                              ? <Check size={15} strokeWidth={3} />
                              : <AlertCircle size={15} strokeWidth={2.5} />
                            }
                          </div>
                          <div>
                            <p className={`text-sm font-bold ${profile?.isVerified ? "text-emerald-700 dark:text-emerald-400" : "text-amber-700 dark:text-amber-400"}`}>
                              {profile?.isVerified ? "Fully Verified" : "Pending Verification"}
                            </p>
                            <p className={`text-[11px] font-medium ${profile?.isVerified ? "text-emerald-600/70 dark:text-emerald-400/60" : "text-amber-600/70 dark:text-amber-400/60"}`}>
                              {profile?.isVerified ? "No feature restrictions" : "Some features are locked"}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </TabsContent>


                {/* ── Security tab ── */}
                <TabsContent value="security" className="mt-0 outline-none animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <div className="bg-white dark:bg-slate-900/40 rounded-2xl p-8 border border-slate-200/60 dark:border-slate-800 shadow-sm max-w-3xl mx-auto">
                    <div className="flex items-center gap-4 mb-8">
                      <div className="h-12 w-12 rounded-2xl bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shrink-0 border border-indigo-100 dark:border-indigo-500/20">
                        <Lock size={24} />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-slate-900 dark:text-white">Change Password</h3>
                        <p className="text-sm text-slate-500 font-medium">Ensure your account uses a strong, unique password.</p>
                      </div>
                    </div>

                    <div className="space-y-6">
                      <div className="space-y-2">
                        <Label className="text-xs text-slate-500 font-bold uppercase tracking-wider ml-1">Current Password</Label>
                        <div className="relative">
                          <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                          <Input
                            type={showCurrent ? "text" : "password"}
                            value={currentPw}
                            onChange={e => { setCurrentPw(e.target.value); setPwErrors(p => ({ ...p, currentPassword: undefined })); }}
                            placeholder="Enter current password"
                            className={`pl-11 rounded-xl border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 focus:ring-2 focus:ring-indigo-500/20 h-12 text-sm pr-12 transition-all ${pwErrors.currentPassword ? "border-red-400 focus:border-red-500 focus:ring-red-500/20" : ""}`}
                          />
                          <button type="button" onClick={() => setShowCurrent(v => !v)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors">
                            {showCurrent ? <EyeOff size={18} /> : <Eye size={18} />}
                          </button>
                        </div>
                        {pwErrors.currentPassword && <p className="text-xs text-red-500 font-semibold ml-1 flex items-center gap-1"><AlertCircle size={12} /> {pwErrors.currentPassword}</p>}
                      </div>

                      <div className="h-px bg-slate-100 dark:bg-slate-800" />

                      <div className="space-y-2">
                        <Label className="text-xs text-slate-500 font-bold uppercase tracking-wider ml-1">New Password</Label>
                        <div className="relative">
                          <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                          <Input
                            type={showNew ? "text" : "password"}
                            value={newPw}
                            onChange={e => { setNewPw(e.target.value); setPwErrors(p => ({ ...p, newPassword: undefined })); }}
                            placeholder="Create a strong password"
                            className={`pl-11 rounded-xl border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 focus:ring-2 focus:ring-indigo-500/20 h-12 text-sm pr-12 transition-all ${pwErrors.newPassword ? "border-red-400 focus:border-red-500 focus:ring-red-500/20" : ""}`}
                          />
                          <button type="button" onClick={() => setShowNew(v => !v)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors">
                            {showNew ? <EyeOff size={18} /> : <Eye size={18} />}
                          </button>
                        </div>
                        {pwErrors.newPassword && <p className="text-xs text-red-500 font-semibold ml-1 flex items-center gap-1"><AlertCircle size={12} /> {pwErrors.newPassword}</p>}
                        
                        {/* Admin-style Checklist and Strength */}
                        {newPw.length > 0 && (
                          <div className="bg-slate-50 dark:bg-slate-800/30 rounded-xl p-4 mt-3 border border-slate-100 dark:border-slate-800/50">
                            <div className="flex gap-1.5 mb-3">
                              {[1, 2, 3, 4, 5].map(i => (
                                <div key={i} className={`h-1.5 flex-1 rounded-full transition-all duration-500 ${i <= strength.score ? strength.color : "bg-slate-200 dark:bg-slate-700"}`} />
                              ))}
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
                              {[
                                { label: "At least 8 characters", pass: newPw.length >= 8 },
                                { label: "Uppercase letter (A–Z)", pass: /[A-Z]/.test(newPw) },
                                { label: "Lowercase letter (a–z)", pass: /[a-z]/.test(newPw) },
                                { label: "Number (0–9)", pass: /[0-9]/.test(newPw) },
                                { label: "Special character (!@#…)", pass: /[^A-Za-z0-9]/.test(newPw) },
                              ].map((check, idx) => (
                                <div key={idx} className={`flex items-center gap-2 text-xs font-medium transition-colors ${check.pass ? "text-emerald-600 dark:text-emerald-400" : "text-slate-500 dark:text-slate-500"}`}>
                                  {check.pass ? <CheckCircle size={14} /> : <div className="w-[14px] h-[14px] rounded-full border border-slate-300 dark:border-slate-600 flex items-center justify-center" />}
                                  {check.label}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label className="text-xs text-slate-500 font-bold uppercase tracking-wider ml-1">Confirm New Password</Label>
                        <div className="relative">
                          <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                          <Input
                            type={showConfirm ? "text" : "password"}
                            value={confirmPw}
                            onChange={e => { setConfirmPw(e.target.value); setPwErrors(p => ({ ...p, confirmPassword: undefined })); }}
                            placeholder="Repeat new password"
                            className={`pl-11 rounded-xl bg-slate-50 dark:bg-slate-800/50 h-12 text-sm pr-12 transition-all outline-none 
                              ${confirmPw && newPw !== confirmPw ? "border-red-400 focus:border-red-500 focus:ring-1 focus:ring-red-500/20" 
                              : confirmPw && newPw === confirmPw ? "border-emerald-500/50 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20" 
                              : "border-slate-200 dark:border-slate-700 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"}`}
                          />
                          <button type="button" onClick={() => setShowConfirm(v => !v)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors">
                            {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
                          </button>
                        </div>
                        {confirmPw && newPw !== confirmPw && (
                          <p className="text-xs text-red-500 font-medium flex items-center gap-1 ml-1 mt-1">
                            <X size={12} /> Passwords do not match
                          </p>
                        )}
                        {confirmPw && newPw === confirmPw && (
                          <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1 ml-1 mt-1">
                            <Check size={12} /> Passwords match perfectly
                          </p>
                        )}
                        {pwErrors.confirmPassword && !confirmPw && <p className="text-xs text-red-500 font-semibold ml-1 flex items-center gap-1 mt-1"><AlertCircle size={12} /> {pwErrors.confirmPassword}</p>}
                      </div>
                    </div>

                    {pwMsg && (
                      <div className={`mt-6 flex items-center gap-3 text-sm font-bold px-4 py-3 rounded-xl border animate-in fade-in ${
                        pwMsg.type === "ok"
                          ? "bg-emerald-50 border-emerald-200 text-emerald-700 dark:bg-emerald-500/10 dark:border-emerald-500/20 dark:text-emerald-400"
                          : "bg-red-50 border-red-200 text-red-700 dark:bg-red-500/10 dark:border-red-500/20 dark:text-red-400"
                      }`}>
                        {pwMsg.type === "ok" ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
                        {pwMsg.text}
                      </div>
                    )}

                    <div className="pt-8 flex justify-end">
                      <Button
                        onClick={handleChangePassword}
                        disabled={pwSaving || !currentPw || !newPw || !confirmPw || newPw !== confirmPw}
                        className="bg-slate-900 hover:bg-slate-800 dark:bg-indigo-600 dark:hover:bg-indigo-700 text-white font-bold rounded-xl px-8 h-12 transition-all duration-300 active:scale-95 disabled:opacity-50"
                      >
                        {pwSaving ? <Loader2 className="animate-spin mr-2" size={18} /> : <Lock size={16} className="mr-2" />}
                        Update Password
                      </Button>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="stats" className="mt-0 outline-none animate-in fade-in slide-in-from-bottom-4 duration-500">
                  {statsLoading ? (
                    <div className="flex items-center justify-center py-16 gap-3 text-slate-400">
                      <Loader2 size={22} className="animate-spin text-indigo-500" />
                      <span className="text-sm font-medium">Loading trading data...</span>
                    </div>
                  ) : (
                  <>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
                    <StatCard 
                      icon={<BarChart2 size={18} />} 
                      label="Total Trades" 
                      value={String(totalTrades)}
                      gradient="from-blue-500/10 to-indigo-500/10"
                      iconColor="text-blue-500"
                    />
                    <StatCard 
                      icon={<Check size={18} />} 
                      label="Win Rate" 
                      value={`${winRate}%`}
                      gradient="from-emerald-500/10 to-teal-500/10"
                      iconColor="text-emerald-500"
                    />
                    <StatCard 
                      icon={<TrendingUp size={18} />} 
                      label="Net P&L" 
                      value={`${netPL >= 0 ? '+' : ''}₹${Math.abs(netPL).toLocaleString("en-IN", { maximumFractionDigits: 0 })}`}
                      valueColor={netPL >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"}
                      gradient="from-purple-500/10 to-pink-500/10"
                      iconColor="text-purple-500"
                    />
                    <StatCard 
                      icon={<Wallet size={18} />} 
                      label="Trading Capital" 
                      value={`₹${tradingCapital.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`}
                      gradient="from-amber-500/10 to-orange-500/10"
                      iconColor="text-amber-500"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-white dark:bg-slate-900/40 rounded-2xl p-6 border border-slate-200/60 dark:border-slate-800 shadow-sm flex items-center justify-between group hover:border-indigo-200 dark:hover:border-indigo-500/30 transition-colors">
                      <div>
                          <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-2">Trading Mastery</p>
                          <p className="text-3xl font-black text-slate-900 dark:text-white capitalize">
                            {tradingStats
                              ? totalTrades >= 100 ? 'Expert'
                                : totalTrades >= 50 ? 'Advanced'
                                : totalTrades >= 20 ? 'Intermediate'
                                : totalTrades >= 5 ? 'Beginner'
                                : 'Rookie'
                              : (profile?.tradingLevel?.toLowerCase() || 'Rookie')}
                          </p>
                          <p className="text-sm text-slate-500 mt-2">Based on {totalTrades} trade{totalTrades !== 1 ? 's' : ''}</p>
                      </div>
                      <div className="w-20 h-20 rounded-full bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center border border-indigo-100 dark:border-indigo-500/20 group-hover:scale-110 transition-transform duration-500">
                          <TrendingUp size={36} className="text-indigo-600 dark:text-indigo-400" />
                      </div>
                    </div>

                    <div className="bg-white dark:bg-slate-900/40 rounded-2xl p-6 border border-slate-200/60 dark:border-slate-800 shadow-sm">
                      <h3 className="text-sm font-bold text-slate-800 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-3 mb-2 flex items-center gap-2">
                        <Activity size={16} className="text-slate-400" /> Activity Log
                      </h3>
                      <div className="space-y-1">
                        <MetaRow 
                          icon={<TrendingUp size={16} className="text-slate-400" />} 
                          label="Best Trade" 
                          value={tradingStats?.bestTrade?.symbol ? `${tradingStats.bestTrade.symbol} (+₹${tradingStats.bestTrade.realizedPL?.toLocaleString("en-IN", { maximumFractionDigits: 0 })})` : "N/A"} 
                        />
                        <MetaRow 
                          icon={<TrendingDown size={16} className="text-slate-400" />} 
                          label="Worst Trade" 
                          value={tradingStats?.worstTrade?.symbol ? `${tradingStats.worstTrade.symbol} (₹${tradingStats.worstTrade.realizedPL?.toLocaleString("en-IN", { maximumFractionDigits: 0 })})` : "N/A"} 
                        />
                        <MetaRow 
                          icon={<BarChart2 size={16} className="text-slate-400" />} 
                          label="Most Traded" 
                          value={tradingStats?.mostTradedSymbol || "N/A"} 
                        />
                        <MetaRow 
                          icon={<Activity size={16} className="text-slate-400" />} 
                          label="Total Volume" 
                          value={tradingStats?.totalVolume ? `₹${tradingStats.totalVolume.toLocaleString("en-IN", { maximumFractionDigits: 0 })}` : "N/A"} 
                        />
                      </div>
                    </div>
                  </div>
                  </>
                  )}
                </TabsContent>
              </div>
            </Tabs>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── Sub-components ──────────────────────────────────────────────────────

function StatCard({ icon, label, value, valueColor = "text-slate-900 dark:text-white", gradient, iconColor }: { icon: React.ReactNode; label: string; value: string; valueColor?: string; gradient: string; iconColor: string }) {
  return (
    <div className="bg-white dark:bg-slate-900/40 rounded-2xl p-6 border border-slate-200/60 dark:border-slate-800 shadow-sm transition-all duration-300 hover:shadow-md hover:-translate-y-1 relative overflow-hidden group">
      <div className={`absolute top-0 right-0 w-24 h-24 rounded-bl-full opacity-20 transition-transform duration-500 group-hover:scale-110 bg-gradient-to-bl ${gradient}`} />
      <div className={`flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500 mb-4`}>
        <div className={`p-1.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 ${iconColor}`}>
          {icon}
        </div> 
        {label}
      </div>
      <p className={`text-2xl font-black tracking-tight ${valueColor}`}>{value}</p>
    </div>
  );
}

function MetaRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 rounded-lg px-2 -mx-2 transition-colors">
      <div className="flex items-center gap-3 text-slate-600 dark:text-slate-400 text-sm font-medium">
        {icon}
        {label}
      </div>
      <span className="text-sm font-bold text-slate-900 dark:text-white">{value}</span>
    </div>
  );
}

