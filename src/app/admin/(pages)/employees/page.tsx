"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
    Users2, UserPlus, Search, RefreshCcw, ShieldCheck,
    Clock, CheckCircle2, XCircle, Loader2, X, AlertTriangle, Shield,
    MoreVertical, Pencil, Trash2, Ban, UserCheck, Phone, Mail, User, Calendar, BarChart3, TrendingUp, IndianRupee, Tag, Info,
    Activity, LogIn, UserCog, UserX, ShieldAlert, ChevronLeft, ChevronRight, MailCheck
} from "lucide-react";
import { companyApi, referralApi } from "@/lib/api";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/shared-components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/shared-components/ui/tabs";
import { Card, CardContent } from "@/shared-components/ui/card";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "@/shared-components/ui/dropdown-menu";
import { Input } from "@/shared-components/ui/input";
import { Label } from "@/shared-components/ui/label";
import { Button } from "@/shared-components/ui/button";
import { Textarea } from "@/shared-components/ui/textarea";

// ─── Types ────────────────────────────────────────────────────────────────────
interface Employee {
    _id: string;
    name: string;
    email: string;
    role: "super_admin" | "employee";
    customRole?: { _id: string; name: string; permissions: string[] };
    isActive: boolean;
    isVerified: boolean;
    phone?: string;
    avatar?: string;
    lastLogin?: string;
    createdAt: string;
}
interface CompanyRole { _id: string; name: string; }

