"use client";

import { useState, useEffect } from 'react';
import { GraduationCap, UserCheck, TrendingUp, Activity, Crown, ArrowUpRight, Users } from 'lucide-react';
import { coordinatorApi } from '@/lib/api';
import Link from 'next/link';
import PlanStudentsModal from '../../_components/PlanStudentsModal';

interface Stats {
    totalStudents: number;
    pendingApprovals: number;
    planSeatLimits: {
        Silver: number;
        Gold: number;
        Diamond: number;
    };
    paidSeatUsage: {
        Silver: number;
        Gold: number;
        Diamond: number;
    };
    subscriptionStatus: string;
}

export default function CoordinatorDashboard() {
    const [stats, setStats] = useState<Stats>({
        totalStudents: 0,
        pendingApprovals: 0,
        planSeatLimits: { Silver: 0, Gold: 0, Diamond: 0 },
        paidSeatUsage: { Silver: 0, Gold: 0, Diamond: 0 },
        subscriptionStatus: 'inactive',
    });
    const [coordName, setCoordName] = useState('');
    const [deptName, setDeptName] = useState('');
    const [loading, setLoading] = useState(true);

    // Modal State
    const [selectedPlan, setSelectedPlan] = useState<'Silver' | 'Gold' | 'Diamond' | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const openPlanModal = (plan: 'Silver' | 'Gold' | 'Diamond') => {
        setSelectedPlan(plan);
        setIsModalOpen(true);
    };

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [coordData, studentsData, pendingData] = await Promise.all([
                    coordinatorApi.getMe(),
                    coordinatorApi.getMyStudents(),
                    coordinatorApi.getPendingStudents(),
                ]);

                if (coordData.success && coordData.coordinator) {
                    setCoordName(coordData.coordinator.name || 'Coordinator');
                    setDeptName(coordData.coordinator.department?.departmentName || 'Department');
                }

                setStats({
                    totalStudents: studentsData.students?.length || 0,
                    pendingApprovals: pendingData.students?.length || 0,
                    planSeatLimits: {
                        Silver: coordData.coordinator?.organization?.planSeatLimits?.Silver || 0,
                        Gold: coordData.coordinator?.organization?.planSeatLimits?.Gold || 0,
                        Diamond: coordData.coordinator?.organization?.planSeatLimits?.Diamond || 0,
                    },
                    paidSeatUsage: {
                        Silver: studentsData.students?.filter((student: any) => student.currentPlan === 'Silver').length || 0,
                        Gold: studentsData.students?.filter((student: any) => student.currentPlan === 'Gold').length || 0,
                        Diamond: studentsData.students?.filter((student: any) => student.currentPlan === 'Diamond').length || 0,
                    },
                    subscriptionStatus: coordData.coordinator?.organization?.subscriptionStatus || 'inactive',
                });
            } catch (e) {
                console.error('Failed to fetch dashboard data', e);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen bg-[#030712]">
                <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    const totalPaidSeats =
        stats.planSeatLimits.Silver +
        stats.planSeatLimits.Gold +
        stats.planSeatLimits.Diamond;
    const totalPaidSeatsFilled =
        stats.paidSeatUsage.Silver +
        stats.paidSeatUsage.Gold +
        stats.paidSeatUsage.Diamond;
    const totalPaidSeatsRemaining = Math.max(totalPaidSeats - totalPaidSeatsFilled, 0);

    return (
        <div className="space-y-8 animate-in fade-in duration-700 pb-10 text-slate-200">
            {/* HERO BANNER */}
            <div className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-indigo-900 via-purple-900 to-blue-900 p-10 shadow-2xl shadow-indigo-900/50 ring-1 ring-white/10 group">
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 brightness-100 contrast-150 mix-blend-overlay"></div>
                <div className="absolute -top-24 -right-24 w-96 h-96 bg-blue-500/30 rounded-full blur-3xl group-hover:bg-blue-400/40 transition-all duration-1000"></div>
                <div className="absolute -bottom-24 -left-24 w-72 h-72 bg-purple-500/30 rounded-full blur-3xl group-hover:bg-purple-400/40 transition-all duration-1000"></div>

                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
                    <div className="space-y-2">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/20 backdrop-blur-md w-fit mb-2">
                            <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                            </span>
                            <span className="text-xs font-medium text-white/90">{deptName} Department</span>
                        </div>
                        <h1 className="text-4xl font-extrabold text-white tracking-tight leading-tight">
                            Welcome back, <span className="text-transparent bg-clip-text bg-gradient-to-r from-white to-blue-100">{coordName}</span>!
                        </h1>
                        <p className="text-indigo-100/80 max-w-xl text-lg font-light leading-relaxed">
                            You have <span className="font-bold text-white border-b border-white/30">{stats.pendingApprovals} pending students</span> requiring your approval today.
                        </p>
                    </div>
                </div>
            </div>

            {/* METRICS ROW */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <DarkMetricCard
                    title="Total Students"
                    value={stats.totalStudents.toString()}
                    sub="Registered in Department"
                    icon={GraduationCap}
                    color="text-blue-400"
                    bg="bg-blue-500/10"
                    border="group-hover:border-blue-500/50"
                />
                <DarkMetricCard
                    title="Pending Approvals"
                    value={stats.pendingApprovals.toString()}
                    sub="Requires verification"
                    icon={UserCheck}
                    color="text-orange-400"
                    bg="bg-orange-500/10"
                    border="group-hover:border-orange-500/50"
                />
                <DarkMetricCard
                    title="Department Status"
                    value="Active"
                    sub="System Operational"
                    icon={Activity}
                    color="text-emerald-400"
                    bg="bg-emerald-500/10"
                    border="group-hover:border-emerald-500/50"
                />
                <DarkMetricCard
                    title="Paid Seats Filled"
                    value={totalPaidSeatsFilled.toString()}
                    sub={`${totalPaidSeatsRemaining} remaining`}
                    icon={Crown}
                    color="text-violet-400"
                    bg="bg-violet-500/10"
                    border="group-hover:border-violet-500/50"
                />
            </div>

            <div className="rounded-[2rem] bg-[#0f172a] p-8 border border-slate-800 shadow-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-72 h-72 bg-violet-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>

                <div className="relative z-10">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
                        <div>
                            <h3 className="text-xl font-bold text-white tracking-tight">Plan Limits</h3>
                            <p className="text-slate-400 text-sm mt-1">
                                Paid seat capacity across Silver, Gold, and Diamond plans.
                            </p>
                        </div>
                        <span className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold border uppercase tracking-wider ${stats.subscriptionStatus === 'active'
                            ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                            : 'bg-slate-500/10 border-slate-500/20 text-slate-400'
                            }`}>
                            <span className={`h-1.5 w-1.5 rounded-full ${stats.subscriptionStatus === 'active' ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'
                                }`} />
                            {stats.subscriptionStatus || 'inactive'}
                        </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <SeatLimitCard
                            title="Silver Seats"
                            filled={stats.paidSeatUsage.Silver}
                            remaining={Math.max(stats.planSeatLimits.Silver - stats.paidSeatUsage.Silver, 0)}
                            total={stats.planSeatLimits.Silver}
                            accent="from-slate-300 to-slate-500"
                            onClick={() => openPlanModal('Silver')}
                        />
                        <SeatLimitCard
                            title="Gold Seats"
                            filled={stats.paidSeatUsage.Gold}
                            remaining={Math.max(stats.planSeatLimits.Gold - stats.paidSeatUsage.Gold, 0)}
                            total={stats.planSeatLimits.Gold}
                            accent="from-amber-300 to-yellow-500"
                            onClick={() => openPlanModal('Gold')}
                        />
                        <SeatLimitCard
                            title="Diamond Seats"
                            filled={stats.paidSeatUsage.Diamond}
                            remaining={Math.max(stats.planSeatLimits.Diamond - stats.paidSeatUsage.Diamond, 0)}
                            total={stats.planSeatLimits.Diamond}
                            accent="from-cyan-300 to-blue-500"
                            onClick={() => openPlanModal('Diamond')}
                        />
                    </div>

                    <div className="mt-6 rounded-2xl border border-slate-800 bg-[#0b1220] px-5 py-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                        <div>
                            <p className="text-sm font-semibold text-white">Paid seats overview</p>
                            <p className="text-xs text-slate-400 mt-1">
                                {totalPaidSeatsFilled} filled out of {totalPaidSeats}, with {totalPaidSeatsRemaining} remaining
                            </p>
                        </div>
                        <Link href="/organization/coordinator/students">
                            <button className="w-full md:w-auto px-5 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-bold shadow-lg shadow-violet-500/20 hover:shadow-violet-500/40 hover:scale-[1.02] transition-all duration-300 flex items-center justify-center gap-2">
                                Review student plans <ArrowUpRight size={18} />
                            </button>
                        </Link>
                    </div>
                </div>
            </div>

            {/* QUICK ACTIONS */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="rounded-[2rem] bg-[#0f172a] p-8 border border-slate-800 shadow-xl relative overflow-hidden group hover:-translate-y-1 transition-transform duration-500">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>

                    <div className="relative z-10">
                        <div className="flex justify-between items-start mb-6">
                            <div>
                                <h3 className="text-xl font-bold text-white tracking-tight">Pending Approvals</h3>
                                <p className="text-slate-400 text-sm mt-1">Review student registration requests</p>
                            </div>
                            <div className="p-3 rounded-xl bg-orange-500/10 border border-orange-500/20">
                                <UserCheck className="w-6 h-6 text-orange-400" />
                            </div>
                        </div>

                        <Link href="/organization/coordinator/students/pending">
                            <button className="w-full py-3 rounded-xl bg-gradient-to-r from-orange-500 to-red-500 text-white font-bold shadow-lg shadow-orange-500/20 hover:shadow-orange-500/40 hover:scale-[1.02] transition-all duration-300 flex items-center justify-center gap-2">
                                Review <span className="bg-white/20 px-2 py-0.5 rounded text-xs">{stats.pendingApprovals}</span> Requests <ArrowUpRight size={18} />
                            </button>
                        </Link>
                    </div>
                </div>

                <div className="rounded-[2rem] bg-[#0f172a] p-8 border border-slate-800 shadow-xl relative overflow-hidden group hover:-translate-y-1 transition-transform duration-500">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>

                    <div className="relative z-10">
                        <div className="flex justify-between items-start mb-6">
                            <div>
                                <h3 className="text-xl font-bold text-white tracking-tight">Manage Students</h3>
                                <p className="text-slate-400 text-sm mt-1">View all students in your department</p>
                            </div>
                            <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20">
                                <Users className="w-6 h-6 text-blue-400" />
                            </div>
                        </div>

                        <Link href="/organization/coordinator/students">
                            <button className="w-full py-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold shadow-lg shadow-blue-500/20 hover:shadow-blue-500/40 hover:scale-[1.02] transition-all duration-300 flex items-center justify-center gap-2">
                                View directory <ArrowUpRight size={18} />
                            </button>
                        </Link>
                    </div>
                </div>
            </div>

            {/* MODAL */}
            {selectedPlan && (
                <PlanStudentsModal
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    plan={selectedPlan}
                />
            )}
        </div>
    );
}

// ------------------------------------------
// HELPER COMPONENTS
// ------------------------------------------

function DarkMetricCard({ title, value, sub, icon: Icon, color, bg, border }: any) {
    return (
        <div className={`rounded-[2rem] bg-[#0f172a] p-6 border border-slate-800 shadow-lg hover:shadow-2xl hover:shadow-blue-900/10 transition-all duration-300 hover:-translate-y-1 group relative overflow-hidden ${border}`}>
            <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-10 transition-opacity">
                <Icon size={64} className={color} />
            </div>
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

function SeatLimitCard({
    title,
    filled,
    remaining,
    total,
    accent,
    onClick
}: {
    title: string;
    filled: number;
    remaining: number;
    total: number;
    accent: string;
    onClick?: () => void;
}) {
    return (
        <div
            className="rounded-2xl border border-slate-800 bg-[#0b1220] p-5 relative overflow-hidden cursor-pointer hover:border-slate-600 hover:bg-[#111827] transition-all duration-300 hover:-translate-y-1"
            onClick={onClick}
        >
            <div className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${accent}`}></div>
            <p className="text-sm font-medium text-slate-400">{title}</p>
            <p className="mt-3 text-3xl font-bold text-white">{filled} <span className="text-lg text-slate-500">filled</span></p>
            <p className="mt-2 text-xs text-slate-400">{remaining} remaining out of {total}</p>
        </div>
    );
}
