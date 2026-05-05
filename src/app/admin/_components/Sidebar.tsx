"use client";

import React, { useState, useEffect, useCallback, memo } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Settings,
  LogOut,
  ShieldCheck,
  BarChart3,
  ShoppingBag,
  Layers,
  Palette,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Zap,
  Mail,
  FileText,
  HelpCircle,
  User,
  CreditCard,
  Building2,
  Image as ImageIcon,
  MessageSquare,
  UsersRound,
  Tag,
  Briefcase,
} from "lucide-react";
import axios from "axios";
import { cn } from "@/lib/utils";
import { companyApi } from "@/lib/api";

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
  /** When true, only users with role='super_admin' can see this item */
  superAdminOnly?: boolean;
  /** When set, employee must have this specific permission key to see this tab */
  requiredPermission?: string;
};

type MenuGroup = {
  title: string;
  items: MenuItem[];
};

interface SidebarProps {
  role: "admin" | "user";
  isOpen: boolean;
  onToggle: () => void;
  isMobileOpen?: boolean;
  onMobileClose?: () => void;
}

// ==========================================
// MENU CONFIGURATION (FIXED PATHS)
// ==========================================

const MENU_GROUPS: MenuGroup[] = [
  {
    title: "Overview",
    items: [
      // FIXED: Added specific path for dashboard
      { href: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard, requiredPermission: "dashboard.view" },
      {
        label: "Trading",
        icon: ShoppingBag,
        requiredPermission: "trading.view",
        subItems: [
          { href: "/admin/trading/etf", label: "ETF" },
          { href: "/admin/trading/nifty50", label: "Nifty50" },
        ],
      },
    ],
  },
  {
    title: "Workspace",
    items: [
      {
        href: "/admin/user-management",
        label: "User Management",
        icon: Users,
        requiredPermission: "users.view",
      },
      { href: "/admin/institutes", label: "Organizations", icon: Building2, requiredPermission: "orgs.view" },
      {
        label: "Employee Management",
        icon: UsersRound,
        superAdminOnly: true,
        subItems: [
          { href: "/admin/employees", label: "All Employees" },
          { href: "/admin/employees/roles", label: "Roles & Permissions" },
          { href: "/admin/employees/activity", label: "Activity Log" },
        ],
      },
      { href: "/admin/referrals", label: "Referrals", icon: Tag, badge: "Earn", variant: "new" },
      { href: "/admin/payments", label: "Payment History", icon: CreditCard, superAdminOnly: true },
      { href: "/admin/applications", label: "Job Applications", icon: Briefcase, badge: "New", variant: "new" },
      { href: "/admin/feedback", label: "Feedback Hub", icon: MessageSquare, badge: "New", variant: "new", requiredPermission: "feedback.view" },
      { href: "/admin/gallery", label: "Gallery", icon: ImageIcon, requiredPermission: "gallery.view" },
    ],
  },
  {
    title: "Settings",
    items: [
      { href: "/admin/profile", label: "Profile", icon: User },
    ],
  },
];

// ==========================================
// MAIN SIDEBAR COMPONENT
// ==========================================

