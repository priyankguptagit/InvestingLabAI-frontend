"use client";

import { Users2, ShieldCheck, LayoutDashboard } from "lucide-react";
import Link from "next/link";

// ─── Sub-tabs ────────────────────────────────────────────────────────────────
const TABS = [
    { label: "All Employees", href: "/admin/employees", icon: Users2 },
    { label: "Roles & Permissions", href: "/admin/employees/roles", icon: ShieldCheck },
    { label: "Activity Log", href: "/admin/employees/activity", icon: LayoutDashboard },
];

export default function EmployeesLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="min-h-screen w-full bg-[#030712] text-slate-200 font-sans">
            {/* Background glow */}
            <div className="fixed inset-0 pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-violet-500/10 rounded-full blur-[120px]" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-indigo-500/10 rounded-full blur-[120px]" />
            </div>

            <div className="relative z-10 p-4 md:p-6 lg:p-10 max-w-[1600px] mx-auto space-y-5">
                {/* Page Header */}
                <div>
                    <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-white via-slate-200 to-slate-400 tracking-tight">
                        Employee Management
                    </h1>
                    <p className="text-slate-500 mt-1.5 text-xs sm:text-sm font-medium tracking-wide">
                        Admin Portal • Staff Operations
                    </p>
                </div>

                {/* Sub-tab navigation */}
                <div className="flex gap-1 p-1 bg-[#0F172A]/80 border border-white/5 rounded-2xl w-full sm:w-fit backdrop-blur-xl overflow-x-auto no-scrollbar">
                    {TABS.map((tab) => (
                        <Link
                            key={tab.href}
                            href={tab.href}
                            className="flex items-center gap-2 px-3 sm:px-5 py-2.5 rounded-xl text-xs sm:text-sm font-medium text-slate-400 hover:text-white hover:bg-white/5 transition-all duration-200 data-[active]:bg-indigo-600 data-[active]:text-white whitespace-nowrap flex-1 sm:flex-none justify-center sm:justify-start"
                        >
                            <tab.icon className="h-4 w-4 shrink-0" />
                            {tab.label}
                        </Link>
                    ))}
                </div>

                {/* Page content */}
                {children}
            </div>
        </div>
    );
}
