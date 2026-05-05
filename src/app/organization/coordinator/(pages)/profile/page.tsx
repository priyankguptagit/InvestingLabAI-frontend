"use client";

import { useEffect, useRef, useState } from "react";
import { coordinatorApi } from "@/lib/api";
import {
    Users, Phone, Mail, Save, CheckCircle, AlertCircle,
    Loader2, Upload, FolderOpen, ShieldCheck, Calendar,
    Hash, BadgeCheck, Clock, Pencil, Building2, GraduationCap,
    Briefcase, FileText, Camera
} from "lucide-react";

/* ─── Types ──────────────────────────────────────────────── */

interface CoordEditable {
    name: string;
    mobile: string;
    profilePhoto: string;
    bio: string;
}

interface CoordReadOnly {
    id: string;
    email: string;
    designation: string;
    role: string;
    organization: { _id: string; organizationName: string } | null;
    department: { _id: string; departmentName: string; departmentCode: string } | null;
    isVerified: boolean;
    isActive: boolean;
    lastLogin: string | null;
    createdAt: string;
}

const DESIGNATION_LABELS: Record<string, string> = {
    hod: "Head of Department",
    faculty: "Faculty",
    coordinator: "Coordinator",
    other: "Other",
};

/* ─── Sub-components ─────────────────────────────────────── */

function SectionCard({ icon: Icon, title, subtitle, children, accentColor = "purple" }: {
    icon: any; title: string; subtitle?: string; children: React.ReactNode; accentColor?: string;
}) {
    const colorMap: Record<string, string> = {
        purple: "text-purple-400", pink: "text-pink-400", blue: "text-blue-400",
        emerald: "text-emerald-400", amber: "text-amber-400", slate: "text-slate-400",
    };
    const bgMap: Record<string, string> = {
        purple: "bg-purple-500/10 border-purple-500/20", pink: "bg-pink-500/10 border-pink-500/20",
        blue: "bg-blue-500/10 border-blue-500/20", emerald: "bg-emerald-500/10 border-emerald-500/20",
        amber: "bg-amber-500/10 border-amber-500/20", slate: "bg-slate-500/10 border-slate-500/20",
    };
    return (
        <div className="rounded-2xl bg-[#111827] border border-white/5 overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300">
            <div className="px-6 pt-5 pb-4 border-b border-white/5">
                <div className="flex items-center gap-3">
                    <div className={`h-8 w-8 rounded-xl ${bgMap[accentColor]} border flex items-center justify-center`}>
                        <Icon className={`h-4 w-4 ${colorMap[accentColor]}`} />
                    </div>
                    <div>
                        <h2 className="text-sm font-semibold text-white">{title}</h2>
                        {subtitle && <p className="text-[11px] text-slate-500 mt-0.5">{subtitle}</p>}
                    </div>
                </div>
            </div>
            <div className="p-6">{children}</div>
        </div>
    );
}

