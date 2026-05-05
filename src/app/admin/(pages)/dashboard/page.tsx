"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
  Users, UserCheck, UserX, ShieldAlert, ArrowUpRight, RefreshCw,
  Building2, UsersRound, FileText,
  MessageSquare, Settings, ChevronRight, ChevronLeft, Activity, Clock,
  AlertCircle, CheckCircle2, Eye, EyeOff
} from "lucide-react";
import { companyApi } from "@/lib/api";
import axiosInstance from "@/lib/axios";

// ─── Types ────────────────────────────────────────────────────────────────────

interface UserStats {
  totalUsers: number;
  activeUsers: number;
  inactiveUsers: number;
  blockedUsers: number;
  deletedUsers: number;
  registeredUsers: number;
}

interface ActivityLog {
  _id: string;
  action: string;
  performedBy: { name: string; role: string };
  target?: { name?: string; email?: string };
  createdAt: string;
  details?: string;
}

interface Employee {
  _id: string;
  name: string;
  email: string;
  role: string;
  isActive: boolean;
  avatar?: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function timeAgo(dateStr: string) {
  const now = Date.now();
  const diff = Math.floor((now - new Date(dateStr).getTime()) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

function formatNumber(n: number) {
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
  return String(n);
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function AdminDashboard() {
  const [adminName, setAdminName] = useState("Admin");
  const [adminRole, setAdminRole] = useState("super_admin");
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);
  const [logsLoading, setLogsLoading] = useState(true);
  const [employeesLoading, setEmployeesLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
  const [activityPage, setActivityPage] = useState(0);
  const LOGS_PER_PAGE = 10;

  const fetchAll = useCallback(async () => {
    setLoading(true);

    // Fetch admin profile
    try {
      const data = await companyApi.getMe();
      if (data.success && data.user) {
        setAdminName(data.user.name || "Admin");
        setAdminRole(data.user.role || "super_admin");
      }
    } catch (e) { /* silently fail */ }

    // Fetch user stats
    setStatsLoading(true);
    try {
      const res = await axiosInstance.get("/api/users/stats");
      if (res.data.success) setUserStats(res.data.stats);
    } catch (e) { /* silently fail */ } finally {
      setStatsLoading(false);
    }

    // Fetch activity logs
    setLogsLoading(true);
    try {
      const data = await companyApi.getActivityLogs();
      if (data.success && Array.isArray(data.logs)) {
        setActivityLogs(data.logs);
        setActivityPage(0); // reset to first page on refresh
      }
    } catch (e) { /* silently fail */ } finally {
      setLogsLoading(false);
    }

    // Fetch employees (super_admin only — gracefully handle 403)
    setEmployeesLoading(true);
    try {
      const data = await companyApi.getEmployees();
      if (data.success && Array.isArray(data.employees)) {
        setEmployees(data.employees.slice(0, 6));
      }
    } catch (e) { /* silently fail */ } finally {
      setEmployeesLoading(false);
    }

    setLoading(false);
    setLastRefresh(new Date());
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const roleLabel = adminRole === "super_admin" ? "Super Admin" : adminRole === "admin" ? "Administrator" : "Employee";

  return (
    <div className="space-y-4 md:space-y-8 animate-in fade-in duration-700 p-3 md:p-8 pb-12 text-slate-200">

      {/* ── HERO BANNER ─────────────────────────────────────────── */}
      <div className="relative overflow-hidden rounded-2xl md:rounded-[2rem] bg-gradient-to-br from-indigo-600 via-purple-600 to-blue-700 p-6 md:p-10 shadow-2xl shadow-indigo-900/50 ring-1 ring-white/10 group">
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay" />
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-blue-400/30 rounded-full blur-3xl" />
        <div className="absolute -bottom-24 -left-24 w-72 h-72 bg-purple-400/30 rounded-full blur-3xl" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/20 backdrop-blur-md w-fit mb-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
              <span className="text-xs font-medium text-white/90">System Operational</span>
            </div>
            <h1 className="text-2xl md:text-4xl font-extrabold text-white tracking-tight leading-tight">
              Welcome back, <span className="text-transparent bg-clip-text bg-gradient-to-r from-white to-blue-100">{adminName}</span>!
            </h1>
            <p className="text-indigo-100/80 text-sm md:text-lg font-light">
              {roleLabel} · Last refreshed {timeAgo(lastRefresh.toISOString())}
            </p>
          </div>
          <button
            onClick={fetchAll}
            disabled={loading}
            className="group relative overflow-hidden bg-white text-indigo-900 px-6 py-3 md:px-8 md:py-4 rounded-xl md:rounded-2xl font-bold shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all duration-300 flex items-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed self-start md:self-auto"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : "group-hover:rotate-180 transition-transform duration-500"}`} />
            Refresh Data
          </button>
        </div>
      </div>

      {/* ── USER STATS CARDS ───────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6">
        <StatCard
          title="Total Users"
          value={statsLoading ? "—" : formatNumber(userStats?.totalUsers ?? 0)}
          sub="All registered accounts"
          icon={Users}
          color="text-blue-400"
          bg="bg-blue-500/10"
          border="group-hover:border-blue-500/40"
          loading={statsLoading}
        />
        <StatCard
          title="Active Users"
          value={statsLoading ? "—" : formatNumber(userStats?.activeUsers ?? 0)}
          sub="Verified & enabled accounts"
          icon={UserCheck}
          color="text-emerald-400"
          bg="bg-emerald-500/10"
          border="group-hover:border-emerald-500/40"
          loading={statsLoading}
        />
        <StatCard
          title="Blocked"
          value={statsLoading ? "—" : formatNumber(userStats?.blockedUsers ?? 0)}
          sub="Deactivated accounts"
          icon={UserX}
          color="text-rose-400"
          bg="bg-rose-500/10"
          border="group-hover:border-rose-500/40"
          loading={statsLoading}
        />
        <StatCard
          title="Team"
          value={employeesLoading ? "—" : formatNumber(employees.length)}
          sub="Active staff"
          icon={ShieldAlert}
          color="text-purple-400"
          bg="bg-purple-500/10"
          border="group-hover:border-purple-500/40"
          loading={employeesLoading}
        />
      </div>

      {/* ── MAIN GRID ─────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">

        {/* Activity Log */}
        <div className="lg:col-span-2 rounded-2xl md:rounded-[2rem] bg-[#0f172a] border border-slate-800 shadow-xl overflow-hidden">
          <div className="flex items-center justify-between p-4 md:p-6 border-b border-slate-800">
            <div>
              <h3 className="text-base md:text-lg font-bold text-white">Recent Activity</h3>
              <p className="text-slate-500 text-xs mt-0.5 hidden sm:block">Live audit log from the staff portal</p>
            </div>
            <Activity className="text-indigo-400 h-5 w-5" />
          </div>

          <div className="divide-y divide-slate-800/60">
            {logsLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="px-6 py-4 flex items-start gap-4 animate-pulse">
                  <div className="h-8 w-8 bg-slate-800 rounded-full shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3 w-3/4 bg-slate-800 rounded" />
                    <div className="h-2 w-1/3 bg-slate-700 rounded" />
                  </div>
                </div>
              ))
            ) : activityLogs.length === 0 ? (
              <div className="px-6 py-12 text-center text-slate-500">
                <Clock className="h-8 w-8 mx-auto mb-3 opacity-50" />
                <p className="text-sm">No recent activity found.</p>
              </div>
            ) : (
              activityLogs
                .slice(activityPage * LOGS_PER_PAGE, (activityPage + 1) * LOGS_PER_PAGE)
                .map((log) => (
                  <ActivityRow key={log._id} log={log} />
                ))
            )}
          </div>

          {/* Pagination controls */}
          {!logsLoading && activityLogs.length > LOGS_PER_PAGE && (
            <div className="flex items-center justify-between px-6 py-3 border-t border-slate-800 bg-slate-900/40">
              <span className="text-xs text-slate-500">
                Page {activityPage + 1} of {Math.ceil(activityLogs.length / LOGS_PER_PAGE)}
                <span className="ml-2 text-slate-600">({activityLogs.length} total)</span>
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => setActivityPage(p => Math.max(0, p - 1))}
                  disabled={activityPage === 0}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800 text-slate-300 hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                >
                  <ChevronLeft size={13} /> Prev
                </button>
                <button
                  onClick={() => setActivityPage(p => Math.min(Math.ceil(activityLogs.length / LOGS_PER_PAGE) - 1, p + 1))}
                  disabled={(activityPage + 1) * LOGS_PER_PAGE >= activityLogs.length}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800 text-slate-300 hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                >
                  Next <ChevronRight size={13} />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Team Overview */}
        <div className="rounded-2xl md:rounded-[2rem] bg-[#0f172a] border border-slate-800 shadow-xl overflow-hidden flex flex-col">
          <div className="flex items-center justify-between p-4 md:p-6 border-b border-slate-800">
            <div>
              <h3 className="text-base md:text-lg font-bold text-white">Team</h3>
              <p className="text-slate-500 text-xs mt-0.5 hidden sm:block">Portal staff members</p>
            </div>
            <UsersRound className="text-indigo-400 h-5 w-5" />
          </div>

          <div className="flex-1 divide-y divide-slate-800/60 overflow-y-auto max-h-80">
            {employeesLoading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="px-5 py-3.5 flex items-center gap-3 animate-pulse">
                  <div className="h-9 w-9 bg-slate-800 rounded-full shrink-0" />
                  <div className="flex-1 space-y-1.5">
                    <div className="h-3 w-2/3 bg-slate-800 rounded" />
                    <div className="h-2 w-1/3 bg-slate-700 rounded" />
                  </div>
                </div>
              ))
            ) : employees.length === 0 ? (
              <div className="px-5 py-10 text-center text-slate-500">
                <UsersRound className="h-8 w-8 mx-auto mb-3 opacity-50" />
                <p className="text-sm">No team members found.</p>
              </div>
            ) : (
              employees.map((emp) => <EmployeeRow key={emp._id} emp={emp} />)
            )}
          </div>

          <div className="p-4 border-t border-slate-800">
            <Link
              href="/admin/employees"
              className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-indigo-600/10 text-indigo-400 hover:bg-indigo-600/20 border border-indigo-500/20 hover:border-indigo-500/40 text-sm font-medium transition-all"
            >
              Manage All Employees <ChevronRight size={14} />
            </Link>
          </div>
        </div>
      </div>

      {/* ── QUICK ACCESS ──────────────────────────────────── */}
      <div>
        <h2 className="text-lg md:text-xl font-bold text-white px-1 mb-3 md:mb-4 tracking-tight">Quick Access</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 md:gap-4">
          {QUICK_LINKS.map((link) => (
            <QuickLink key={link.href} {...link} />
          ))}
        </div>
      </div>

      {/* ── USER BREAKDOWN BAR ───────────────────────────────────── */}
      {userStats && !statsLoading && (
        <div className="rounded-2xl md:rounded-[2rem] bg-[#0f172a] border border-slate-800 shadow-xl p-4 md:p-8">
          <div className="flex items-center justify-between mb-4 md:mb-6">
            <div>
              <h3 className="text-base md:text-lg font-bold text-white">User Breakdown</h3>
              <p className="text-slate-500 text-xs md:text-sm hidden sm:block">Distribution of user account states</p>
            </div>
            <Link href="/admin/user-management" className="text-sm text-indigo-400 hover:text-indigo-300 flex items-center gap-1">
              View All <ArrowUpRight size={14} />
            </Link>
          </div>
          <div className="space-y-3 md:space-y-4">
            <BreakdownBar
              label="Active"
              count={userStats.activeUsers}
              total={userStats.totalUsers}
              color="bg-emerald-500"
              shadow="shadow-[0_0_12px_rgba(16,185,129,0.4)]"
              icon={CheckCircle2}
              iconColor="text-emerald-400"
            />
            <BreakdownBar
              label="Unverified"
              count={userStats.totalUsers - userStats.registeredUsers}
              total={userStats.totalUsers}
              color="bg-amber-500"
              shadow="shadow-[0_0_12px_rgba(245,158,11,0.4)]"
              icon={AlertCircle}
              iconColor="text-amber-400"
            />
            <BreakdownBar
              label="Blocked"
              count={userStats.blockedUsers}
              total={userStats.totalUsers}
              color="bg-rose-500"
              shadow="shadow-[0_0_12px_rgba(239,68,68,0.4)]"
              icon={EyeOff}
              iconColor="text-rose-400"
            />
            <BreakdownBar
              label="Archived"
              count={userStats.deletedUsers}
              total={userStats.totalUsers + userStats.deletedUsers}
              color="bg-slate-500"
              shadow=""
              icon={Eye}
              iconColor="text-slate-400"
            />
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatCard({ title, value, sub, icon: Icon, color, bg, border, loading }: any) {
  return (
    <div className={`rounded-2xl md:rounded-[2rem] bg-[#0f172a] p-4 md:p-6 border border-slate-800 shadow-lg hover:shadow-2xl hover:shadow-blue-900/10 transition-all duration-300 hover:-translate-y-1 group relative overflow-hidden ${border}`}>
      <div className="flex justify-between items-start mb-3 md:mb-4 relative z-10">
        <div className={`p-2.5 md:p-4 rounded-xl md:rounded-2xl ${bg} group-hover:scale-110 transition-transform duration-300 ring-1 ring-white/5`}>
          <Icon className={`h-4 w-4 md:h-6 md:w-6 ${color}`} />
        </div>
      </div>
      <div className="relative z-10">
        <p className="text-slate-400 text-xs md:text-sm font-medium mb-1 truncate">{title}</p>
        {loading ? (
          <div className="h-7 md:h-9 w-16 md:w-24 bg-slate-800 rounded-lg animate-pulse" />
        ) : (
          <h3 className="text-2xl md:text-3xl font-bold text-white tracking-tight">{value}</h3>
        )}
        <p className="text-[10px] md:text-xs text-slate-500 mt-1 md:mt-2 font-medium leading-tight line-clamp-1">{sub}</p>
      </div>
    </div>
  );
}

function ActivityRow({ log }: { log: ActivityLog }) {
  const actionColors: Record<string, string> = {
    login: "text-emerald-400 bg-emerald-500/10",
    logout: "text-slate-400 bg-slate-500/10",
    invite: "text-blue-400 bg-blue-500/10",
    delete: "text-rose-400 bg-rose-500/10",
    update: "text-amber-400 bg-amber-500/10",
    block: "text-orange-400 bg-orange-500/10",
    create: "text-indigo-400 bg-indigo-500/10",
  };
  const key = Object.keys(actionColors).find(k => log.action?.toLowerCase().includes(k)) ?? "update";
  const colorClass = actionColors[key];

  return (
    <div className="px-6 py-4 flex items-start gap-4 hover:bg-slate-800/20 transition-colors">
      <div className={`mt-0.5 h-8 w-8 rounded-full flex items-center justify-center shrink-0 ${colorClass}`}>
        <span className="text-xs font-bold uppercase">{log.performedBy?.name?.[0] ?? "?"}</span>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-slate-200 leading-snug">
          <span className="font-semibold text-white">{log.performedBy?.name ?? "Unknown"}</span>
          {" "}<span className="text-slate-400">{log.action}</span>
          {log.target?.name && <span className="text-slate-300"> · {log.target.name}</span>}
        </p>
        <p className="text-xs text-slate-500 mt-0.5">{timeAgo(log.createdAt)}</p>
      </div>
    </div>
  );
}

function EmployeeRow({ emp }: { emp: Employee }) {
  const initials = emp.name.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2);
  const roleLabel = emp.role === "super_admin" ? "Super Admin" : emp.role === "admin" ? "Admin" : "Employee";

  return (
    <div className="px-5 py-3.5 flex items-center gap-3 hover:bg-slate-800/20 transition-colors">
      <div className="relative h-9 w-9 shrink-0">
        {emp.avatar ? (
          <img src={emp.avatar} alt={emp.name} className="h-full w-full rounded-full object-cover" />
        ) : (
          <div className="h-full w-full rounded-full bg-gradient-to-br from-indigo-600 to-purple-700 flex items-center justify-center text-white text-xs font-bold">
            {initials}
          </div>
        )}
        <div className={`absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-[#0f172a] ${emp.isActive ? "bg-emerald-500" : "bg-slate-500"}`} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-white truncate">{emp.name}</p>
        <p className="text-xs text-slate-500 truncate">{roleLabel}</p>
      </div>
      <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold capitalize ${emp.isActive ? "bg-emerald-500/10 text-emerald-400" : "bg-slate-700 text-slate-400"}`}>
        {emp.isActive ? "Active" : "Inactive"}
      </span>
    </div>
  );
}

function BreakdownBar({ label, count, total, color, shadow, icon: Icon, iconColor }: any) {
  const pct = total > 0 ? Math.min(100, Math.round((count / total) * 100)) : 0;
  return (
    <div className="flex items-center gap-3 md:gap-4">
      <div className="flex items-center gap-2 w-24 md:w-32 shrink-0">
        <Icon size={14} className={iconColor} />
        <span className="text-xs md:text-sm font-medium text-slate-300">{label}</span>
      </div>
      <div className="flex-1 h-2.5 bg-slate-800 rounded-full overflow-hidden">
        <div
          className={`h-full ${color} rounded-full transition-all duration-700 ${shadow}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-xs md:text-sm font-bold text-white w-10 md:w-12 text-right">{count.toLocaleString()}</span>
      <span className="text-xs text-slate-500 w-8 md:w-10 text-right">{pct}%</span>
    </div>
  );
}

function QuickLink({ href, label, icon: Icon, color, bg }: any) {
  return (
    <Link
      href={href}
      className={`flex flex-col items-center gap-2 md:gap-3 p-3 md:p-5 rounded-2xl md:rounded-[1.5rem] bg-[#0f172a] border border-slate-800 hover:border-slate-600 hover:bg-slate-800/40 transition-all duration-300 hover:-translate-y-1 group`}
    >
      <div className={`p-2 md:p-3 rounded-xl md:rounded-2xl ${bg} group-hover:scale-110 transition-transform duration-300`}>
        <Icon className={`h-4 w-4 md:h-5 md:w-5 ${color}`} />
      </div>
      <span className="text-[10px] md:text-xs font-semibold text-slate-300 group-hover:text-white text-center leading-tight">{label}</span>
    </Link>
  );
}

const QUICK_LINKS = [
  { href: "/admin/user-management", label: "Users", icon: Users, color: "text-blue-400", bg: "bg-blue-500/10" },
  { href: "/admin/institutes", label: "Organizations", icon: Building2, color: "text-emerald-400", bg: "bg-emerald-500/10" },
  { href: "/admin/employees", label: "Employees", icon: UsersRound, color: "text-purple-400", bg: "bg-purple-500/10" },
  { href: "/admin/feedback", label: "Feedback", icon: MessageSquare, color: "text-pink-400", bg: "bg-pink-500/10" },
  { href: "/admin/profile", label: "Settings", icon: Settings, color: "text-slate-400", bg: "bg-slate-700/50" },
];