export function Sidebar({
  role,
  isOpen,
  onToggle,
  isMobileOpen = false,
  onMobileClose,
}: SidebarProps) {
  const [isClient, setIsClient] = useState(false);
  const [userRole, setUserRole] = useState<string>('');
  const [userPermissions, setUserPermissions] = useState<string[]>([]);
  const [userData, setUserData] = useState({
    name: "Loading...",
    email: "...",
    avatar: null as string | null,
    role: "Administrator"
  });

  useEffect(() => {
    setIsClient(true);
    fetchUserProfile();
  }, []);

  const fetchUserProfile = async () => {
    try {
      const data = await companyApi.getMe();
      if (data.success && data.user) {
        setUserData({
          name: data.user.name,
          email: data.user.email,
          avatar: data.user.avatar || null,
          role: data.user.role || "Administrator"
        });
        setUserRole(data.user.role ?? '');
        setUserPermissions(data.user.customRole?.permissions || []);
      }
    } catch (e) {
      setUserData({ name: "Admin", email: "admin@praedico.com", avatar: null, role: "Administrator" });
    }
  };

  const handleToggle = useCallback(() => {
    onToggle();
  }, [onToggle]);

  if (!isClient) return null;

  return (
    <>
      <style jsx global>{`
        @keyframes orbit {
          0% { transform: rotate(0deg) translateX(18px) rotate(0deg); }
          100% { transform: rotate(360deg) translateX(18px) rotate(-360deg); }
        }
        .group:hover .animate-orbit {
          animation: orbit 3s linear infinite;
          opacity: 1;
        }
        @keyframes shine-slide {
          0% { left: -100%; opacity: 0; }
          50% { opacity: 0.5; }
          100% { left: 100%; opacity: 0; }
        }
        .animate-shine-slide { animation: shine-slide 3s infinite linear; }
        .sidebar-scroll::-webkit-scrollbar { width: 0px; }
        .sidebar-scroll:hover::-webkit-scrollbar { width: 4px; }
        .sidebar-scroll::-webkit-scrollbar-track { background: transparent; }
        .sidebar-scroll::-webkit-scrollbar-thumb { background: #334155; border-radius: 4px; }

        /* Mobile slide-in */
        @keyframes slideInLeft {
          from { transform: translateX(-100%); }
          to { transform: translateX(0); }
        }
        .sidebar-mobile-in { animation: slideInLeft 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards; }
      `}</style>

      {/* ── Desktop Sidebar ── */}
      <aside
        className={cn(
          "relative h-screen flex-col border-r border-white/5 bg-[#0B0C15] text-slate-400 z-50 shadow-[4px_0_24px_rgba(0,0,0,0.4)]",
          "transition-all duration-500",
          // Hidden on mobile, flex on md+
          "hidden md:flex",
          isOpen ? "w-[280px]" : "w-[88px]"
        )}
      >
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.03] pointer-events-none mix-blend-overlay" />
        <SidebarHeader isOpen={isOpen} onToggle={handleToggle} />
        <div className="flex-1 overflow-y-auto overflow-x-hidden sidebar-scroll py-6 space-y-8">
          {MENU_GROUPS.map((group) => {
            const filteredGroup = {
              ...group,
              items: group.items.filter((item) => {
                if (item.superAdminOnly && userRole !== 'super_admin') return false;
                if (item.requiredPermission && userRole !== 'super_admin') {
                  if (!userPermissions.includes(item.requiredPermission)) return false;
                }
                return true;
              }),
            };
            if (filteredGroup.items.length === 0) return null;
            return (
              <NavGroup
                key={group.title}
                group={filteredGroup}
                isOpen={isOpen}
                onToggleSidebar={handleToggle}
                onNavClick={undefined}
              />
            );
          })}
        </div>
        <UserProfileFooter isOpen={isOpen} user={userData} />
      </aside>

      {/* ── Mobile Drawer Sidebar ── */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 w-[280px] flex flex-col border-r border-white/5 bg-[#0B0C15] text-slate-400 z-[100] shadow-[4px_0_24px_rgba(0,0,0,0.4)]",
          "md:hidden transition-transform duration-300",
          isMobileOpen ? "translate-x-0 sidebar-mobile-in" : "-translate-x-full"
        )}
      >
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.03] pointer-events-none mix-blend-overlay" />
        <SidebarHeader isOpen={true} onToggle={onMobileClose ?? (() => { })} />
        <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden sidebar-scroll py-6 space-y-8">
          {MENU_GROUPS.map((group) => {
            const filteredGroup = {
              ...group,
              items: group.items.filter((item) => {
                if (item.superAdminOnly && userRole !== 'super_admin') return false;
                if (item.requiredPermission && userRole !== 'super_admin') {
                  if (!userPermissions.includes(item.requiredPermission)) return false;
                }
                return true;
              }),
            };
            if (filteredGroup.items.length === 0) return null;
            return (
              <NavGroup
                key={group.title}
                group={filteredGroup}
                isOpen={true}
                onToggleSidebar={() => { }}
                onNavClick={onMobileClose}
              />
            );
          })}
        </div>
        <UserProfileFooter isOpen={true} user={userData} />
      </aside>
    </>
  );
}