// ─── Helpers ──────────────────────────────────────────────────────────────────
const getTimeAgo = (dateStr?: string) => {
    if (!dateStr) return "Never";
    const diff = Date.now() - new Date(dateStr).getTime();
    const m = Math.floor(diff / 60000);
    if (m < 1) return "Just now";
    if (m < 60) return `${m}m ago`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}h ago`;
    return `${Math.floor(h / 24)}d ago`;
};

const GRADIENT_CYCLE = [
    "from-indigo-500 to-blue-600",
    "from-violet-500 to-purple-600",
    "from-pink-500 to-rose-600",
    "from-emerald-500 to-teal-600",
    "from-amber-500 to-orange-600",
];

// ─── Toast ────────────────────────────────────────────────────────────────────
function Toast({ msg, type, onClose }: { msg: string; type: "success" | "error"; onClose: () => void }) {
    useEffect(() => { const t = setTimeout(onClose, 4000); return () => clearTimeout(t); }, [onClose]);
    return (
        <div className={`fixed bottom-6 right-6 z-[500] flex items-center gap-3 px-5 py-4 rounded-2xl shadow-2xl border text-sm font-semibold transition-all duration-300 ${type === "success" ? "bg-emerald-900/90 border-emerald-500/40 text-emerald-200" : "bg-rose-900/90 border-rose-500/40 text-rose-200"}`}>
            {type === "success" ? <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0" /> : <XCircle className="h-5 w-5 text-rose-400 shrink-0" />}
            {msg}
            <button onClick={onClose} className="ml-2 text-slate-400 hover:text-white"><X className="h-4 w-4" /></button>
        </div>
    );
}

// ─── Phone validation ─────────────────────────────────────────────────────────
function isValidPhone(phone: string) {
    return /^[6-9]\d{9}$/.test(phone.trim());
}

// ─── Modal Backdrop ───────────────────────────────────────────────────────────
function ModalBackdrop({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
    return (
        <div
            className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md"
            onClick={e => { if (e.target === e.currentTarget) onClose(); }}
        >
            {children}
        </div>
    );
}

// ─── Invite Modal ─────────────────────────────────────────────────────────────
function InviteModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: (emp: Employee) => void }) {
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [phone, setPhone] = useState("");
    const [aadhar, setAadhar] = useState("");
    const [address, setAddress] = useState("");
    const [joiningDate, setJoiningDate] = useState("");
    const [loading, setLoading] = useState(false);
    const [err, setErr] = useState("");

    const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    const phoneValid = phone === "" || isValidPhone(phone);
    const aadharValid = aadhar === "" || /^\d{12}$/.test(aadhar.trim());

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setErr("");
        if (!name.trim()) { setErr("Name is required."); return; }
        if (!emailValid) { setErr("Enter a valid email address."); return; }
        if (phone && !phoneValid) { setErr("Phone must be a valid 10-digit Indian mobile number."); return; }
        if (aadhar && !aadharValid) { setErr("Aadhar number must be exactly 12 digits."); return; }

        setLoading(true);
        try {
            const res = await companyApi.inviteEmployee({
                name,
                email,
                phone: phone || undefined,
                aadharNumber: aadhar || undefined,
                permanentAddress: address || undefined,
                joiningDate: joiningDate || undefined,
            } as any);
            if (res.success) {
                onSuccess(res.employee);
                onClose();
            }
        } catch (error: any) {
            setErr(error.response?.data?.message || "Failed to send invite.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={true} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-w-md bg-[#0F172A] border-white/10 p-0 shadow-2xl max-h-[90vh] overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                <DialogHeader className="px-7 pt-7 pb-4 border-b border-white/5 bg-white/[0.02]">
                    <DialogTitle className="text-xl font-bold text-white tracking-tight">Invite Employee</DialogTitle>
                    <DialogDescription className="text-sm text-slate-400 mt-1.5">
                        They'll receive an email to set their password.
                    </DialogDescription>
                </DialogHeader>

                <div className="px-7 py-5">
                    {err && (
                        <div className="mb-6 flex items-start gap-3 p-4 rounded-xl bg-rose-500/10 border border-rose-500/20">
                            <XCircle className="h-5 w-5 text-rose-400 shrink-0 mt-0.5" />
                            <p className="text-rose-300 text-sm">{err}</p>
                        </div>
                    )}

                    <form id="invite-form" onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-1.5">
                            <Label htmlFor="name" className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Full Name *</Label>
                            <div className="relative">
                                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                                <Input
                                    id="name"
                                    type="text"
                                    value={name}
                                    onChange={e => setName(e.target.value)}
                                    placeholder="e.g. Rahul Sharma"
                                    required
                                    className="pl-10 bg-[#020617] border-white/5 text-slate-200 placeholder:text-slate-600 focus-visible:ring-indigo-500/30 focus-visible:border-indigo-500/50 rounded-xl h-11"
                                />
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <Label htmlFor="email" className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Email Address *</Label>
                            <div className="relative">
                                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                                <Input
                                    id="email"
                                    type="email"
                                    value={email}
                                    onChange={e => setEmail(e.target.value)}
                                    placeholder="employee@company.com"
                                    required
                                    className={`pl-10 bg-[#020617] text-slate-200 placeholder:text-slate-600 rounded-xl h-11 transition-all ${email && !emailValid
                                            ? "border-rose-500/50 focus-visible:ring-rose-500/30 focus-visible:border-rose-500/50"
                                            : "border-white/5 focus-visible:ring-indigo-500/30 focus-visible:border-indigo-500/50"
                                        }`}
                                />
                            </div>
                            {email && !emailValid && <p className="text-rose-400 text-xs mt-1.5">Enter a valid email</p>}
                        </div>

                        <div className="space-y-1.5">
                            <Label htmlFor="phone" className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                                Phone <span className="text-slate-600 normal-case font-normal">(optional)</span>
                            </Label>
                            <div className="flex gap-2">
                                <div className="flex items-center px-4 bg-[#020617] border border-white/5 rounded-xl text-slate-500 text-sm shrink-0 h-11">
                                    🇮🇳 +91
                                </div>
                                <div className="relative flex-1">
                                    <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                                    <Input
                                        id="phone"
                                        type="tel"
                                        value={phone}
                                        onChange={e => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
                                        placeholder="9876543210"
                                        maxLength={10}
                                        className={`pl-10 bg-[#020617] text-slate-200 placeholder:text-slate-600 rounded-xl h-11 transition-all ${phone && !phoneValid
                                                ? "border-rose-500/50 focus-visible:ring-rose-500/30 focus-visible:border-rose-500/50"
                                                : "border-white/5 focus-visible:ring-indigo-500/30 focus-visible:border-indigo-500/50"
                                            }`}
                                    />
                                </div>
                            </div>
                            {phone && !phoneValid && <p className="text-rose-400 text-xs mt-1.5">Must start with 6–9 and be 10 digits</p>}
                        </div>

                        <div className="space-y-1.5">
                            <Label htmlFor="aadhar" className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                                Aadhar Number <span className="text-slate-600 normal-case font-normal">(optional)</span>
                            </Label>
                            <div className="relative">
                                <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <rect x="3" y="5" width="18" height="14" rx="2" strokeWidth="2" />
                                    <path d="M8 10h.01M12 10h.01M16 10h.01" strokeWidth="2" strokeLinecap="round" />
                                </svg>
                                <Input
                                    id="aadhar"
                                    type="text"
                                    value={aadhar}
                                    onChange={e => setAadhar(e.target.value.replace(/\D/g, "").slice(0, 12))}
                                    placeholder="12-digit Aadhar number"
                                    maxLength={12}
                                    className={`pl-10 font-mono tracking-widest bg-[#020617] text-slate-200 placeholder:text-slate-600 rounded-xl h-11 transition-all ${aadhar && !aadharValid
                                            ? "border-rose-500/50 focus-visible:ring-rose-500/30 focus-visible:border-rose-500/50"
                                            : "border-white/5 focus-visible:ring-indigo-500/30 focus-visible:border-indigo-500/50"
                                        }`}
                                />
                            </div>
                            {aadhar && !aadharValid && <p className="text-rose-400 text-xs mt-1.5">Must be exactly 12 digits</p>}
                            {aadhar.length === 12 && aadharValid && <p className="text-emerald-400 text-xs mt-1.5">✓ 12 digits entered</p>}
                        </div>

                        <div className="space-y-1.5">
                            <Label htmlFor="joiningDate" className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                                Joining Date <span className="text-slate-600 normal-case font-normal">(optional)</span>
                            </Label>
                            <div className="relative">
                                <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500 pointer-events-none" />
                                <Input
                                    id="joiningDate"
                                    type="date"
                                    value={joiningDate}
                                    onChange={e => setJoiningDate(e.target.value)}
                                    className="pl-10 bg-[#020617] border-white/5 text-slate-200 focus-visible:ring-indigo-500/30 focus-visible:border-indigo-500/50 rounded-xl h-11 [color-scheme:dark]"
                                />
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <Label htmlFor="address" className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                                Permanent Address <span className="text-slate-600 normal-case font-normal">(optional)</span>
                            </Label>
                            <Textarea
                                id="address"
                                value={address}
                                onChange={e => setAddress(e.target.value)}
                                placeholder="Full permanent address..."
                                rows={2}
                                className="resize-none bg-[#020617] border-white/5 text-slate-200 placeholder:text-slate-600 focus-visible:ring-indigo-500/30 focus-visible:border-indigo-500/50 rounded-xl"
                            />
                        </div>
                    </form>
                </div>

                <DialogFooter className="px-7 py-5 border-t border-white/5 bg-[#0F172A]">
                    <div className="flex gap-3 w-full sm:w-auto">
                        <Button
                            type="button"
                            variant="ghost"
                            onClick={onClose}
                            className="flex-1 sm:flex-none h-11 px-6 rounded-xl text-slate-300 hover:text-white hover:bg-white/10"
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            form="invite-form"
                            disabled={loading}
                            className="flex-1 sm:flex-none h-11 px-6 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold shadow-lg shadow-indigo-900/20"
                        >
                            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {loading ? "Sending..." : "Send Invite"}
                        </Button>
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

// ─── Edit Modal ───────────────────────────────────────────────────────────────

function EditModal({ emp, onClose, onSuccess }: { emp: Employee; onClose: () => void; onSuccess: (updated: Employee) => void }) {
    const [name, setName] = useState(emp.name);
    const [phone, setPhone] = useState(emp.phone?.replace(/^\+91/, "") || "");
    const [address, setAddress] = useState((emp as any).permanentAddress || "");
    const [joiningDate, setJoiningDate] = useState(
        (emp as any).joiningDate ? new Date((emp as any).joiningDate).toISOString().split("T")[0] : ""
    );
    const [loading, setLoading] = useState(false);
    const [err, setErr] = useState("");

    const phoneValid = phone === "" || isValidPhone(phone);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setErr("");
        if (!name.trim()) { setErr("Name is required."); return; }
        if (phone && !phoneValid) { setErr("Phone must be a valid 10-digit number."); return; }

        setLoading(true);
        try {
            const res = await companyApi.updateEmployee(emp._id, {
                name,
                phone: phone ? `+91${phone}` : "",
                permanentAddress: address,
                joiningDate: joiningDate || undefined,
            } as any);
            if (res.success) { onSuccess(res.employee); onClose(); }
        } catch (error: any) {
            setErr(error.response?.data?.message || "Failed to update employee.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={true} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-w-sm bg-[#0F172A] border-white/10 p-0 shadow-2xl max-h-[90vh] overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                <DialogHeader className="px-7 pt-7 pb-4 border-b border-white/5 bg-white/[0.02]">
                    <DialogTitle className="text-xl font-bold text-white tracking-tight">Edit Employee</DialogTitle>
                </DialogHeader>

                <div className="px-7 py-5">
                    {err && (
                        <div className="mb-5 flex items-start gap-3 p-4 rounded-xl bg-rose-500/10 border border-rose-500/20">
                            <XCircle className="h-5 w-5 text-rose-400 shrink-0 mt-0.5" />
                            <p className="text-rose-300 text-sm">{err}</p>
                        </div>
                    )}

                    <form id="edit-form" onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-1.5">
                            <Label htmlFor="edit-name" className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Full Name</Label>
                            <div className="relative">
                                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                                <Input
                                    id="edit-name"
                                    type="text"
                                    value={name}
                                    onChange={e => setName(e.target.value)}
                                    className="pl-10 bg-[#020617] border-white/5 text-slate-200 focus-visible:ring-indigo-500/30 focus-visible:border-indigo-500/50 rounded-xl h-11"
                                />
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <Label htmlFor="edit-phone" className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Phone</Label>
                            <div className="flex gap-2">
                                <div className="flex items-center px-4 bg-[#020617] border border-white/5 rounded-xl text-slate-500 text-sm shrink-0 h-11">
                                    🇮🇳 +91
                                </div>
                                <div className="relative flex-1">
                                    <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                                    <Input
                                        id="edit-phone"
                                        type="tel"
                                        value={phone}
                                        onChange={e => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
                                        placeholder="9876543210"
                                        maxLength={10}
                                        className={`pl-10 bg-[#020617] text-slate-200 placeholder:text-slate-600 rounded-xl h-11 transition-all ${phone && !phoneValid
                                                ? "border-rose-500/50 focus-visible:ring-rose-500/30 focus-visible:border-rose-500/50"
                                                : "border-white/5 focus-visible:ring-indigo-500/30 focus-visible:border-indigo-500/50"
                                            }`}
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <Label htmlFor="edit-joiningDate" className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Joining Date</Label>
                            <div className="relative">
                                <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500 pointer-events-none" />
                                <Input
                                    id="edit-joiningDate"
                                    type="date"
                                    value={joiningDate}
                                    onChange={e => setJoiningDate(e.target.value)}
                                    className="pl-10 bg-[#020617] border-white/5 text-slate-200 focus-visible:ring-indigo-500/30 focus-visible:border-indigo-500/50 rounded-xl h-11 [color-scheme:dark]"
                                />
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <Label htmlFor="edit-address" className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Permanent Address</Label>
                            <Textarea
                                id="edit-address"
                                value={address}
                                onChange={e => setAddress(e.target.value)}
                                placeholder="Full permanent address..."
                                rows={2}
                                className="resize-none bg-[#020617] border-white/5 text-slate-200 placeholder:text-slate-600 focus-visible:ring-indigo-500/30 focus-visible:border-indigo-500/50 rounded-xl"
                            />
                        </div>
                    </form>
                </div>

                <DialogFooter className="px-7 py-5 border-t border-white/5 bg-[#0F172A]">
                    <div className="flex gap-3 w-full sm:w-auto">
                        <Button
                            type="button"
                            variant="ghost"
                            onClick={onClose}
                            className="flex-1 sm:flex-none h-11 px-6 rounded-xl text-slate-300 hover:text-white hover:bg-white/10"
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            form="edit-form"
                            disabled={loading}
                            className="flex-1 sm:flex-none h-11 px-6 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold shadow-lg shadow-indigo-900/20"
                        >
                            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {loading ? "Saving..." : "Save"}
                        </Button>
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

// ─── Delete Confirm Modal ────────────────────────────────────────────────────
function DeleteModal({ emp, onClose, onSuccess }: { emp: Employee; onClose: () => void; onSuccess: (id: string) => void }) {
    const [loading, setLoading] = useState(false);

    const handleDelete = async () => {
        setLoading(true);
        try {
            await companyApi.deleteEmployee(emp._id);
            onSuccess(emp._id);
            onClose();
        } catch (err: any) {
            alert(err.response?.data?.message || "Failed to delete.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <ModalBackdrop onClose={onClose}>
            <div className="bg-[#0F172A] border border-white/10 rounded-3xl p-7 w-full max-w-sm shadow-2xl text-center">
                <div className="h-14 w-14 rounded-full bg-rose-500/10 border border-rose-500/20 flex items-center justify-center mx-auto mb-4">
                    <Trash2 className="h-6 w-6 text-rose-400" />
                </div>
                <h3 className="text-lg font-bold text-white mb-2">Delete Employee?</h3>
                <p className="text-slate-400 text-sm mb-6">
                    This will permanently remove <span className="text-white font-semibold">{emp.name}</span> from the portal. This action cannot be undone.
                </p>
                <div className="flex gap-3">
                    <button onClick={onClose} className="flex-1 py-3 rounded-xl bg-white/5 text-slate-300 text-sm font-bold hover:bg-white/10 transition-all">Cancel</button>
                    <button
                        onClick={handleDelete}
                        disabled={loading}
                        className="flex-1 py-3 rounded-xl bg-rose-600 hover:bg-rose-500 disabled:opacity-60 text-white text-sm font-bold flex items-center justify-center gap-2"
                    >
                        {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                        {loading ? "Deleting…" : "Delete"}
                    </button>
                </div>
            </div>
        </ModalBackdrop>
    );
}

// ─── Assign Role Modal ────────────────────────────────────────────────────────
function AssignRoleModal({ emp, roles, onClose, onSuccess }: { emp: Employee; roles: CompanyRole[]; onClose: () => void; onSuccess: (updated: Employee) => void }) {
    const [selectedRoleId, setSelectedRoleId] = useState(emp.customRole?._id || "");
    const [assigning, setAssigning] = useState(false);

    const handleAssign = async () => {
        setAssigning(true);
        try {
            const res = await companyApi.assignRole(emp._id, selectedRoleId || null);
            if (res.success) { onSuccess(res.member); onClose(); }
        } catch (err: any) {
            alert(err.response?.data?.message || "Failed to assign role.");
        } finally {
            setAssigning(false);
        }
    };

    if (roles.length === 0) {
        return (
            <ModalBackdrop onClose={onClose}>
                <div className="bg-[#0F172A] border border-white/10 rounded-3xl p-8 max-w-sm w-full shadow-2xl text-center">
                    <div className="h-14 w-14 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mx-auto mb-4">
                        <AlertTriangle className="h-6 w-6 text-amber-400" />
                    </div>
                    <h3 className="text-lg font-bold text-white mb-2">No Roles Available</h3>
                    <p className="text-slate-400 text-sm mb-6">Create custom roles in the "Roles & Permissions" tab first.</p>
                    <button onClick={onClose} className="w-full py-3 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-sm font-bold transition-all">Close</button>
                </div>
            </ModalBackdrop>
        );
    }

    return (
        <ModalBackdrop onClose={onClose}>
            <div className="bg-[#0F172A] border border-white/10 rounded-3xl p-6 w-full max-w-md shadow-2xl">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h3 className="text-lg font-bold text-white">Assign Role</h3>
                        <p className="text-sm text-slate-500">For <span className="text-slate-300 font-semibold">{emp.name}</span></p>
                    </div>
                    <button onClick={onClose} className="p-2 rounded-xl hover:bg-white/5 text-slate-400"><X className="h-5 w-5" /></button>
                </div>
                <div className="space-y-3 mb-6">
                    <label className={`flex items-center gap-3 p-4 rounded-xl border cursor-pointer transition-all ${selectedRoleId === "" ? "border-indigo-500/50 bg-indigo-500/5" : "border-white/5 hover:bg-white/5"}`}>
                        <input type="radio" name="role" checked={selectedRoleId === ""} onChange={() => setSelectedRoleId("")} className="h-4 w-4 text-indigo-500" />
                        <div>
                            <p className="text-sm font-medium text-slate-200">No Role (Default)</p>
                            <p className="text-xs text-slate-500">Employee will have no custom permissions.</p>
                        </div>
                    </label>
                    {roles.map(role => (
                        <label key={role._id} className={`flex items-center gap-3 p-4 rounded-xl border cursor-pointer transition-all ${selectedRoleId === role._id ? "border-indigo-500/50 bg-indigo-500/5" : "border-white/5 hover:bg-white/5"}`}>
                            <input type="radio" name="role" checked={selectedRoleId === role._id} onChange={() => setSelectedRoleId(role._id)} className="h-4 w-4 text-indigo-500" />
                            <p className="text-sm font-medium text-slate-200">{role.name}</p>
                        </label>
                    ))}
                </div>
                <div className="flex gap-3">
                    <button onClick={onClose} className="flex-1 py-3 rounded-xl bg-white/5 text-slate-300 text-sm font-bold">Cancel</button>
                    <button onClick={handleAssign} disabled={assigning} className="flex-1 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60 text-white text-sm font-bold flex items-center justify-center gap-2">
                        {assigning && <Loader2 className="h-4 w-4 animate-spin" />}
                        {assigning ? "Saving…" : "Save Assignment"}
                    </button>
                </div>
            </div>
        </ModalBackdrop>
    );
}

// ─── Action Dropdown ──────────────────────────────────────────────────────────
function ActionMenu({ emp, onEdit, onDelete, onBlock, onAssignRole, onViewStats, onResendInvite }: {
    emp: Employee;
    onEdit: () => void;
    onDelete: () => void;
    onBlock: () => void;
    onAssignRole: () => void;
    onViewStats: () => void;
    onResendInvite: () => void;
}) {
    const actions = [
        { icon: BarChart3, label: "View Performance", onClick: onViewStats, color: "text-emerald-400" },
        { icon: Shield, label: "Assign Role", onClick: onAssignRole, color: "text-indigo-400" },
        { icon: Pencil, label: "Edit", onClick: onEdit, color: "text-slate-300" },
        ...(!emp.isVerified ? [{ icon: MailCheck, label: "Resend Invite", onClick: onResendInvite, color: "text-amber-400" }] : []),
        { icon: emp.isActive ? Ban : UserCheck, label: emp.isActive ? "Block" : "Unblock", onClick: onBlock, color: emp.isActive ? "text-amber-400" : "text-emerald-400" },
        { icon: Trash2, label: "Delete", onClick: onDelete, color: "text-rose-400" },
    ];

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <button
                    className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-all outline-none"
                    aria-label="Actions"
                >
                    <MoreVertical className="h-4 w-4" />
                </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48 bg-[#0F172A] border border-white/10 rounded-2xl shadow-2xl p-1">
                {actions.map(({ icon: Icon, label, onClick, color }) => (
                    <DropdownMenuItem
                        key={label}
                        onClick={onClick}
                        className={`flex items-center gap-3 px-3 py-2.5 text-sm font-medium cursor-pointer rounded-xl focus:bg-white/5 transition-colors ${color}`}
                    >
                        <Icon className="h-4 w-4" />
                        {label}
                    </DropdownMenuItem>
                ))}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}


// ─── Activity Log helpers (reused from activity page) ────────────────────────
const TWELVE_HOURS_MS = 12 * 60 * 60 * 1000;
const formatTs = (dateStr: string) => {
    const date = new Date(dateStr);
    const diff = Date.now() - date.getTime();
    if (diff >= TWELVE_HOURS_MS) {
        return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
            + ' · ' + date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
    }
    const m = Math.floor(diff / 60000);
    if (m < 1) return 'Just now';
    if (m < 60) return `${m}m ago`;
    return `${Math.floor(m / 60)}h ${m % 60}m ago`;
};
const ACT_META: Record<string, { label: string; icon: React.ReactNode; cls: string }> = {
    EMPLOYEE_LOGIN:   { label: 'Login',           icon: <LogIn className="h-3.5 w-3.5" />,     cls: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' },
    EMPLOYEE_CREATED: { label: 'Invited',          icon: <UserPlus className="h-3.5 w-3.5" />,  cls: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20' },
    EMPLOYEE_UPDATED: { label: 'Updated',          icon: <UserCog className="h-3.5 w-3.5" />,   cls: 'text-blue-400 bg-blue-500/10 border-blue-500/20' },
    EMPLOYEE_DELETED: { label: 'Removed',          icon: <Trash2 className="h-3.5 w-3.5" />,    cls: 'text-rose-400 bg-rose-500/10 border-rose-500/20' },
    EMPLOYEE_BLOCKED: { label: 'Blocked/Unblocked',icon: <UserX className="h-3.5 w-3.5" />,     cls: 'text-orange-400 bg-orange-500/10 border-orange-500/20' },
    ROLE_CREATED:     { label: 'Role Created',     icon: <ShieldCheck className="h-3.5 w-3.5" />, cls: 'text-violet-400 bg-violet-500/10 border-violet-500/20' },
    ROLE_UPDATED:     { label: 'Role Updated',     icon: <ShieldCheck className="h-3.5 w-3.5" />, cls: 'text-amber-400 bg-amber-500/10 border-amber-500/20' },
    ROLE_DELETED:     { label: 'Role Deleted',     icon: <ShieldAlert className="h-3.5 w-3.5" />, cls: 'text-red-400 bg-red-500/10 border-red-500/20' },
    ROLE_ASSIGNED:    { label: 'Role Assigned',    icon: <Shield className="h-3.5 w-3.5" />,     cls: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20' },
};
const getActMeta = (a: string) => ACT_META[a] ?? { label: a, icon: <Activity className="h-3.5 w-3.5" />, cls: 'text-slate-400 bg-slate-500/10 border-slate-500/20' };

// ─── Referral Details Modal ───────────────────────────────────────────────────
function ReferralDetailsModal({ emp, onClose }: { emp: Employee; onClose: () => void }) {
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState<any>(null);
    const [error, setError] = useState("");

    const [actLogs, setActLogs] = useState<any[]>([]);
    const [actLoading, setActLoading] = useState(false);
    const [actError, setActError] = useState("");
    const [actPage, setActPage] = useState(1);
    const ACT_PER_PAGE = 8;

    useEffect(() => {
        let alive = true;
        setLoading(true);
        referralApi.getEmployeePerformance(emp._id)
            .then(res => { if (alive && res.success) setData(res.data); else if (alive) setError(res.message || 'Failed'); })
            .catch(err => { if (alive) setError(err.response?.data?.message || err.message); })
            .finally(() => { if (alive) setLoading(false); });

        setActLoading(true);
        companyApi.getEmployeeActivityLogs(emp._id)
            .then(res => { if (alive && res.success) setActLogs(res.logs); else if (alive) setActError('Failed to load activity'); })
            .catch(err => { if (alive) setActError(err.response?.data?.message || err.message); })
            .finally(() => { if (alive) setActLoading(false); });

        return () => { alive = false; };
    }, [emp._id]);

    return (
        <Dialog open={true} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="bg-[#0F172A] border-white/10 sm:max-w-4xl max-h-[90vh] overflow-y-auto custom-scrollbar z-[500]">
                <DialogHeader>
                    <DialogTitle className="text-xl font-bold text-white flex items-center gap-2">
                        <BarChart3 className="h-5 w-5 text-indigo-400" />
                        Referral Performance
                    </DialogTitle>
                    <p className="text-sm text-slate-500 mt-1">For <span className="text-slate-300 font-semibold">{emp.name}</span></p>
                </DialogHeader>

                {loading ? (
                    <div className="flex flex-col items-center justify-center py-20">
                        <Loader2 className="h-8 w-8 text-indigo-500 animate-spin mb-4" />
                        <p className="text-slate-400 text-sm">Loading performance data...</p>
                    </div>
                ) : error ? (
                    <div className="flex flex-col items-center justify-center py-20 text-center">
                        <XCircle className="h-10 w-10 text-rose-500 mb-3" />
                        <p className="text-slate-400 text-sm">{error}</p>
                    </div>
                ) : data ? (
                    <div className="mt-4">
                        {/* Stats Grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                            <Card className="bg-[#020617] border-white/5 shadow-none">
                                <CardContent className="p-5">
                                    <p className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-2 flex items-center gap-1.5"><IndianRupee className="h-3.5 w-3.5 text-emerald-400" /> Revenue Generated</p>
                                    <p className="text-2xl font-bold text-emerald-400">₹{data.stats?.totalRevenue?.toLocaleString() || 0}</p>
                                </CardContent>
                            </Card>
                            <Card className="bg-[#020617] border-white/5 shadow-none">
                                <CardContent className="p-5">
                                    <p className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-2 flex items-center gap-1.5"><TrendingUp className="h-3.5 w-3.5 text-indigo-400" /> Net Profit</p>
                                    <p className="text-2xl font-bold text-indigo-400">₹{data.stats?.totalProfit?.toLocaleString() || 0}</p>
                                </CardContent>
                            </Card>
                            <Card className="bg-[#020617] border-white/5 shadow-none">
                                <CardContent className="p-5">
                                    <p className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-2 flex items-center gap-1.5"><Tag className="h-3.5 w-3.5 text-amber-400" /> Total Discount Provided</p>
                                    <p className="text-2xl font-bold text-amber-400">₹{data.stats?.totalDiscountProvided?.toLocaleString() || 0}</p>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Tabs content */}
                        <Tabs defaultValue="usages" className="w-full">
                            <TabsList className="bg-[#020617] border border-white/10 p-1 rounded-xl mb-4">
                                <TabsTrigger value="usages" className="data-[state=active]:bg-[#1E293B] data-[state=active]:text-white text-slate-400 rounded-lg">
                                    Referred Students ({data.logs?.length || 0})
                                </TabsTrigger>
                                <TabsTrigger value="codes" className="data-[state=active]:bg-[#1E293B] data-[state=active]:text-white text-slate-400 rounded-lg">
                                    Generated Codes ({data.codes?.length || 0})
                                </TabsTrigger>
                                <TabsTrigger value="activity" className="data-[state=active]:bg-[#1E293B] data-[state=active]:text-white text-slate-400 rounded-lg">
                                    Activity Log {actLogs.length > 0 && `(${actLogs.length})`}
                                </TabsTrigger>
                            </TabsList>

                            <TabsContent value="usages" className="mt-0 outline-none">
                                <div className="bg-[#020617] rounded-2xl border border-white/10 overflow-hidden">
                                    {data.logs && data.logs.length > 0 ? (
                                        <table className="w-full text-left">
                                            <thead>
                                                <tr className="border-b border-white/10 bg-white/[0.02]">
                                                    <th className="px-5 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-widest">Student</th>
                                                    <th className="px-5 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-widest">Code Used</th>
                                                    <th className="px-5 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-widest">Plan</th>
                                                    <th className="px-5 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-widest text-right">Paid</th>
                                                    <th className="px-5 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-widest text-right">Discount</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-white/5">
                                                {data.logs.map((log: any, i: number) => (
                                                    <tr key={i} className="hover:bg-white/[0.02] transition-colors">
                                                        <td className="px-5 py-4">
                                                            <p className="text-sm font-medium text-slate-200">{log.userId?.name || "Unknown"}</p>
                                                            <p className="text-xs text-slate-500">{log.userId?.email || ""}</p>
                                                        </td>
                                                        <td className="px-5 py-4">
                                                            <span className="inline-block px-2.5 py-1 bg-white/5 rounded-lg text-xs font-mono text-slate-300 border border-white/10 uppercase tracking-wider">{log.referralCode}</span>
                                                        </td>
                                                        <td className="px-5 py-4 text-sm text-slate-300 capitalize">{log.planName}</td>
                                                        <td className="px-5 py-4 text-sm font-medium text-emerald-400 text-right">₹{log.amountPaid}</td>
                                                        <td className="px-5 py-4 text-sm font-medium text-amber-400 text-right">₹{log.discountGiven}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    ) : (
                                        <div className="p-10 text-center">
                                            <Info className="h-6 w-6 text-slate-500 mx-auto mb-2" />
                                            <p className="text-slate-400 text-sm">No students have used codes from this employee yet.</p>
                                        </div>
                                    )}
                                </div>
                            </TabsContent>

                            <TabsContent value="codes" className="mt-0 outline-none">
                                <div className="bg-[#020617] rounded-2xl border border-white/10 overflow-hidden">
                                    {data.codes && data.codes.length > 0 ? (
                                        <table className="w-full text-left">
                                            <thead>
                                                <tr className="border-b border-white/10 bg-white/[0.02]">
                                                    <th className="px-5 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-widest">Coupon Code</th>
                                                    <th className="px-5 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-widest">Discount %</th>
                                                    <th className="px-5 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-widest">Uses</th>
                                                    <th className="px-5 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-widest text-right">Status</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-white/5">
                                                {data.codes.map((code: any, i: number) => (
                                                    <tr key={i} className="hover:bg-white/[0.02] transition-colors">
                                                        <td className="px-5 py-4">
                                                            <span className="inline-block px-2.5 py-1 bg-white/5 rounded-lg text-sm font-mono font-bold text-indigo-300 border border-indigo-500/20">{code.code}</span>
                                                        </td>
                                                        <td className="px-5 py-4 text-sm font-medium text-slate-300">{code.discountPercent}%</td>
                                                        <td className="px-5 py-4 text-sm text-slate-400">{code.usageCount} uses</td>
                                                        <td className="px-5 py-4 text-right">
                                                            {code.isActive ? (
                                                                <span className="inline-flex items-center gap-1.5 text-emerald-400 text-xs font-semibold uppercase tracking-wide">
                                                                    <span className="h-2 w-2 rounded-full bg-emerald-500" /> Active
                                                                </span>
                                                            ) : (
                                                                <span className="inline-flex items-center gap-1.5 text-rose-400 text-xs font-semibold uppercase tracking-wide">
                                                                    <span className="h-2 w-2 rounded-full bg-rose-500" /> Inactive
                                                                </span>
                                                            )}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    ) : (
                                        <div className="p-10 text-center">
                                            <Info className="h-6 w-6 text-slate-500 mx-auto mb-2" />
                                            <p className="text-slate-400 text-sm">No codes have been generated by this employee.</p>
                                        </div>
                                    )}
                                </div>
                            </TabsContent>
                            <TabsContent value="activity" className="mt-0 outline-none">
                                <div className="bg-[#020617] rounded-2xl border border-white/10 overflow-hidden">
                                    {actLoading ? (
                                        <div className="flex items-center justify-center py-12 gap-3">
                                            <Loader2 className="h-5 w-5 text-indigo-400 animate-spin" />
                                            <span className="text-slate-400 text-sm">Loading activity…</span>
                                        </div>
                                    ) : actError ? (
                                        <div className="flex flex-col items-center justify-center py-12">
                                            <XCircle className="h-8 w-8 text-rose-400 mb-2" />
                                            <p className="text-slate-400 text-sm">{actError}</p>
                                        </div>
                                    ) : actLogs.length === 0 ? (
                                        <div className="flex flex-col items-center justify-center py-12">
                                            <Activity className="h-8 w-8 text-slate-600 mb-3" />
                                            <p className="text-slate-400 text-sm">No activity recorded for this employee yet.</p>
                                        </div>
                                    ) : (
                                        <>
                                        <div className="divide-y divide-white/[0.04]">
                                            {actLogs.slice((actPage - 1) * ACT_PER_PAGE, actPage * ACT_PER_PAGE).map((log: any) => {
                                                const m = getActMeta(log.action);
                                                const isOld = Date.now() - new Date(log.createdAt).getTime() >= TWELVE_HOURS_MS;
                                                return (
                                                    <div key={log._id} className="flex items-start gap-3 px-5 py-3.5 hover:bg-white/[0.025] transition-colors">
                                                        <div className={`h-7 w-7 rounded-lg border flex items-center justify-center flex-shrink-0 mt-0.5 ${m.cls}`}>
                                                            {m.icon}
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <div className="flex items-center gap-2 flex-wrap">
                                                                <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${m.cls}`}>{m.label}</span>
                                                                {log.targetModel && (
                                                                    <span className="px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-white/5 uppercase tracking-wider text-[9px] font-bold">
                                                                        {log.targetModel.replace('Company', '')}
                                                                    </span>
                                                                )}
                                                            </div>
                                                            <p className="text-xs text-slate-400 mt-1 leading-relaxed">{log.details}</p>
                                                        </div>
                                                        <div className="text-right flex-shrink-0">
                                                            <div className="flex items-center gap-1 text-slate-500 justify-end">
                                                                {isOld ? <Calendar className="h-3 w-3" /> : <Clock className="h-3 w-3" />}
                                                                <span className="text-[11px] whitespace-nowrap">{formatTs(log.createdAt)}</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                        {/* Pagination */}
                                        {actLogs.length > ACT_PER_PAGE && (
                                            <div className="flex items-center justify-between px-5 py-3 border-t border-white/5 bg-white/[0.015]">
                                                <span className="text-xs text-slate-500">
                                                    {(actPage - 1) * ACT_PER_PAGE + 1}–{Math.min(actPage * ACT_PER_PAGE, actLogs.length)} of {actLogs.length}
                                                </span>
                                                <div className="flex items-center gap-1">
                                                    <button
                                                        onClick={() => setActPage(p => Math.max(1, p - 1))}
                                                        disabled={actPage === 1}
                                                        className="p-1.5 rounded-lg bg-slate-800/50 border border-white/5 text-slate-400 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                                                    >
                                                        <ChevronLeft className="h-3.5 w-3.5" />
                                                    </button>
                                                    <span className="text-xs text-slate-400 px-2 font-medium">
                                                        {actPage} / {Math.ceil(actLogs.length / ACT_PER_PAGE)}
                                                    </span>
                                                    <button
                                                        onClick={() => setActPage(p => Math.min(Math.ceil(actLogs.length / ACT_PER_PAGE), p + 1))}
                                                        disabled={actPage >= Math.ceil(actLogs.length / ACT_PER_PAGE)}
                                                        className="p-1.5 rounded-lg bg-slate-800/50 border border-white/5 text-slate-400 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                                                    >
                                                        <ChevronRight className="h-3.5 w-3.5" />
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                        </>
                                    )}
                                </div>
                            </TabsContent>
                        </Tabs>
                    </div>
                ) : null}
            </DialogContent>
            {/* Custom Scrollbar Styles for the Modal */}
            <style dangerouslySetInnerHTML={{
                __html: `
                .custom-scrollbar::-webkit-scrollbar { width: 6px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 10px; }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.2); }
            `}} />
        </Dialog>
    );
}

