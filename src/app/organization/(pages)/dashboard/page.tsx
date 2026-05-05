"use client";

import { useState, useEffect } from 'react';
import { Building2, Users, UserCheck, GraduationCap, TrendingUp, ArrowRight, Activity, ShieldCheck, Crown, Clock } from 'lucide-react';
import { organizationApi } from '@/lib/api';
import Link from 'next/link';
import SubscriptionWarning from '../../_components/SubscriptionWarning';

interface Stats {
    totalStudents: number;
    pendingApprovals: number;
    activeDepartments: number;
    activeCoordinators: number;
}
interface PlanCapacity {
    Silver: { used: number; limit: number };
    Gold: { used: number; limit: number };
    Diamond: { used: number; limit: number };
}

function DarkMetricCard({ title, value, sub, icon: Icon, color, bg, border, delay }: any) {
    return (
        <div
            className={`rounded-[2rem] bg-[#0f172a] p-6 border border-slate-800 shadow-lg relative overflow-hidden group hover:shadow-2xl transition-all duration-500 hover:-translate-y-1 ${border}`}
            style={{ animation: `fadeInUp 0.6s ease-out ${delay}s backwards` }}
        >
            <div className="absolute inset-0 bg-gradient-to-br from-white/[0.02] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <div className="absolute -right-6 -top-6 w-24 h-24 rounded-full bg-gradient-to-br from-white/[0.03] to-transparent blur-xl group-hover:scale-150 transition-transform duration-700" />

            <div className="flex justify-between items-start mb-4 relative z-10">
                <div className={`p-4 rounded-2xl ${bg} group-hover:scale-110 transition-transform duration-300 ring-1 ring-white/5`}>
                    <Icon className={`h-6 w-6 ${color}`} />
                </div>
                <TrendingUp className={`w-5 h-5 ${color} opacity-50`} />
            </div>

            <div className="relative z-10">
                <p className="text-slate-400 text-sm font-medium mb-1 tracking-wide">{title}</p>
                <h3 className="text-3xl font-bold text-white tracking-tight">{value}</h3>
                <p className="text-xs text-slate-500 mt-2 font-medium flex items-center gap-1">
                    {sub}
                </p>
            </div>
        </div>
    );
}

