"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { createPortal } from "react-dom";
import {
    ShieldCheck, Plus, X, ChevronDown, ChevronRight,
    LayoutDashboard, BarChart3, ShoppingBag, Users, Building2,
    FileText, MessageSquare, Image as ImageIcon, Mail, Users2,
    Trash2, Loader2, AlertCircle, RefreshCcw, Pencil, Check
} from "lucide-react";
import { companyApi } from "@/lib/api";

// ─── Permission Definitions ───────────────────────────────────────────────────
const PERMISSION_SECTIONS = [
    {
        key: "dashboard", label: "Dashboard", icon: LayoutDashboard, color: "text-blue-400",
        permissions: [
            { key: "dashboard.view", label: "View Dashboard", description: "Access the overview dashboard" },
        ],
    },
    {
        key: "trading", label: "Trading Data", icon: ShoppingBag, color: "text-amber-400",
        permissions: [
            { key: "trading.view", label: "View Trading", description: "Access ETF and Nifty50 tables" },
            { key: "trading.scrape", label: "Trigger Scraper", description: "Manually run the stock data scraper" },
            { key: "trading.delete", label: "Clear Market Data", description: "Delete all stock/ETF history and reset the scraper" },
        ],
    },
    {
        key: "users", label: "User Management", icon: Users, color: "text-cyan-400",
        permissions: [
            { key: "users.view", label: "View Users", description: "List and search all users" },
            { key: "users.edit", label: "Edit User", description: "Update name, email, role" },
            { key: "users.archive", label: "Archive User", description: "Soft-delete a user account" },
            { key: "users.restore", label: "Restore User", description: "Restore an archived account" },
            { key: "users.block", label: "Block / Unblock User", description: "Toggle active status" },
            { key: "users.bulk_action", label: "Bulk Actions", description: "Archive / block multiple users at once" },
            { key: "users.export_csv", label: "Export CSV", description: "Download user list as CSV" },
            { key: "users.delete", label: "Delete User", description: "Permanently delete a user account" },
        ],
    },
    {
        key: "orgs", label: "Organizations", icon: Building2, color: "text-violet-400",
        permissions: [
            { key: "orgs.view", label: "View Organizations", description: "List all registered organizations" },
            { key: "orgs.view_users", label: "View Org Users", description: "List users inside an organization" },
            { key: "orgs.activate_subscription", label: "Activate Subscription", description: "Enable paid plan for an org" },
            { key: "orgs.manage_seats", label: "Manage Seats", description: "Reconfigure subscription seats" },
            { key: "orgs.deactivate_subscription", label: "Deactivate Subscription", description: "Revoke org's premium access" },
        ],
    },
    {
        key: "feedback", label: "Feedback Hub", icon: MessageSquare, color: "text-pink-400",
        permissions: [
            { key: "feedback.view", label: "View Feedback", description: "Read submitted feedback entries" },
            { key: "feedback.update_status", label: "Update Status", description: "Mark feedback as reviewed / resolved" },
            { key: "feedback.delete", label: "Delete Feedback", description: "Remove a feedback entry" },
        ],
    },
    {
        key: "gallery", label: "Gallery Management", icon: ImageIcon, color: "text-rose-400",
        permissions: [
            { key: "gallery.view", label: "View Gallery", description: "Access the image gallery" },
            { key: "gallery.upload", label: "Upload Images", description: "Add new images to the gallery" },
            { key: "gallery.delete", label: "Delete Images", description: "Remove images from the gallery" },
        ],
    },
] as const;

const GRADIENTS = [
    "from-indigo-500 to-violet-600",
    "from-pink-500 to-rose-600",
    "from-emerald-500 to-teal-600",
    "from-amber-500 to-orange-600",
    "from-cyan-500 to-blue-600",
];

interface CompanyRole {
    _id: string;
    name: string;
    description?: string;
    permissions: string[];
    createdBy: { name: string; email: string } | string;
    createdAt: string;
}

