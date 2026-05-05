"use client";

import { useEffect, useRef, useState } from "react";
import { organizationApi } from "@/lib/api";
import {
    Building2, Image, Phone, Mail, Globe, Save, CheckCircle, AlertCircle,
    Loader2, Upload, FolderOpen, MapPin, Crown, Users, GraduationCap,
    ShieldCheck, Calendar, Hash, UserCheck, Clock, BadgeCheck, Sparkles,
    ChevronDown, Pencil
} from "lucide-react";

/* ─── Types ──────────────────────────────────────────────── */

interface OrgProfile {
    organizationName: string;
    organizationType: string;
    logoUrl: string;
    address: string;
    city: string;
    state: string;
    pincode: string;
    contactEmail: string;
    contactPhone: string;
    website: string;
}

interface OrgReadOnly {
    id: string;
    isVerified: boolean;
    isActive: boolean;
    registeredBy: { name: string; email: string; designation: string } | null;
    subscriptionStatus: string;
    subscriptionPlan: string;
    subscriptionExpiry: string | null;
    maxStudents: number;
    totalDepartments: number;
    totalAdmins: number;
    totalCoordinators: number;
    totalStudents: number;
    activeStudents: number;
    pendingApprovals: number;
    createdAt: string;
}

interface AdminInfo {
    name: string;
    email: string;
    designation: string;
}

const ORG_TYPES: { value: string; label: string }[] = [
    { value: "university", label: "University" },
    { value: "college", label: "College" },
    { value: "institute", label: "Organization" },
    { value: "school", label: "School" },
    { value: "other", label: "Other" },
];

/* ─── Sub-components ─────────────────────────────────────── */

