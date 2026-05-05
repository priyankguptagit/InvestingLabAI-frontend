"use client";

import { useState, useEffect, useRef, useCallback, DragEvent } from "react";
import { useRouter } from "next/navigation";
import {
    User, Mail, Phone, Shield, Lock, Camera, Check, X, Loader2,
    Eye, EyeOff, Upload, AlertCircle, CheckCircle, ArrowLeft,
    Calendar, Clock, Fingerprint, BadgeCheck, Database, RefreshCw, Trash2,
} from "lucide-react";
import {
    Card, CardContent, CardDescription, CardHeader, CardTitle,
} from "@/shared-components/ui/card";
import { Input } from "@/shared-components/ui/input";
import { Label } from "@/shared-components/ui/label";
import { Button } from "@/shared-components/ui/button";
import { Separator } from "@/shared-components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared-components/ui/tabs";
import { Badge } from "@/shared-components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/shared-components/ui/avatar";
import { companyApi } from "@/lib/api";
import axiosInstance from "@/lib/axios";
import { z } from "zod";

const passwordSchema = z.object({
    currentPw: z.string().min(1, "Current password is required"),
    newPw: z.string()
        .min(8, "Password must be at least 8 characters")
        .max(128, "Password is too long")
        .regex(/[A-Z]/, "Must contain at least one uppercase letter")
        .regex(/[a-z]/, "Must contain at least one lowercase letter")
        .regex(/[0-9]/, "Must contain at least one number")
        .regex(/[^A-Za-z0-9]/, "Must contain at least one special character (!@#$%^&*…)"),
    confirmPw: z.string()
}).refine(data => data.newPw !== data.currentPw, {
    message: "New password cannot be the same as current password",
    path: ["newPw"]
}).refine(data => data.newPw === data.confirmPw, {
    message: "Passwords do not match",
    path: ["confirmPw"]
});

// ─── Types ───────────────────────────────────────────────────────────────────

interface MemberProfile {
    id: string;
    name: string;
    email: string;
    role: string;
    phone?: string | null;
    avatar?: string | null;
    isActive: boolean;
    isVerified: boolean;
    lastLogin?: string | null;
    createdAt?: string | null;
    customRole?: { name: string; permissions: string[] } | null;
}

type AlertState = { type: "success" | "error"; message: string } | null;

// ─── Helpers ─────────────────────────────────────────────────────────────────

function roleLabel(role: string): string {
    if (role === "super_admin") return "Super Admin";
    if (role === "admin") return "Administrator";
    return "Employee";
}

function roleBadgeClass(role: string): string {
    if (role === "super_admin") return "bg-gradient-to-r from-amber-500/20 to-orange-500/20 text-amber-300 border-amber-500/30";
    if (role === "admin") return "bg-gradient-to-r from-blue-500/20 to-indigo-500/20 text-blue-300 border-blue-500/30";
    return "bg-gradient-to-r from-slate-500/20 to-slate-600/20 text-slate-300 border-slate-500/30";
}

function fmt(dateStr?: string | null) {
    if (!dateStr) return "—";
    return new Date(dateStr).toLocaleDateString("en-IN", {
        day: "2-digit", month: "short", year: "numeric",
        hour: "2-digit", minute: "2-digit",
    });
}

function fmtDate(dateStr?: string | null) {
    if (!dateStr) return "—";
    return new Date(dateStr).toLocaleDateString("en-IN", {
        day: "2-digit", month: "long", year: "numeric",
    });
}

// ─── Alert Banner ────────────────────────────────────────────────────────────

function AlertBanner({ alert, onClose }: { alert: AlertState; onClose: () => void }) {
    if (!alert) return null;
    const isSuccess = alert.type === "success";
    return (
        <div className={`flex items-center gap-3 px-4 py-3 rounded-xl border text-sm font-medium transition-all ${isSuccess
            ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
            : "bg-red-500/10 border-red-500/30 text-red-300"
            }`}>
            {isSuccess
                ? <CheckCircle className="h-4 w-4 shrink-0" />
                : <AlertCircle className="h-4 w-4 shrink-0" />
            }
            <span className="flex-1">{alert.message}</span>
            <button onClick={onClose} className="opacity-60 hover:opacity-100 transition-opacity">
                <X className="h-3.5 w-3.5" />
            </button>
        </div>
    );
}

// ─── Avatar Upload Zone ───────────────────────────────────────────────────────