// ─── Shared Permissions Modal ─────────────────────────────────────────────────
// Used for both Create and Edit
function PermissionsModal({
    title,
    subtitle,
    initialName = "",
    initialDesc = "",
    initialPerms = new Set<string>(),
    saving,
    saveError,
    onSave,
    onClose,
}: {
    title: string;
    subtitle: string;
    initialName?: string;
    initialDesc?: string;
    initialPerms?: Set<string>;
    saving: boolean;
    saveError: string;
    onSave: (name: string, desc: string, perms: string[]) => void;
    onClose: () => void;
}) {
    const [roleName, setRoleName] = useState(initialName);
    const [roleDesc, setRoleDesc] = useState(initialDesc);
    const [selectedPerms, setSelectedPerms] = useState<Set<string>>(new Set(initialPerms));
    const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());

    const togglePerm = (sectionKey: string, key: string) => {
        setSelectedPerms((prev) => {
            const next = new Set(prev);

            if (next.has(key)) {
                // Unchecking
                next.delete(key);
                // If unchecking the '.view' permission, uncheck ALL other permissions in this section
                if (key.endsWith('.view')) {
                    const section = PERMISSION_SECTIONS.find(s => s.key === sectionKey);
                    if (section) {
                        section.permissions.forEach(p => next.delete(p.key));
                    }
                }
            } else {
                // Checking a permission
                next.add(key);
                // If checking ANY permission, ensure the '.view' permission is also checked
                if (!key.endsWith('.view')) {
                    const viewPermKey = `${sectionKey}.view`;
                    next.add(viewPermKey);
                }
            }
            return next;
        });
    };

    const toggleSection = (key: string) => {
        setExpandedSections((prev) => {
            const next = new Set(prev);
            next.has(key) ? next.delete(key) : next.add(key);
            return next;
        });
    };

    const toggleAllInSection = (sectionKey: string) => {
        const section = PERMISSION_SECTIONS.find((s) => s.key === sectionKey);
        if (!section) return;
        const allKeys = section.permissions.map((p) => p.key);
        const allSelected = allKeys.every((k) => selectedPerms.has(k));
        setSelectedPerms((prev) => {
            const next = new Set(prev);
            allSelected ? allKeys.forEach((k) => next.delete(k)) : allKeys.forEach((k) => next.add(k));
            return next;
        });
    };

    // Custom Checkbox Component
    const Checkbox = ({ checked, indeterminate, onClick }: { checked: boolean, indeterminate?: boolean, onClick: (e: React.MouseEvent) => void }) => (
        <button
            type="button"
            onClick={onClick}
            className={`h-5 w-5 rounded-[6px] border flex items-center justify-center shrink-0 transition-all shadow-sm ${checked
                ? "bg-indigo-500 border-indigo-500 shadow-indigo-500/20"
                : indeterminate
                    ? "bg-indigo-500/20 border-indigo-500/50"
                    : "bg-[#020617] border-white/10 hover:border-white/20"
                }`}
        >
            {checked && <Check className="h-3.5 w-3.5 text-white" strokeWidth={3} />}
            {indeterminate && !checked && <div className="h-1 w-2.5 rounded-full bg-indigo-400" />}
        </button>
    );

    const [mobileTab, setMobileTab] = useState<'details' | 'permissions'>('details');

    const [mounted, setMounted] = useState(false);
    useEffect(() => setMounted(true), []);

    if (!mounted) return null;

    return createPortal(
        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 sm:p-8 bg-black/60 backdrop-blur-md transition-all">
            <div className="bg-[#0F172A] border-0 sm:border border-white/10 rounded-none sm:rounded-3xl w-full max-w-[1200px] max-h-[90vh] flex flex-col shadow-2xl overflow-hidden relative flex-shrink-0">

                {/* ── Mobile Header ── */}
                <div className="flex md:hidden items-center justify-between px-5 py-4 border-b border-white/5 shrink-0 bg-[#020617]/60">
                    <h2 className="text-base font-bold text-white truncate pr-4">{title}</h2>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-xl bg-white/5 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 transition-all shrink-0"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                {/* ── Mobile Tab Switcher ── */}
                <div className="flex md:hidden border-b border-white/5 shrink-0">
                    <button
                        onClick={() => setMobileTab('details')}
                        className={`flex-1 py-3 text-sm font-semibold transition-all ${mobileTab === 'details' ? 'text-indigo-400 border-b-2 border-indigo-500' : 'text-slate-500'}`}
                    >
                        Details
                    </button>
                    <button
                        onClick={() => setMobileTab('permissions')}
                        className={`flex-1 py-3 text-sm font-semibold transition-all flex items-center justify-center gap-2 ${mobileTab === 'permissions' ? 'text-indigo-400 border-b-2 border-indigo-500' : 'text-slate-500'}`}
                    >
                        Permissions
                        {selectedPerms.size > 0 && (
                            <span className="px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-400 text-xs font-bold">{selectedPerms.size}</span>
                        )}
                    </button>
                </div>

                {/* ── Desktop Close Button ── */}
                <button
                    onClick={onClose}
                    className="hidden md:flex absolute top-5 right-5 z-[210] p-2.5 rounded-xl bg-white/5 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 transition-all border border-white/5 hover:border-rose-500/30 items-center justify-center"
                >
                    <X className="h-5 w-5" />
                </button>

                {/* ── Body ── */}
                <div className="flex-1 min-h-0 flex flex-col md:flex-row overflow-hidden">

                    {/* Left Panel: Info & Settings */}
                    <div className={`w-full md:w-[35%] lg:w-[30%] bg-[#020617]/50 md:border-r border-white/5 flex flex-col p-5 sm:p-8 min-h-0 overflow-y-auto [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-white/10 hover:[&::-webkit-scrollbar-thumb]:bg-white/20 ${mobileTab === 'details' ? 'flex' : 'hidden'} md:flex`}>
                        <div className="hidden md:block">
                            <h2 className="text-2xl font-bold text-white tracking-tight leading-tight">{title}</h2>
                            <p className="text-sm text-slate-500 mt-2 leading-relaxed">{subtitle}</p>
                        </div>

                        <div className="mt-4 md:mt-8 space-y-5 flex-1">
                            <div>
                                <label className="text-[11px] font-bold uppercase tracking-widest text-slate-500 ml-1 mb-2 block">Role Name <span className="text-rose-500">*</span></label>
                                <input
                                    type="text"
                                    value={roleName}
                                    onChange={(e) => setRoleName(e.target.value)}
                                    placeholder="e.g., Content Manager"
                                    className="w-full bg-[#0F172A] border border-white/10 rounded-2xl py-3.5 px-5 text-sm text-white placeholder:text-slate-600 focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500/50 outline-none transition-all shadow-inner"
                                />
                            </div>
                            <div>
                                <label className="text-[11px] font-bold uppercase tracking-widest text-slate-500 ml-1 mb-2 block">Description</label>
                                <textarea
                                    value={roleDesc}
                                    onChange={(e) => setRoleDesc(e.target.value)}
                                    placeholder="Brief explanation of this role's duties"
                                    rows={4}
                                    className="w-full bg-[#0F172A] border border-white/10 rounded-2xl py-3.5 px-5 text-sm text-white placeholder:text-slate-600 focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500/50 outline-none transition-all shadow-inner resize-none"
                                />
                            </div>

                            {saveError && (
                                <div className="flex items-start gap-3 p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm">
                                    <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
                                    <span className="leading-relaxed">{saveError}</span>
                                </div>
                            )}
                        </div>

                        <div className="pt-6 mt-auto shrink-0 space-y-3">
                            <button
                                onClick={() => onSave(roleName, roleDesc, Array.from(selectedPerms))}
                                disabled={!roleName.trim() || saving}
                                className="w-full py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-bold shadow-lg shadow-indigo-900/30 transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                                {saving ? "Saving..." : "Save Role"}
                            </button>
                            <button onClick={onClose} disabled={saving} className="w-full py-3.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-sm font-bold transition-all disabled:opacity-40">
                                Cancel
                            </button>
                        </div>
                    </div>

                    {/* Right Panel: Permissions Map */}
                    <div className={`flex-1 flex-col min-h-0 bg-transparent overflow-hidden ${mobileTab === 'permissions' ? 'flex' : 'hidden'} md:flex`}>
                        <div className="p-5 sm:p-8 pb-4 border-b border-white/5 flex items-center justify-between shrink-0 bg-[#0F172A]/90 backdrop-blur-md z-10">
                            <div>
                                <h3 className="text-base sm:text-xl font-bold text-white tracking-tight">Permissions Configuration</h3>
                                <p className="text-[11px] text-slate-500 uppercase tracking-widest font-semibold mt-1">Granular Access Control</p>
                            </div>
                            <span className="px-3.5 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-bold tracking-wide shadow-inner shadow-indigo-500/10 md:mr-[50px]">
                                {selectedPerms.size} Selected
                            </span>
                        </div>

                        <div className="flex-1 min-h-0 overflow-y-auto p-4 sm:p-8 pt-4 sm:pt-6 space-y-3 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-white/10 hover:[&::-webkit-scrollbar-thumb]:bg-white/20">
                            <div className="grid grid-cols-1 xl:grid-cols-2 gap-3 sm:gap-4 items-start">
                                {PERMISSION_SECTIONS.map((section) => {
                                    const Icon = section.icon;
                                    const isExpanded = expandedSections.has(section.key);
                                    const sectionKeys = section.permissions.map((p) => p.key);
                                    const allChecked = sectionKeys.every((k) => selectedPerms.has(k));
                                    const someChecked = sectionKeys.some((k) => selectedPerms.has(k));
                                    const activeCount = sectionKeys.filter((k) => selectedPerms.has(k)).length;

                                    return (
                                        <div key={section.key} className={`rounded-2xl border transition-all duration-300 overflow-hidden self-start h-max ${activeCount > 0 ? 'border-indigo-500/30 bg-indigo-500/[0.03] shadow-sm shadow-indigo-900/10' : 'border-white/5 bg-[#020617]/30 hover:border-white/10'}`}>
                                            <div className="flex items-center p-3.5 sm:p-4 gap-3 sm:gap-4">
                                                <Checkbox
                                                    checked={allChecked}
                                                    indeterminate={someChecked && !allChecked}
                                                    onClick={(e) => { e.stopPropagation(); toggleAllInSection(section.key); }}
                                                />

                                                <div className="flex items-center gap-3 sm:gap-4 flex-1 cursor-pointer select-none" onClick={() => toggleSection(section.key)}>
                                                    <div className={`h-9 w-9 sm:h-10 sm:w-10 shrink-0 rounded-xl bg-[#0B101E] border border-white/5 flex items-center justify-center ${section.color} shadow-inner`}>
                                                        <Icon className="h-4 w-4 sm:h-5 sm:w-5" />
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-sm font-bold text-slate-200 truncate">{section.label}</p>
                                                        <p className="text-[11px] text-slate-500 font-medium tracking-wide mt-0.5 truncate">
                                                            {activeCount}/{sectionKeys.length} active
                                                        </p>
                                                    </div>

                                                    <div className="shrink-0 w-7 h-7 rounded-full bg-white/[0.02] flex items-center justify-center ml-1">
                                                        {isExpanded ? <ChevronDown className="h-4 w-4 text-slate-400" /> : <ChevronRight className="h-4 w-4 text-slate-400" />}
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Expanded items */}
                                            <div className={`transition-all duration-300 ease-in-out origin-top ${isExpanded ? 'max-h-[800px] opacity-100' : 'max-h-0 opacity-0'} overflow-hidden`}>
                                                <div className="px-4 sm:px-5 pb-4 sm:pb-5 pt-2 space-y-1 bg-black/20 border-t border-white/5">
                                                    {section.permissions.map((perm) => {
                                                        const isSelected = selectedPerms.has(perm.key);
                                                        return (
                                                            <div
                                                                key={perm.key}
                                                                onClick={() => togglePerm(section.key, perm.key)}
                                                                className={`flex items-center gap-3 p-3 sm:p-3.5 rounded-xl border transition-all cursor-pointer ${isSelected ? 'border-indigo-500/40 bg-indigo-500/10' : 'border-white/5 hover:border-white/10 hover:bg-white/[0.02]'}`}
                                                            >
                                                                <div className="shrink-0">
                                                                    <Checkbox
                                                                        checked={isSelected}
                                                                        onClick={(e) => { e.stopPropagation(); togglePerm(section.key, perm.key); }}
                                                                    />
                                                                </div>
                                                                <div className="min-w-0">
                                                                    <p className={`text-sm font-semibold transition-colors truncate ${isSelected ? 'text-indigo-300' : 'text-slate-300'}`}>{perm.label}</p>
                                                                    <p className={`text-xs mt-0.5 leading-relaxed ${isSelected ? 'text-indigo-400/70' : 'text-slate-500'}`}>{perm.description}</p>
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>,
        document.body
    );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function RolesPage() {
    const [roles, setRoles] = useState<CompanyRole[]>([]);
    const [loadingRoles, setLoadingRoles] = useState(true);
    const [rolesError, setRolesError] = useState("");

    // Create modal
    const [createOpen, setCreateOpen] = useState(false);
    const [createSaving, setCreateSaving] = useState(false);
    const [createError, setCreateError] = useState("");

    // Edit modal
    const [editTarget, setEditTarget] = useState<CompanyRole | null>(null);
    const [editSaving, setEditSaving] = useState(false);
    const [editError, setEditError] = useState("");

    // Delete confirm
    const [deleteTarget, setDeleteTarget] = useState<CompanyRole | null>(null);
    const [deleting, setDeleting] = useState(false);

    // ─── Fetch ──────────────────────────────────────────────────────────────────
    const fetchRoles = useCallback(async () => {
        setLoadingRoles(true);
        setRolesError("");
        try {
            const data = await companyApi.listRoles();
            if (data.success) setRoles(data.roles);
        } catch (err: any) {
            setRolesError(err.response?.data?.message || "Failed to load roles");
        } finally {
            setLoadingRoles(false);
        }
    }, []);

    useEffect(() => { fetchRoles(); }, [fetchRoles]);

    // ─── Create ──────────────────────────────────────────────────────────────────
    const handleCreate = async (name: string, desc: string, perms: string[]) => {
        setCreateSaving(true);
        setCreateError("");
        try {
            const data = await companyApi.createRole({ name, description: desc, permissions: perms });
            if (data.success) {
                setRoles((prev) => [data.role, ...prev]);
                setCreateOpen(false);
            }
        } catch (err: any) {
            setCreateError(err.response?.data?.message || "Failed to create role");
        } finally {
            setCreateSaving(false);
        }
    };

    // ─── Edit ────────────────────────────────────────────────────────────────────
    const handleEdit = async (name: string, desc: string, perms: string[]) => {
        if (!editTarget) return;
        setEditSaving(true);
        setEditError("");
        try {
            const data = await companyApi.updateRole(editTarget._id, { name, description: desc, permissions: perms });
            if (data.success) {
                setRoles((prev) => prev.map((r) => r._id === editTarget._id ? data.role : r));
                setEditTarget(null);
            }
        } catch (err: any) {
            setEditError(err.response?.data?.message || "Failed to update role");
        } finally {
            setEditSaving(false);
        }
    };

    // ─── Delete ───────────────────────────────────────────────────────────────────
    const handleDeleteRole = async () => {
        if (!deleteTarget) return;
        setDeleting(true);
        try {
            await companyApi.deleteRole(deleteTarget._id);
            setRoles((prev) => prev.filter((r) => r._id !== deleteTarget._id));
            setDeleteTarget(null);
        } catch (err: any) {
            alert(err.response?.data?.message || "Failed to delete role");
        } finally {
            setDeleting(false);
        }
    };

    // ─── Render ─────────────────────────────────────────────────────────────────
    return (
        <div className="space-y-6">
            {/* Toolbar */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:justify-between">
                <p className="text-slate-500 text-sm">
                    Create roles and assign granular permissions to control what each employee can access.
                </p>
                <div className="flex items-center gap-3">
                    <button onClick={fetchRoles} className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-all">
                        <RefreshCcw className={`h-4 w-4 ${loadingRoles ? "animate-spin" : ""}`} />
                    </button>
                    <button
                        onClick={() => setCreateOpen(true)}
                        className="flex items-center gap-2 px-4 sm:px-5 py-3 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-bold rounded-xl transition-all shadow-lg shadow-indigo-900/30 active:scale-[0.98] flex-1 sm:flex-none justify-center"
                    >
                        <Plus className="h-4 w-4" />
                        Add Role
                    </button>
                </div>
            </div>

            {/* States */}
            {loadingRoles ? (
                <div className="flex items-center justify-center py-20">
                    <Loader2 className="h-8 w-8 text-indigo-500 animate-spin" />
                </div>
            ) : rolesError ? (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                    <AlertCircle className="h-10 w-10 text-rose-500 mb-3" />
                    <p className="text-slate-400 text-sm">{rolesError}</p>
                </div>
            ) : roles.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 rounded-[28px] bg-[#0F172A]/60 border border-dashed border-white/10 text-center">
                    <div className="h-16 w-16 rounded-full bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center mb-4">
                        <ShieldCheck className="h-7 w-7 text-indigo-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-white mb-1">No roles yet</h3>
                    <p className="text-slate-500 text-sm max-w-xs mb-5">
                        Create your first role to start assigning permissions to employees.
                    </p>
                    <button
                        onClick={() => setCreateOpen(true)}
                        className="flex items-center gap-2 px-5 py-3 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-bold rounded-xl transition-all"
                    >
                        <Plus className="h-4 w-4" /> Create First Role
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
                    {roles.map((role, i) => (
                        <div
                            key={role._id}
                            onClick={() => setEditTarget(role)}
                            className="group relative rounded-2xl bg-[#0F172A]/80 border border-white/5 p-6 hover:border-indigo-500/40 transition-all duration-300 overflow-hidden cursor-pointer hover:-translate-y-0.5 hover:shadow-xl hover:shadow-indigo-900/20"
                        >
                            <div className={`absolute -top-10 -right-10 w-28 h-28 rounded-full bg-gradient-to-br ${GRADIENTS[i % GRADIENTS.length]} opacity-0 group-hover:opacity-15 blur-2xl transition-opacity duration-500`} />

                            {/* Action buttons — top right */}
                            <div className="absolute top-4 right-4 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button
                                    onClick={(e) => { e.stopPropagation(); setEditTarget(role); }}
                                    className="p-1.5 rounded-lg bg-white/5 hover:bg-indigo-500/20 text-slate-500 hover:text-indigo-400 transition-all"
                                    title="Edit role"
                                >
                                    <Pencil className="h-3.5 w-3.5" />
                                </button>
                                <button
                                    onClick={(e) => { e.stopPropagation(); setDeleteTarget(role); }}
                                    className="p-1.5 rounded-lg bg-white/5 hover:bg-rose-500/20 text-slate-500 hover:text-rose-400 transition-all"
                                    title="Delete role"
                                >
                                    <Trash2 className="h-3.5 w-3.5" />
                                </button>
                            </div>

                            <div className={`h-10 w-10 rounded-xl bg-gradient-to-br ${GRADIENTS[i % GRADIENTS.length]} flex items-center justify-center mb-4 shadow-lg`}>
                                <ShieldCheck className="h-5 w-5 text-white" />
                            </div>
                            <h3 className="text-base font-bold text-white mb-1 pr-14">{role.name}</h3>
                            <p className="text-xs text-slate-500 mb-4 leading-relaxed line-clamp-2">
                                {role.description || "No description"}
                            </p>
                            <div className="flex items-center gap-1 flex-wrap">
                                <span className="flex items-center gap-1 text-xs text-slate-500">
                                    <ShieldCheck className="h-3 w-3 text-indigo-400" />
                                    {role.permissions.length} permissions
                                </span>
                            </div>
                            {/* Click hint */}
                            <p className="mt-3 text-[10px] text-slate-700 group-hover:text-indigo-500/60 transition-colors">
                                Click to edit permissions
                            </p>
                        </div>
                    ))}

                    {/* Add card */}
                    <button
                        onClick={() => setCreateOpen(true)}
                        className="rounded-2xl border border-dashed border-white/10 hover:border-indigo-500/40 p-6 flex flex-col items-center justify-center gap-3 text-slate-500 hover:text-indigo-400 transition-all duration-300 group min-h-[160px]"
                    >
                        <div className="h-12 w-12 rounded-xl bg-white/5 group-hover:bg-indigo-500/10 border border-white/5 group-hover:border-indigo-500/20 flex items-center justify-center transition-all">
                            <Plus className="h-6 w-6" />
                        </div>
                        <span className="text-sm font-medium">Create New Role</span>
                    </button>
                </div>
            )}

            {/* ── CREATE MODAL ── */}
            {createOpen && (
                <PermissionsModal
                    title="Create New Role"
                    subtitle="Define a name and select permissions"
                    saving={createSaving}
                    saveError={createError}
                    onSave={handleCreate}
                    onClose={() => { setCreateOpen(false); setCreateError(""); }}
                />
            )}

            {/* ── EDIT MODAL ── */}
            {editTarget && (
                <PermissionsModal
                    title={`Edit Role: ${editTarget.name}`}
                    subtitle="Modify name, description or individual permissions"
                    initialName={editTarget.name}
                    initialDesc={editTarget.description ?? ""}
                    initialPerms={new Set(editTarget.permissions)}
                    saving={editSaving}
                    saveError={editError}
                    onSave={handleEdit}
                    onClose={() => { setEditTarget(null); setEditError(""); }}
                />
            )}

            {/* ── DELETE CONFIRM ── */}
            {deleteTarget && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
                    <div className="bg-[#0F172A] border border-white/10 rounded-3xl p-8 max-w-sm w-full shadow-2xl text-center">
                        <div className="h-14 w-14 rounded-full bg-rose-500/10 border border-rose-500/20 flex items-center justify-center mx-auto mb-4">
                            <Trash2 className="h-6 w-6 text-rose-400" />
                        </div>
                        <h3 className="text-lg font-bold text-white mb-2">Delete Role?</h3>
                        <p className="text-slate-400 text-sm mb-6">
                            Are you sure you want to delete{" "}
                            <span className="text-white font-semibold">{deleteTarget.name}</span>? This cannot be undone.
                        </p>
                        <div className="flex gap-3">
                            <button onClick={() => setDeleteTarget(null)} disabled={deleting} className="flex-1 py-3 rounded-xl bg-white/5 text-slate-300 text-sm font-bold">
                                Cancel
                            </button>
                            <button
                                onClick={handleDeleteRole}
                                disabled={deleting}
                                className="flex-1 py-3 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-sm font-bold transition-all flex items-center justify-center gap-2"
                            >
                                {deleting && <Loader2 className="h-4 w-4 animate-spin" />}
                                {deleting ? "Deleting..." : "Delete"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
