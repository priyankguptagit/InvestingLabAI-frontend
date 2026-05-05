"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import {
  Activity, Clock, Loader2, XCircle, ShieldCheck, UserPlus,
  LogIn, AlertTriangle, ChevronLeft, ChevronRight, Filter,
  X, Search, UserCog, Trash2, UserX, RefreshCcw, Calendar,
  Mail, Shield, Check
} from "lucide-react";
import { companyApi } from "@/lib/api";

// ─── Types ────────────────────────────────────────────────────────────────────
interface ActivityLog {
  _id: string;
  action: string;
  details: string;
  performedBy: {
    _id: string;
    name: string;
    email: string;
    avatar?: string;
    role?: string;
    isActive?: boolean;
  };
  targetModel?: string;
  metadata?: Record<string, any>;
  createdAt: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
const TWELVE_HOURS_MS = 12 * 60 * 60 * 1000;

const formatTimestamp = (dateStr: string): { primary: string; secondary?: string } => {
  const date = new Date(dateStr);
  const diff = Date.now() - date.getTime();

  if (diff >= TWELVE_HOURS_MS) {
    // Show exact date + time
    const dateLabel = date.toLocaleDateString("en-IN", {
      day: "2-digit", month: "short", year: "numeric",
    });
    const timeLabel = date.toLocaleTimeString("en-IN", {
      hour: "2-digit", minute: "2-digit", hour12: true,
    });
    return { primary: dateLabel, secondary: timeLabel };
  }

  // Within 12 hours — relative
  const m = Math.floor(diff / 60000);
  if (m < 1) return { primary: "Just now" };
  if (m < 60) return { primary: `${m}m ago` };
  const h = Math.floor(m / 60);
  return { primary: `${h}h ${m % 60}m ago` };
};

const ACTION_META: Record<string, { label: string; icon: React.ReactNode; colorClass: string; badgeClass: string }> = {
  EMPLOYEE_LOGIN:   { label: "Login",            icon: <LogIn className="h-4 w-4" />,        colorClass: "text-emerald-400 bg-emerald-500/10 border-emerald-500/25",  badgeClass: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30" },
  EMPLOYEE_CREATED: { label: "Employee Added",   icon: <UserPlus className="h-4 w-4" />,     colorClass: "text-indigo-400 bg-indigo-500/10 border-indigo-500/25",     badgeClass: "bg-indigo-500/15 text-indigo-300 border-indigo-500/30" },
  EMPLOYEE_UPDATED: { label: "Profile Updated",  icon: <UserCog className="h-4 w-4" />,      colorClass: "text-blue-400 bg-blue-500/10 border-blue-500/25",           badgeClass: "bg-blue-500/15 text-blue-300 border-blue-500/30" },
  EMPLOYEE_DELETED: { label: "Employee Removed", icon: <Trash2 className="h-4 w-4" />,       colorClass: "text-rose-400 bg-rose-500/10 border-rose-500/25",           badgeClass: "bg-rose-500/15 text-rose-300 border-rose-500/30" },
  EMPLOYEE_BLOCKED: { label: "Access Toggled",   icon: <UserX className="h-4 w-4" />,        colorClass: "text-orange-400 bg-orange-500/10 border-orange-500/25",     badgeClass: "bg-orange-500/15 text-orange-300 border-orange-500/30" },
  ROLE_CREATED:     { label: "Role Created",     icon: <ShieldCheck className="h-4 w-4" />,  colorClass: "text-violet-400 bg-violet-500/10 border-violet-500/25",     badgeClass: "bg-violet-500/15 text-violet-300 border-violet-500/30" },
  ROLE_UPDATED:     { label: "Role Updated",     icon: <ShieldCheck className="h-4 w-4" />,  colorClass: "text-amber-400 bg-amber-500/10 border-amber-500/25",        badgeClass: "bg-amber-500/15 text-amber-300 border-amber-500/30" },
  ROLE_DELETED:     { label: "Role Deleted",     icon: <AlertTriangle className="h-4 w-4" />,colorClass: "text-red-400 bg-red-500/10 border-red-500/25",              badgeClass: "bg-red-500/15 text-red-300 border-red-500/30" },
  ROLE_ASSIGNED:    { label: "Role Assigned",    icon: <Shield className="h-4 w-4" />,       colorClass: "text-cyan-400 bg-cyan-500/10 border-cyan-500/25",           badgeClass: "bg-cyan-500/15 text-cyan-300 border-cyan-500/30" },
};

const getActionMeta = (action: string) =>
  ACTION_META[action] ?? { label: action, icon: <Activity className="h-4 w-4" />, colorClass: "text-slate-400 bg-slate-500/10 border-slate-500/25", badgeClass: "bg-slate-500/15 text-slate-300 border-slate-500/30" };

const ROLE_LABELS: Record<string, { label: string; color: string }> = {
  super_admin: { label: "Super Admin", color: "text-amber-300 bg-amber-500/10 border-amber-500/30" },
  admin:       { label: "Admin",       color: "text-indigo-300 bg-indigo-500/10 border-indigo-500/30" },
  employee:    { label: "Employee",    color: "text-slate-300 bg-slate-500/10 border-slate-500/30" },
};

// ─── Avatar Initials Component ────────────────────────────────────────────────
function Avatar({ name, avatar }: { name: string; avatar?: string }) {
  if (avatar) return (
    <img src={avatar} alt={name} className="h-9 w-9 rounded-full object-cover ring-2 ring-white/10" />
  );
  const initials = name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
  return (
    <div className="h-9 w-9 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-xs font-bold text-white ring-2 ring-white/10">
      {initials}
    </div>
  );
}

// ─── Multi-Select Dropdown ────────────────────────────────────────────────────
function MultiSelectDropdown({
  label, icon, options, selected, onToggle, onClear,
}: {
  label: string;
  icon: React.ReactNode;
  options: { value: string; label: string }[];
  selected: Set<string>;
  onToggle: (val: string) => void;
  onClear: () => void;
}) {
  const [open, setOpen] = useState(false);
  const count = selected.size;

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(p => !p)}
        className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium border transition-all ${count > 0
          ? "bg-indigo-500/15 border-indigo-500/40 text-indigo-300"
          : "bg-slate-800/60 border-white/8 text-slate-400 hover:bg-slate-700/60 hover:text-slate-200"
          }`}
      >
        {icon}
        <span>{label}</span>
        {count > 0 && (
          <span className="bg-indigo-500 text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
            {count}
          </span>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute top-full mt-2 left-0 z-20 w-52 bg-[#0d1526] border border-white/10 rounded-xl shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-3 py-2 border-b border-white/5">
              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">{label}</span>
              {count > 0 && (
                <button onClick={onClear} className="text-[10px] text-rose-400 hover:text-rose-300 font-medium">Clear</button>
              )}
            </div>
            <div className="py-1 max-h-56 overflow-y-auto">
              {options.map(opt => (
                <button
                  key={opt.value}
                  onClick={() => onToggle(opt.value)}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-300 hover:bg-white/5 transition-colors"
                >
                  <div className={`w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 transition-colors ${selected.has(opt.value) ? "bg-indigo-500 border-indigo-500" : "border-white/20"}`}>
                    {selected.has(opt.value) && <Check className="w-2.5 h-2.5 text-white" />}
                  </div>
                  <span className="truncate">{opt.label}</span>
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function ActivityLogPage() {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12;

  // Filters
  const [search, setSearch] = useState("");
  const [selectedActions, setSelectedActions] = useState<Set<string>>(new Set());
  const [selectedRoles, setSelectedRoles] = useState<Set<string>>(new Set());
  const [selectedModels, setSelectedModels] = useState<Set<string>>(new Set());

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await companyApi.getActivityLogs();
      if (data.success) setLogs(data.logs);
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to fetch activity logs");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchLogs(); }, [fetchLogs]);

  // Derive unique options from data
  const actionOptions = useMemo(() =>
    Object.entries(ACTION_META).map(([v, m]) => ({ value: v, label: m.label })),
    []
  );
  const roleOptions = [
    { value: "super_admin", label: "Super Admin" },
    { value: "admin", label: "Admin" },
    { value: "employee", label: "Employee" },
  ];
  const modelOptions = useMemo(() => {
    const models = Array.from(new Set(logs.map(l => l.targetModel).filter(Boolean))) as string[];
    return models.map(m => ({ value: m, label: m.replace("Company", "") }));
  }, [logs]);

  const toggleSet = (setter: React.Dispatch<React.SetStateAction<Set<string>>>, val: string) => {
    setter(prev => { const n = new Set(prev); n.has(val) ? n.delete(val) : n.add(val); return n; });
  };

  const clearAllFilters = () => {
    setSearch("");
    setSelectedActions(new Set());
    setSelectedRoles(new Set());
    setSelectedModels(new Set());
  };

  const filteredLogs = useMemo(() => {
    const q = search.trim().toLowerCase();
    return logs.filter(log => {
      if (selectedActions.size > 0 && !selectedActions.has(log.action)) return false;
      if (selectedRoles.size > 0 && !selectedRoles.has(log.performedBy?.role || "")) return false;
      if (selectedModels.size > 0 && !selectedModels.has(log.targetModel || "")) return false;
      if (q) {
        const haystack = `${log.performedBy?.name} ${log.performedBy?.email} ${log.details} ${log.action}`.toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    });
  }, [logs, search, selectedActions, selectedRoles, selectedModels]);

  const totalPages = Math.ceil(filteredLogs.length / itemsPerPage);
  const currentLogs = filteredLogs.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const activeFilterCount = selectedActions.size + selectedRoles.size + selectedModels.size + (search ? 1 : 0);

  // Reset to page 1 when filters change
  useEffect(() => setCurrentPage(1), [search, selectedActions, selectedRoles, selectedModels]);

  return (
    <div className="space-y-6 text-slate-200">
      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="h-11 w-11 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
            <Activity className="h-5 w-5 text-amber-400" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Activity Log</h2>
            <p className="text-slate-500 text-xs mt-0.5">
              Audit trail of all employee and admin actions
              {logs.length > 0 && <span className="ml-1 text-slate-600">· {logs.length} entries</span>}
            </p>
          </div>
        </div>
        <button
          onClick={fetchLogs}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border border-white/8 bg-slate-800/60 text-slate-300 hover:bg-slate-700/60 hover:text-white transition-all disabled:opacity-50"
        >
          <RefreshCcw size={14} className={loading ? "animate-spin" : ""} /> Refresh
        </button>
      </div>

      {/* ── Filter Bar ──────────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500 pointer-events-none" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search name, email, action…"
            className="pl-8 pr-3 py-2 rounded-lg bg-slate-800/60 border border-white/8 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500/50 focus:border-indigo-500/40 w-56 transition-all"
          />
          {search && (
            <button onClick={() => setSearch("")} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300">
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        <MultiSelectDropdown
          label="Action"
          icon={<Activity className="w-3.5 h-3.5" />}
          options={actionOptions}
          selected={selectedActions}
          onToggle={v => toggleSet(setSelectedActions, v)}
          onClear={() => setSelectedActions(new Set())}
        />

        <MultiSelectDropdown
          label="Role"
          icon={<Shield className="w-3.5 h-3.5" />}
          options={roleOptions}
          selected={selectedRoles}
          onToggle={v => toggleSet(setSelectedRoles, v)}
          onClear={() => setSelectedRoles(new Set())}
        />

        {modelOptions.length > 0 && (
          <MultiSelectDropdown
            label="Target"
            icon={<Filter className="w-3.5 h-3.5" />}
            options={modelOptions}
            selected={selectedModels}
            onToggle={v => toggleSet(setSelectedModels, v)}
            onClear={() => setSelectedModels(new Set())}
          />
        )}

        {activeFilterCount > 0 && (
          <button
            onClick={clearAllFilters}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 border border-rose-500/20 transition-all"
          >
            <X className="w-3.5 h-3.5" /> Clear all ({activeFilterCount})
          </button>
        )}

        {filteredLogs.length !== logs.length && (
          <span className="ml-auto text-xs text-slate-500">
            Showing <span className="text-slate-300 font-medium">{filteredLogs.length}</span> of {logs.length} results
          </span>
        )}
      </div>

      {/* ── Content ─────────────────────────────────────────────────────────── */}
      <div className="rounded-2xl bg-[#0F172A]/80 border border-white/5 backdrop-blur-2xl shadow-2xl overflow-hidden">

        {loading && logs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24">
            <Loader2 className="h-8 w-8 text-indigo-500 animate-spin" />
            <p className="mt-3 text-sm text-slate-500">Loading audit trail…</p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-24">
            <XCircle className="h-10 w-10 text-rose-500 mb-3" />
            <p className="text-slate-400 text-sm">{error}</p>
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24">
            <div className="h-16 w-16 rounded-full bg-slate-800/50 border border-white/5 flex items-center justify-center mb-4">
              <Clock className="h-7 w-7 text-slate-500" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-1">
              {logs.length === 0 ? "No activity yet" : "No matching entries"}
            </h3>
            <p className="text-slate-500 text-sm max-w-xs text-center">
              {logs.length === 0
                ? "Future logins and admin actions will appear here."
                : "Try adjusting or clearing your filters."}
            </p>
          </div>
        ) : (
          <>
            {/* Table Header */}
            <div className="hidden md:grid grid-cols-[2fr_1.5fr_1.5fr_1.2fr_1fr] gap-4 px-6 py-3 border-b border-white/5 bg-white/[0.02]">
              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Performed By</span>
              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Action</span>
              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Details</span>
              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Target</span>
              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 text-right">When</span>
            </div>

            <div className="divide-y divide-white/[0.04]">
              {currentLogs.map((log) => {
                const meta = getActionMeta(log.action);
                const ts = formatTimestamp(log.createdAt);
                const isOld = Date.now() - new Date(log.createdAt).getTime() >= TWELVE_HOURS_MS;
                const roleMeta = ROLE_LABELS[log.performedBy?.role || ""] || ROLE_LABELS.employee;

                return (
                  <div
                    key={log._id}
                    className="grid grid-cols-1 md:grid-cols-[2fr_1.5fr_1.5fr_1.2fr_1fr] gap-4 px-6 py-4 hover:bg-white/[0.025] transition-colors items-center"
                  >
                    {/* Performer */}
                    <div className="flex items-center gap-3 min-w-0">
                      <Avatar name={log.performedBy?.name || "?"} avatar={log.performedBy?.avatar} />
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-slate-200 truncate">
                          {log.performedBy?.name || "System"}
                        </p>
                        <div className="flex items-center gap-1 mt-0.5">
                          <Mail className="h-3 w-3 text-slate-600 flex-shrink-0" />
                          <span className="text-xs text-slate-500 truncate">{log.performedBy?.email}</span>
                        </div>
                        <span className={`inline-flex items-center mt-1 px-1.5 py-0.5 rounded-md text-[10px] font-semibold border ${roleMeta.color}`}>
                          {roleMeta.label}
                        </span>
                      </div>
                    </div>

                    {/* Action Badge */}
                    <div className="flex items-center gap-2">
                      <div className={`h-8 w-8 rounded-lg border flex items-center justify-center flex-shrink-0 ${meta.colorClass}`}>
                        {meta.icon}
                      </div>
                      <span className={`px-2 py-0.5 rounded-md text-[11px] font-bold border ${meta.badgeClass}`}>
                        {meta.label}
                      </span>
                    </div>

                    {/* Details */}
                    <p className="text-xs text-slate-400 leading-relaxed line-clamp-2">
                      {log.details}
                    </p>

                    {/* Target Model */}
                    <div>
                      {log.targetModel ? (
                        <span className="px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-white/5 uppercase tracking-wider text-[9px] font-bold">
                          {log.targetModel.replace("Company", "")}
                        </span>
                      ) : (
                        <span className="text-slate-600 text-xs">—</span>
                      )}
                    </div>

                    {/* Timestamp */}
                    <div className="flex flex-col items-end text-right">
                      {isOld ? (
                        <>
                          <div className="flex items-center gap-1 text-slate-400">
                            <Calendar className="h-3 w-3 flex-shrink-0" />
                            <span className="text-xs font-medium">{ts.primary}</span>
                          </div>
                          <div className="flex items-center gap-1 text-slate-500 mt-0.5">
                            <Clock className="h-3 w-3 flex-shrink-0" />
                            <span className="text-xs">{ts.secondary}</span>
                          </div>
                        </>
                      ) : (
                        <div className="flex items-center gap-1 text-slate-400">
                          <Clock className="h-3 w-3 flex-shrink-0" />
                          <span className="text-xs font-medium">{ts.primary}</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-6 py-4 border-t border-white/5 bg-white/[0.015]">
                <span className="text-sm text-slate-500">
                  Showing{" "}
                  <span className="text-slate-300 font-medium">
                    {(currentPage - 1) * itemsPerPage + 1}–{Math.min(currentPage * itemsPerPage, filteredLogs.length)}
                  </span>{" "}
                  of <span className="text-slate-300 font-medium">{filteredLogs.length}</span>
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="px-3 py-1.5 rounded-lg text-sm font-medium bg-slate-800/50 text-slate-300 hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center gap-1 border border-white/5"
                  >
                    <ChevronLeft size={15} /> Prev
                  </button>
                  <div className="flex items-center gap-1 px-1">
                    {Array.from({ length: totalPages }).map((_, i) =>
                      totalPages <= 7 || Math.abs(i + 1 - currentPage) <= 1 || i === 0 || i === totalPages - 1 ? (
                        <button
                          key={i}
                          onClick={() => setCurrentPage(i + 1)}
                          className={`w-7 h-7 flex items-center justify-center rounded-md text-xs font-medium transition-all ${currentPage === i + 1 ? "bg-indigo-500 text-white" : "text-slate-400 hover:bg-slate-800 hover:text-white"}`}
                        >
                          {i + 1}
                        </button>
                      ) : (Math.abs(i + 1 - currentPage) === 2 ? (
                        <span key={i} className="text-slate-600 w-4 text-center">…</span>
                      ) : null)
                    )}
                  </div>
                  <button
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="px-3 py-1.5 rounded-lg text-sm font-medium bg-slate-800/50 text-slate-300 hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center gap-1 border border-white/5"
                  >
                    Next <ChevronRight size={15} />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
