"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Award,
    Download,
    ExternalLink,
    Calendar,
    Loader2,
    FileText,
    CheckCircle2,
    X,
    Shield,
    Sparkles,
    ChevronRight,
    Star,
    BarChart3,
    Hash,
    Clock,
    RefreshCw,
    Eye,
    BadgeCheck,
    BookOpen,
    TrendingUp,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { certificateApi, Certificate } from "@/lib/api/certificate.api";
import { userApi } from "@/lib/api/user.api";
import { generateStudentReportPDF } from "@/lib/utils/reportGenerator";
import { Button } from "@/shared-components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/shared-components/ui/tabs";
import { Card, CardContent } from "@/shared-components/ui/card";

interface ReportData {
    report: { generatedAt: string; analysis?: string };
    teacherReview?: { aggregateScore?: number; remarks?: string };
}

interface UserProfile {
    name: string;
    email: string;
}

// ---------------------------------------------------------------------------
// StatCard
// ---------------------------------------------------------------------------

const StatCard = ({
    icon: Icon,
    label,
    value,
    color,
    delay = 0,
}: {
    icon: React.ComponentType<{ className?: string }>;
    label: string;
    value: string | number;
    color: "cyan" | "emerald" | "purple" | "amber";
    delay?: number;
}) => {
    const palette: Record<string, string> = {
        cyan: "from-cyan-500/20 to-blue-500/10 border-cyan-500/30 text-cyan-600 dark:text-cyan-400",
        emerald: "from-emerald-500/20 to-teal-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400",
        purple: "from-purple-500/20 to-pink-500/10 border-purple-500/30 text-purple-600 dark:text-purple-400",
        amber: "from-amber-500/20 to-orange-500/10 border-amber-500/30 text-amber-600 dark:text-amber-400",
    };

    const glows: Record<string, string> = {
        cyan: "dark:group-hover:shadow-[0_0_30px_-10px_rgba(6,182,212,0.5)]",
        emerald: "dark:group-hover:shadow-[0_0_30px_-10px_rgba(52,211,153,0.5)]",
        purple: "dark:group-hover:shadow-[0_0_30px_-10px_rgba(168,85,247,0.5)]",
        amber: "dark:group-hover:shadow-[0_0_30px_-10px_rgba(245,158,11,0.5)]",
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay, duration: 0.5 }}
            whileHover={{ y: -4 }}
        >
            <Card className={cn(
                "group relative overflow-hidden bg-gradient-to-br backdrop-blur-xl border border-slate-200 dark:border-white/10 rounded-[1.5rem] transition-all duration-500 shadow-xl shadow-slate-200/50 dark:shadow-none",
                "bg-white dark:bg-white/[0.05] dark:to-[#0A0A0A]",
                palette[color],
                glows[color]
            )}>
                <div className={cn("absolute -top-8 -right-8 w-24 h-24 rounded-full blur-[30px] transition-colors duration-700",
                    color === "cyan" ? "bg-cyan-500/10 dark:group-hover:bg-cyan-500/20" :
                    color === "emerald" ? "bg-emerald-500/10 dark:group-hover:bg-emerald-500/20" :
                    color === "purple" ? "bg-purple-500/10 dark:group-hover:bg-purple-500/20" :
                    "bg-amber-500/10 dark:group-hover:bg-amber-500/20"
                )} />
                <CardContent className="p-6 relative z-10">
                    <div className={cn("p-3 bg-gradient-to-br rounded-xl border w-fit mb-4 group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300", palette[color])}>
                        <Icon className="h-5 w-5" />
                    </div>
                    <div className="text-2xl font-extrabold text-foreground tracking-tight">{value}</div>
                    <div className="text-xs text-muted-foreground font-medium uppercase tracking-widest mt-1">{label}</div>
                </CardContent>
            </Card>
        </motion.div>
    );
};

// ---------------------------------------------------------------------------
// Certificate Preview Modal
// ---------------------------------------------------------------------------

