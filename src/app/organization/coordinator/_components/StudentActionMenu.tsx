"use client";



import { MoreVertical, Edit, Trash2, PieChart, RefreshCw, FileText, CreditCard, ChevronRight, CheckCircle2 } from 'lucide-react';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';

const PLAN_STYLES: Record<string, { label: string; color: string; dot: string }> = {
    Free: { label: 'Free', color: 'text-slate-400', dot: 'bg-slate-400' },
    Silver: { label: 'Silver', color: 'text-slate-200', dot: 'bg-slate-300' },
    Gold: { label: 'Gold', color: 'text-amber-300', dot: 'bg-amber-400' },
    Diamond: { label: 'Diamond', color: 'text-sky-300', dot: 'bg-sky-400' },
};

const PLANS = ['Free', 'Silver', 'Gold', 'Diamond'] as const;

interface PlanSeatInfo {
    Silver: number;
    Gold: number;
    Diamond: number;
}

interface StudentActionMenuProps {
    student: any;
    onEdit: (student: any) => void;
    onArchive: (student: any) => void;
    onUnarchive: (student: any) => void;
    onViewPortfolio: (student: any) => void;
    onDownloadReport?: (student: any) => void;
    hasReport?: boolean;
    onChangePlan?: (student: any, newPlan: string) => void;
    /** How many seats are configured per plan (0 = unlimited) */
    planSeatLimits?: PlanSeatInfo;
    /** How many students are currently on each paid plan */
    paidSeatUsage?: PlanSeatInfo;
}

