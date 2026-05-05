"use client";

import React, { useState, useEffect, useCallback, memo } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
    LayoutDashboard,
    Building2,
    Users,
    UserCheck,
    LogOut,
    ChevronLeft,
    ChevronRight,
    ChevronDown,
    GraduationCap,
    ShieldCheck,
    Activity,
    Award,
    MessageSquarePlus
} from "lucide-react";
import { cn } from "@/lib/utils";
import { organizationApi } from "@/lib/api";

// ==========================================
// TYPES
// ==========================================

type SubMenuItem = {
    href: string;
    label: string;
};

type MenuItem = {
    href?: string;
    label: string;
    icon: any;
    badge?: number | string;
    variant?: "default" | "new" | "notification";
    subItems?: SubMenuItem[];
};

type MenuGroup = {
    title: string;
    items: MenuItem[];
};

// ==========================================
// SUB-COMPONENTS (Defined before use due to const hoisting)
// ==========================================

const SidebarHeader = memo(({ isOpen, onToggle }: { isOpen: boolean; onToggle: () => void }) => {
    return (
        <div className="h-[88px] flex items-center px-6 border-b border-white/5 relative shrink-0">
            <div
                onClick={!isOpen ? onToggle : undefined}
                className={cn("flex items-center gap-4 w-full transition-all duration-300 group/header", !isOpen && "cursor-pointer justify-center")}
            >
                {/* Logo Mark */}
                <div className="relative">
                    <div className="absolute -inset-3 bg-blue-500/20 rounded-full blur-xl opacity-0 group-hover/header:opacity-100 transition-opacity duration-700" />
                    <div className="relative h-11 w-11 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center shadow-[0_0_20px_rgba(37,99,235,0.3)] ring-1 ring-white/10 group-hover/header:scale-105 transition-transform duration-300">
                        <Award className="text-white h-6 w-6 drop-shadow-md" />
                    </div>
                </div>

                {/* Text */}
                <div className={cn("flex flex-col overflow-hidden transition-all duration-500", isOpen ? "w-auto opacity-100" : "w-0 opacity-0")}>
                    <span className="font-bold text-xl text-white tracking-tight leading-none whitespace-nowrap">
                        Praedico
                    </span>
                    <span className="text-[10px] font-bold text-blue-400 tracking-[0.25em] mt-1 whitespace-nowrap uppercase">
                        Organization Portal
                    </span>
                </div>
            </div>

            {isOpen && (
                <button
                    onClick={(e) => { e.stopPropagation(); onToggle(); }}
                    className="absolute -right-3 top-1/2 -translate-y-1/2 h-7 w-7 bg-[#0B0C15] border border-white/10 rounded-full flex items-center justify-center text-slate-400 shadow-xl hover:bg-blue-600 hover:border-blue-500 hover:text-white transition-all duration-300 z-50 group/toggle"
                >
                    <ChevronLeft size={14} className="group-hover/toggle:-translate-x-0.5 transition-transform" />
                </button>
            )}
        </div>
    );
});
SidebarHeader.displayName = "SidebarHeader";