function AvatarUploadZone({
    avatarUrl,
    initials,
    uploading,
    onFileSelect,
}: {
    avatarUrl: string | null;
    initials: string;
    uploading: boolean;
    onFileSelect: (file: File) => void;
}) {
    const [dragging, setDragging] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    const validate = (file: File): string | null => {
        const valid = ["image/jpeg", "image/png", "image/webp", "image/gif"];
        if (!valid.includes(file.type)) return "Please upload a JPG, PNG, WEBP or GIF.";
        if (file.size > 5 * 1024 * 1024) return "File must be under 5 MB.";
        return null;
    };

    const handleDrop = (e: DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setDragging(false);
        const file = e.dataTransfer.files?.[0];
        if (file && !validate(file)) onFileSelect(file);
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file && !validate(file)) onFileSelect(file);
        if (inputRef.current) inputRef.current.value = "";
    };

    return (
        <div className="flex flex-col items-center gap-6">
            {/* Avatar circle */}
            <div className="relative group">
                <div className="absolute -inset-1 bg-gradient-to-tr from-blue-500 via-purple-500 to-pink-500 rounded-full blur-sm opacity-60 group-hover:opacity-90 transition-opacity duration-300" />
                <div
                    className="relative h-36 w-36 rounded-full overflow-hidden bg-gradient-to-br from-blue-600 to-purple-700 flex items-center justify-center ring-4 ring-slate-900 cursor-pointer"
                    onClick={() => !uploading && inputRef.current?.click()}
                >
                    {avatarUrl ? (
                        /* object-cover + aspect-ratio lock = no stretching */
                        <img
                            src={avatarUrl}
                            alt="Profile photo"
                            className="h-full w-full object-cover"
                            style={{ aspectRatio: "1 / 1" }}
                        />
                    ) : (
                        <span className="text-white font-black text-5xl select-none">{initials}</span>
                    )}

                    {/* Hover overlay */}
                    <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 backdrop-blur-[2px]">
                        {uploading ? (
                            <Loader2 className="h-8 w-8 text-white animate-spin" />
                        ) : (
                            <>
                                <Camera className="h-7 w-7 text-white mb-1" />
                                <span className="text-white text-[11px] font-semibold tracking-wide">Change Photo</span>
                            </>
                        )}
                    </div>
                </div>
            </div>

            {/* Drag-drop zone */}
            <div
                onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
                onDragLeave={() => setDragging(false)}
                onDrop={handleDrop}
                onClick={() => !uploading && inputRef.current?.click()}
                className={`w-full max-w-xs flex flex-col items-center gap-2 py-5 px-4 rounded-2xl border-2 border-dashed cursor-pointer transition-all duration-200 ${dragging
                    ? "border-blue-400 bg-blue-500/10 scale-[1.02]"
                    : "border-slate-700 bg-slate-800/40 hover:border-slate-500 hover:bg-slate-800/60"
                    }`}
            >
                <div className={`h-9 w-9 rounded-full flex items-center justify-center transition-colors ${dragging ? "bg-blue-500/20 text-blue-400" : "bg-slate-700/60 text-slate-400"}`}>
                    <Upload className="h-4 w-4" />
                </div>
                <div className="text-center">
                    <p className={`text-xs font-semibold ${dragging ? "text-blue-300" : "text-slate-300"}`}>
                        {dragging ? "Drop image here" : "Drag & drop or click to upload"}
                    </p>
                    <p className="text-[11px] text-slate-500 mt-0.5">JPG, PNG, WEBP · Max 5 MB</p>
                </div>
            </div>

            <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif" className="hidden" onChange={handleChange} />
        </div>
    );
}

// ─── Change Password Modal ───────────────────────────────────────────────────