// ==========================================
// SUB-COMPONENTS
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
          <div className="absolute -inset-3 bg-indigo-500/20 rounded-full blur-xl opacity-0 group-hover/header:opacity-100 transition-opacity duration-700" />
          <div className="relative h-11 w-11 rounded-2xl flex items-center justify-center">
            <Image
              src="/praedico-logo.png"
              alt="Praedico Logo"
              width={44}
              height={44}
              className="rounded-2xl"
            />
          </div>
        </div>

        {/* Text */}
        <div className={cn("flex flex-col overflow-hidden transition-all duration-500", isOpen ? "w-auto opacity-100" : "w-0 opacity-0")}>
          <span className="font-bold text-[14px] text-white tracking-tight leading-none whitespace-nowrap">
            Praedico Global Research
          </span>
          <span className="text-[10px] font-bold text-indigo-400 tracking-[0.25em] mt-1 whitespace-nowrap uppercase">
            Admin Portal
          </span>
        </div>
      </div>

      {isOpen && (
        <button
          onClick={(e) => { e.stopPropagation(); onToggle(); }}
          className="absolute -right-3 top-1/2 -translate-y-1/2 h-7 w-7 bg-[#0B0C15] border border-white/10 rounded-full flex items-center justify-center text-slate-400 shadow-xl hover:bg-indigo-600 hover:border-indigo-500 hover:text-white transition-all duration-300 z-50 group/toggle"
        >
          <ChevronLeft size={14} className="group-hover/toggle:-translate-x-0.5 transition-transform" />
        </button>
      )}
    </div>
  );
});
SidebarHeader.displayName = "SidebarHeader";

const NavGroup = memo((
  {
    group,
    isOpen,
    onToggleSidebar,
    onNavClick,
  }: {
    group: MenuGroup;
    isOpen: boolean;
    onToggleSidebar: () => void;
    onNavClick?: () => void;
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
            onNavClick={onNavClick}
          />
        ))}
      </div>
    </div>
  );
});
NavGroup.displayName = "NavGroup";

const NavItem = memo((
  {
    item,
    isOpen,
    onToggleSidebar,
    onNavClick,
  }: {
    item: MenuItem;
    isOpen: boolean;
    onToggleSidebar: () => void;
    onNavClick?: () => void;
  }) => {
  const pathname = usePathname();
  const Icon = item.icon;

  // ============================================
  // PATH MATCHING LOGIC (Ensures Glow Works)
  // ============================================

  // Exact match for the main link
  const isActive = item.href ? pathname === item.href : false;

  // Child match for dropdowns
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
    return <Link href={item.href!} className={className} onClick={onNavClick}>{children}</Link>;
  };

  // ============================================
  // GLOW & ACTIVE STATE STYLES
  // ============================================
  const activeClass = cn(
    "bg-gradient-to-r from-indigo-600/20 via-purple-500/10 to-transparent", // Gradient
    "text-white", // Text Color
    "border-l-2 border-indigo-500", // Left Border
    "shadow-[0_0_20px_rgba(99,102,241,0.15)]", // Neon Glow
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
        {/* Glowing Background for Icon when Active */}
        {(isActive || isSubActive) && (
          <div className="absolute left-0 w-full h-full bg-indigo-500/5 opacity-50 blur-xl pointer-events-none" />
        )}

        <div className={cn(
          "relative z-10 transition-all duration-300",
          (isActive || isSubActive) ? "text-indigo-400 drop-shadow-[0_0_8px_rgba(129,140,248,0.5)] scale-105" : "text-slate-500 group-hover:text-slate-300"
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
                    "bg-indigo-500 text-white"
              )}>
                {item.badge}
              </span>
            )}
            {item.subItems && (
              <ChevronDown size={14} className={cn("text-slate-500 transition-transform duration-300", isExpanded && "rotate-180 text-white")} />
            )}
          </div>
        )}

        {/* Collapsed Tooltip */}
        {!isOpen && (
          <div className="absolute left-full top-1/2 -translate-y-1/2 ml-4 px-3 py-1.5 bg-[#1e1b4b] border border-indigo-500/30 text-white text-xs font-semibold rounded-lg opacity-0 group-hover/nav:opacity-100 translate-x-2 group-hover/nav:translate-x-0 transition-all duration-200 pointer-events-none z-[100] shadow-xl whitespace-nowrap">
            {item.label}
          </div>
        )}
      </Wrapper>

      {/* Submenu Expansion */}
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
                      : "text-slate-500 hover:text-indigo-300"
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