export default function OrganizationDashboard() {
    const [stats, setStats] = useState<Stats>({
        totalStudents: 0,
        pendingApprovals: 0,
        activeDepartments: 0,
        activeCoordinators: 0,
    });
    const [orgName, setOrgName] = useState('');
    const [planData, setPlanData] = useState<{ plan: string, expiry: string | null }>({ plan: 'Free', expiry: null });
    const [planCapacity, setPlanCapacity] = useState<PlanCapacity>({
        Silver: { used: 0, limit: 0 },
        Gold: { used: 0, limit: 0 },
        Diamond: { used: 0, limit: 0 }
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [orgData, statsData, pendingData] = await Promise.all([
                    organizationApi.getMe(),
                    organizationApi.getStats(),
                    organizationApi.getPendingStudents(),
                ]);

                if (orgData.success && orgData.organization) {
                    const hasMixedAllocation =
                        (orgData.organization.planSeatLimits?.Silver || 0) > 0 ||
                        (orgData.organization.planSeatLimits?.Gold || 0) > 0 ||
                        (orgData.organization.planSeatLimits?.Diamond || 0) > 0;
                    setOrgName(orgData.organization.organizationName || 'Organization');
                    setPlanData({
                        plan: hasMixedAllocation ? 'Mixed Allocation' : (orgData.organization.subscriptionPlan || 'Free Plan'),
                        expiry: orgData.organization.subscriptionExpiry || null
                    });
                }

                if (statsData.success) {
                    setStats({
                        totalStudents: statsData.stats?.totalStudents || 0,
                        pendingApprovals: pendingData.students?.length || 0, // Using pendingData length for accuracy
                        activeDepartments: statsData.stats?.totalDepartments || 0,
                        activeCoordinators: statsData.stats?.totalCoordinators || 0,
                    });
                    setPlanCapacity({
                        Silver: {
                            used: statsData.stats?.planWiseStudents?.Silver || 0,
                            limit: statsData.stats?.configuredPlanSeats?.Silver || 0,
                        },
                        Gold: {
                            used: statsData.stats?.planWiseStudents?.Gold || 0,
                            limit: statsData.stats?.configuredPlanSeats?.Gold || 0,
                        },
                        Diamond: {
                            used: statsData.stats?.planWiseStudents?.Diamond || 0,
                            limit: statsData.stats?.configuredPlanSeats?.Diamond || 0,
                        },
                    });
                }
            } catch (e) {
                console.error('Failed to fetch dashboard data', e);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    const metrics = [
        {
            title: 'Total Students',
            value: stats.totalStudents,
            sub: 'Across all departments',
            icon: GraduationCap,
            color: 'text-blue-400',
            bg: 'bg-blue-500/10',
            border: 'hover:border-blue-500/30',
            delay: 0.1
        },
        {
            title: 'Pending Approvals',
            value: stats.pendingApprovals,
            sub: 'Requires attention',
            icon: UserCheck,
            color: 'text-orange-400',
            bg: 'bg-orange-500/10',
            border: 'hover:border-orange-500/30',
            delay: 0.2
        },
        {
            title: 'Active Departments',
            value: stats.activeDepartments,
            sub: 'Operational units',
            icon: Building2,
            color: 'text-purple-400',
            bg: 'bg-purple-500/10',
            border: 'hover:border-purple-500/30',
            delay: 0.3
        },
        {
            title: 'Coordinators',
            value: stats.activeCoordinators,
            sub: 'Department leads',
            icon: ShieldCheck,
            color: 'text-emerald-400',
            bg: 'bg-emerald-500/10',
            border: 'hover:border-emerald-500/30',
            delay: 0.4
        },
        {
            title: 'Paid Seats Filled',
            value: planCapacity.Silver.used + planCapacity.Gold.used + planCapacity.Diamond.used,
            sub: `${Math.max(
                (planCapacity.Silver.limit + planCapacity.Gold.limit + planCapacity.Diamond.limit) -
                (planCapacity.Silver.used + planCapacity.Gold.used + planCapacity.Diamond.used),
                0
            )} remaining`,
            icon: Crown,
            color: 'text-amber-400',
            bg: 'bg-amber-500/10',
            border: 'hover:border-amber-500/30',
            delay: 0.5
        },
    ];

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-[#030712]">
                <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen w-full bg-[#030712] text-slate-200 font-sans selection:bg-indigo-500/30 relative overflow-hidden p-6 md:p-10">
            {/* Background Effects */}
            <div className="fixed inset-0 pointer-events-none">
                <div className="absolute top-[-20%] right-[-10%] w-[600px] h-[600px] bg-indigo-500/10 rounded-full blur-[120px] animate-pulse-slow" />
                <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] bg-blue-500/10 rounded-full blur-[100px] animate-pulse-slow delay-700" />
            </div>

            <div className="relative z-10 max-w-7xl mx-auto space-y-10">

                {/* Hero Section */}
                <div className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-indigo-900/40 via-purple-900/40 to-slate-900/40 p-10 shadow-2xl border border-white/10 animate-fade-in-up">
                    <div className="absolute inset-0 bg-grid-white/[0.02] bg-[length:32px_32px]" />
                    <div className="absolute -top-24 -right-24 w-64 h-64 bg-indigo-500/30 rounded-full blur-3xl animate-blob" />

                    <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                        <div>
                            <div className="flex flex-wrap items-center gap-3 mb-4">
                                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-indigo-300 text-xs font-bold uppercase tracking-wider backdrop-blur-md border border-white/10">
                                    <Activity className="w-3.5 h-3.5" />
                                    Organization Portal
                                </div>

                                {planData.plan && (
                                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gradient-to-r from-amber-500/20 to-orange-500/20 text-amber-400 text-xs font-bold uppercase tracking-wider backdrop-blur-md border border-amber-500/20 shadow-lg shadow-amber-500/10">
                                        <Crown className="w-3.5 h-3.5" />
                                        {planData.plan}
                                    </div>
                                )}

                                {planData.expiry && (
                                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-500/10 text-rose-300 text-xs font-bold uppercase tracking-wider backdrop-blur-md border border-rose-500/20">
                                        <Clock className="w-3.5 h-3.5" />
                                        Expires: {new Date(planData.expiry).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                    </div>
                                )}
                            </div>

                            <h1 className="text-4xl md:text-5xl font-bold text-white tracking-tight mb-2">
                                Welcome back!
                            </h1>
                            <p className="text-lg text-slate-400 max-w-xl">
                                Managing <span className="text-indigo-400 font-semibold">{orgName}</span>. Here's what's happening today.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Expiry Warning Popup Component */}
                {planData.expiry && (
                    <SubscriptionWarning expiryDate={planData.expiry} planName={planData.plan} />
                )}

                {/* Metrics Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
                    {metrics.map((metric, idx) => (
                        <DarkMetricCard key={idx} {...metric} />
                    ))}
                </div>

                <div className="rounded-[2rem] bg-[#0f172a] p-8 border border-slate-800 shadow-lg relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-72 h-72 bg-amber-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
                    <div className="relative z-10">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
                        <div>
                            <h2 className="text-xl font-bold text-white">Paid Seat Capacity</h2>
                            <p className="text-sm text-slate-400 mt-1">
                                Track filled and remaining paid seats across all active plans.
                            </p>
                        </div>
                        <span className="inline-flex items-center gap-2 rounded-full border border-amber-500/20 bg-amber-500/10 px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-amber-400">
                            <Crown className="h-3.5 w-3.5" />
                            {planCapacity.Silver.used + planCapacity.Gold.used + planCapacity.Diamond.used} filled / {planCapacity.Silver.limit + planCapacity.Gold.limit + planCapacity.Diamond.limit} paid seats
                        </span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {(["Silver", "Gold", "Diamond"] as const).map((plan) => {
                            const used = planCapacity[plan].used;
                            const limit = planCapacity[plan].limit;
                            const remaining = Math.max(limit - used, 0);
                            const isConfigured = limit > 0;
                            const isFull = isConfigured && used >= limit;

                            return (
                                <div key={plan} className={`rounded-2xl border p-5 relative overflow-hidden ${isFull ? "border-rose-500/30 bg-rose-500/5" : "border-white/10 bg-[#0b1220]"}`}>
                                    <div className={`absolute inset-x-0 top-0 h-1 ${
                                        plan === 'Silver'
                                            ? 'bg-gradient-to-r from-slate-300 to-slate-500'
                                            : plan === 'Gold'
                                                ? 'bg-gradient-to-r from-amber-300 to-yellow-500'
                                                : 'bg-gradient-to-r from-cyan-300 to-blue-500'
                                    }`} />
                                    <p className="text-sm font-semibold text-white">{plan} Seats</p>
                                    <p className="mt-3 text-3xl font-bold text-white">
                                        {used} <span className="text-lg text-slate-500">filled</span>
                                    </p>
                                    <p className="text-xs text-slate-400 mt-2">
                                        {isConfigured ? `${remaining} remaining out of ${limit}` : "0 remaining out of 0"}
                                    </p>
                                    <p className={`text-xs mt-3 ${isConfigured ? (isFull ? "text-rose-400" : "text-emerald-400") : "text-slate-500"}`}>
                                        {isConfigured ? (isFull ? "Paid capacity full" : "Paid seats available") : "No paid seats configured"}
                                    </p>
                                </div>
                            );
                        })}
                    </div>
                    </div>
                </div>

                {/* Quick Actions */}
                <div>
                    <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
                        <span className="w-1 h-8 bg-indigo-500 rounded-full"></span>
                        Quick Actions
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <Link href="/organization/students/pending" className="group relative overflow-hidden rounded-[2rem] bg-[#0f172a] border border-slate-800 p-8 hover:border-indigo-500/50 transition-all duration-300 hover:shadow-2xl hover:-translate-y-1">
                            <div className="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-indigo-500 to-purple-500 scale-x-0 group-hover:scale-x-100 transition-transform duration-500" />
                            <div className="w-14 h-14 bg-indigo-500/10 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                                <UserCheck className="w-7 h-7 text-indigo-400" />
                            </div>
                            <h3 className="text-xl font-bold text-white mb-2 group-hover:text-indigo-400 transition-colors">Approve Students</h3>
                            <p className="text-slate-400 text-sm mb-6 leading-relaxed">Review and approve pending student registrations.</p>
                            <div className="flex items-center text-indigo-400 font-semibold text-sm group-hover:gap-2 transition-all">
                                Review Requests <ArrowRight className="w-4 h-4 ml-1" />
                            </div>
                        </Link>

                        <Link href="/organization/coordinators" className="group relative overflow-hidden rounded-[2rem] bg-[#0f172a] border border-slate-800 p-8 hover:border-purple-500/50 transition-all duration-300 hover:shadow-2xl hover:-translate-y-1">
                            <div className="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-purple-500 to-fuchsia-500 scale-x-0 group-hover:scale-x-100 transition-transform duration-500" />
                            <div className="w-14 h-14 bg-purple-500/10 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                                <Users className="w-7 h-7 text-purple-400" />
                            </div>
                            <h3 className="text-xl font-bold text-white mb-2 group-hover:text-purple-400 transition-colors">Manage Coordinators</h3>
                            <p className="text-slate-400 text-sm mb-6 leading-relaxed">Add or manage department coordinators.</p>
                            <div className="flex items-center text-purple-400 font-semibold text-sm group-hover:gap-2 transition-all">
                                View Coordinators <ArrowRight className="w-4 h-4 ml-1" />
                            </div>
                        </Link>

                        <Link href="/organization/departments" className="group relative overflow-hidden rounded-[2rem] bg-[#0f172a] border border-slate-800 p-8 hover:border-emerald-500/50 transition-all duration-300 hover:shadow-2xl hover:-translate-y-1">
                            <div className="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-emerald-500 to-teal-500 scale-x-0 group-hover:scale-x-100 transition-transform duration-500" />
                            <div className="w-14 h-14 bg-emerald-500/10 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                                <Building2 className="w-7 h-7 text-emerald-400" />
                            </div>
                            <h3 className="text-xl font-bold text-white mb-2 group-hover:text-emerald-400 transition-colors">Manage Departments</h3>
                            <p className="text-slate-400 text-sm mb-6 leading-relaxed">Create and manage organization departments.</p>
                            <div className="flex items-center text-emerald-400 font-semibold text-sm group-hover:gap-2 transition-all">
                                View Departments <ArrowRight className="w-4 h-4 ml-1" />
                            </div>
                        </Link>
                    </div>
                </div>
            </div>

            {/* Global CSS for Animations */}
            <style jsx global>{`
                @keyframes fadeInUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
                @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
                .animate-fade-in-up { animation: fadeInUp 0.8s ease-out forwards; }
                .animate-pulse-slow { animation: pulse 6s cubic-bezier(0.4, 0, 0.6, 1) infinite; }
            `}</style>
        </div>
    );
}