function ChangePasswordModal({
    open,
    onClose,
    onSubmit,
    saving,
    alert,
    onClearAlert,
}: {
    open: boolean;
    onClose: () => void;
    onSubmit: (currentPw: string, newPw: string) => Promise<void>;
    saving: boolean;
    alert: AlertState;
    onClearAlert: () => void;
}) {
    const [currentPw, setCurrentPw] = useState("");
    const [newPw, setNewPw] = useState("");
    const [confirmPw, setConfirmPw] = useState("");
    const [showCurrent, setShowCurrent] = useState(false);
    const [showNew, setShowNew] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [localError, setLocalError] = useState<string | null>(null);

    // Reset fields when modal closes
    const handleClose = () => {
        setCurrentPw(""); setNewPw(""); setConfirmPw("");
        setShowCurrent(false); setShowNew(false); setShowConfirm(false);
        setLocalError(null);
        onClearAlert();
        onClose();
    };

    const calculateStrength = (pw: string) => {
        if (!pw) return 0;
        let score = 0;
        if (pw.length >= 8) score++;
        if (/[A-Z]/.test(pw)) score++;
        if (/[a-z]/.test(pw)) score++;
        if (/[0-9]/.test(pw)) score++;
        if (/[^A-Za-z0-9]/.test(pw)) score++;
        if (score <= 2) return 1;
        if (score === 3) return 2;
        if (score === 4) return 3;
        return 4;
    };

    const pwStrength = calculateStrength(newPw);
    const pwStrengthLabel = ["", "Weak", "Fair", "Good", "Strong"];
    const pwStrengthColor = ["", "bg-red-500", "bg-orange-500", "bg-amber-500", "bg-emerald-500"];
    const pwStrengthTextColor = ["", "text-red-400", "text-orange-400", "text-amber-400", "text-emerald-400"];

    const checks = [
        { label: "At least 8 characters", pass: newPw.length >= 8 },
        { label: "Uppercase letter (A–Z)", pass: /[A-Z]/.test(newPw) },
        { label: "Lowercase letter (a–z)", pass: /[a-z]/.test(newPw) },
        { label: "Number (0–9)", pass: /[0-9]/.test(newPw) },
        { label: "Special character (!@#…)", pass: /[^A-Za-z0-9]/.test(newPw) },
    ];

    const handleSubmit = async () => {
        setLocalError(null);
        const result = passwordSchema.safeParse({ currentPw, newPw, confirmPw });
        if (!result.success) {
            setLocalError(result.error.issues[0].message);
            return;
        }
        await onSubmit(currentPw, newPw);
        if (!alert) {
            // success – close after parent sets alert
        }
    };

    if (!open) return null;

    const displayError = localError || (alert?.type === "error" ? alert.message : null);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/70 backdrop-blur-sm"
                onClick={handleClose}
            />

            {/* Panel */}
            <div className="relative w-full max-w-md bg-slate-900 border border-slate-700/60 rounded-2xl shadow-2xl shadow-black/50 overflow-hidden animate-in fade-in zoom-in-95 duration-200">

                {/* Header */}
                <div className="flex items-center justify-between px-6 py-5 border-b border-slate-800">
                    <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-blue-500/20 to-indigo-500/20 border border-blue-500/20 flex items-center justify-center">
                            <Lock className="h-4 w-4 text-blue-400" />
                        </div>
                        <div>
                            <h2 className="text-white font-bold text-base leading-tight">Change Password</h2>
                            <p className="text-slate-500 text-xs">Choose a strong, unique password</p>
                        </div>
                    </div>
                    <button
                        onClick={handleClose}
                        className="h-8 w-8 rounded-lg flex items-center justify-center text-slate-500 hover:text-white hover:bg-slate-800 transition-all"
                    >
                        <X className="h-4 w-4" />
                    </button>
                </div>

                {/* Body */}
                <div className="px-6 py-5 space-y-4">

                    {/* Error / success alert */}
                    {displayError && (
                        <div className="flex items-start gap-2.5 px-3.5 py-3 rounded-xl bg-red-500/10 border border-red-500/25 text-red-300 text-sm">
                            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                            <span>{displayError}</span>
                        </div>
                    )}
                    {alert?.type === "success" && (
                        <div className="flex items-start gap-2.5 px-3.5 py-3 rounded-xl bg-emerald-500/10 border border-emerald-500/25 text-emerald-300 text-sm">
                            <CheckCircle className="h-4 w-4 shrink-0 mt-0.5" />
                            <span>{alert.message}</span>
                        </div>
                    )}

                    {/* Current Password */}
                    <div className="space-y-1.5">
                        <label className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Current Password</label>
                        <div className="relative">
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                            <input
                                type={showCurrent ? "text" : "password"}
                                value={currentPw}
                                onChange={e => setCurrentPw(e.target.value)}
                                className="w-full pl-9 pr-10 h-11 bg-slate-800/70 border border-slate-700 rounded-xl text-white text-sm placeholder:text-slate-600 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30 transition-all"
                                placeholder="Enter your current password"
                            />
                            <button type="button" onClick={() => setShowCurrent(p => !p)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors">
                                {showCurrent ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </button>
                        </div>
                    </div>

                    {/* New Password */}
                    <div className="space-y-1.5">
                        <label className="text-slate-400 text-xs font-semibold uppercase tracking-wider">New Password</label>
                        <div className="relative">
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                            <input
                                type={showNew ? "text" : "password"}
                                value={newPw}
                                onChange={e => setNewPw(e.target.value)}
                                className="w-full pl-9 pr-10 h-11 bg-slate-800/70 border border-slate-700 rounded-xl text-white text-sm placeholder:text-slate-600 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30 transition-all"
                                placeholder="Create a strong password"
                            />
                            <button type="button" onClick={() => setShowNew(p => !p)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors">
                                {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </button>
                        </div>

                        {/* Strength bar */}
                        {newPw.length > 0 && (
                            <div className="space-y-1.5 pt-1">
                                <div className="flex gap-1">
                                    {[1, 2, 3, 4].map(i => (
                                        <div
                                            key={i}
                                            className={`h-1 flex-1 rounded-full transition-all duration-300 ${i <= pwStrength ? pwStrengthColor[pwStrength] : "bg-slate-700"
                                                }`}
                                        />
                                    ))}
                                </div>
                                <p className={`text-[11px] font-semibold ${pwStrengthTextColor[pwStrength]}`}>
                                    {pwStrengthLabel[pwStrength]}
                                </p>
                            </div>
                        )}

                        {/* Checklist */}
                        {newPw.length > 0 && (
                            <div className="grid grid-cols-1 gap-1 pt-1">
                                {checks.map(({ label, pass }) => (
                                    <div key={label} className={`flex items-center gap-1.5 text-[11px] font-medium transition-colors ${pass ? "text-emerald-400" : "text-slate-500"
                                        }`}>
                                        {pass
                                            ? <Check className="h-3 w-3 shrink-0" />
                                            : <X className="h-3 w-3 shrink-0" />}
                                        {label}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Confirm Password */}
                    <div className="space-y-1.5">
                        <label className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Confirm New Password</label>
                        <div className="relative">
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                            <input
                                type={showConfirm ? "text" : "password"}
                                value={confirmPw}
                                onChange={e => setConfirmPw(e.target.value)}
                                className={`w-full pl-9 pr-10 h-11 bg-slate-800/70 border rounded-xl text-white text-sm placeholder:text-slate-600 focus:outline-none focus:ring-1 transition-all ${confirmPw && newPw !== confirmPw
                                    ? "border-red-500/50 focus:border-red-500 focus:ring-red-500/20"
                                    : confirmPw && newPw === confirmPw
                                        ? "border-emerald-500/50 focus:border-emerald-500 focus:ring-emerald-500/20"
                                        : "border-slate-700 focus:border-blue-500 focus:ring-blue-500/30"
                                    }`}
                                placeholder="Repeat new password"
                            />
                            <button type="button" onClick={() => setShowConfirm(p => !p)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors">
                                {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </button>
                        </div>
                        {confirmPw && newPw !== confirmPw && (
                            <p className="text-[11px] text-red-400 font-medium flex items-center gap-1">
                                <X className="h-3 w-3" /> Passwords don&apos;t match
                            </p>
                        )}
                        {confirmPw && newPw === confirmPw && (
                            <p className="text-[11px] text-emerald-400 font-medium flex items-center gap-1">
                                <Check className="h-3 w-3" /> Passwords match
                            </p>
                        )}
                    </div>
                </div>

                {/* Footer */}
                <div className="px-6 py-4 border-t border-slate-800 flex gap-3 justify-end">
                    <button
                        onClick={handleClose}
                        className="px-5 h-10 rounded-xl border border-slate-700 text-slate-300 text-sm font-semibold hover:bg-slate-800 hover:text-white transition-all"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={saving || !currentPw || !newPw || !confirmPw || newPw !== confirmPw || pwStrength < 2}
                        className="px-6 h-10 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-sm font-semibold shadow-lg shadow-blue-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                        {saving ? (
                            <><Loader2 className="h-4 w-4 animate-spin" />Changing...</>
                        ) : (
                            <><Lock className="h-4 w-4" />Change Password</>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function AdminProfilePage() {
    const router = useRouter();
    const [profile, setProfile] = useState<MemberProfile | null>(null);
    const [loading, setLoading] = useState(true);

    // Profile fields
    const [name, setName] = useState("");
    const [phone, setPhone] = useState("");
    const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
    const [avatarUploading, setAvatarUploading] = useState(false);

    // (password fields live inside ChangePasswordModal)

    // Modal state
    const [pwModalOpen, setPwModalOpen] = useState(false);

    // UI state
    const [profileSaving, setProfileSaving] = useState(false);
    const [pwSaving, setPwSaving] = useState(false);
    const [profileAlert, setProfileAlert] = useState<AlertState>(null);
    const [pwAlert, setPwAlert] = useState<AlertState>(null);

    // ── Cleanup state ────────────────────────────────────────────────────
    const [cleanupLoading, setCleanupLoading] = useState(false);
    const [cleanupResult, setCleanupResult] = useState<{
        deletedCount: number;
        remainingPastIntraday: number;
        message: string;
    } | null>(null);
    const [cleanupError, setCleanupError] = useState<string | null>(null);

    const handleManualCleanup = async () => {
        setCleanupLoading(true);
        setCleanupResult(null);
        setCleanupError(null);
        try {
            const res = await axiosInstance.post("/api/stocks/cleanup");
            setCleanupResult(res.data);
        } catch (err: any) {
            setCleanupError(err?.response?.data?.message || "Cleanup failed. Please try again.");
        } finally {
            setCleanupLoading(false);
        }
    };

    // ── Load ────────────────────────────────────────────────────────────
    const loadProfile = useCallback(async () => {
        setLoading(true);
        try {
            const data = await companyApi.getMe();
            if (data.success && data.user) {
                const u = data.user;
                setProfile(u);
                setName(u.name || "");
                setPhone(u.phone || "");
                setAvatarUrl(u.avatar || null);
            }
        } catch { /* silently ignore */ }
        finally { setLoading(false); }
    }, []);

    useEffect(() => { loadProfile(); }, [loadProfile]);

    // ── Avatar upload ────────────────────────────────────────────────────
    const handleAvatarSelect = async (file: File) => {
        const localPreview = URL.createObjectURL(file);
        setAvatarUrl(localPreview);
        setAvatarUploading(true);
        setProfileAlert(null);

        try {
            const formData = new FormData();
            formData.append("image", file);
            const res = await axiosInstance.post("/api/upload?folder=praedico_admin_avatars", formData, {
                headers: { "Content-Type": "multipart/form-data" },
            });
            const cloudUrl: string = res.data?.url;
            if (!cloudUrl) throw new Error("Upload returned no URL");

            // Persist to CompanyMemberModel — NEVER UserModel
            await companyApi.updateMyProfile({ avatar: cloudUrl });
            setAvatarUrl(cloudUrl);
            URL.revokeObjectURL(localPreview);
            if (profile) setProfile({ ...profile, avatar: cloudUrl });
            setProfileAlert({ type: "success", message: "Profile photo updated successfully!" });
        } catch (err: any) {
            setAvatarUrl(profile?.avatar || null);
            URL.revokeObjectURL(localPreview);
            setProfileAlert({ type: "error", message: err?.response?.data?.message || "Photo upload failed. Please try again." });
        } finally {
            setAvatarUploading(false);
        }
    };

    // ── Save profile info ────────────────────────────────────────────────
    const handleSaveProfile = async () => {
        if (!name.trim()) {
            setProfileAlert({ type: "error", message: "Name cannot be empty." });
            return;
        }

        if (phone.trim()) {
            const cleanPhone = phone.replace(/\D/g, "");
            const isValid = (cleanPhone.length === 10 && /^[6-9]/.test(cleanPhone)) ||
                (cleanPhone.length === 12 && cleanPhone.startsWith("91") && /^[6-9]/.test(cleanPhone.substring(2)));
            if (!isValid) {
                setProfileAlert({ type: "error", message: "Please enter a valid Indian mobile number." });
                return;
            }
        }

        setProfileSaving(true);
        setProfileAlert(null);
        try {
            await companyApi.updateMyProfile({ name: name.trim(), phone: phone.trim() });
            if (profile) setProfile({ ...profile, name: name.trim(), phone: phone.trim() });
            setProfileAlert({ type: "success", message: "Profile information saved!" });
        } catch (err: any) {
            setProfileAlert({ type: "error", message: err?.response?.data?.message || "Failed to save profile." });
        } finally { setProfileSaving(false); }
    };

    // ── Change password (modal handler) ─────────────────────────────────
    const handleChangePassword = async (currentPassword: string, newPassword: string) => {
        setPwAlert(null);
        setPwSaving(true);
        try {
            await companyApi.changePassword({ currentPassword, newPassword });
            setPwAlert({ type: "success", message: "Password changed successfully!" });
            // Close modal after short delay so user can see success
            setTimeout(() => { setPwModalOpen(false); setPwAlert(null); }, 1800);
        } catch (err: any) {
            setPwAlert({ type: "error", message: err?.response?.data?.message || "Password change failed. Check your current password." });
        } finally { setPwSaving(false); }
    };

    const initials = (profile?.name || "A").split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2);


    // ── Skeleton loader ──────────────────────────────────────────────────
    if (loading) {
        return (
            <div className="min-h-screen bg-[#020817] flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="h-14 w-14 rounded-full border-4 border-blue-500/30 border-t-blue-500 animate-spin" />
                    <p className="text-slate-400 text-sm font-medium">Loading profile...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#020817] relative overflow-hidden">
            {/* ── Ambient background ───────────────────────────────────── */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
                <div className="absolute top-[-15%] left-[-10%] w-[50%] h-[50%] bg-blue-600/8 blur-[120px] rounded-full" />
                <div className="absolute bottom-[-15%] right-[-10%] w-[45%] h-[45%] bg-purple-600/8 blur-[120px] rounded-full" />
                <div className="absolute top-[40%] left-[40%] w-[30%] h-[30%] bg-indigo-600/5 blur-[100px] rounded-full" />
            </div>

            <div className="relative max-w-5xl mx-auto px-4 sm:px-6 py-8">

                {/* ── Back button ──────────────────────────────────────── */}
                <button
                    onClick={() => router.back()}
                    className="flex items-center gap-2 text-slate-400 hover:text-white text-sm font-medium mb-8 transition-colors group"
                >
                    <ArrowLeft className="h-4 w-4 group-hover:-translate-x-0.5 transition-transform" />
                    Back
                </button>

                {/* ── Hero Banner ──────────────────────────────────────── */}
                <div className="relative rounded-3xl overflow-hidden mb-8 h-48">
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-700 via-indigo-700 to-purple-800" />
                    <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(255,255,255,0.15),transparent_60%)]" />
                    <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,rgba(0,0,0,0.3),transparent_70%)]" />

                    {/* Decorative circles */}
                    <div className="absolute -top-12 -right-12 w-48 h-48 bg-white/5 rounded-full" />
                    <div className="absolute -bottom-8 left-24 w-32 h-32 bg-white/5 rounded-full" />
                    <div className="absolute top-8 left-8 w-16 h-16 bg-white/5 rounded-full" />

                    {/* Content overlaid on banner */}
                    <div className="absolute bottom-6 left-8 flex items-end gap-4">
                        <div className="text-white">
                            <div className="flex items-center gap-2.5 mb-1">
                                <h1 className="text-2xl font-black tracking-tight">{profile?.name || "Admin"}</h1>
                                {profile?.isVerified && (
                                    <BadgeCheck className="h-5 w-5 text-blue-300" />
                                )}
                            </div>
                            <p className="text-white/60 text-sm">{profile?.email}</p>
                        </div>
                    </div>

                    {/* Role badge */}
                    <div className="absolute top-6 right-8">
                        <div className={`px-3 py-1.5 rounded-full border text-xs font-bold tracking-wide ${roleBadgeClass(profile?.role || "")}`}>
                            {roleLabel(profile?.role || "")}
                        </div>
                    </div>
                </div>

                {/* ── Stats Row ────────────────────────────────────────── */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                    {[
                        { label: "Status", value: profile?.isActive ? "Active" : "Inactive", icon: Fingerprint, color: profile?.isActive ? "text-emerald-400" : "text-red-400", bg: profile?.isActive ? "bg-emerald-500/10" : "bg-red-500/10" },
                        { label: "Role", value: roleLabel(profile?.role || ""), icon: Shield, color: "text-blue-400", bg: "bg-blue-500/10" },
                        { label: "Member Since", value: fmtDate(profile?.createdAt), icon: Calendar, color: "text-purple-400", bg: "bg-purple-500/10" },
                        { label: "Last Login", value: fmt(profile?.lastLogin), icon: Clock, color: "text-amber-400", bg: "bg-amber-500/10" },
                    ].map(({ label, value, icon: Icon, color, bg }) => (
                        <div key={label} className="bg-slate-900/60 border border-slate-800/60 rounded-2xl p-4 backdrop-blur-sm">
                            <div className="flex items-center gap-2 mb-2">
                                <div className={`h-7 w-7 rounded-lg ${bg} flex items-center justify-center`}>
                                    <Icon className={`h-3.5 w-3.5 ${color}`} />
                                </div>
                                <p className="text-[11px] text-slate-500 font-semibold uppercase tracking-wider">{label}</p>
                            </div>
                            <p className={`text-sm font-bold ${color}`}>{value}</p>
                        </div>
                    ))}
                </div>

                {/* ── Tabs ─────────────────────────────────────────────── */}
                <Tabs defaultValue="profile" className="space-y-6">
                    <TabsList className="bg-slate-900/70 border border-slate-800/60 p-1 rounded-xl h-auto backdrop-blur-sm">
                        <TabsTrigger
                            value="profile"
                            className="rounded-lg px-5 py-2.5 text-sm font-semibold data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-indigo-600 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all"
                        >
                            <User className="h-4 w-4 mr-2" />
                            Profile
                        </TabsTrigger>
                        <TabsTrigger
                            value="security"
                            className="rounded-lg px-5 py-2.5 text-sm font-semibold data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-indigo-600 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all"
                        >
                            <Lock className="h-4 w-4 mr-2" />
                            Security
                        </TabsTrigger>
                    </TabsList>

                    {/* ── Profile Tab ──────────────────────────────────── */}
                    <TabsContent value="profile" className="space-y-6">
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                            {/* Photo Card */}
                            <Card className="bg-slate-900/60 border-slate-800/60 backdrop-blur-sm rounded-2xl shadow-xl">
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-white text-base font-bold">Profile Photo</CardTitle>
                                    <CardDescription className="text-slate-400 text-xs">
                                        Drag & drop or click the avatar to upload. Stored independently from your user account.
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <AvatarUploadZone
                                        avatarUrl={avatarUrl}
                                        initials={initials}
                                        uploading={avatarUploading}
                                        onFileSelect={handleAvatarSelect}
                                    />
                                    {avatarUploading && (
                                        <div className="mt-4 flex items-center justify-center gap-2 text-blue-400 text-xs font-medium">
                                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                            Uploading to Cloudinary...
                                        </div>
                                    )}
                                </CardContent>
                            </Card>

                            {/* Info Card */}
                            <Card className="lg:col-span-2 bg-slate-900/60 border-slate-800/60 backdrop-blur-sm rounded-2xl shadow-xl">
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-white text-base font-bold">Personal Information</CardTitle>
                                    <CardDescription className="text-slate-400 text-xs">
                                        Update your display name and contact number.
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-5">

                                    {profileAlert && (
                                        <AlertBanner alert={profileAlert} onClose={() => setProfileAlert(null)} />
                                    )}

                                    {/* Name */}
                                    <div className="space-y-1.5">
                                        <Label className="text-slate-300 text-xs font-semibold uppercase tracking-wider">
                                            Full Name
                                        </Label>
                                        <div className="relative">
                                            <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                                            <Input
                                                value={name}
                                                onChange={e => setName(e.target.value)}
                                                className="pl-9 bg-slate-800/60 border-slate-700 text-white placeholder:text-slate-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30 rounded-xl h-11"
                                                placeholder="Your full name"
                                            />
                                        </div>
                                    </div>

                                    {/* Email — read only */}
                                    <div className="space-y-1.5">
                                        <Label className="text-slate-300 text-xs font-semibold uppercase tracking-wider">
                                            Email Address
                                        </Label>
                                        <div className="relative">
                                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                                            <Input
                                                value={profile?.email || ""}
                                                readOnly
                                                className="pl-9 bg-slate-800/30 border-slate-700/50 text-slate-400 rounded-xl h-11 cursor-not-allowed"
                                            />
                                        </div>
                                        <p className="text-[11px] text-slate-600">Email cannot be changed here. Contact your administrator.</p>
                                    </div>

                                    {/* Phone */}
                                    <div className="space-y-1.5">
                                        <Label className="text-slate-300 text-xs font-semibold uppercase tracking-wider">
                                            Phone Number
                                        </Label>
                                        <div className="relative">
                                            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                                            <Input
                                                value={phone}
                                                onChange={e => setPhone(e.target.value)}
                                                className={`pl-9 bg-slate-800/60 border-slate-700 text-white placeholder:text-slate-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30 rounded-xl h-11 transition-all ${phone && !((phone.replace(/\D/g, "").length === 10 && /^[6-9]/.test(phone.replace(/\D/g, ""))) || (phone.replace(/\D/g, "").length === 12 && phone.replace(/\D/g, "").startsWith("91") && /^[6-9]/.test(phone.replace(/\D/g, "").substring(2))))
                                                    ? "border-red-500/50 focus:ring-red-500/30"
                                                    : ""
                                                    }`}
                                                placeholder="+91 98765 43210"
                                                type="tel"
                                            />
                                        </div>
                                        {phone && !((phone.replace(/\D/g, "").length === 10 && /^[6-9]/.test(phone.replace(/\D/g, ""))) || (phone.replace(/\D/g, "").length === 12 && phone.replace(/\D/g, "").startsWith("91") && /^[6-9]/.test(phone.replace(/\D/g, "").substring(2)))) && (
                                            <p className="text-[11px] text-red-400 font-medium flex items-center gap-1 mt-1">
                                                <AlertCircle className="h-3 w-3" /> Please enter a valid Indian mobile number
                                            </p>
                                        )}
                                    </div>

                                    {/* Role — read only */}
                                    <div className="space-y-1.5">
                                        <Label className="text-slate-300 text-xs font-semibold uppercase tracking-wider">
                                            Role
                                        </Label>
                                        <div className="flex items-center gap-3 px-3 h-11 bg-slate-800/30 border border-slate-700/50 rounded-xl">
                                            <Shield className="h-4 w-4 text-slate-500" />
                                            <span className="text-slate-400 text-sm">{roleLabel(profile?.role || "")}</span>
                                            {profile?.customRole && (
                                                <Badge variant="outline" className="ml-auto text-[11px] border-slate-600 text-slate-400">
                                                    {profile.customRole.name}
                                                </Badge>
                                            )}
                                        </div>
                                        <p className="text-[11px] text-slate-600">Roles are managed by your super admin.</p>
                                    </div>

                                    <Separator className="bg-slate-800/60" />

                                    <div className="flex items-center justify-end pt-1">
                                        <Button
                                            onClick={handleSaveProfile}
                                            disabled={profileSaving || avatarUploading}
                                            className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold px-8 h-10 rounded-xl shadow-lg shadow-blue-500/20 transition-all hover:shadow-blue-500/30 disabled:opacity-50"
                                        >
                                            {profileSaving ? (
                                                <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Saving...</>
                                            ) : (
                                                <><Check className="h-4 w-4 mr-2" />Save Changes</>
                                            )}
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </TabsContent>

                    {/* ── Security Tab ─────────────────────────────────── */}
                    <TabsContent value="security">
                        <div className="max-w-xl">
                            <Card className="bg-slate-900/60 border-slate-800/60 backdrop-blur-sm rounded-2xl shadow-xl">
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-white text-base font-bold">Account Security</CardTitle>
                                    <CardDescription className="text-slate-400 text-xs">
                                        Manage your password and account security settings.
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-5">
                                    <div className="flex items-center gap-4 p-4 rounded-xl bg-slate-800/40 border border-slate-700/40">
                                        <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-blue-500/20 to-indigo-500/20 border border-blue-500/20 flex items-center justify-center shrink-0">
                                            <Lock className="h-5 w-5 text-blue-400" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-white text-sm font-semibold">Password</p>
                                            <p className="text-slate-500 text-xs mt-0.5">Last changed: not tracked</p>
                                        </div>
                                        <Button
                                            type="button"
                                            onClick={() => setPwModalOpen(true)}
                                            className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold px-5 h-9 rounded-xl shadow-lg shadow-blue-500/20 transition-all text-sm shrink-0"
                                        >
                                            Update
                                        </Button>
                                    </div>
                                    <p className="text-slate-600 text-xs">
                                        Use a strong password with at least 8 characters, including uppercase, lowercase, numbers, and special characters.
                                    </p>
                                </CardContent>
                            </Card>

                            {/* ── Database Maintenance Card ── */}
                            {(profile?.role === "super_admin" || profile?.role === "admin") && (
                                <Card className="bg-slate-900/60 border-slate-800/60 backdrop-blur-sm rounded-2xl shadow-xl mt-6">
                                    <CardHeader className="pb-2">
                                        <div className="flex items-center gap-3">
                                            <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-orange-500/20 to-red-500/20 border border-orange-500/20 flex items-center justify-center shrink-0">
                                                <Database className="h-4 w-4 text-orange-400" />
                                            </div>
                                            <div>
                                                <CardTitle className="text-white text-base font-bold">Database Maintenance</CardTitle>
                                                <CardDescription className="text-slate-400 text-xs">
                                                    Compact past-day intraday records into DailySnapshots and free up database space.
                                                </CardDescription>
                                            </div>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="space-y-4">

                                        {/* Info row */}
                                        <div className="flex items-start gap-3 p-3.5 rounded-xl bg-slate-800/40 border border-slate-700/40">
                                            <Trash2 className="h-4 w-4 text-slate-500 mt-0.5 shrink-0" />
                                            <p className="text-slate-400 text-xs leading-relaxed">
                                                Runs the same cleanup that automatically fires every trading day morning.
                                                Safe to run at any time — today&apos;s intraday data is never touched.
                                                Past-day records are compacted into sealed DailySnapshots first.
                                            </p>
                                        </div>

                                        {/* Result banner */}
                                        {cleanupResult && (
                                            <div className="flex items-start gap-3 px-4 py-3 rounded-xl bg-emerald-500/10 border border-emerald-500/25 text-emerald-300 text-sm animate-in fade-in duration-300">
                                                <CheckCircle className="h-4 w-4 shrink-0 mt-0.5" />
                                                <div>
                                                    <p className="font-semibold">{cleanupResult.message}</p>
                                                    <p className="text-emerald-400/70 text-xs mt-0.5">
                                                        {cleanupResult.deletedCount} records deleted &mdash; {cleanupResult.remainingPastIntraday} past-day records remaining
                                                    </p>
                                                </div>
                                            </div>
                                        )}

                                        {/* Error banner */}
                                        {cleanupError && (
                                            <div className="flex items-start gap-3 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/25 text-red-300 text-sm animate-in fade-in duration-300">
                                                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                                                <span>{cleanupError}</span>
                                            </div>
                                        )}

                                        {/* Action button */}
                                        <button
                                            onClick={handleManualCleanup}
                                            disabled={cleanupLoading}
                                            className="flex items-center gap-2 px-5 h-10 rounded-xl bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-500 hover:to-red-500 text-white text-sm font-semibold shadow-lg shadow-orange-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            {cleanupLoading ? (
                                                <><Loader2 className="h-4 w-4 animate-spin" />Running Cleanup...</>
                                            ) : (
                                                <><RefreshCw className="h-4 w-4" />Run Manual Cleanup</>
                                            )}
                                        </button>

                                    </CardContent>
                                </Card>
                            )}
                        </div>
                    </TabsContent>
                </Tabs>
            </div>

            {/* ── Change Password Modal ─────────────────────────────── */}
            <ChangePasswordModal
                open={pwModalOpen}
                onClose={() => setPwModalOpen(false)}
                onSubmit={handleChangePassword}
                saving={pwSaving}
                alert={pwAlert}
                onClearAlert={() => setPwAlert(null)}
            />
        </div>
    );
}