function StatusBadge({ active, label }: { active: boolean; label: string }) {
    return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border ${active
            ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
            : "bg-slate-500/10 border-slate-500/20 text-slate-400"
            }`}>
            <span className={`h-1.5 w-1.5 rounded-full ${active ? "bg-emerald-400 animate-pulse" : "bg-slate-500"}`} />
            {label}
        </span>
    );
}

function ReadOnlyField({ label, value, icon: Icon }: { label: string; value: string; icon?: any }) {
    return (
        <div>
            <label className="block text-[11px] font-medium text-slate-500 mb-1.5 flex items-center gap-1.5">
                {Icon && <Icon className="h-3 w-3" />}
                {label}
            </label>
            <div className="px-4 py-3 bg-[#0a0f1a] border border-slate-800/50 rounded-xl text-sm text-slate-300">
                {value || "—"}
            </div>
        </div>
    );
}

function InfoTile({ icon: Icon, label, value, color }: { icon: any; label: string; value: string; color: string }) {
    const colorMap: Record<string, string> = {
        purple: "text-purple-400 bg-purple-500/10 border-purple-500/15",
        pink: "text-pink-400 bg-pink-500/10 border-pink-500/15",
        blue: "text-blue-400 bg-blue-500/10 border-blue-500/15",
        emerald: "text-emerald-400 bg-emerald-500/10 border-emerald-500/15",
        amber: "text-amber-400 bg-amber-500/10 border-amber-500/15",
    };
    const textColor: Record<string, string> = {
        purple: "text-purple-400", pink: "text-pink-400", blue: "text-blue-400",
        emerald: "text-emerald-400", amber: "text-amber-400",
    };
    return (
        <div className={`rounded-xl border ${colorMap[color]} p-4 flex items-center gap-3`}>
            <div className={`h-10 w-10 rounded-xl ${colorMap[color]} flex items-center justify-center flex-shrink-0`}>
                <Icon className={`h-5 w-5 ${textColor[color]}`} />
            </div>
            <div className="min-w-0">
                <p className="text-[11px] text-slate-500 font-medium truncate">{label}</p>
                <p className="text-sm font-bold text-white truncate">{value}</p>
            </div>
        </div>
    );
}

/* ─── Main Component ─────────────────────────────────────── */

export default function CoordinatorProfilePage() {
    const [form, setForm] = useState<CoordEditable>({
        name: "", mobile: "", profilePhoto: "", bio: "",
    });
    const [readOnly, setReadOnly] = useState<CoordReadOnly>({
        id: "", email: "", designation: "", role: "",
        organization: null, department: null,
        isVerified: false, isActive: false, lastLogin: null, createdAt: "",
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
    const [statusMsg, setStatusMsg] = useState("");
    const [photoPreview, setPhotoPreview] = useState<string | null>(null);
    const [photoImgError, setPhotoImgError] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const data = await coordinatorApi.getMe();
                if (data.success && data.coordinator) {
                    const c = data.coordinator;
                    setForm({
                        name: c.name || "",
                        mobile: c.mobile || "",
                        profilePhoto: c.profilePhoto || "",
                        bio: c.bio || "",
                    });
                    setReadOnly({
                        id: c.id || "",
                        email: c.email || "",
                        designation: c.designation || "",
                        role: c.role || "",
                        organization: c.organization || null,
                        department: c.department || null,
                        isVerified: c.isVerified ?? false,
                        isActive: c.isActive ?? false,
                        lastLogin: c.lastLogin || null,
                        createdAt: c.createdAt || "",
                    });
                    if (c.profilePhoto) setPhotoPreview(c.profilePhoto);
                }
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        };
        fetchProfile();
    }, []);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setForm(prev => ({ ...prev, [name]: value }));
        if (name === "profilePhoto") {
            setPhotoPreview(value || null);
            setPhotoImgError(false);
        }
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (file.size > 2 * 1024 * 1024) {
            setStatus("error");
            setStatusMsg("Image is too large. Please use a file under 2MB.");
            setTimeout(() => setStatus("idle"), 4000);
            return;
        }
        const reader = new FileReader();
        reader.onload = (ev) => {
            const dataUrl = ev.target?.result as string;
            setForm(prev => ({ ...prev, profilePhoto: dataUrl }));
            setPhotoPreview(dataUrl);
            setPhotoImgError(false);
        };
        reader.readAsDataURL(file);
    };

    const handleSave = async () => {
        setSaving(true);
        setStatus("idle");
        try {
            await coordinatorApi.updateProfile({
                name: form.name,
                mobile: form.mobile,
                profilePhoto: form.profilePhoto,
                bio: form.bio,
            });
            setStatus("success");
            setStatusMsg("Profile updated successfully!");
        } catch (err: any) {
            setStatus("error");
            setStatusMsg(err?.response?.data?.message || "Failed to save. Please try again.");
        } finally {
            setSaving(false);
            setTimeout(() => setStatus("idle"), 5000);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-[#030712]">
                <div className="text-center">
                    <Loader2 className="h-10 w-10 animate-spin text-purple-500 mx-auto mb-3" />
                    <p className="text-slate-400 text-sm">Loading your profile...</p>
                </div>
            </div>
        );
    }

    const inputClass = "w-full px-4 py-3 bg-[#0f172a] border border-slate-700/50 rounded-xl text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/30 transition-all";
    const labelClass = "block text-xs font-medium text-slate-400 mb-1.5";

    const initials = form.name
        ? form.name.split(" ").map(n => n.charAt(0)).slice(0, 2).join("").toUpperCase()
        : "?";

    return (
        <div className="min-h-screen w-full bg-[#030712] text-slate-200 font-sans selection:bg-purple-500/30 relative overflow-hidden">
            {/* Background Ambient */}
            <div className="fixed inset-0 pointer-events-none">
                <div className="absolute top-[-15%] right-[-5%] w-[500px] h-[500px] bg-purple-500/8 rounded-full blur-[120px] animate-pulse" style={{ animationDuration: "8s" }} />
                <div className="absolute bottom-[-10%] left-[-5%] w-[400px] h-[400px] bg-pink-500/6 rounded-full blur-[100px] animate-pulse" style={{ animationDuration: "10s" }} />
            </div>

            <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 py-8 pb-20">

                {/* ═══ PROFILE HERO ═══ */}
                <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-purple-900/40 via-pink-900/30 to-slate-900/40 border border-white/10 shadow-2xl mb-8">
                    <div className="absolute inset-0 bg-grid-white/[0.02] bg-[length:24px_24px]" />
                    <div className="absolute -top-20 -right-20 w-56 h-56 bg-purple-500/20 rounded-full blur-3xl" />
                    <div className="absolute -bottom-16 -left-16 w-48 h-48 bg-pink-500/15 rounded-full blur-3xl" />

                    <div className="relative z-10 p-6 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center gap-6">
                        {/* Profile Photo */}
                        <div className="relative group">
                            <div className="absolute -inset-1 bg-gradient-to-br from-purple-500/30 to-pink-500/30 rounded-full blur-md opacity-50 group-hover:opacity-80 transition-opacity" />
                            <div className="relative h-24 w-24 sm:h-28 sm:w-28 rounded-full bg-[#111827] border-2 border-white/10 flex items-center justify-center overflow-hidden shadow-xl">
                                {photoPreview ? (
                                    photoImgError ? (
                                        <div className="text-center px-2">
                                            <AlertCircle className="h-6 w-6 text-amber-500 mx-auto mb-1" />
                                            <span className="text-[9px] text-amber-500">Can&apos;t preview</span>
                                        </div>
                                    ) : (
                                        <img
                                            src={photoPreview}
                                            alt="Profile photo"
                                            className="h-full w-full object-cover"
                                            onError={() => setPhotoImgError(true)}
                                        />
                                    )
                                ) : (
                                    <span className="font-bold text-3xl text-white bg-gradient-to-br from-purple-500 to-pink-600 w-full h-full flex items-center justify-center">
                                        {initials}
                                    </span>
                                )}
                            </div>
                            {/* Camera button */}
                            <button
                                onClick={() => fileInputRef.current?.click()}
                                className="absolute -bottom-1 -right-1 h-8 w-8 rounded-full bg-purple-600 border-2 border-[#111827] flex items-center justify-center text-white hover:bg-purple-500 transition-colors shadow-lg"
                                title="Change profile photo"
                            >
                                <Camera className="h-3.5 w-3.5" />
                            </button>
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/png,image/jpeg,image/jpg,image/webp"
                                className="hidden"
                                onChange={handleFileUpload}
                            />
                        </div>

                        {/* Title & Badges */}
                        <div className="flex-1 min-w-0">
                            <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight mb-2 truncate">
                                {form.name || "Coordinator Profile"}
                            </h1>
                            <div className="flex flex-wrap items-center gap-2 mb-2">
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-purple-500/15 text-purple-300 text-[11px] font-bold uppercase tracking-wider border border-purple-500/20 backdrop-blur-md">
                                    <Briefcase className="h-3 w-3" />
                                    {DESIGNATION_LABELS[readOnly.designation] || readOnly.designation}
                                </span>
                                <StatusBadge active={readOnly.isVerified} label={readOnly.isVerified ? "Verified" : "Unverified"} />
                                <StatusBadge active={readOnly.isActive} label={readOnly.isActive ? "Active" : "Inactive"} />
                            </div>
                            <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-500">
                                {readOnly.email && (
                                    <span className="flex items-center gap-1.5">
                                        <Mail className="h-3 w-3" /> {readOnly.email}
                                    </span>
                                )}
                                {readOnly.createdAt && (
                                    <span className="flex items-center gap-1.5">
                                        <Calendar className="h-3 w-3" />
                                        Joined {new Date(readOnly.createdAt).toLocaleDateString("en-US", { month: "long", year: "numeric" })}
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* ═══ STATUS BANNER ═══ */}
                {status !== "idle" && (
                    <div className={`mb-6 flex items-center gap-3 px-4 py-3.5 rounded-xl text-sm font-medium animate-fade-in
                        ${status === "success"
                            ? "bg-emerald-500/10 border border-emerald-500/20 text-emerald-400"
                            : "bg-red-500/10 border border-red-500/20 text-red-400"
                        }`}>
                        {status === "success"
                            ? <CheckCircle className="h-4 w-4 shrink-0" />
                            : <AlertCircle className="h-4 w-4 shrink-0" />}
                        {statusMsg}
                    </div>
                )}

                <div className="space-y-6">

                    {/* ═══ 1. PROFILE PHOTO URL ═══ */}
                    <div className="rounded-xl bg-[#111827] border border-white/5 p-4">
                        <label className="block text-xs font-medium text-slate-400 mb-2 flex items-center gap-1.5">
                            <Camera className="h-3 w-3 text-slate-500" />
                            Profile Photo URL
                        </label>
                        <div className="flex gap-2">
                            <input
                                type="url"
                                name="profilePhoto"
                                value={form.profilePhoto.startsWith("data:") ? "" : form.profilePhoto}
                                onChange={handleChange}
                                placeholder="https://your-cdn.com/photo.jpg"
                                className={inputClass + " flex-1"}
                            />
                            <button
                                type="button"
                                onClick={() => fileInputRef.current?.click()}
                                title="Upload from your computer"
                                className="flex-shrink-0 flex items-center gap-2 px-4 py-3 bg-[#1e293b] border border-slate-700/50 rounded-xl text-sm text-slate-300 hover:text-white hover:bg-slate-700/70 hover:border-purple-500/40 transition-all"
                            >
                                <FolderOpen className="h-4 w-4" />
                                <span className="hidden sm:inline">Browse</span>
                            </button>
                        </div>
                        {form.profilePhoto.startsWith("data:") && (
                            <p className="text-[11px] text-emerald-500/80 mt-2 flex items-center gap-1.5">
                                <CheckCircle className="h-3 w-3 shrink-0" />
                                Photo uploaded — ready to save.
                            </p>
                        )}
                        {photoImgError && photoPreview && !form.profilePhoto.startsWith("data:") && (
                            <p className="text-[11px] text-amber-500/80 mt-2 flex items-center gap-1.5">
                                <AlertCircle className="h-3 w-3 shrink-0" />
                                Preview unavailable. URL is still saved.
                            </p>
                        )}
                    </div>

                    {/* ═══ 2. PERSONAL INFORMATION (Editable) ═══ */}
                    <SectionCard icon={Users} title="Personal Information" subtitle="Your basic details" accentColor="purple">
                        <div className="space-y-5">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                <div>
                                    <label className={labelClass}>Full Name</label>
                                    <input type="text" name="name" value={form.name} onChange={handleChange} className={inputClass} placeholder="Dr. Jane Smith" />
                                </div>
                                <div>
                                    <label className={labelClass}>
                                        <Phone className="h-3 w-3 inline mr-1 text-slate-500" />
                                        Mobile Number
                                    </label>
                                    <input type="text" name="mobile" value={form.mobile} onChange={handleChange} className={inputClass} placeholder="+91 98765 43210" />
                                </div>
                            </div>
                            <div>
                                <label className={labelClass}>
                                    <Mail className="h-3 w-3 inline mr-1 text-slate-500" />
                                    Email Address
                                </label>
                                <div className="px-4 py-3 bg-[#0a0f1a] border border-slate-800/50 rounded-xl text-sm text-slate-400 flex items-center gap-2">
                                    <span>{readOnly.email}</span>
                                    <span className="ml-auto text-[10px] text-slate-600 border border-slate-700 rounded-md px-2 py-0.5">Read-only</span>
                                </div>
                                <p className="text-[10px] text-slate-600 mt-1">Email cannot be changed. Contact your organization admin.</p>
                            </div>
                        </div>
                    </SectionCard>

                    {/* ═══ 3. BIO / ABOUT (Editable) ═══ */}
                    <SectionCard icon={FileText} title="About / Bio" subtitle="A short introduction about yourself (max 500 characters)" accentColor="pink">
                        <div>
                            <textarea
                                name="bio"
                                value={form.bio}
                                onChange={handleChange}
                                rows={4}
                                maxLength={500}
                                placeholder="Write a short bio about yourself... your expertise, interests, or a welcome message for your students."
                                className={inputClass + " resize-none"}
                            />
                            <div className="flex justify-between mt-1.5">
                                <p className="text-[10px] text-slate-600">Visible on your profile.</p>
                                <p className={`text-[10px] ${form.bio.length > 450 ? 'text-amber-400' : 'text-slate-600'}`}>
                                    {form.bio.length}/500
                                </p>
                            </div>
                        </div>
                    </SectionCard>

                    {/* ═══ 4. DEPARTMENT & ORGANIZATION (Read-only) ═══ */}
                    <SectionCard icon={Building2} title="Department & Organization" subtitle="Your assigned department and parent organization" accentColor="blue">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <InfoTile
                                icon={GraduationCap}
                                label="Department"
                                value={readOnly.department?.departmentName || "—"}
                                color="purple"
                            />
                            <InfoTile
                                icon={Hash}
                                label="Department Code"
                                value={readOnly.department?.departmentCode || "—"}
                                color="pink"
                            />
                            <InfoTile
                                icon={Building2}
                                label="Organization"
                                value={readOnly.organization?.organizationName || "—"}
                                color="blue"
                            />
                            <InfoTile
                                icon={Briefcase}
                                label="Designation"
                                value={DESIGNATION_LABELS[readOnly.designation] || readOnly.designation || "—"}
                                color="amber"
                            />
                        </div>
                    </SectionCard>

                    {/* ═══ 5. ACCOUNT DETAILS (Read-only) ═══ */}
                    <SectionCard icon={ShieldCheck} title="Account Details" subtitle="Security and authentication information" accentColor="emerald">
                        <div className="space-y-5">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                <ReadOnlyField icon={ShieldCheck} label="Role" value="Department Coordinator" />
                                <ReadOnlyField icon={BadgeCheck} label="Designation" value={DESIGNATION_LABELS[readOnly.designation] || readOnly.designation} />
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                <ReadOnlyField
                                    icon={Clock}
                                    label="Last Login"
                                    value={readOnly.lastLogin
                                        ? new Date(readOnly.lastLogin).toLocaleString("en-US", {
                                            month: "short", day: "numeric", year: "numeric",
                                            hour: "2-digit", minute: "2-digit"
                                        })
                                        : "Never"
                                    }
                                />
                                <ReadOnlyField
                                    icon={Calendar}
                                    label="Account Created"
                                    value={readOnly.createdAt
                                        ? new Date(readOnly.createdAt).toLocaleDateString("en-US", {
                                            month: "long", day: "numeric", year: "numeric"
                                        })
                                        : "—"
                                    }
                                />
                            </div>
                            <div className="flex items-center gap-3 pt-1">
                                <StatusBadge active={readOnly.isVerified} label={readOnly.isVerified ? "Email Verified" : "Email Unverified"} />
                                <StatusBadge active={readOnly.isActive} label={readOnly.isActive ? "Account Active" : "Account Inactive"} />
                            </div>
                        </div>
                    </SectionCard>

                    {/* ═══ 6. ACCOUNT INFO FOOTER ═══ */}
                    <div className="rounded-2xl bg-[#0d1117] border border-white/5 px-6 py-4 flex flex-wrap items-center justify-between gap-4 text-[11px] text-slate-500">
                        <div className="flex items-center gap-4">
                            {readOnly.createdAt && (
                                <span className="flex items-center gap-1.5">
                                    <Calendar className="h-3 w-3" />
                                    Created {new Date(readOnly.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                                </span>
                            )}
                            {readOnly.id && (
                                <span className="flex items-center gap-1.5 font-mono">
                                    <Hash className="h-3 w-3" />
                                    {readOnly.id}
                                </span>
                            )}
                        </div>
                        <div className="flex items-center gap-3">
                            <StatusBadge active={readOnly.isVerified} label={readOnly.isVerified ? "Verified" : "Unverified"} />
                            <StatusBadge active={readOnly.isActive} label={readOnly.isActive ? "Active" : "Inactive"} />
                        </div>
                    </div>

                    {/* ═══ SAVE BUTTON ═══ */}
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-semibold rounded-xl shadow-lg shadow-purple-900/30 transition-all duration-300 hover:-translate-y-0.5 disabled:opacity-60 disabled:cursor-not-allowed disabled:translate-y-0"
                    >
                        {saving ? (
                            <><Loader2 className="h-4 w-4 animate-spin" /> Saving Changes...</>
                        ) : (
                            <><Save className="h-4 w-4" /> Save Changes</>
                        )}
                    </button>

                </div>
            </div>

            {/* Animations */}
            <style jsx global>{`
                @keyframes fade-in { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
                .animate-fade-in { animation: fade-in 0.4s ease-out forwards; }
            `}</style>
        </div>
    );
}