export default function StudentActionMenu({
    student,
    onEdit,
    onArchive,
    onUnarchive,
    onViewPortfolio,
    onDownloadReport,
    hasReport,
    onChangePlan,
    planSeatLimits,
    paidSeatUsage,
}: StudentActionMenuProps) {

    const isPlanFull = (plan: string): boolean => {
        if (plan === 'Free') return false;
        const key = plan as keyof PlanSeatInfo;
        const limit = planSeatLimits?.[key] ?? 0;
        if (limit === 0) return false; // 0 = unlimited
        const used = paidSeatUsage?.[key] ?? 0;
        // If student is already on this plan, don't count their own seat
        const currentPlan = student.currentPlan || 'Free';
        const adjustedUsed = currentPlan === plan ? used - 1 : used;
        return adjustedUsed >= limit;
    };

    return (
        <DropdownMenu.Root>
            <DropdownMenu.Trigger asChild>
                <button className="p-2 rounded-lg hover:bg-white/5 text-slate-500 hover:text-white transition-colors outline-none focus:ring-2 focus:ring-indigo-500/20">
                    <MoreVertical className="w-4 h-4" />
                </button>
            </DropdownMenu.Trigger>

            <DropdownMenu.Portal>
                <DropdownMenu.Content
                    align="end"
                    className="min-w-[12rem] bg-[#0F172A] rounded-lg border border-slate-800 p-1 shadow-xl animate-in fade-in zoom-in-95 duration-200 z-50"
                    sideOffset={5}
                >
                    <DropdownMenu.Label className="px-2 py-1.5 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                        Actions
                    </DropdownMenu.Label>

                    <DropdownMenu.Separator className="h-px bg-slate-800 my-1" />

                    <DropdownMenu.Item
                        onSelect={() => onEdit(student)}
                        className="flex items-center px-2 py-2 text-sm text-slate-200 rounded-md cursor-pointer hover:bg-slate-800 focus:bg-slate-800 focus:text-white outline-none group mb-1"
                    >
                        <Edit className="w-4 h-4 mr-2 text-blue-400 group-hover:text-blue-300" />
                        Edit Details
                    </DropdownMenu.Item>

                    <DropdownMenu.Item
                        onSelect={() => onViewPortfolio(student)}
                        className="flex items-center px-2 py-2 text-sm text-slate-200 rounded-md cursor-pointer hover:bg-slate-800 focus:bg-slate-800 focus:text-white outline-none group mb-1"
                    >
                        <PieChart className="w-4 h-4 mr-2 text-indigo-400 group-hover:text-indigo-300" />
                        View Portfolio
                    </DropdownMenu.Item>

                    {hasReport && onDownloadReport && (
                        <DropdownMenu.Item
                            onSelect={() => onDownloadReport(student)}
                            className="flex items-center px-2 py-2 text-sm text-slate-200 rounded-md cursor-pointer hover:bg-slate-800 focus:bg-slate-800 focus:text-white outline-none group mb-1"
                        >
                            <FileText className="w-4 h-4 mr-2 text-amber-400 group-hover:text-amber-300" />
                            Download Report
                        </DropdownMenu.Item>
                    )}

                    {/* ── Change Plan sub-menu ─────────────────────────── */}
                    {onChangePlan && (
                        <DropdownMenu.Sub>
                            <DropdownMenu.SubTrigger className="flex items-center justify-between w-full px-2 py-2 text-sm text-slate-200 rounded-md cursor-pointer hover:bg-slate-800 focus:bg-slate-800 focus:text-white outline-none group mb-1 select-none">
                                <span className="flex items-center gap-2">
                                    <CreditCard className="w-4 h-4 text-emerald-400 group-hover:text-emerald-300" />
                                    Change Plan
                                </span>
                                <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
                            </DropdownMenu.SubTrigger>

                            <DropdownMenu.Portal>
                                <DropdownMenu.SubContent
                                    className="min-w-[11rem] bg-[#0F172A] rounded-lg border border-slate-800 p-1 shadow-xl animate-in fade-in zoom-in-95 duration-150 z-50"
                                    sideOffset={6}
                                    alignOffset={-4}
                                >
                                    <DropdownMenu.Label className="px-2 py-1.5 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                                        Current: {student.currentPlan || 'Free'}
                                    </DropdownMenu.Label>
                                    <DropdownMenu.Separator className="h-px bg-slate-800 mb-1" />

                                    {PLANS.map((plan) => {
                                        const isCurrent = (student.currentPlan || 'Free') === plan;
                                        const full = !isCurrent && isPlanFull(plan);
                                        const style = PLAN_STYLES[plan];

                                        if (full) {
                                            return (
                                                <div
                                                    key={plan}
                                                    className="flex items-center justify-between px-2 py-2 text-sm rounded-md cursor-not-allowed opacity-50"
                                                >
                                                    <span className="flex items-center gap-2 text-slate-400">
                                                        <span className={`w-2 h-2 rounded-full ${style.dot}`} />
                                                        {style.label}
                                                    </span>
                                                    <span className="text-[10px] font-bold text-rose-400 bg-rose-400/10 px-1.5 py-0.5 rounded-full">
                                                        Plan limit full
                                                    </span>
                                                </div>
                                            );
                                        }

                                        return (
                                            <DropdownMenu.Item
                                                key={plan}
                                                disabled={isCurrent}
                                                onSelect={() => onChangePlan(student, plan)}
                                                className={`flex items-center justify-between px-2 py-2 text-sm rounded-md outline-none mb-0.5 ${isCurrent
                                                    ? 'opacity-60 cursor-default bg-white/5'
                                                    : 'cursor-pointer hover:bg-slate-800 focus:bg-slate-800'
                                                    } ${style.color}`}
                                            >
                                                <span className="flex items-center gap-2">
                                                    <span className={`w-2 h-2 rounded-full ${style.dot}`} />
                                                    {style.label}
                                                </span>
                                                {isCurrent && (
                                                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                                                )}
                                            </DropdownMenu.Item>
                                        );
                                    })}
                                </DropdownMenu.SubContent>
                            </DropdownMenu.Portal>
                        </DropdownMenu.Sub>
                    )}

                    <DropdownMenu.Separator className="h-px bg-slate-800 my-1" />

                    {student.isDeleted ? (
                        <DropdownMenu.Item
                            onSelect={() => onUnarchive(student)}
                            className="flex items-center px-2 py-2 text-sm text-emerald-400 rounded-md cursor-pointer hover:bg-emerald-900/20 focus:bg-emerald-900/20 focus:text-emerald-300 outline-none group"
                        >
                            <RefreshCw className="w-4 h-4 mr-2" />
                            Unarchive Student
                        </DropdownMenu.Item>
                    ) : (
                        <DropdownMenu.Item
                            onSelect={() => onArchive(student)}
                            className="flex items-center px-2 py-2 text-sm text-red-400 rounded-md cursor-pointer hover:bg-red-900/20 focus:bg-red-900/20 focus:text-red-300 outline-none group"
                        >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Archive Student
                        </DropdownMenu.Item>
                    )}
                </DropdownMenu.Content>
            </DropdownMenu.Portal>
        </DropdownMenu.Root>
    );
}
