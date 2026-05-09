"use client";

import React, { useState } from "react";
import { 
    Dialog, 
    DialogContent, 
    DialogHeader, 
    DialogTitle, 
    DialogDescription,
    DialogFooter
} from "@/shared-components/ui/dialog";
import { Button } from "@/shared-components/ui/button";
import { Input } from "@/shared-components/ui/input";
import { Label } from "@/shared-components/ui/label";
import { Badge } from "@/shared-components/ui/badge";
import { Award, Search, User, Calendar, CheckCircle2, AlertCircle, Loader2, X } from "lucide-react";
import { certificateApi } from "@/lib/api/certificate.api";
import { format } from "date-fns";
import { Alert, AlertDescription, AlertTitle } from "@/shared-components/ui/alert";

interface CertificateModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function CertificateModal({ isOpen, onClose }: CertificateModalProps) {
    const [certificateCode, setCertificateCode] = useState("");
    const [userName, setUserName] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [validatedData, setValidatedData] = useState<any>(null);

    const handleValidate = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setValidatedData(null);

        try {
            const res = await certificateApi.validateCertificate(certificateCode, userName);
            if (res.success) {
                setValidatedData(res.data);
            } else {
                setError(res.message || "Validation failed. Please check your details.");
            }
        } catch (err: any) {
            setError(err.response?.data?.message || "An error occurred during validation.");
        } finally {
            setLoading(false);
        }
    };

    const resetForm = () => {
        setCertificateCode("");
        setUserName("");
        setError(null);
        setValidatedData(null);
    };

    const handleClose = () => {
        resetForm();
        onClose();
    };

    return (
        <Dialog open={isOpen} onOpenChange={handleClose}>
            <DialogContent className="sm:max-w-[500px] bg-[#020617] border-slate-800 text-white p-0 overflow-hidden rounded-3xl shadow-2xl shadow-indigo-500/20">
                <div className="relative p-6">
                    {/* Background decoration */}
                    <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 blur-3xl rounded-full -translate-y-1/2 translate-x-1/2 pointer-events-none" />
                    <div className="absolute bottom-0 left-0 w-32 h-32 bg-fuchsia-500/10 blur-3xl rounded-full translate-y-1/2 -translate-x-1/2 pointer-events-none" />

                    <DialogHeader className="mb-6 relative z-10">
                        <div className="flex items-center gap-4 mb-2">
                            <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 flex items-center justify-center border border-indigo-500/30">
                                <Award className="w-6 h-6 text-indigo-400" />
                            </div>
                            <div>
                                <DialogTitle className="text-2xl font-black tracking-tight text-white">Validate Certificate</DialogTitle>
                                <DialogDescription className="text-slate-500 text-sm font-medium">Verify the authenticity of a certificate</DialogDescription>
                            </div>
                        </div>
                    </DialogHeader>

                    {!validatedData ? (
                        <form onSubmit={handleValidate} className="space-y-6 relative z-10">
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="code" className="text-xs font-black uppercase tracking-widest text-slate-500">Certificate Code</Label>
                                    <div className="relative group">
                                        <div className="absolute left-0 top-0 bottom-0 px-4 flex items-center justify-center bg-slate-900 border-r border-slate-800 rounded-l-xl text-[10px] font-black text-indigo-400 tracking-widest uppercase">
                                            PRD-
                                        </div>
                                        <Input
                                            id="code"
                                            placeholder="Enter numeric code"
                                            value={certificateCode}
                                            onChange={(e) => setCertificateCode(e.target.value)}
                                            className="pl-20 py-6 bg-slate-950/50 border-slate-800 focus:border-indigo-500 rounded-xl transition-all placeholder:text-slate-700"
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="name" className="text-xs font-black uppercase tracking-widest text-slate-500">User Name</Label>
                                    <div className="relative group">
                                        <Input
                                            id="name"
                                            placeholder="Enter user name as registered"
                                            value={userName}
                                            onChange={(e) => setUserName(e.target.value)}
                                            className="py-6 bg-slate-950/50 border-slate-800 focus:border-indigo-500 rounded-xl transition-all placeholder:text-slate-700"
                                            required
                                        />
                                    </div>
                                </div>
                            </div>

                            {error && (
                                <Alert variant="destructive" className="bg-rose-500/10 border-rose-500/30 text-rose-400 rounded-xl animate-in fade-in zoom-in-95 duration-300">
                                    <AlertCircle className="h-4 w-4" />
                                    <AlertTitle className="font-bold text-xs uppercase tracking-wider mb-1">Validation Error</AlertTitle>
                                    <AlertDescription className="text-xs font-medium">{error}</AlertDescription>
                                </Alert>
                            )}

                            <div className="flex gap-3">
                                <Button
                                    type="button"
                                    variant="ghost"
                                    onClick={handleClose}
                                    className="flex-1 py-6 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition-all font-bold text-xs uppercase tracking-widest"
                                >
                                    Cancel
                                </Button>
                                <Button
                                    type="submit"
                                    disabled={loading}
                                    className="flex-1 py-6 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white transition-all font-bold text-xs uppercase tracking-widest shadow-lg shadow-indigo-600/20 active:scale-95 group"
                                >
                                    {loading ? (
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : (
                                        <>Validate Certificate <CheckCircle2 className="w-4 h-4 ml-2 group-hover:scale-110 transition-transform" /></>
                                    )}
                                </Button>
                            </div>
                        </form>
                    ) : (
                        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 relative z-10">
                            <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-2xl p-4 flex items-center gap-3 mb-6">
                                <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center text-white">
                                    <CheckCircle2 className="w-5 h-5" />
                                </div>
                                <div>
                                    <p className="text-emerald-400 font-bold text-sm">Certificate Validated</p>
                                    <p className="text-emerald-500/70 text-xs font-medium">Authenticity confirmed by Praedico Global Research</p>
                                </div>
                            </div>

                            <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 space-y-4 relative overflow-hidden group">
                                <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none group-hover:rotate-12 transition-transform duration-700">
                                    <Award className="w-24 h-24 text-white" />
                                </div>

                                <div className="space-y-1">
                                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Student Name</p>
                                    <p className="text-xl font-bold text-white tracking-tight">{validatedData.userName}</p>
                                </div>

                                <div className="h-px bg-slate-800" />

                                <div className="grid grid-cols-2 gap-6">
                                    <div className="space-y-1">
                                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Plan Name</p>
                                        <p className="text-sm font-bold text-indigo-400">{validatedData.planName}</p>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Status</p>
                                        <Badge variant="outline" className="bg-emerald-500/10 text-emerald-400 border-emerald-500/30 font-black text-[9px] uppercase tracking-widest px-2 py-0">Issued</Badge>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Issue Date</p>
                                        <div className="flex items-center gap-1.5 text-slate-300 font-bold text-[11px]">
                                            <Calendar className="w-3 h-3 text-slate-500" />
                                            {format(new Date(validatedData.issuedAt), 'dd MMM yyyy')}
                                        </div>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Validity Date</p>
                                        <div className="flex items-center gap-1.5 text-slate-300 font-bold text-[11px]">
                                            <Calendar className="w-3 h-3 text-slate-500" />
                                            {format(new Date(validatedData.endDate), 'dd MMM yyyy')}
                                        </div>
                                    </div>
                                </div>

                                <div className="pt-4 border-t border-slate-800 mt-4 flex items-center justify-between">
                                    <div>
                                        <p className="text-[9px] font-black uppercase tracking-widest text-slate-500">Certificate No.</p>
                                        <p className="text-xs font-mono font-bold text-slate-400 mt-0.5">{validatedData.certificateNumber}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-[9px] font-black uppercase tracking-widest text-slate-500">Seal</p>
                                        <div className="w-8 h-8 rounded-full border border-indigo-500/30 flex items-center justify-center text-indigo-400 mt-1 opacity-50">
                                            <Award className="w-4 h-4" />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <Button
                                onClick={resetForm}
                                className="w-full py-6 rounded-xl bg-slate-900 border border-slate-800 text-white font-bold text-xs uppercase tracking-widest hover:bg-slate-800 transition-all shadow-lg active:scale-95"
                            >
                                Validate Another
                            </Button>
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