const CertificateModal = ({
    cert,
    onClose,
    onDownload,
}: {
    cert: Certificate;
    onClose: () => void;
    onDownload: (cert: Certificate) => void;
}) => {
    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 dark:bg-black/80 backdrop-blur-md"
                onClick={onClose}
            >
                <motion.div
                    initial={{ opacity: 0, scale: 0.85, y: 40 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.85, y: 40 }}
                    transition={{ type: "spring", damping: 25, stiffness: 300 }}
                    onClick={(e) => e.stopPropagation()}
                    className="relative w-full max-w-2xl bg-background border border-border rounded-[2rem] overflow-hidden shadow-2xl"
                >
                    {/* Modal header gradient stripe */}
                    <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 via-cyan-500 to-purple-500" />

                    {/* Close button */}
                    <button
                        onClick={onClose}
                        className="absolute top-5 right-5 z-10 p-2 rounded-full bg-slate-100 dark:bg-muted hover:bg-slate-200 dark:hover:bg-muted/80 border border-slate-200 dark:border-border text-slate-500 dark:text-muted-foreground hover:text-slate-900 dark:hover:text-foreground transition-all"
                    >
                        <X size={18} />
                    </button>

                    {/* Certificate Card Visual */}
                    <div className="p-8 md:p-12">
                        {/* Parchment-style certificate */}
                        <div className="relative rounded-2xl overflow-hidden border border-emerald-500/30 bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-[#0A1A12] dark:to-[#020A05] p-8 text-center shadow-[inset_0_0_60px_rgba(16,185,129,0.05)]">
                            {/* Corner ornaments */}
                            <div className="absolute top-3 left-3 w-12 h-12 border-t-2 border-l-2 border-emerald-500/40 rounded-tl-xl" />
                            <div className="absolute top-3 right-3 w-12 h-12 border-t-2 border-r-2 border-emerald-500/40 rounded-tr-xl" />
                            <div className="absolute bottom-3 left-3 w-12 h-12 border-b-2 border-l-2 border-emerald-500/40 rounded-bl-xl" />
                            <div className="absolute bottom-3 right-3 w-12 h-12 border-b-2 border-r-2 border-emerald-500/40 rounded-br-xl" />

                            {/* Background watermark */}
                            <div className="absolute inset-0 flex items-center justify-center opacity-[0.04] pointer-events-none">
                                <Award className="w-64 h-64 text-emerald-500" />
                            </div>

                            <div className="relative z-10">
                                <div className="flex justify-center mb-4">
                                    <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl shadow-[0_0_20px_rgba(16,185,129,0.15)]">
                                        <Award className="h-10 w-10 text-emerald-600 dark:text-emerald-400" />
                                    </div>
                                </div>
                                <div className="text-[10px] font-bold uppercase tracking-[0.3em] text-emerald-600/70 dark:text-emerald-400/70 mb-2">
                                    Praedico Learning Platform
                                </div>
                                <h2 className="text-2xl md:text-3xl font-extrabold text-foreground mb-1">
                                    Certificate of Completion
                                </h2>
                                <p className="text-emerald-600/80 dark:text-emerald-400/80 text-sm font-medium mb-6">
                                    {cert.planName} Plan
                                </p>

                                <div className="space-y-0.5 mb-6">
                                    <div className="text-xs text-muted-foreground">Program Duration</div>
                                    <div className="text-sm text-foreground font-semibold">
                                        {new Date(cert.startDate).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
                                        {" — "}
                                        {new Date(cert.endDate).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
                                    </div>
                                </div>

                                <div className="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-muted border border-slate-200 dark:border-border rounded-xl shadow-sm">
                                    <Hash size={12} className="text-slate-500 dark:text-muted-foreground" />
                                    <span className="text-[11px] font-mono text-slate-900 dark:text-foreground tracking-widest">{cert.certificateNumber}</span>
                                </div>
                            </div>
                        </div>

                        {/* Info row */}
                        <div className="grid grid-cols-3 gap-4 mt-6">
                            {[
                                { label: "Issued On", value: new Date(cert.issuedAt).toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" }), icon: Calendar },
                                { label: "Plan Type", value: cert.planName, icon: BookOpen },
                                { label: "Status", value: "Verified", icon: BadgeCheck },
                            ].map(({ label, value, icon: Icon }) => (
                                <div key={label} className="bg-slate-50 dark:bg-muted/50 border border-slate-200 dark:border-border rounded-xl p-3 text-center shadow-sm">
                                    <Icon className="w-4 h-4 text-emerald-600 dark:text-emerald-400 mx-auto mb-1.5" />
                                    <div className="text-[10px] text-slate-500 dark:text-muted-foreground uppercase tracking-wide">{label}</div>
                                    <div className="text-xs text-slate-900 dark:text-foreground font-semibold mt-0.5">{value}</div>
                                </div>
                            ))}
                        </div>

                        {/* Actions */}
                        <div className="flex gap-3 mt-6">
                            <Button
                                asChild
                                variant="ghost"
                                className="flex-1 flex items-center justify-center gap-2 py-6 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-sm rounded-xl transition-all shadow-lg shadow-emerald-900/20"
                            >
                                <motion.button
                                    whileHover={{ scale: 1.02, boxShadow: "0 0 20px rgba(16,185,129,0.3)" }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={() => onDownload(cert)}
                                >
                                    <Download size={16} /> Download Certificate
                                </motion.button>
                            </Button>
                            <Button
                                asChild
                                variant="outline"
                                className="px-5 py-6 rounded-xl transition-all"
                            >
                                <motion.button
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={() => onDownload(cert)}
                                    title="Open in new tab"
                                >
                                    <ExternalLink size={18} />
                                </motion.button>
                            </Button>
                        </div>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
};

// ---------------------------------------------------------------------------
// Main Page
// ---------------------------------------------------------------------------

export default function ReportsPage() {
    const [certificates, setCertificates] = useState<Certificate[]>([]);
    const [report, setReport] = useState<ReportData | null>(null);
    const [user, setUser] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [activeTab, setActiveTab] = useState<"all" | "certificates" | "reports">("all");
    const [selectedCert, setSelectedCert] = useState<Certificate | null>(null);

    const fetchData = async (bg = false) => {
        if (!bg) setLoading(true);
        else setRefreshing(true);
        try {
            try {
                const axiosInstance = (await import("@/lib/axios")).default;
                const userRes = await axiosInstance.get("/api/users/me");
                if (userRes.data?.success) setUser(userRes.data.user);
            } catch { /* silent */ }

            const certRes = await certificateApi.getMyCertificates();
            if (certRes.success) setCertificates(certRes.data);

            const reportRes = await userApi.getMyReport();
            if (reportRes.success) setReport(reportRes);
        } catch (error) {
            console.error("Failed to fetch reports/certificates:", error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => { fetchData(); }, []);

    const handleDownloadCertificate = (cert: Certificate) => {
        const url = `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001"}${cert.certificateUrl}`;
        const link = document.createElement("a");
        link.href = url;
        link.target = "_blank";
        link.download = `Certificate_${cert.certificateNumber}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleDownloadReport = () => {
        if (!report || !user) return;
        generateStudentReportPDF(
            user.name,
            user.email,
            report.report.generatedAt,
            report.report.analysis || "",
            report.teacherReview as any
        );
    };

    const totalItems = (report ? 1 : 0) + certificates.length;
    const hasContent = totalItems > 0;

    const showReport = activeTab === "all" || activeTab === "reports";
    const showCerts = activeTab === "all" || activeTab === "certificates";

    const tabs = [
        { id: "all", label: "All Documents", count: totalItems },
        { id: "certificates", label: "Certificates", count: certificates.length },
        { id: "reports", label: "Reports", count: report ? 1 : 0 },
    ] as const;

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-background text-slate-900 dark:text-foreground font-sans selection:bg-cyan-500/30 overflow-x-hidden">

            {/* ── Ambient Background ── */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden">
                <div className="absolute top-[-10%] left-[-5%] w-[700px] h-[700px] bg-emerald-500/5 dark:bg-emerald-600/10 rounded-full blur-[160px] animate-[pulse_10s_ease-in-out_infinite]" />
                <div className="absolute top-[30%] right-[-10%] w-[600px] h-[600px] bg-cyan-500/5 dark:bg-cyan-600/8 rounded-full blur-[140px] animate-[pulse_12s_ease-in-out_infinite]" />
                <div className="absolute bottom-[-10%] left-[30%] w-[500px] h-[500px] bg-purple-500/5 dark:bg-purple-600/8 rounded-full blur-[130px] animate-[pulse_9s_ease-in-out_infinite]" />
            </div>

            <div className="relative z-10 max-w-[1400px] mx-auto px-5 md:px-10 pt-24 pb-16 space-y-10">

                {/* ── Header ── */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                    className="flex flex-col md:flex-row items-start md:items-end justify-between gap-6"
                >
                    <div>
                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.1 }}
                            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-bold uppercase tracking-wider mb-5"
                        >
                            <Sparkles size={13} className="animate-pulse" />
                            Achievements &amp; Records
                        </motion.div>

                        <h1 className="text-4xl md:text-6xl font-extrabold text-slate-900 dark:text-foreground tracking-tighter leading-none">
                            My{" "}
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-500 via-cyan-500 to-purple-500">
                                Reports &amp; Certs
                            </span>
                        </h1>
                        <p className="text-slate-500 dark:text-muted-foreground mt-3 max-w-lg text-sm md:text-base leading-relaxed">
                            Your official Praedico portfolio performance reports and course completion certificates — all in one place.
                        </p>
                    </div>

                    <Button
                        variant="outline"
                        asChild
                        className="flex items-center gap-2 px-5 py-6 border-emerald-500/30 hover:border-emerald-500 text-emerald-600 dark:text-emerald-300 hover:bg-emerald-500/10 rounded-xl transition-all shadow-lg shrink-0 h-auto"
                    >
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => fetchData(true)}
                        >
                            <RefreshCw size={16} className={cn("transition-transform", refreshing && "animate-spin")} />
                            <span className="font-semibold text-sm hidden sm:inline">Refresh</span>
                        </motion.button>
                    </Button>
                </motion.div>

                {/* ── Stats Row ── */}
                {!loading && hasContent && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <StatCard icon={Award} label="Certificates" value={certificates.length} color="emerald" delay={0.05} />
                        <StatCard icon={FileText} label="Reports" value={report ? 1 : 0} color="cyan" delay={0.1} />
                        <StatCard icon={TrendingUp} label="Avg Score" value={report?.teacherReview?.aggregateScore ? `${report.teacherReview.aggregateScore}/100` : "—"} color="purple" delay={0.15} />
                        <StatCard icon={Star} label="Status" value="Verified" color="amber" delay={0.2} />
                    </div>
                )}

                {/* ── Tabs ── */}
                {!loading && hasContent && (
                    <Tabs value={activeTab} onValueChange={(val) => setActiveTab(val as any)} className="w-fit">
                        <TabsList className="bg-white dark:bg-muted border border-slate-200 dark:border-border rounded-2xl p-1.5 shadow-sm dark:shadow-inner h-auto flex gap-2">
                            {tabs.map((tab) => (
                                <TabsTrigger
                                    key={tab.id}
                                    value={tab.id}
                                    className="relative flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 data-[state=active]:text-slate-900 dark:data-[state=active]:text-foreground data-[state=active]:shadow-none data-[state=active]:bg-transparent text-slate-500 dark:text-muted-foreground hover:text-slate-900 dark:hover:text-foreground border-0 outline-none"
                                >
                                    {activeTab === tab.id && (
                                        <motion.div
                                            layoutId="active-tab"
                                            className="absolute inset-0 bg-gradient-to-r from-emerald-500/20 to-cyan-500/20 border border-emerald-500/30 rounded-xl"
                                            transition={{ type: "spring", duration: 0.4 }}
                                        />
                                    )}
                                    <span className="relative z-10">{tab.label}</span>
                                    <span className={cn(
                                        "relative z-10 min-w-[20px] h-5 flex items-center justify-center text-[10px] font-bold rounded-full px-1.5",
                                        activeTab === tab.id
                                            ? "bg-emerald-500/20 text-emerald-600 dark:text-emerald-300 border border-emerald-500/30"
                                            : "bg-slate-100 dark:bg-muted-foreground/10 text-slate-500 dark:text-muted-foreground"
                                    )}>
                                        {tab.count}
                                    </span>
                                </TabsTrigger>
                            ))}
                        </TabsList>
                    </Tabs>
                )}

                {/* ── Content ── */}
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-36">
                        <div className="relative">
                            <div className="w-20 h-20 border-2 border-emerald-500/30 rounded-full animate-spin border-t-emerald-500" />
                            <Award className="absolute inset-0 m-auto h-8 w-8 text-emerald-500 animate-pulse" />
                        </div>
                        <p className="text-slate-500 dark:text-muted-foreground font-medium mt-6 tracking-wide">Loading your achievements...</p>
                    </div>
                ) : !hasContent ? (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="flex flex-col items-center justify-center py-36 bg-white dark:bg-muted/30 border border-slate-200 dark:border-border rounded-[2.5rem] shadow-xl shadow-slate-200/50 dark:shadow-none"
                    >
                        <div className="relative mb-6">
                            <div className="p-7 bg-slate-50 dark:bg-muted rounded-full border border-slate-200 dark:border-border shadow-sm">
                                <FileText size={48} className="text-slate-400 dark:text-muted-foreground" />
                            </div>
                            <div className="absolute -bottom-1 -right-1 bg-amber-500 p-2 rounded-full border-4 border-white dark:border-background shadow-sm">
                                <Clock size={14} className="text-white" />
                            </div>
                        </div>
                        <h2 className="text-2xl font-bold text-slate-900 dark:text-foreground mb-3">Nothing Here Yet</h2>
                        <p className="text-slate-500 dark:text-muted-foreground max-w-md text-center leading-relaxed text-sm">
                            Your AI reports and certificates will appear here once your coordinator generates them. Keep investing!
                        </p>
                    </motion.div>
                ) : (
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={activeTab}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.2 }}
                            className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6"
                        >

                            {/* ── REPORT CARD ── */}
                            {showReport && report && (
                                <motion.div
                                    layout
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    whileHover={{ y: -6 }}
                                    className="group relative bg-white dark:bg-gradient-to-br dark:from-[#0A0A14] dark:to-[#050505] border border-slate-200 dark:border-cyan-500/25 hover:border-slate-300 dark:hover:border-cyan-500/60 rounded-[2rem] overflow-hidden transition-all duration-500 shadow-xl shadow-slate-200/50 dark:shadow-sm hover:shadow-2xl hover:shadow-slate-200/80 dark:hover:shadow-[0_0_50px_-15px_rgba(6,182,212,0.4)] flex flex-col"
                                >
                                    {/* Top gradient stripe */}
                                    <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-cyan-500 to-transparent opacity-60 group-hover:opacity-100 transition-opacity" />
                                    <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 dark:from-cyan-500/10 to-transparent opacity-30 group-hover:opacity-70 transition-opacity duration-500" />

                                    <div className="p-8 relative z-10 flex flex-col flex-1">
                                        {/* Card header */}
                                        <div className="flex items-start justify-between mb-6">
                                            <div className="p-3.5 bg-gradient-to-br from-cyan-500/20 to-blue-500/10 rounded-2xl border border-cyan-500/30 text-cyan-600 dark:text-cyan-400 group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300 shadow-sm">
                                                <FileText size={24} />
                                            </div>
                                            <div className="flex flex-col items-end gap-2">
                                                <div className="flex items-center gap-1.5 px-3 py-1 bg-cyan-500/10 border border-cyan-500/30 rounded-full text-cyan-700 dark:text-cyan-300 text-[10px] font-bold tracking-widest uppercase shadow-sm">
                                                    <CheckCircle2 size={12} /> AI Report
                                                </div>
                                                <div className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-50 dark:bg-muted border border-slate-200 dark:border-border rounded-full text-slate-500 dark:text-muted-foreground text-[10px] font-bold shadow-sm">
                                                    <BarChart3 size={10} /> 7-Factor
                                                </div>
                                            </div>
                                        </div>

                                        {/* Title */}
                                        <h3 className="text-xl font-extrabold text-foreground mb-1 group-hover:text-cyan-600 dark:group-hover:text-cyan-300 transition-colors">
                                            Praedico AI Analysis
                                        </h3>
                                        <p className="text-sm text-muted-foreground mb-6">Complete Portfolio Performance Assessment</p>

                                        {/* Details rows */}
                                        <div className="space-y-3 flex-1">
                                            <div className="flex items-center gap-3 bg-slate-50 dark:bg-muted/50 border border-slate-200 dark:border-border rounded-xl px-4 py-2.5 shadow-sm dark:shadow-none">
                                                <Calendar size={15} className="text-cyan-500/60 shrink-0" />
                                                <span className="text-sm text-slate-500 dark:text-muted-foreground">Generated:&nbsp;
                                                    <span className="font-semibold text-slate-900 dark:text-foreground">
                                                        {new Date(report.report.generatedAt).toLocaleDateString("en-US", { day: "numeric", month: "long", year: "numeric" })}
                                                    </span>
                                                </span>
                                            </div>
                                            {report.teacherReview?.aggregateScore != null && (
                                                <div className="flex items-center gap-3 bg-slate-50 dark:bg-muted/50 border border-slate-200 dark:border-border rounded-xl px-4 py-2.5 shadow-sm dark:shadow-none">
                                                    <Star size={15} className="text-amber-500/60 shrink-0" />
                                                    <span className="text-sm text-slate-500 dark:text-muted-foreground">Score:&nbsp;
                                                        <span className="font-bold text-emerald-600 dark:text-emerald-400">
                                                            {report.teacherReview.aggregateScore}
                                                            <span className="text-slate-400 dark:text-muted-foreground font-normal">/100</span>
                                                        </span>
                                                    </span>
                                                </div>
                                            )}
                                            {report.teacherReview?.remarks && (
                                                <div className="bg-slate-50 dark:bg-muted/30 border border-slate-200 dark:border-border rounded-xl px-4 py-3 shadow-sm dark:shadow-none">
                                                    <div className="text-[10px] text-slate-500 dark:text-muted-foreground uppercase tracking-widest mb-1.5 font-bold">Coordinator Remark</div>
                                                    <p className="text-sm text-slate-800 dark:text-foreground/80 leading-relaxed line-clamp-2">
                                                        {report.teacherReview.remarks}
                                                    </p>
                                                </div>
                                            )}
                                        </div>

                                        {/* Action buttons */}
                                        <div className="flex gap-3 mt-8">
                                            <Button
                                                asChild
                                                variant="ghost"
                                                className="flex-1 flex items-center justify-center gap-2 py-6 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold text-sm rounded-xl transition-all shadow-lg shadow-cyan-900/20"
                                            >
                                                <motion.button
                                                    whileHover={{ scale: 1.02 }}
                                                    whileTap={{ scale: 0.98 }}
                                                    onClick={handleDownloadReport}
                                                >
                                                    <Download size={16} /> Download PDF
                                                </motion.button>
                                            </Button>
                                            <Button
                                                asChild
                                                variant="outline"
                                                className="px-5 py-6 rounded-xl transition-all"
                                            >
                                                <motion.button
                                                    whileHover={{ scale: 1.02 }}
                                                    whileTap={{ scale: 0.98 }}
                                                    onClick={handleDownloadReport}
                                                    title="Open Report"
                                                >
                                                    <ExternalLink size={18} />
                                                </motion.button>
                                            </Button>
                                        </div>
                                    </div>
                                </motion.div>
                            )}

                            {/* ── CERTIFICATE CARDS ── */}
                            {showCerts && certificates.map((cert, idx) => (
                                <motion.div
                                    key={cert._id}
                                    layout
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ delay: idx * 0.07 }}
                                    whileHover={{ y: -6 }}
                                    className="group relative bg-white dark:bg-gradient-to-br dark:from-[#080F0B] dark:to-[#050505] border border-slate-200 dark:border-emerald-500/20 hover:border-slate-300 dark:hover:border-emerald-500/60 rounded-[2rem] overflow-hidden transition-all duration-500 shadow-xl shadow-slate-200/50 dark:shadow-sm hover:shadow-2xl hover:shadow-slate-200/80 dark:hover:shadow-[0_0_50px_-15px_rgba(52,211,153,0.4)] flex flex-col"
                                >
                                    {/* Top gradient stripe */}
                                    <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-emerald-500 to-transparent opacity-50 group-hover:opacity-100 transition-opacity" />
                                    <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 dark:from-emerald-500/8 to-transparent opacity-50 group-hover:opacity-100 transition-opacity duration-500" />

                                    {/* Watermark */}
                                    <div className="absolute bottom-6 right-6 opacity-[0.04] group-hover:opacity-[0.07] transition-opacity">
                                        <Award className="w-28 h-28 text-emerald-500" />
                                    </div>

                                    <div className="p-8 relative z-10 flex flex-col flex-1">
                                        {/* Card header */}
                                        <div className="flex items-start justify-between mb-6">
                                            <div className="p-3.5 bg-gradient-to-br from-emerald-500/20 to-teal-500/10 rounded-2xl border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 group-hover:scale-110 group-hover:-rotate-3 transition-transform duration-300">
                                                <Award size={24} />
                                            </div>
                                            <div className="flex flex-col items-end gap-2">
                                                <div className="flex items-center gap-1.5 px-3 py-1 bg-emerald-500/10 border border-emerald-500/25 rounded-full text-emerald-700 dark:text-emerald-300 text-[10px] font-bold uppercase tracking-widest">
                                                    <Shield size={10} /> Verified
                                                </div>
                                                <div className="text-[10px] text-muted-foreground font-mono tracking-wider px-1">
                                                    #{idx + 1}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Title */}
                                        <h3 className="text-xl font-extrabold text-foreground mb-1 group-hover:text-emerald-600 dark:group-hover:text-emerald-300 transition-colors">
                                            Certificate of Completion
                                        </h3>
                                        <p className="text-sm text-muted-foreground mb-6">{cert.planName} Plan</p>

                                        {/* Details rows */}
                                        <div className="space-y-3 flex-1">
                                            <div className="flex items-center gap-3 bg-slate-50 dark:bg-muted/50 border border-slate-200 dark:border-border rounded-xl px-4 py-2.5 shadow-sm dark:shadow-none">
                                                <Calendar size={15} className="text-emerald-500/60 shrink-0" />
                                                <span className="text-xs text-slate-500 dark:text-muted-foreground">
                                                    {new Date(cert.startDate).toLocaleDateString("en-US", { month: "short", year: "numeric" })}
                                                    &nbsp;→&nbsp;
                                                    {new Date(cert.endDate).toLocaleDateString("en-US", { month: "short", year: "numeric" })}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-3 bg-slate-50 dark:bg-muted/50 border border-slate-200 dark:border-border rounded-xl px-4 py-2.5 shadow-sm dark:shadow-none">
                                                <Clock size={15} className="text-emerald-500/60 shrink-0" />
                                                <span className="text-xs text-slate-500 dark:text-muted-foreground">Issued:&nbsp;
                                                    <span className="font-semibold text-slate-900 dark:text-foreground">
                                                        {new Date(cert.issuedAt).toLocaleDateString("en-US", { day: "numeric", month: "long", year: "numeric" })}
                                                    </span>
                                                </span>
                                            </div>
                                            {/* Certificate ID chip */}
                                            <div className="flex items-center gap-2 bg-slate-100 dark:bg-emerald-500/5 border border-slate-200 dark:border-emerald-500/15 rounded-xl px-4 py-2.5 shadow-sm dark:shadow-none">
                                                <Hash size={13} className="text-emerald-500/60 shrink-0" />
                                                <span className="text-[11px] font-mono text-emerald-600 dark:text-emerald-400/80 tracking-widest truncate">{cert.certificateNumber}</span>
                                            </div>
                                        </div>

                                        {/* Action buttons */}
                                        <div className="flex gap-3 mt-8">
                                            <Button
                                                asChild
                                                variant="outline"
                                                className="flex-1 flex items-center justify-center gap-2 py-6 border-slate-200 dark:border-border hover:border-emerald-500/40 hover:bg-emerald-50/50 dark:hover:bg-emerald-500/5 rounded-xl transition-all shadow-sm"
                                            >
                                                <motion.button
                                                    whileHover={{ scale: 1.02 }}
                                                    whileTap={{ scale: 0.98 }}
                                                    onClick={() => setSelectedCert(cert)}
                                                >
                                                    <Eye size={15} className="text-emerald-500" /> Preview
                                                </motion.button>
                                            </Button>
                                            <Button
                                                asChild
                                                variant="ghost"
                                                className="flex-1 flex items-center justify-center gap-2 py-6 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-sm rounded-xl transition-all shadow-lg shadow-emerald-900/20"
                                            >
                                                <motion.button
                                                    whileHover={{ scale: 1.02 }}
                                                    whileTap={{ scale: 0.98 }}
                                                    onClick={() => handleDownloadCertificate(cert)}
                                                >
                                                    <Download size={15} /> Download
                                                </motion.button>
                                            </Button>
                                        </div>
                                    </div>

                                    {/* Bottom animated border on hover */}
                                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-emerald-500/0 via-emerald-400 to-emerald-500/0 opacity-0 group-hover:opacity-70 transition-opacity duration-500" />
                                </motion.div>
                            ))}

                        </motion.div>
                    </AnimatePresence>
                )}

                {/* ── Verification badge / Footer ── */}
                {!loading && hasContent && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.5 }}
                        className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-6 text-sm text-muted-foreground"
                    >
                        <div className="flex items-center gap-2">
                            <Shield size={14} className="text-emerald-500" />
                            <span>All documents are digitally verified by Praedico</span>
                        </div>
                        <span className="hidden sm:inline-block text-muted-foreground/40">•</span>
                        <div className="flex items-center gap-2">
                            <BadgeCheck size={14} className="text-cyan-500" />
                            <span>Certificates issued upon plan completion</span>
                        </div>
                        <ChevronRight size={14} className="hidden sm:block text-muted-foreground/40" />
                        <span className="text-muted-foreground/40 text-xs">praedico.app</span>
                    </motion.div>
                )}
            </div>

            {/* ── Certificate Preview Modal ── */}
            {selectedCert && (
                <CertificateModal
                    cert={selectedCert}
                    onClose={() => setSelectedCert(null)}
                    onDownload={handleDownloadCertificate}
                />
            )}
        </div>
    );
}