function SectionCard({ icon: Icon, title, subtitle, children, accentColor = "blue" }: {
    icon: any; title: string; subtitle?: string; children: React.ReactNode; accentColor?: string;
}) {
    const colorMap: Record<string, string> = {
        blue: "text-blue-400", indigo: "text-indigo-400", emerald: "text-emerald-400",
        amber: "text-amber-400", purple: "text-purple-400", rose: "text-rose-400",
    };
    const bgMap: Record<string, string> = {
        blue: "bg-blue-500/10 border-blue-500/20", indigo: "bg-indigo-500/10 border-indigo-500/20",
        emerald: "bg-emerald-500/10 border-emerald-500/20", amber: "bg-amber-500/10 border-amber-500/20",
        purple: "bg-purple-500/10 border-purple-500/20", rose: "bg-rose-500/10 border-rose-500/20",
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

function StatTile({ icon: Icon, label, value, color }: { icon: any; label: string; value: number | string; color: string }) {
    const colorMap: Record<string, string> = {
        blue: "text-blue-400 bg-blue-500/10 border-blue-500/15",
        indigo: "text-indigo-400 bg-indigo-500/10 border-indigo-500/15",
        emerald: "text-emerald-400 bg-emerald-500/10 border-emerald-500/15",
        purple: "text-purple-400 bg-purple-500/10 border-purple-500/15",
        amber: "text-amber-400 bg-amber-500/10 border-amber-500/15",
        rose: "text-rose-400 bg-rose-500/10 border-rose-500/15",
    };
    const textColor: Record<string, string> = {
        blue: "text-blue-400", indigo: "text-indigo-400", emerald: "text-emerald-400",
        purple: "text-purple-400", amber: "text-amber-400", rose: "text-rose-400",
    };
    return (
        <div className={`rounded-xl border ${colorMap[color]} p-4 flex items-center gap-3 group hover:scale-[1.02] transition-transform duration-200`}>
            <div className={`h-10 w-10 rounded-xl ${colorMap[color]} flex items-center justify-center flex-shrink-0`}>
                <Icon className={`h-5 w-5 ${textColor[color]}`} />
            </div>
            <div className="min-w-0">
                <p className="text-[11px] text-slate-500 font-medium truncate">{label}</p>
                <p className="text-lg font-bold text-white">{value}</p>
            </div>
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

function SubscriptionBadge({ status }: { status: string }) {
    const styles: Record<string, string> = {
        active: "bg-emerald-500/10 border-emerald-500/20 text-emerald-400",
        inactive: "bg-slate-500/10 border-slate-500/20 text-slate-400",
        expired: "bg-rose-500/10 border-rose-500/20 text-rose-400",
    };
    return (
        <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border uppercase tracking-wider ${styles[status] || styles.inactive}`}>
            <span className={`h-1.5 w-1.5 rounded-full ${status === "active" ? "bg-emerald-400 animate-pulse" : status === "expired" ? "bg-rose-400" : "bg-slate-500"}`} />
            {status || "Unknown"}
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

/* ─── Main Component ─────────────────────────────────────── */

export default function OrganizationSettingsPage() {
    const [form, setForm] = useState<OrgProfile>({
        organizationName: "", organizationType: "institute", logoUrl: "",
        address: "", city: "", state: "", pincode: "",
        contactEmail: "", contactPhone: "", website: "",
    });
    const [readOnly, setReadOnly] = useState<OrgReadOnly>({
        id: "", isVerified: false, isActive: false, registeredBy: null,
        subscriptionStatus: "inactive", subscriptionPlan: "", subscriptionExpiry: null,
        maxStudents: 0, totalDepartments: 0, totalAdmins: 0, totalCoordinators: 0,
        totalStudents: 0, activeStudents: 0, pendingApprovals: 0, createdAt: "",
    });
    const [admin, setAdmin] = useState<AdminInfo | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
    const [statusMsg, setStatusMsg] = useState("");
    const [logoPreview, setLogoPreview] = useState<string | null>(null);
    const [logoImgError, setLogoImgError] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        const fetchOrg = async () => {
            try {
                const data = await organizationApi.getMe();
                if (data.success && data.organization) {
                    const org = data.organization;
                    setForm({
                        organizationName: org.organizationName || "",
                        organizationType: org.organizationType || "institute",
                        logoUrl: org.logoUrl || "",
                        address: org.address || "",
                        city: org.city || "",
                        state: org.state || "",
                        pincode: org.pincode || "",
                        contactEmail: org.contactEmail || "",
                        contactPhone: org.contactPhone || "",
                        website: org.website || "",
                    });
                    setReadOnly({
                        id: org.id || "",
                        isVerified: org.isVerified ?? false,
                        isActive: org.isActive ?? false,
                        registeredBy: org.registeredBy || null,
                        subscriptionStatus: org.subscriptionStatus || "inactive",
                        subscriptionPlan: org.subscriptionPlan || "",
                        subscriptionExpiry: org.subscriptionExpiry || null,
                        maxStudents: org.maxStudents || 0,
                        totalDepartments: org.totalDepartments || 0,
                        totalAdmins: org.totalAdmins || 0,
                        totalCoordinators: org.totalCoordinators || 0,
                        totalStudents: org.totalStudents || 0,
                        activeStudents: org.activeStudents || 0,
                        pendingApprovals: org.pendingApprovals || 0,
                        createdAt: org.createdAt || "",
                    });
                    if (org.logoUrl) setLogoPreview(org.logoUrl);
                }
                if (data.success && data.admin) {
                    setAdmin({
                        name: data.admin.name || "",
                        email: data.admin.email || "",
                        designation: data.admin.designation || "",
                    });
                }
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        };
        fetchOrg();
    }, []);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setForm(prev => ({ ...prev, [name]: value }));
        if (name === "logoUrl") {
            setLogoPreview(value || null);
            setLogoImgError(false);
        }
    };

    const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
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
            setForm(prev => ({ ...prev, logoUrl: dataUrl }));
            setLogoPreview(dataUrl);
            setLogoImgError(false);
        };
        reader.readAsDataURL(file);
    };

    const handleSave = async () => {
        setSaving(true);
        setStatus("idle");
        try {
            await organizationApi.updateProfile({
                organizationName: form.organizationName,
                organizationType: form.organizationType as any,
                logoUrl: form.logoUrl,
                address: form.address,
                city: form.city,
                state: form.state,
                pincode: form.pincode,
                contactEmail: form.contactEmail,
                contactPhone: form.contactPhone,
                website: form.website,
            });
            setStatus("success");
            setStatusMsg("Organization profile updated successfully!");
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
                    <Loader2 className="h-10 w-10 animate-spin text-blue-500 mx-auto mb-3" />
                    <p className="text-slate-400 text-sm">Loading organization profile...</p>
                </div>
            </div>
        );
    }

    const inputClass = "w-full px-4 py-3 bg-[#0f172a] border border-slate-700/50 rounded-xl text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/30 transition-all";
    const labelClass = "block text-xs font-medium text-slate-400 mb-1.5";

    return (
        <div className="min-h-screen w-full bg-[#030712] text-slate-200 font-sans selection:bg-indigo-500/30 relative overflow-hidden">
            {/* Background Ambient */}
            <div className="fixed inset-0 pointer-events-none">
                <div className="absolute top-[-15%] right-[-5%] w-[500px] h-[500px] bg-blue-500/8 rounded-full blur-[120px] animate-pulse" style={{ animationDuration: "8s" }} />
                <div className="absolute bottom-[-10%] left-[-5%] w-[400px] h-[400px] bg-indigo-500/6 rounded-full blur-[100px] animate-pulse" style={{ animationDuration: "10s" }} />
            </div>

            <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 py-8 pb-20">

                {/* ═══ PROFILE HERO ═══ */}
                <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-900/40 via-blue-900/30 to-slate-900/40 border border-white/10 shadow-2xl mb-8">
                    <div className="absolute inset-0 bg-grid-white/[0.02] bg-[length:24px_24px]" />
                    <div className="absolute -top-20 -right-20 w-56 h-56 bg-blue-500/20 rounded-full blur-3xl" />
                    <div className="absolute -bottom-16 -left-16 w-48 h-48 bg-indigo-500/15 rounded-full blur-3xl" />

                    <div className="relative z-10 p-6 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center gap-6">
                        {/* Logo */}
                        <div className="relative group">
                            <div className="absolute -inset-1 bg-gradient-to-br from-blue-500/30 to-indigo-500/30 rounded-2xl blur-md opacity-50 group-hover:opacity-80 transition-opacity" />
                            <div className="relative h-20 w-20 sm:h-24 sm:w-24 rounded-2xl bg-[#111827] border-2 border-white/10 flex items-center justify-center overflow-hidden shadow-xl">
                                {logoPreview ? (
                                    logoImgError ? (
                                        <div className="text-center px-2">
                                            <AlertCircle className="h-6 w-6 text-amber-500 mx-auto mb-1" />
                                            <span className="text-[9px] text-amber-500">Can&apos;t preview</span>
                                        </div>
                                    ) : (
                                        <img
                                            src={logoPreview}
                                            alt="Organization logo"
                                            className="h-full w-full object-contain p-1.5"
                                            onError={() => setLogoImgError(true)}
                                        />
                                    )
                                ) : (
                                    <Building2 className="h-10 w-10 text-slate-600" />
                                )}
                            </div>
                            {/* Edit logo overlay */}
                            <button
                                onClick={() => fileInputRef.current?.click()}
                                className="absolute -bottom-1 -right-1 h-7 w-7 rounded-full bg-blue-600 border-2 border-[#111827] flex items-center justify-center text-white hover:bg-blue-500 transition-colors shadow-lg"
                                title="Change logo"
                            >
                                <Pencil className="h-3 w-3" />
                            </button>
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/png,image/jpeg,image/jpg,image/svg+xml,image/webp"
                                className="hidden"
                                onChange={handleFileUpload}
                            />
                        </div>

                        {/* Title & Badges */}
                        <div className="flex-1 min-w-0">
                            <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight mb-2 truncate">
                                {form.organizationName || "Organization Profile"}
                            </h1>
                            <div className="flex flex-wrap items-center gap-2">
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/10 text-blue-300 text-[11px] font-bold uppercase tracking-wider border border-white/10 backdrop-blur-md">
                                    <Building2 className="h-3 w-3" />
                                    {ORG_TYPES.find(t => t.value === form.organizationType)?.label || form.organizationType}
                                </span>
                                <StatusBadge active={readOnly.isVerified} label={readOnly.isVerified ? "Verified" : "Unverified"} />
                                <StatusBadge active={readOnly.isActive} label={readOnly.isActive ? "Active" : "Inactive"} />
                                {readOnly.subscriptionPlan && (
                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-400 text-[11px] font-bold uppercase tracking-wider border border-amber-500/20">
                                        <Crown className="h-3 w-3" />
                                        {readOnly.subscriptionPlan}
                                    </span>
                                )}
                            </div>
                            {readOnly.createdAt && (
                                <p className="text-[11px] text-slate-500 mt-2 flex items-center gap-1.5">
                                    <Calendar className="h-3 w-3" />
                                    Member since {new Date(readOnly.createdAt).toLocaleDateString("en-US", { month: "long", year: "numeric" })}
                                </p>
                            )}
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

                {/* Logo URL Input (collapsible helper below hero) */}
                <div className="mb-6 rounded-xl bg-[#111827] border border-white/5 p-4">
                    <label className="block text-xs font-medium text-slate-400 mb-2 flex items-center gap-1.5">
                        <Image className="h-3 w-3 text-slate-500" />
                        Logo URL
                    </label>
                    <div className="flex gap-2">
                        <input
                            type="url"
                            name="logoUrl"
                            value={form.logoUrl.startsWith("data:") ? "" : form.logoUrl}
                            onChange={handleChange}
                            placeholder="https://your-cdn.com/logo.png"
                            className={inputClass + " flex-1"}
                        />
                        <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            title="Upload from your computer"
                            className="flex-shrink-0 flex items-center gap-2 px-4 py-3 bg-[#1e293b] border border-slate-700/50 rounded-xl text-sm text-slate-300 hover:text-white hover:bg-slate-700/70 hover:border-blue-500/40 transition-all"
                        >
                            <FolderOpen className="h-4 w-4" />
                            <span className="hidden sm:inline">Browse</span>
                        </button>
                    </div>
                    {form.logoUrl.startsWith("data:") && (
                        <p className="text-[11px] text-emerald-500/80 mt-2 flex items-center gap-1.5">
                            <CheckCircle className="h-3 w-3 shrink-0" />
                            Local image uploaded — ready to save.
                        </p>
                    )}
                    {logoImgError && logoPreview && !form.logoUrl.startsWith("data:") && (
                        <p className="text-[11px] text-amber-500/80 mt-2 flex items-center gap-1.5">
                            <AlertCircle className="h-3 w-3 shrink-0" />
                            Preview unavailable (CORS/hotlink protected). URL is still saved.
                        </p>
                    )}
                </div>

                <div className="space-y-6">

                    {/* ═══ 1. ORGANIZATION DETAILS (Editable) ═══ */}
                    <SectionCard icon={Building2} title="Organization Details" subtitle="Basic information about your organization" accentColor="blue">
                        <div className="space-y-5">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                <div>
                                    <label className={labelClass}>Organization Name</label>
                                    <input type="text" name="organizationName" value={form.organizationName} onChange={handleChange} className={inputClass} placeholder="MIT Indore" />
                                </div>
                                <div>
                                    <label className={labelClass}>Organization Type</label>
                                    <div className="relative">
                                        <select
                                            name="organizationType"
                                            value={form.organizationType}
                                            onChange={handleSelectChange}
                                            className={inputClass + " appearance-none cursor-pointer pr-10"}
                                        >
                                            {ORG_TYPES.map(t => (
                                                <option key={t.value} value={t.value}>{t.label}</option>
                                            ))}
                                        </select>
                                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500 pointer-events-none" />
                                    </div>
                                </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                <div>
                                    <label className={labelClass}>
                                        <Mail className="h-3 w-3 inline mr-1 text-slate-500" />
                                        Contact Email
                                    </label>
                                    <input type="email" name="contactEmail" value={form.contactEmail} onChange={handleChange} className={inputClass} placeholder="admin@org.com" />
                                </div>
                                <div>
                                    <label className={labelClass}>
                                        <Phone className="h-3 w-3 inline mr-1 text-slate-500" />
                                        Contact Phone
                                    </label>
                                    <input type="text" name="contactPhone" value={form.contactPhone} onChange={handleChange} className={inputClass} placeholder="+91 98765 43210" />
                                </div>
                            </div>
                            <div>
                                <label className={labelClass}>
                                    <Globe className="h-3 w-3 inline mr-1 text-slate-500" />
                                    Website
                                </label>
                                <input type="url" name="website" value={form.website} onChange={handleChange} className={inputClass} placeholder="https://www.mit.edu" />
                            </div>
                        </div>
                    </SectionCard>

                    {/* ═══ 2. LOCATION & ADDRESS (Editable) ═══ */}
                    <SectionCard icon={MapPin} title="Location & Address" subtitle="Physical location details" accentColor="indigo">
                        <div className="space-y-5">
                            <div>
                                <label className={labelClass}>
                                    <MapPin className="h-3 w-3 inline mr-1 text-slate-500" />
                                    Street Address
                                </label>
                                <input type="text" name="address" value={form.address} onChange={handleChange} className={inputClass} placeholder="123 University Road" />
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                <div>
                                    <label className={labelClass}>City</label>
                                    <input type="text" name="city" value={form.city} onChange={handleChange} className={inputClass} placeholder="Indore" />
                                </div>
                                <div>
                                    <label className={labelClass}>State / Province</label>
                                    <input type="text" name="state" value={form.state} onChange={handleChange} className={inputClass} placeholder="Madhya Pradesh" />
                                </div>
                            </div>
                            <div className="grid grid-cols-1 gap-5">
                                <div>
                                    <label className={labelClass}>Pincode / ZIP</label>
                                    <input type="text" name="pincode" value={form.pincode} onChange={handleChange} className={inputClass} placeholder="452001" />
                                </div>
                            </div>
                        </div>
                    </SectionCard>

                    {/* ═══ 3. SUBSCRIPTION & PLAN (Read-only) ═══ */}
                    <SectionCard icon={Crown} title="Subscription & Plan" subtitle="Managed by the Praedico platform team" accentColor="amber">
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                            <div className="rounded-xl bg-[#0a0f1a] border border-slate-800/50 p-4">
                                <p className="text-[11px] text-slate-500 font-medium mb-1">Plan</p>
                                <p className="text-base font-bold text-white">{readOnly.subscriptionPlan || "No Plan"}</p>
                            </div>
                            <div className="rounded-xl bg-[#0a0f1a] border border-slate-800/50 p-4">
                                <p className="text-[11px] text-slate-500 font-medium mb-1">Status</p>
                                <SubscriptionBadge status={readOnly.subscriptionStatus} />
                            </div>
                            <div className="rounded-xl bg-[#0a0f1a] border border-slate-800/50 p-4">
                                <p className="text-[11px] text-slate-500 font-medium mb-1">Expires</p>
                                <p className="text-base font-bold text-white">
                                    {readOnly.subscriptionExpiry
                                        ? new Date(readOnly.subscriptionExpiry).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
                                        : "—"}
                                </p>
                            </div>
                            <div className="rounded-xl bg-[#0a0f1a] border border-slate-800/50 p-4">
                                <p className="text-[11px] text-slate-500 font-medium mb-1">Max Students</p>
                                <p className="text-base font-bold text-white">{readOnly.maxStudents === 0 ? "Unlimited" : readOnly.maxStudents}</p>
                            </div>
                        </div>
                    </SectionCard>

                    {/* ═══ 4. ORGANIZATION STATISTICS (Read-only) ═══ */}
                    <SectionCard icon={Sparkles} title="Organization Statistics" subtitle="Live metrics across your organization" accentColor="emerald">
                        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                            <StatTile icon={Building2} label="Departments" value={readOnly.totalDepartments} color="indigo" />
                            <StatTile icon={ShieldCheck} label="Admins" value={readOnly.totalAdmins} color="blue" />
                            <StatTile icon={Users} label="Coordinators" value={readOnly.totalCoordinators} color="purple" />
                            <StatTile icon={GraduationCap} label="Total Students" value={readOnly.totalStudents} color="emerald" />
                            <StatTile icon={BadgeCheck} label="Active Students" value={readOnly.activeStudents} color="amber" />
                            <StatTile icon={UserCheck} label="Pending Approvals" value={readOnly.pendingApprovals} color="rose" />
                        </div>
                    </SectionCard>

                    {/* ═══ 5. REGISTERED BY (Read-only) ═══ */}
                    {readOnly.registeredBy && (
                        <SectionCard icon={ShieldCheck} title="Registered By" subtitle="Initial registrant details" accentColor="purple">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                                <ReadOnlyField icon={Users} label="Name" value={readOnly.registeredBy.name} />
                                <ReadOnlyField icon={Mail} label="Email" value={readOnly.registeredBy.email} />
                                <ReadOnlyField icon={BadgeCheck} label="Designation" value={readOnly.registeredBy.designation} />
                            </div>
                        </SectionCard>
                    )}

                    {/* ═══ 6. CURRENT ADMIN INFO (Read-only) ═══ */}
                    {admin && (
                        <SectionCard icon={UserCheck} title="Logged-in Admin" subtitle="Your admin account details" accentColor="rose">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                                <ReadOnlyField icon={Users} label="Name" value={admin.name} />
                                <ReadOnlyField icon={Mail} label="Email" value={admin.email} />
                                <ReadOnlyField icon={BadgeCheck} label="Designation" value={admin.designation} />
                            </div>
                        </SectionCard>
                    )}

                    {/* ═══ 7. ACCOUNT INFO FOOTER (Read-only) ═══ */}
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
                        className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold rounded-xl shadow-lg shadow-blue-900/30 transition-all duration-300 hover:-translate-y-0.5 disabled:opacity-60 disabled:cursor-not-allowed disabled:translate-y-0"
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