const NavItem = memo(({
    item,
    isOpen,
    onToggleSidebar
}: {
    item: MenuItem;
    isOpen: boolean;
    onToggleSidebar: () => void;
}) => {
    const pathname = usePathname();
    const Icon = item.icon;

    const isActive = item.href ? pathname === item.href : false;
    const isSubActive = item.subItems?.some(sub => pathname === sub.href);

    const [isExpanded, setIsExpanded] = useState(isSubActive);

    useEffect(() => {
        if (isSubActive) setIsExpanded(true);
    }, [isSubActive]);

    const handleClick = (e: React.MouseEvent) => {
        if (item.subItems) {
            e.preventDefault();
            if (!isOpen) {
                onToggleSidebar();
                setTimeout(() => setIsExpanded(true), 150);
            } else {
                setIsExpanded(!isExpanded);
            }
        }
    };

    const Wrapper = ({ children, className }: any) => {
        if (item.subItems) return <button onClick={handleClick} className={className} type="button">{children}</button>;
        return <Link href={item.href!} className={className}>{children}</Link>;
    };

    // Active Style - using Blue/Indigo for Org Portal
    const activeClass = cn(
        "bg-gradient-to-r from-blue-600/20 via-indigo-500/10 to-transparent",
        "text-white",
        "border-l-2 border-blue-500",
        "shadow-[0_0_20px_rgba(59,130,246,0.15)]",
        "backdrop-blur-sm"
    );

    const inactiveClass = "text-slate-400 hover:bg-white/5 hover:text-slate-200 border-l-2 border-transparent";

    return (
        <div className="relative group/nav">
            <Wrapper
                className={cn(
                    "relative flex items-center w-full p-3 text-sm font-medium transition-all duration-300 group rounded-r-xl",
                    (isActive || isSubActive) ? activeClass : inactiveClass,
                    !isOpen && "justify-center px-0 py-3 rounded-xl border-l-0"
                )}
            >
                {(isActive || isSubActive) && (
                    <div className="absolute left-0 w-full h-full bg-blue-500/5 opacity-50 blur-xl pointer-events-none" />
                )}

                <div className={cn(
                    "relative z-10 transition-all duration-300",
                    (isActive || isSubActive) ? "text-blue-400 drop-shadow-[0_0_8px_rgba(96,165,250,0.5)] scale-105" : "text-slate-500 group-hover:text-slate-300"
                )}>
                    <Icon size={20} strokeWidth={1.5} />
                </div>

                <div className={cn("flex-1 text-left ml-3 transition-all duration-300 overflow-hidden whitespace-nowrap", isOpen ? "w-auto opacity-100" : "w-0 opacity-0 ml-0")}>
                    <span className={cn((isActive || isSubActive) && "font-semibold tracking-wide")}>{item.label}</span>
                </div>

                {isOpen && (
                    <div className="flex items-center gap-2">
                        {item.badge && (
                            <span className={cn(
                                "px-2 py-0.5 text-[10px] font-bold rounded-full shadow-sm",
                                item.variant === "new" ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/20" :
                                    item.variant === "notification" ? "bg-rose-500 text-white" :
                                        "bg-blue-500 text-white"
                            )}>
                                {item.badge}
                            </span>
                        )}
                        {item.subItems && (
                            <ChevronDown size={14} className={cn("text-slate-500 transition-transform duration-300", isExpanded && "rotate-180 text-white")} />
                        )}
                    </div>
                )}

                {!isOpen && (
                    <div className="absolute left-full top-1/2 -translate-y-1/2 ml-4 px-3 py-1.5 bg-[#1e1b4b] border border-blue-500/30 text-white text-xs font-semibold rounded-lg opacity-0 group-hover/nav:opacity-100 translate-x-2 group-hover/nav:translate-x-0 transition-all duration-200 pointer-events-none z-[100] shadow-xl whitespace-nowrap">
                        {item.label}
                    </div>
                )}
            </Wrapper>

            {item.subItems && isOpen && (
                <div
                    className={cn(
                        "overflow-hidden transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]",
                        isExpanded ? "max-h-96 opacity-100 mt-1" : "max-h-0 opacity-0"
                    )}
                >
                    <div className="relative pl-4 ml-5 border-l border-white/10 space-y-1 py-1">
                        {item.subItems.map((sub) => {
                            const isChildActive = pathname === sub.href;
                            return (
                                <Link
                                    key={sub.href}
                                    href={sub.href}
                                    className={cn(
                                        "block px-4 py-2 rounded-lg text-sm transition-all duration-200 hover:translate-x-1",
                                        isChildActive
                                            ? "text-white font-medium bg-white/5 shadow-[0_0_15px_rgba(255,255,255,0.05)]"
                                            : "text-slate-500 hover:text-blue-300"
                                    )}
                                >
                                    {sub.label}
                                </Link>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
});
NavItem.displayName = "NavItem";

const NavGroup = memo(({
    group,
    isOpen,
    onToggleSidebar
}: {
    group: MenuGroup;
    isOpen: boolean;
    onToggleSidebar: () => void;
}) => {
    return (
        <div className="px-4">
            <div className={cn("transition-all duration-300", isOpen ? "opacity-100 h-auto mb-3" : "opacity-0 h-0 mb-0 overflow-hidden")}>
                <h3 className="px-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest select-none">
                    {group.title}
                </h3>
            </div>
            {!isOpen && <div className="h-px w-6 bg-white/10 mx-auto mb-4" />}

            <div className="space-y-1">
                {group.items.map((item) => (
                    <NavItem
                        key={item.label}
                        item={item}
                        isOpen={isOpen}
                        onToggleSidebar={onToggleSidebar}
                    />
                ))}
            </div>
        </div>
    );
});
NavGroup.displayName = "NavGroup";

const StatusCard = memo(() => {
    return (
        <div className="relative rounded-2xl bg-gradient-to-br from-blue-900/50 to-indigo-900/50 p-5 shadow-lg overflow-hidden group border border-white/10 hover:border-white/20 transition-colors">
            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-soft-light" />
            <div className="relative z-10">
                <div className="h-10 w-10 rounded-xl bg-white/10 backdrop-blur-md flex items-center justify-center mb-4 border border-white/10 shadow-inner">
                    <Activity className="text-white h-5 w-5" />
                </div>
                <h4 className="text-white font-bold text-base mb-1">System Active</h4>
                <p className="text-white/60 text-xs leading-relaxed">
                    All systems operational.
                </p>
            </div>
        </div>
    );
});
StatusCard.displayName = "StatusCard";

const UserProfileFooter = memo(({ isOpen, user }: { isOpen: boolean; user: any }) => {
    const [imgError, setImgError] = useState(false);
    const router = useRouter();

    const handleLogout = async () => {
        try {
            await organizationApi.logout();
        } catch (e) {
            console.error(e);
        } finally {
            router.push("/");
        }
    };

    return (
        <div className="flex-shrink-0 p-4 border-t border-white/5 bg-[#08090f] relative group">
            <div className={cn("flex items-center gap-3 p-2 rounded-2xl transition-all duration-300", isOpen ? "bg-white/5 border border-white/5 hover:bg-white/10 hover:border-white/10" : "justify-center")}>

                <div className="relative flex-shrink-0 h-10 w-10">
                    <div className="absolute inset-0 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                        <div className="absolute top-1/2 left-1/2 w-full h-full -translate-x-1/2 -translate-y-1/2 rounded-full animate-orbit">
                            <div className="w-1.5 h-1.5 bg-blue-500 rounded-full shadow-[0_0_8px_#3b82f6]" />
                        </div>
                    </div>
                    <div className="h-full w-full rounded-full p-[2px] bg-gradient-to-tr from-blue-500 to-indigo-500 shadow-lg relative z-10">
                        <div className="h-full w-full rounded-full bg-[#0B0C15] overflow-hidden flex items-center justify-center">
                            {user.avatar && !imgError ? (
                                <img
                                    src={user.avatar}
                                    alt={user.name}
                                    className="h-full w-full object-cover"
                                    onError={() => setImgError(true)}
                                />
                            ) : (
                                <span className="font-bold text-white text-sm bg-gradient-to-br from-blue-500 to-indigo-600 w-full h-full flex items-center justify-center">
                                    {user.name.charAt(0).toUpperCase()}
                                </span>
                            )}
                        </div>
                    </div>
                </div>

                <div className={cn("flex-1 min-w-0 transition-all duration-300", isOpen ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-4 hidden")}>
                    <p className="text-sm font-bold text-white truncate leading-tight group-hover:text-blue-300 transition-colors">
                        {user.name}
                    </p>
                    <p className="text-[10px] text-slate-500 truncate font-medium uppercase tracking-wide mt-0.5">Admin Portal</p>
                </div>

                {isOpen && (
                    <button
                        onClick={handleLogout}
                        className="p-2 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                        title="Logout"
                    >
                        <LogOut size={18} />
                    </button>
                )}
            </div>

            {!isOpen && (
                <button
                    onClick={handleLogout}
                    className="mt-4 w-full p-2 flex justify-center text-slate-500 hover:text-rose-400 transition-colors"
                    title="Logout"
                >
                    <LogOut size={20} />
                </button>
            )}
        </div>
    );
});
UserProfileFooter.displayName = "UserProfileFooter";

// ==========================================
// MAIN COMPONENT
// ==========================================

export default function OrganizationSidebar() {
    const [isOpen, setIsOpen] = useState(true);
    const [isClient, setIsClient] = useState(false);

    const [orgData, setOrgData] = useState({
        name: "Organization",
        email: "Loading...",
        // avatar is fetched from OrganizationAdminModel — isolated from UserModel
        avatar: null as string | null
    });
    const [pendingCount, setPendingCount] = useState(0);

    useEffect(() => {
        setIsClient(true);
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [oData, pData] = await Promise.all([
                organizationApi.getMe(),
                organizationApi.getPendingStudents()
            ]);

            if (oData.success) {
                if (oData.organization) {
                    setOrgData(prev => ({
                        ...prev,
                        name: oData.organization.organizationName || "Organization",
                        email: oData.organization.contactEmail || "admin@org.com",
                    }));
                }
                // Bind admin's personal avatar from OrganizationAdminModel — never UserModel
                if (oData.admin) {
                    setOrgData(prev => ({
                        ...prev,
                        avatar: oData.admin.avatar || null,
                    }));
                }
            }

            if (pData.success) {
                setPendingCount(pData.students?.length || 0);
            }

        } catch (e) {
            console.error("Failed to fetch sidebar data", e);
        }
    };

    const handleToggle = useCallback(() => {
        setIsOpen(prev => !prev);
    }, []);

    // ==========================================
    // MENU CONFIGURATION
    // ==========================================
    const MENU_GROUPS: MenuGroup[] = [
        {
            title: "Overview",
            items: [
                { href: "/organization/dashboard", label: "Dashboard", icon: LayoutDashboard },
                // { href: "/organization/analytics", label: "Analytics", icon: Activity, badge: "New", variant: "new" },
            ],
        },
        {
            title: "Management",
            items: [
                { href: "/organization/departments", label: "Departments", icon: Building2 },
                { href: "/organization/coordinators", label: "Coordinators", icon: Users },
                {
                    href: "/organization/students/pending",
                    label: "Pending Approvals",
                    icon: UserCheck,
                    badge: pendingCount > 0 ? pendingCount : undefined,
                    variant: "notification"
                },
                { href: "/organization/students", label: "All Students", icon: GraduationCap },
            ],
        },
        {
            title: "Settings",
            items: [
                { href: "/organization/settings", label: "Org Profile", icon: ShieldCheck },
                { href: "/organization/feedback", label: "Feedback", icon: MessageSquarePlus },
            ],
        },
    ];

    if (!isClient) return null;

    return (
        <>
            <style jsx global>{`
        /* Orbit Animation */
        @keyframes orbit {
          0% { transform: rotate(0deg) translateX(18px) rotate(0deg); }
          100% { transform: rotate(360deg) translateX(18px) rotate(-360deg); }
        }
        .animate-orbit { animation: orbit 3s linear infinite; }
        
        /* Sidebar Scrollbar */
        .sidebar-scroll::-webkit-scrollbar { width: 0px; }
        .sidebar-scroll:hover::-webkit-scrollbar { width: 4px; }
        .sidebar-scroll::-webkit-scrollbar-track { background: transparent; }
        .sidebar-scroll::-webkit-scrollbar-thumb { background: #334155; border-radius: 4px; }
      `}</style>

            <aside
                className={cn(
                    "relative h-screen flex flex-col border-r border-white/5 bg-[#0B0C15] text-slate-400 z-50 shadow-[4px_0_24px_rgba(0,0,0,0.4)]",
                    "transition-all duration-500 cubic-bezier(0.2, 0.8, 0.2, 1)",
                    isOpen ? "w-[280px]" : "w-[88px]"
                )}
            >
                {/* Subtle Noise Texture */}
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.03] pointer-events-none mix-blend-overlay" />

                {/* 1. Header */}
                <SidebarHeader isOpen={isOpen} onToggle={handleToggle} />

                {/* 2. Navigation */}
                <div className="flex-1 overflow-y-auto overflow-x-hidden sidebar-scroll py-6 space-y-8">
                    {MENU_GROUPS.map((group) => (
                        <NavGroup
                            key={group.title}
                            group={group}
                            isOpen={isOpen}
                            onToggleSidebar={handleToggle}
                        />
                    ))}

                    {/* Promo/Status Card */}
                    <div
                        className={cn(
                            "px-5 transition-all duration-500 ease-in-out transform",
                            isOpen ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8 pointer-events-none absolute bottom-0"
                        )}
                    >
                        <StatusCard />
                    </div>
                </div>

                {/* 3. User Profile Footer */}
                <UserProfileFooter isOpen={isOpen} user={orgData} />
            </aside>
        </>
    );
}