const PromoCard = memo(() => {
  return (
    <div className="relative rounded-2xl bg-gradient-to-br from-violet-900/50 to-fuchsia-900/50 p-5 shadow-lg overflow-hidden group cursor-pointer border border-white/10 hover:border-white/20 transition-colors">
      <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-soft-light" />

      {/* Moving Shine Effect */}
      <div className="absolute top-0 left-[-100%] w-full h-full bg-gradient-to-r from-transparent via-white/10 to-transparent skew-x-12 animate-shine-slide" />

      <div className="relative z-10">
        <div className="h-10 w-10 rounded-xl bg-white/10 backdrop-blur-md flex items-center justify-center mb-4 border border-white/10 shadow-inner">
          <Zap className="text-white h-5 w-5 fill-white" />
        </div>

        <h4 className="text-white font-bold text-base mb-1">Upgrade to Pro</h4>
        <p className="text-white/60 text-xs leading-relaxed mb-4">
          Unlock AI reports & more.
        </p>

        <button className="w-full py-2.5 bg-white text-black text-xs font-bold rounded-xl shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 flex items-center justify-center gap-2">
          View Pricing <ChevronRight size={12} />
        </button>
      </div>
    </div>
  );
});
PromoCard.displayName = "PromoCard";

const UserProfileFooter = memo(({ isOpen, user }: { isOpen: boolean; user: any }) => {
  const [imgError, setImgError] = useState(false);

  const handleLogout = async () => {
    try {
      await companyApi.logout();
    } catch (e) {
      console.error(e);
    } finally {
      window.location.href = "/";
    }
  };

  return (
    <div className="flex-shrink-0 p-4 border-t border-white/5 bg-[#08090f] relative group">
      <div className={cn("flex items-center gap-3 p-2 rounded-2xl transition-all duration-300", isOpen ? "bg-white/5 border border-white/5 hover:bg-white/10 hover:border-white/10" : "justify-center")}>

        {/* AVATAR CONTAINER */}
        <div className="relative flex-shrink-0 h-10 w-10">

          {/* ORBITING DOT ANIMATION */}
          <div className="absolute inset-0 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500">
            <div className="absolute top-1/2 left-1/2 w-full h-full -translate-x-1/2 -translate-y-1/2 rounded-full animate-orbit">
              <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full shadow-[0_0_8px_#10b981]" />
            </div>
          </div>

          {/* MAIN IMAGE */}
          <div className="h-full w-full rounded-full p-[2px] bg-gradient-to-tr from-purple-500 to-pink-500 shadow-lg relative z-10">
            <div className="h-full w-full rounded-full bg-[#0B0C15] overflow-hidden flex items-center justify-center">
              {user.avatar && !imgError ? (
                <img
                  src={user.avatar}
                  alt={user.name}
                  className="h-full w-full object-cover"
                  onError={() => setImgError(true)}
                />
              ) : (
                <span className="font-bold text-white text-sm bg-gradient-to-br from-indigo-500 to-purple-600 w-full h-full flex items-center justify-center">
                  {user.name.charAt(0).toUpperCase()}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* User Details */}
        <div className={cn("flex-1 min-w-0 transition-all duration-300", isOpen ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-4 hidden")}>
          <p className="text-sm font-bold text-white truncate leading-tight group-hover:text-pink-300 transition-colors">
            {user.name}
          </p>
          <p className="text-[10px] text-slate-500 truncate font-medium uppercase tracking-wide mt-0.5">
            {user.role === 'super_admin' ? 'Super Admin' : user.role === 'admin' ? 'Administrator' : 'Employee'}
          </p>
        </div>

        {/* Logout */}
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

      {/* Collapsed Logout */}
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