// ─── Page Component ───────────────────────────────────────────────────────────
export default function AllEmployeesPage() {
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [roles, setRoles] = useState<CompanyRole[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [error, setError] = useState("");

    // Toast
    const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);

    // Modal state
    const [showInvite, setShowInvite] = useState(false);
    const [editTarget, setEditTarget] = useState<Employee | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<Employee | null>(null);
    const [assignTarget, setAssignTarget] = useState<Employee | null>(null);
    const [statsTarget, setStatsTarget] = useState<Employee | null>(null);
    const [blockingId, setBlockingId] = useState<string | null>(null);
    const [resendingInviteId, setResendingInviteId] = useState<string | null>(null);

    const showToast = useCallback((msg: string, type: "success" | "error" = "success") => {
        setToast({ msg, type });
    }, []);

    const fetchData = useCallback(async () => {
        setLoading(true);
        setError("");
        try {
            const [empRes, roleRes] = await Promise.all([
                companyApi.getEmployees(search || undefined),
                companyApi.listRoles(),
            ]);
            if (empRes.success) setEmployees(empRes.employees);
            if (roleRes.success) setRoles(roleRes.roles);
        } catch (err: any) {
            setError(err.response?.data?.message || "Failed to fetch data");
        } finally {
            setLoading(false);
        }
    }, [search]);

    useEffect(() => {
        const t = setTimeout(fetchData, 300);
        return () => clearTimeout(t);
    }, [fetchData]);

    const handleBlock = async (emp: Employee) => {
        setBlockingId(emp._id);
        try {
            const res = await companyApi.toggleBlock(emp._id);
            if (res.success) {
                setEmployees(prev => prev.map(e => e._id === emp._id ? { ...e, isActive: res.employee.isActive } : e));
                showToast(res.message);
            }
        } catch (err: any) {
            showToast(err.response?.data?.message || "Failed to update status.", "error");
        } finally {
            setBlockingId(null);
        }
    };

    const handleResendInvite = async (emp: Employee) => {
        setResendingInviteId(emp._id);
        try {
            const res = await companyApi.resendInvite(emp._id);
            if (res.success) {
                showToast(`Invite resent to ${emp.email}`);
            }
        } catch (err: any) {
            showToast(err.response?.data?.message || "Failed to resend invite.", "error");
        } finally {
            setResendingInviteId(null);
        }
    };

    const total = employees.length;
    const active = employees.filter(e => e.isActive).length;
    const superAdmins = employees.filter(e => e.role === "super_admin").length;

    return (
        <div className="space-y-6">
            {/* Toast */}
            {toast && <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />}

            {/* Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {[
                    { label: "Total Members", value: loading ? "—" : total, color: "text-white" },
                    { label: "Active", value: loading ? "—" : active, color: "text-emerald-400" },
                    { label: "Super Admins", value: loading ? "—" : superAdmins, color: "text-indigo-400" },
                ].map(s => (
                    <div key={s.label} className="p-6 rounded-2xl bg-[#0F172A]/60 border border-white/5 backdrop-blur-xl">
                        <p className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-2">{s.label}</p>
                        <p className={`text-3xl font-bold ${s.color}`}>{s.value}</p>
                    </div>
                ))}
            </div>

            {/* Table card */}
            <div className="rounded-[28px] bg-[#0F172A]/80 border border-white/5 backdrop-blur-2xl shadow-2xl overflow-hidden">
                {/* Toolbar */}
                <div className="p-4 md:p-6 border-b border-white/5 flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
                    <div className="relative w-full sm:w-80 group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500 group-focus-within:text-indigo-400 transition-colors" />
                        <input
                            type="text"
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            placeholder="Search employees..."
                            className="w-full pl-11 pr-4 py-3 bg-[#020617] border border-white/5 rounded-xl md:rounded-2xl text-sm text-slate-200 placeholder-slate-600 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500/50 outline-none transition-all"
                        />
                    </div>
                    <div className="flex items-center gap-2 sm:gap-3">
                        <button
                            onClick={fetchData}
                            className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-all"
                            title="Refresh"
                        >
                            <RefreshCcw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
                        </button>
                        <button
                            onClick={() => setShowInvite(true)}
                            className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-bold rounded-xl transition-all shadow-lg shadow-indigo-900/30 flex-1 sm:flex-none justify-center"
                        >
                            <UserPlus className="h-4 w-4" />
                            <span>Invite Employee</span>
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="min-h-[300px] relative">
                    {loading && employees.length === 0 ? (
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                            <Loader2 className="h-8 w-8 text-indigo-500 animate-spin" />
                            <p className="mt-3 text-sm text-slate-500">Loading members...</p>
                        </div>
                    ) : error ? (
                        <div className="flex flex-col items-center justify-center py-16 text-center">
                            <XCircle className="h-10 w-10 text-rose-500 mb-3" />
                            <p className="text-slate-400 text-sm">{error}</p>
                        </div>
                    ) : employees.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-16 text-center">
                            <div className="h-16 w-16 rounded-full bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center mb-4">
                                <Users2 className="h-7 w-7 text-indigo-400" />
                            </div>
                            <h3 className="text-lg font-semibold text-white mb-1">No members found</h3>
                            <p className="text-slate-500 text-sm max-w-xs">
                                {search ? "No results match your search." : "Invite an employee to get started."}
                            </p>
                        </div>
                    ) : (
                        <>
                            {/* Mobile Card List */}
                            <div className="block md:hidden divide-y divide-white/5">
                                {employees.map((emp, i) => (
                                    <div key={emp._id} className="flex items-center gap-3 p-4">
                                        <div className={`h-10 w-10 rounded-full bg-gradient-to-br ${GRADIENT_CYCLE[i % GRADIENT_CYCLE.length]} flex items-center justify-center text-sm font-bold text-white shrink-0`}>
                                            {emp.name.charAt(0).toUpperCase()}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-semibold text-slate-200 truncate">{emp.name}</p>
                                            <p className="text-xs text-slate-500 truncate">{emp.email}</p>
                                            <div className="flex items-center gap-2 mt-1">
                                                {emp.isActive ? (
                                                    <span className="text-emerald-400 text-[10px] font-bold uppercase tracking-wide">Active</span>
                                                ) : (
                                                    <span className="text-rose-400 text-[10px] font-bold uppercase tracking-wide">Blocked</span>
                                                )}
                                                {emp.customRole && <span className="text-blue-300 text-[10px] font-bold uppercase tracking-wide">· {emp.customRole.name}</span>}
                                                {emp.role === "super_admin" && <span className="text-indigo-300 text-[10px] font-bold uppercase tracking-wide">· Super Admin</span>}
                                            </div>
                                        </div>
                                        {emp.role !== "super_admin" && (
                                            <ActionMenu
                                                emp={emp}
                                                onEdit={() => setEditTarget(emp)}
                                                onDelete={() => setDeleteTarget(emp)}
                                                onBlock={() => handleBlock(emp)}
                                                onAssignRole={() => setAssignTarget(emp)}
                                                onViewStats={() => setStatsTarget(emp)}
                                                onResendInvite={() => handleResendInvite(emp)}
                                            />
                                        )}
                                    </div>
                                ))}
                            </div>

                            {/* Desktop Table */}
                            <div className="hidden md:block overflow-x-auto">
                                <table className="w-full">
                                    <thead>
                                        <tr className="border-b border-white/5 bg-[#020617]/50">
                                            <th className="px-8 py-4 text-left text-[11px] font-bold text-slate-500 uppercase tracking-widest">Member</th>
                                            <th className="px-6 py-4 text-left text-[11px] font-bold text-slate-500 uppercase tracking-widest">Role</th>
                                            <th className="px-6 py-4 text-left text-[11px] font-bold text-slate-500 uppercase tracking-widest">Status</th>
                                            <th className="px-6 py-4 text-left text-[11px] font-bold text-slate-500 uppercase tracking-widest">Last Login</th>
                                            <th className="px-6 py-4 text-right text-[11px] font-bold text-slate-500 uppercase tracking-widest">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/5">
                                        {employees.map((emp, i) => (
                                            <tr key={emp._id} className="group hover:bg-white/[0.02] transition-colors duration-200">
                                                {/* Member */}
                                                <td className="px-8 py-4 cursor-pointer" onClick={() => setStatsTarget(emp)}>
                                                    <div className="flex items-center gap-3">
                                                        <div className={`h-10 w-10 rounded-full bg-gradient-to-br ${GRADIENT_CYCLE[i % GRADIENT_CYCLE.length]} flex items-center justify-center text-sm font-bold text-white shadow-lg shrink-0`}>
                                                            {emp.name.charAt(0).toUpperCase()}
                                                        </div>
                                                        <div>
                                                            <p className="text-sm font-semibold text-slate-200 group-hover:text-indigo-400 transition-colors">{emp.name}</p>
                                                            <p className="text-xs text-slate-500">{emp.email}</p>
                                                            {emp.phone && <p className="text-xs text-slate-600">{emp.phone}</p>}
                                                        </div>
                                                    </div>
                                                </td>

                                                {/* Role */}
                                                <td className="px-6 py-4">
                                                    {emp.role === "super_admin" ? (
                                                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-[10px] font-bold uppercase tracking-wider">
                                                            <ShieldCheck className="h-3 w-3" /> Super Admin
                                                        </span>
                                                    ) : emp.customRole ? (
                                                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-300 text-[10px] font-bold uppercase tracking-wider">
                                                            <Shield className="h-3 w-3" /> {emp.customRole.name}
                                                        </span>
                                                    ) : (
                                                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-500/10 border border-slate-500/20 text-slate-400 text-[10px] font-bold uppercase tracking-wider">
                                                            <Users2 className="h-3 w-3" /> Employee
                                                        </span>
                                                    )}
                                                </td>

                                                {/* Status */}
                                                <td className="px-6 py-4">
                                                    <div className="space-y-1">
                                                        {emp.isActive ? (
                                                            <div className="flex items-center gap-2">
                                                                <span className="relative flex h-2.5 w-2.5">
                                                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                                                                    <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500" />
                                                                </span>
                                                                <span className="text-emerald-400 text-xs font-semibold uppercase tracking-wide">Active</span>
                                                            </div>
                                                        ) : (
                                                            <div className="flex items-center gap-2">
                                                                <span className="h-2.5 w-2.5 rounded-full bg-rose-500" />
                                                                <span className="text-rose-400 text-xs font-semibold uppercase tracking-wide">Blocked</span>
                                                            </div>
                                                        )}
                                                        {!emp.isVerified && (
                                                            <p className="text-amber-500/80 text-[10px] font-medium">Invite pending</p>
                                                        )}
                                                    </div>
                                                </td>

                                                {/* Last Login */}
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-1.5 text-slate-400">
                                                        <Clock className="h-3.5 w-3.5" />
                                                        <span className="text-xs">{getTimeAgo(emp.lastLogin)}</span>
                                                    </div>
                                                </td>

                                                {/* Actions */}
                                                <td className="px-6 py-4 text-right">
                                                    {blockingId === emp._id || resendingInviteId === emp._id ? (
                                                        <Loader2 className="h-4 w-4 text-indigo-400 animate-spin ml-auto" />
                                                    ) : emp.role !== "super_admin" ? (
                                                        <ActionMenu
                                                            emp={emp}
                                                            onEdit={() => setEditTarget(emp)}
                                                            onDelete={() => setDeleteTarget(emp)}
                                                            onBlock={() => handleBlock(emp)}
                                                            onAssignRole={() => setAssignTarget(emp)}
                                                            onViewStats={() => setStatsTarget(emp)}
                                                            onResendInvite={() => handleResendInvite(emp)}
                                                        />
                                                    ) : null}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </>
                    )}
                </div>
            </div>

            {/* ── MODALS ── */}
            {showInvite && (
                <InviteModal
                    onClose={() => setShowInvite(false)}
                    onSuccess={emp => {
                        setEmployees(prev => [emp, ...prev]);
                        showToast(`Invite sent to ${emp.email}`);
                    }}
                />
            )}
            {editTarget && (
                <EditModal
                    emp={editTarget}
                    onClose={() => setEditTarget(null)}
                    onSuccess={updated => {
                        setEmployees(prev => prev.map(e => e._id === updated._id ? { ...e, ...updated } : e));
                        showToast("Employee updated successfully");
                    }}
                />
            )}
            {deleteTarget && (
                <DeleteModal
                    emp={deleteTarget}
                    onClose={() => setDeleteTarget(null)}
                    onSuccess={id => {
                        setEmployees(prev => prev.filter(e => e._id !== id));
                        showToast("Employee deleted successfully");
                    }}
                />
            )}
            {assignTarget && (
                <AssignRoleModal
                    emp={assignTarget}
                    roles={roles}
                    onClose={() => setAssignTarget(null)}
                    onSuccess={updated => {
                        setEmployees(prev => prev.map(e => e._id === updated._id ? { ...e, customRole: updated.customRole } : e));
                        showToast("Role assigned successfully");
                    }}
                />
            )}
            {statsTarget && (
                <ReferralDetailsModal
                    emp={statsTarget}
                    onClose={() => setStatsTarget(null)}
                />
            )}
        </div>
    );
}
