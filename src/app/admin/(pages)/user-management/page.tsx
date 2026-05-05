"use client";
import React, { useState, useEffect } from "react";
import {
  X, Users, MoreVertical, Loader2,
  ChevronLeft, ChevronRight, Sparkles, Shield,
  Clock, RotateCcw, Archive,
  RefreshCcw, Filter, Download, Eye, Ban, Search,
  Crown, UserCheck, CalendarDays, CheckCircle2,
  Building2, Globe, Mail, MapPin, Briefcase
} from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuItem,
} from "@/shared-components/ui/dropdown-menu";

// 👇 IMPORT API & TYPES
import { userApi, User, UserStats, Pagination } from "@/lib/api/user.api";
import { companyApi } from "@/lib/api";
import AdminBulkActionBar from "@/shared-components/AdminBulkActionBar";
import BulkConfirmModal, { BulkActionType } from "@/shared-components/BulkConfirmModal";

// ============================================
// MAIN COMPONENT
// ============================================

export default function UserManagementPage() {
  // ============================================
  // STATE MANAGEMENT
  // ============================================

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatuses, setSelectedStatuses] = useState<Set<string>>(new Set());
  const [showIndividualOnly, setShowIndividualOnly] = useState(false);

  const [users, setUsers] = useState<User[]>([]);
  const [stats, setStats] = useState<UserStats>({
    totalUsers: 0,
    activeUsers: 0,
    inactiveUsers: 0,
    blockedUsers: 0,
    registeredUsers: 0,
    deletedUsers: 0,
  });
  const [pagination, setPagination] = useState<Pagination>({
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 0,
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [actionMenuOpen, setActionMenuOpen] = useState<string | null>(null);

  // Bulk State
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkActionType, setBulkActionType] = useState<BulkActionType>('archive');
  const [bulkConfirmOpen, setBulkConfirmOpen] = useState(false);
  const [bulkLoading, setBulkLoading] = useState(false);

  // Modals
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [archiveModalOpen, setArchiveModalOpen] = useState(false);
  const [restoreModalOpen, setRestoreModalOpen] = useState(false);
  const [changePlanModalOpen, setChangePlanModalOpen] = useState(false);

  // Edit Form State
  const [editFormData, setEditFormData] = useState({
    name: "",
    email: "",
  });
  const [isSaving, setIsSaving] = useState(false);

  // Change Plan Form State
  const [changePlanForm, setChangePlanForm] = useState<{
    planName: 'Silver' | 'Gold' | 'Diamond' | 'Free';
    durationMonths: 1 | 3 | 6;
  }>({ planName: 'Silver', durationMonths: 1 });
  const [isChangingPlan, setIsChangingPlan] = useState(false);

  const [perms, setPerms] = useState<Record<string, boolean>>({});

  useEffect(() => {
    companyApi.getMe().then(res => {
      if (res.success && res.user) {
        if (res.user.role === 'super_admin') {
          setPerms({
            edit: true,
            archive: true,
            restore: true,
            block: true,
            bulk: true,
            export_csv: true,
            delete: true
          });
        } else {
          const p = res.user.customRole?.permissions || [];
          setPerms({
            edit: p.includes('users.edit'),
            archive: p.includes('users.archive'),
            restore: p.includes('users.restore'),
            block: p.includes('users.block'),
            bulk: p.includes('users.bulk_action'),
            export_csv: p.includes('users.export_csv'),
            delete: p.includes('users.delete'),
          });
        }
      }
    }).catch(() => { });
  }, []);

  // ============================================
  // API FUNCTIONS
  // ============================================

  const fetchUsers = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await userApi.getAllUsers({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        search: searchQuery,
        status: Array.from(selectedStatuses).join(','),
        ...(showIndividualOnly ? { individualOnly: true } : {}),
      });

      if (data.success) {
        setUsers(data.users);
        setPagination(data.pagination);
      }
    } catch (err: any) {
      if (users.length === 0) {
        setError(err.response?.data?.message || "Failed to fetch users");
      }
      console.error("Error fetching users:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      // ✅ FIXED: Use userApi.getStats
      const data = await userApi.getStats();
      if (data.success) {
        setStats(data.stats);
      }
    } catch (err) {
      console.error("Error fetching stats:", err);
    }
  };

  // --- ARCHIVE USER ---
  const handleSoftDeleteUser = async (userId: string) => {
    const previousUsers = [...users];

    // Optimistic Update
    setUsers((current) =>
      current.map(u => u._id === userId ? { ...u, isDeleted: true, deletedAt: new Date().toISOString() } : u)
    );
    setArchiveModalOpen(false);
    setActionMenuOpen(null);

    try {
      // ✅ FIXED: Use userApi.softDelete
      const data = await userApi.softDelete(userId);

      if (data.success) {
        fetchStats();
        if (Array.from(selectedStatuses).join(',') !== 'deleted' && Array.from(selectedStatuses).join(',') !== 'all') {
          setUsers(prev => prev.filter(u => u._id !== userId));
        }
      }
    } catch (err: any) {
      setUsers(previousUsers); // Rollback
      alert("Failed to archive user");
    }
  };

  // --- RESTORE USER ---
  const handleRestoreUser = async (userId: string) => {
    const previousUsers = [...users];

    // Optimistic Update
    setUsers((current) =>
      current.map(u => u._id === userId ? { ...u, isDeleted: false, deletedAt: undefined, isActive: false } : u)
    );
    setRestoreModalOpen(false);
    setActionMenuOpen(null);

    try {
      // ✅ FIXED: Use userApi.restore
      const data = await userApi.restore(userId);

      if (data.success) {
        fetchStats();
        if (Array.from(selectedStatuses).includes('deleted')) {
          setUsers(prev => prev.filter(u => u._id !== userId));
        }
      }
    } catch (err: any) {
      setUsers(previousUsers); // Rollback
      alert("Failed to restore user");
    }
  };

  // --- TOGGLE ACTIVE ---
  const handleToggleActive = async (userId: string) => {
    const previousUsers = [...users];
    setUsers((currentUsers) =>
      currentUsers.map((user) => {
        if (user._id === userId) {
          return { ...user, isActive: !user.isActive };
        }
        return user;
      })
    );
    setActionMenuOpen(null);

    try {
      // ✅ FIXED: Use userApi.toggleActive
      const data = await userApi.toggleActive(userId);

      if (data.success) {
        fetchStats();
      } else {
        setUsers(previousUsers);
        alert("Server failed to update status");
      }
    } catch (err: any) {
      console.error("Toggle error:", err);
      setUsers(previousUsers);
      alert("Failed to update status.");
    }
  };

  // --- UPDATE USER ---
  const handleEditClick = (user: User) => {
    setSelectedUser(user);
    setEditFormData({
      name: user.name,
      email: user.email
    });
    setEditModalOpen(true);
  };

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;

    setIsSaving(true);
    try {
      // ✅ FIXED: Use userApi.updateUser
      const data = await userApi.updateUser(selectedUser._id, editFormData as any);

      if (data.success) {
        setUsers(prev => prev.map(u =>
          u._id === selectedUser._id ? { ...u, ...editFormData } : u
        ));
        setEditModalOpen(false);
      }
    } catch (err: any) {
      console.error("Update error:", err);
      alert("Failed to update user");
    } finally {
      setIsSaving(false);
    }
  };

  // --- ADMIN CHANGE PLAN ---
  const handleChangePlan = async () => {
    if (!selectedUser) return;
    setIsChangingPlan(true);
    try {
      const planName = changePlanForm.planName;
      const durationMonths = planName === 'Free' ? undefined : changePlanForm.durationMonths;
      const data = await userApi.adminChangePlan(selectedUser._id, planName, durationMonths);
      if (data.success) {
        // Optimistically update the user in the list
        setUsers(prev => prev.map(u =>
          u._id === selectedUser._id
            ? {
                ...u,
                currentPlan: planName,
                subscriptionStatus: planName === 'Free' ? 'cancelled' : 'active',
                subscriptionExpiry: data.subscriptionExpiry,
              }
            : u
        ));
        setChangePlanModalOpen(false);
      }
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Failed to change plan');
    } finally {
      setIsChangingPlan(false);
    }
  };

  const handleExport = () => {
    const csv = [
      ["Name", "Email", "Status", "Joined"],
      ...users.map((u) => [
        u.name,
        u.email,
        u.isDeleted
          ? "Archived"
          : u.isActive && u.isVerified
            ? "Active"
            : "Inactive",
        new Date(u.createdAt).toLocaleDateString(),
      ]),
    ]
      .map((row) => row.join(","))
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `users-${new Date().toISOString()}.csv`;
    a.click();
  };

  // --- BULK SELECTION LOGIC ---
  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      const newSelected = new Set(selectedIds);
      users.forEach(user => newSelected.add(user._id));
      setSelectedIds(newSelected);
    } else {
      const newSelected = new Set(selectedIds);
      users.forEach(user => newSelected.delete(user._id));
      setSelectedIds(newSelected);
    }
  };

  const toggleSelection = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  // --- BULK ACTION HANDLER ---
  const openBulkConfirm = (action: BulkActionType) => {
    setBulkActionType(action);
    setBulkConfirmOpen(true);
  };

  const handleBulkAction = async () => {
    if (selectedIds.size === 0) return;
    setBulkLoading(true);

    try {
      const data = await userApi.bulkAction({
        userIds: Array.from(selectedIds),
        action: bulkActionType
      });

      if (data.success) {
        setSelectedIds(new Set());
        setBulkConfirmOpen(false);
        fetchUsers();
        fetchStats();
      }
    } catch (err: any) {
      console.error("Bulk action error:", err);
      alert(`Failed to perform bulk ${bulkActionType}`);
    } finally {
      setBulkLoading(false);
    }
  };

  // ============================================
  // EFFECTS
  // ============================================

  useEffect(() => {
    fetchUsers();
    fetchStats();
  }, [pagination.page, searchQuery, selectedStatuses, showIndividualOnly]);

  useEffect(() => {
    setPagination((prev) => ({ ...prev, page: 1 }));
    setSelectedIds(new Set()); // Clear selection when filters change
  }, [searchQuery, selectedStatuses, showIndividualOnly]);

  // ============================================
  // UI HELPERS (Badges, Stats)
  // ============================================

  const getStatusBadge = (user: User) => {
    if (user.isDeleted) {
      return (
        <div className="flex items-center gap-2">
          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-slate-500"></span>
          <span className="text-slate-500 text-xs font-semibold tracking-wide uppercase">Archived</span>
        </div>
      );
    }
    if (user.isActive && user.isVerified) {
      return (
        <div className="flex items-center gap-2">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
          </span>
          <span className="text-emerald-400 text-xs font-semibold tracking-wide uppercase">Active</span>
        </div>
      );
    } else if (!user.isActive) {
      return (
        <div className="flex items-center gap-2">
          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.5)]"></span>
          <span className="text-rose-400 text-xs font-semibold tracking-wide uppercase">Blocked</span>
        </div>
      );
    } else {
      return (
        <div className="flex items-center gap-2">
          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500"></span>
          <span className="text-amber-400 text-xs font-semibold tracking-wide uppercase">Inactive</span>
        </div>
      );
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  };

  const getTimeAgo = (dateString?: string) => {
    if (!dateString) return "Never";
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
  };

  const statsCards = [
    { icon: Users, label: "Total Users", value: stats.totalUsers, color: "text-white", gradient: "from-blue-600 to-indigo-600" },
    { icon: Sparkles, label: "Active Now", value: stats.activeUsers, color: "text-emerald-300", gradient: "from-emerald-600 to-teal-600" },
    { icon: Shield, label: "Blocked", value: stats.blockedUsers, color: "text-rose-300", gradient: "from-rose-600 to-red-600" },
    { icon: Archive, label: "Archived", value: stats.deletedUsers || 0, color: "text-slate-300", gradient: "from-slate-600 to-gray-600" },
  ];

  const getPlanBadge = (plan?: string) => {
    if (!plan || plan === 'Free') return null;
    const config: Record<string, { color: string; bg: string }> = {
      Diamond: { color: 'text-cyan-300', bg: 'bg-cyan-500/10 border-cyan-500/30' },
      Gold:    { color: 'text-amber-300', bg: 'bg-amber-500/10 border-amber-500/30' },
      Silver:  { color: 'text-slate-300', bg: 'bg-slate-500/10 border-slate-500/30' },
    };
    const c = config[plan] || config.Silver;
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[10px] font-bold uppercase tracking-wide ${c.bg} ${c.color}`}>
        <Crown className="h-2.5 w-2.5" />{plan}
      </span>
    );
  };

  // ============================================
  // RENDER (UI Remains Identical)
  // ============================================

  return (
    <div className="min-h-screen w-full bg-[#030712] text-slate-200 font-sans selection:bg-indigo-500/30 relative overflow-hidden">
      {/* Background Effects */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-indigo-500/10 rounded-full blur-[120px] animate-pulse-slow" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-purple-500/10 rounded-full blur-[120px] animate-pulse-slow delay-1000" />
      </div>

      <div className="relative z-10 p-3 md:p-6 lg:p-10 max-w-[1600px] mx-auto space-y-4 md:space-y-8">

        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 animate-slide-down">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl md:text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-white via-slate-200 to-slate-400 tracking-tight">
                User Management
              </h1>
              <button
                onClick={fetchUsers}
                className="p-2 rounded-full bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-all"
                title="Refresh List"
              >
                <RotateCcw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              </button>
            </div>
            <p className="text-slate-500 mt-1 text-xs md:text-sm font-medium tracking-wide">
              Admin Portal • System Overview
            </p>
          </div>

          {perms.export_csv && (
            <button
              onClick={handleExport}
              className="group relative px-6 py-3 rounded-xl bg-[#0F172A] border border-white/10 hover:border-indigo-500/50 transition-all duration-300 overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/10 to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <div className="flex items-center gap-2 relative z-10">
                <Download className="h-4 w-4 text-indigo-400 group-hover:scale-110 transition-transform" />
                <span className="text-sm font-semibold text-slate-300 group-hover:text-white">Export CSV</span>
              </div>
            </button>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6">
          {statsCards.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <div
                key={index}
                className="relative group p-4 md:p-6 rounded-2xl md:rounded-3xl bg-[#0F172A]/60 backdrop-blur-xl border border-white/5 hover:border-white/10 transition-all duration-500 hover:-translate-y-1"
                style={{ animation: `fadeIn 0.5s ease-out ${index * 0.1}s backwards` }}
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${stat.gradient} opacity-0 group-hover:opacity-5 rounded-2xl md:rounded-3xl transition-opacity duration-500`} />
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-slate-500 text-[10px] md:text-xs font-bold uppercase tracking-wider mb-1 md:mb-2">{stat.label}</p>
                    <h3 className={`text-2xl md:text-3xl font-bold ${stat.color} tracking-tight`}>{stat.value}</h3>
                  </div>
                  <div className={`p-2 md:p-3 rounded-xl md:rounded-2xl bg-white/5 border border-white/5 group-hover:scale-110 transition-transform duration-300`}>
                    <Icon className={`h-4 w-4 md:h-6 md:w-6 ${stat.color} opacity-80`} />
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Filters & Table */}
        <div className="rounded-2xl md:rounded-[32px] bg-[#0F172A]/80 backdrop-blur-2xl border border-white/5 shadow-2xl overflow-hidden animate-slide-up">
          <div className="p-3 md:p-6 border-b border-white/5 flex flex-col lg:flex-row gap-3 justify-between items-stretch lg:items-center bg-[#0F172A]/50">
            {/* Search */}
            <div className="relative w-full lg:w-96 group">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-slate-500 group-focus-within:text-indigo-400 transition-colors" />
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search users..."
                className="block w-full pl-11 pr-4 py-3 md:py-3.5 bg-[#020617] border border-white/5 rounded-xl md:rounded-2xl text-sm text-slate-200 placeholder-slate-600 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500/50 transition-all outline-none"
              />
            </div>

            {/* Filters */}
            <div className="flex gap-2 md:gap-3 flex-wrap">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center gap-2 px-3 md:px-4 py-2.5 md:py-3.5 bg-[#020617] border border-white/5 hover:bg-white/5 rounded-xl md:rounded-2xl text-sm font-medium text-slate-300 transition-colors">
                    <Filter className="h-4 w-4 text-slate-500" />
                    <span className="hidden sm:inline">Status</span>
                    {selectedStatuses.size > 0 && (
                      <span className="ml-1 bg-indigo-500 text-white text-[10px] px-2 py-0.5 rounded-full font-bold">
                        {selectedStatuses.size}
                      </span>
                    )}
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48 bg-[#0F172A] border-white/10 text-slate-200 shadow-xl rounded-xl p-2 font-sans">
                  <DropdownMenuLabel className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1 px-2">Account Status</DropdownMenuLabel>
                  <DropdownMenuSeparator className="bg-white/10 mx-1 mb-2" />
                  {['active', 'deleted', 'unverified'].map((statusOption) => (
                    <DropdownMenuCheckboxItem
                      key={statusOption}
                      checked={selectedStatuses.has(statusOption)}
                      onCheckedChange={(checked) => {
                        setSelectedStatuses(prev => {
                          const next = new Set(prev);
                          if (checked) next.add(statusOption);
                          else next.delete(statusOption);
                          return next;
                        });
                      }}
                      className="capitalize cursor-pointer rounded-lg focus:bg-indigo-500/20 focus:text-indigo-300"
                    >
                      {statusOption === 'deleted' ? 'Archived' : statusOption}
                    </DropdownMenuCheckboxItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Individual Users Only Toggle */}
              <button
                onClick={() => setShowIndividualOnly(prev => !prev)}
                className={`flex items-center gap-2 px-3 md:px-4 py-2.5 md:py-3.5 border rounded-xl md:rounded-2xl text-sm font-medium transition-all ${
                  showIndividualOnly
                    ? 'bg-violet-500/15 border-violet-500/40 text-violet-300 shadow-[0_0_12px_rgba(139,92,246,0.15)]'
                    : 'bg-[#020617] border-white/5 text-slate-300 hover:bg-white/5'
                }`}
                title="Show only users not affiliated with any organization"
              >
                <UserCheck className="h-4 w-4" />
                <span className="hidden sm:inline">Individual Only</span>
                {showIndividualOnly && (
                  <span className="ml-1 bg-violet-500 text-white text-[10px] px-1.5 py-0.5 rounded-full font-bold">ON</span>
                )}
              </button>

              {/* Clear Filters Button */}
              {(selectedStatuses.size > 0 || showIndividualOnly) && (
                <button
                  onClick={() => { setSelectedStatuses(new Set()); setShowIndividualOnly(false); }}
                  className="px-3 md:px-4 py-2.5 md:py-3.5 flex items-center gap-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 rounded-xl md:rounded-2xl text-sm font-bold transition-colors animate-in fade-in"
                >
                  <X className="h-4 w-4" />
                  <span className="hidden sm:inline">Clear</span>
                </button>
              )}
            </div>
          </div>

          <div className="relative min-h-[400px]">
            {loading && users.length === 0 ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#0F172A]/50 z-20">
                <Loader2 className="h-10 w-10 text-indigo-500 animate-spin" />
                <p className="mt-4 text-sm text-slate-400 font-medium animate-pulse">Fetching data...</p>
              </div>
            ) : users.length === 0 && !error ? (
              <div className="flex flex-col items-center justify-center py-24 text-center">
                <div className="h-20 w-20 bg-slate-800/50 rounded-full flex items-center justify-center mb-6 border border-white/5">
                  <Search className="h-8 w-8 text-slate-500" />
                </div>
                <h3 className="text-xl font-semibold text-white">No users found</h3>
                <p className="text-slate-500 mt-2 max-w-xs mx-auto">We couldn't find any users matching your current filters.</p>
              </div>
            ) : (
              <>
                {/* ── DESKTOP TABLE (md+) ── */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-white/5 bg-[#020617]/50">
                        <th className="px-6 py-5 w-12 text-center">
                          <input
                            type="checkbox"
                            className="h-4 w-4 rounded border-white/10 bg-[#020617] text-indigo-500 focus:ring-indigo-500/20 cursor-pointer"
                            checked={users.length > 0 && users.every(u => selectedIds.has(u._id))}
                            onChange={handleSelectAll}
                          />
                        </th>
                        <th className="px-8 py-5 text-left text-[11px] font-bold text-slate-500 uppercase tracking-widest">User Details</th>
                        <th className="px-6 py-5 text-left text-[11px] font-bold text-slate-500 uppercase tracking-widest">Status</th>
                        <th className="px-6 py-5 text-left text-[11px] font-bold text-slate-500 uppercase tracking-widest">Last Active</th>
                        <th className="px-6 py-5 text-right text-[11px] font-bold text-slate-500 uppercase tracking-widest">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {users.map((user, index) => (
                        <tr
                          key={user._id}
                          className={`group hover:bg-white/[0.02] transition-colors duration-300 cursor-pointer ${user.isDeleted ? 'opacity-50 grayscale hover:grayscale-0 hover:opacity-100' : ''} ${selectedIds.has(user._id) ? 'bg-indigo-500/5 hover:bg-indigo-500/10' : ''}`}
                          style={{ animation: `slideUp 0.3s ease-out ${index * 0.05}s backwards` }}
                          onClick={(e) => {
                            const target = e.target as HTMLElement;
                            if (target.closest('button') || target.closest('input')) return;
                            setSelectedUser(user);
                            setViewModalOpen(true);
                          }}
                        >
                          <td className="px-6 py-5 text-center">
                            <input
                              type="checkbox"
                              className="h-4 w-4 rounded border-white/10 bg-[#020617] text-indigo-500 focus:ring-indigo-500/20 cursor-pointer"
                              checked={selectedIds.has(user._id)}
                              onChange={() => toggleSelection(user._id)}
                            />
                          </td>
                          <td className="px-8 py-5">
                            <div className="flex items-center gap-4">
                              <div className={`h-11 w-11 rounded-full flex items-center justify-center text-sm font-bold text-white shadow-lg bg-gradient-to-br ${user.isDeleted
                                ? 'from-slate-600 to-gray-600'
                                : ['from-pink-500 to-rose-500', 'from-indigo-500 to-blue-500', 'from-emerald-500 to-teal-500', 'from-amber-500 to-orange-500'][index % 4]
                                }`}>
                                {user.name.charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <p className={`text-sm font-semibold text-slate-200 ${!user.isDeleted && 'group-hover:text-indigo-400'} transition-colors`}>{user.name}</p>
                                <p className="text-xs text-slate-500 font-medium mt-0.5">{user.email}</p>
                                {getPlanBadge(user.currentPlan) && (
                                  <div className="mt-1">{getPlanBadge(user.currentPlan)}</div>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-5">{getStatusBadge(user)}</td>
                          <td className="px-6 py-5">
                            <div className="flex items-center gap-2 text-slate-400">
                              <Clock className="h-3.5 w-3.5" />
                              <span className="text-xs font-medium">{getTimeAgo(user.lastActive || user.lastLogin)}</span>
                            </div>
                          </td>
                          <td className="px-6 py-5 text-right">
                            <div className="flex items-center justify-end gap-1 opacity-60 group-hover:opacity-100 transition-opacity">
                              <button onClick={() => { setSelectedUser(user); setViewModalOpen(true); }} className="p-2 rounded-lg hover:bg-indigo-500/10 hover:text-indigo-400 text-slate-400 transition-all">
                                <Eye className="h-4 w-4" />
                              </button>
                              {user.isDeleted && perms.restore && (
                                <button onClick={() => { setSelectedUser(user); setRestoreModalOpen(true); }} className="p-2 rounded-lg hover:bg-emerald-500/10 hover:text-emerald-400 text-slate-400 transition-all" title="Restore User">
                                  <RefreshCcw className="h-4 w-4" />
                                </button>
                              )}
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <button className="p-2 rounded-lg hover:bg-slate-700/50 text-slate-400 transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500/50">
                                    <MoreVertical className="h-4 w-4" />
                                  </button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-48 bg-[#0F172A] border-[#1e293b] text-slate-200 shadow-2xl rounded-xl p-1 font-sans z-50">
                                  {!user.isDeleted ? (
                                    <>
                                      {perms.block && (
                                        <DropdownMenuItem onClick={() => handleToggleActive(user._id)} className="px-3 py-2.5 text-xs font-medium text-slate-300 focus:bg-white/5 focus:text-white cursor-pointer rounded-lg flex items-center gap-2">
                                          <Ban className="h-3.5 w-3.5" />
                                          {user.isActive ? "Block Access" : "Unblock User"}
                                        </DropdownMenuItem>
                                      )}
                                      {!user.organization && (
                                        <DropdownMenuItem
                                          onClick={() => {
                                            setSelectedUser(user);
                                            setChangePlanForm({ planName: (user.currentPlan as any) || 'Silver', durationMonths: 1 });
                                            setChangePlanModalOpen(true);
                                          }}
                                          className="px-3 py-2.5 text-xs font-medium text-violet-300 focus:bg-violet-500/10 focus:text-violet-200 cursor-pointer rounded-lg flex items-center gap-2"
                                        >
                                          <Crown className="h-3.5 w-3.5" />
                                          Change Plan
                                        </DropdownMenuItem>
                                      )}
                                      {perms.archive && (
                                        <DropdownMenuItem onClick={() => { setSelectedUser(user); setArchiveModalOpen(true); }} className="px-3 py-2.5 text-xs font-medium text-amber-400 focus:bg-amber-500/10 focus:text-amber-300 cursor-pointer rounded-lg flex items-center gap-2 mt-1 border-t border-white/5 pt-3">
                                          <Archive className="h-3.5 w-3.5" />
                                          Archive User
                                        </DropdownMenuItem>
                                      )}
                                    </>
                                  ) : perms.restore ? (
                                    <DropdownMenuItem onClick={() => { setSelectedUser(user); setRestoreModalOpen(true); }} className="px-3 py-2.5 text-xs font-medium text-emerald-400 focus:bg-emerald-500/10 focus:text-emerald-300 cursor-pointer rounded-lg flex items-center gap-2">
                                      <RefreshCcw className="h-3.5 w-3.5" />
                                      Restore Account
                                    </DropdownMenuItem>
                                  ) : null}
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* ── MOBILE CARD LIST (< md) ── */}
                <div className="md:hidden divide-y divide-white/5">
                  {users.map((user, index) => (
                    <div
                      key={user._id}
                      className={`p-4 flex items-center gap-3 cursor-pointer ${user.isDeleted ? 'opacity-60' : ''} ${selectedIds.has(user._id) ? 'bg-indigo-500/5' : ''}`}
                      onClick={(e) => {
                        const target = e.target as HTMLElement;
                        if (target.closest('button') || target.closest('input')) return;
                        setSelectedUser(user);
                        setViewModalOpen(true);
                      }}
                    >
                      {/* Checkbox */}
                      <input
                        type="checkbox"
                        className="h-4 w-4 rounded border-white/10 bg-[#020617] text-indigo-500 shrink-0 cursor-pointer"
                        checked={selectedIds.has(user._id)}
                        onChange={() => toggleSelection(user._id)}
                      />
                      {/* Avatar */}
                      <div className={`h-10 w-10 shrink-0 rounded-full flex items-center justify-center text-sm font-bold text-white bg-gradient-to-br ${user.isDeleted ? 'from-slate-600 to-gray-600'
                        : ['from-pink-500 to-rose-500', 'from-indigo-500 to-blue-500', 'from-emerald-500 to-teal-500', 'from-amber-500 to-orange-500'][index % 4]
                        }`}>
                        {user.name.charAt(0).toUpperCase()}
                      </div>
                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-slate-200 truncate">{user.name}</p>
                        <p className="text-[11px] text-slate-500 truncate">{user.email}</p>
                        <div className="flex items-center gap-2 mt-1">
                          {getStatusBadge(user)}
                          <span className="text-[10px] text-slate-600 flex items-center gap-1">
                            <Clock className="h-2.5 w-2.5" />{getTimeAgo(user.lastActive || user.lastLogin)}
                          </span>
                        </div>
                      </div>
                      {/* Actions */}
                      <div className="flex items-center gap-1 shrink-0">
                        <button onClick={() => { setSelectedUser(user); setViewModalOpen(true); }} className="p-2 rounded-lg hover:bg-indigo-500/10 text-slate-400 hover:text-indigo-400 transition-all">
                          <Eye className="h-4 w-4" />
                        </button>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button className="p-2 rounded-lg hover:bg-slate-700/50 text-slate-400 transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500/50">
                              <MoreVertical className="h-4 w-4" />
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-44 bg-[#0F172A] border-[#1e293b] text-slate-200 shadow-2xl rounded-xl p-1 font-sans z-50">
                            <DropdownMenuItem onClick={() => { setSelectedUser(user); setViewModalOpen(true); }} className="px-3 py-2 text-xs font-medium text-slate-300 focus:bg-white/5 focus:text-white cursor-pointer rounded-lg flex items-center gap-2 mb-1">
                              <Eye className="h-3.5 w-3.5" /> View Details
                            </DropdownMenuItem>
                            {!user.isDeleted && !user.organization && (
                              <DropdownMenuItem
                                onClick={() => {
                                  setSelectedUser(user);
                                  setChangePlanForm({ planName: (user.currentPlan as any) || 'Silver', durationMonths: 1 });
                                  setChangePlanModalOpen(true);
                                }}
                                className="px-3 py-2 text-xs font-medium text-violet-300 focus:bg-violet-500/10 focus:text-violet-200 cursor-pointer rounded-lg flex items-center gap-2 border-t border-white/5 pt-2"
                              >
                                <Crown className="h-3.5 w-3.5" /> Change Plan
                              </DropdownMenuItem>
                            )}
                            {!user.isDeleted && perms.block && (
                              <DropdownMenuItem onClick={() => handleToggleActive(user._id)} className="px-3 py-2 text-xs font-medium text-slate-300 focus:bg-white/5 focus:text-white cursor-pointer rounded-lg flex items-center gap-2 border-t border-white/5 pt-2">
                                <Ban className="h-3.5 w-3.5" />
                                {user.isActive ? 'Block Access' : 'Unblock User'}
                              </DropdownMenuItem>
                            )}
                            {!user.isDeleted && perms.archive && (
                              <DropdownMenuItem onClick={() => { setSelectedUser(user); setArchiveModalOpen(true); }} className="px-3 py-2 text-xs font-medium text-amber-400 focus:bg-amber-500/10 focus:text-amber-300 cursor-pointer rounded-lg flex items-center gap-2 border-t border-white/5 pt-2">
                                <Archive className="h-3.5 w-3.5" /> Archive
                              </DropdownMenuItem>
                            )}
                            {user.isDeleted && perms.restore && (
                              <DropdownMenuItem onClick={() => { setSelectedUser(user); setRestoreModalOpen(true); }} className="px-3 py-2 text-xs font-medium text-emerald-400 focus:bg-emerald-500/10 focus:text-emerald-300 cursor-pointer rounded-lg flex items-center gap-2 border-t border-white/5 pt-2">
                                <RefreshCcw className="h-3.5 w-3.5" /> Restore
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Pagination Controls */}
          {!loading && users.length > 0 && (
            <div className="p-6 border-t border-white/5 bg-[#020617]/30 flex items-center justify-between">
              <p className="text-xs font-medium text-slate-500">
                Page <span className="text-white">{pagination.page}</span> of {pagination.totalPages} • Total <span className="text-white">{pagination.total}</span> users
              </p>
              <div className="flex gap-2">
                <button onClick={() => setPagination(prev => ({ ...prev, page: Math.max(1, prev.page - 1) }))} disabled={pagination.page === 1} className="p-2.5 rounded-xl bg-[#0F172A] border border-white/5 text-slate-400 hover:text-white hover:border-white/20 disabled:opacity-30 disabled:cursor-not-allowed transition-all">
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button onClick={() => setPagination(prev => ({ ...prev, page: Math.min(prev.totalPages, prev.page + 1) }))} disabled={pagination.page === pagination.totalPages} className="p-2.5 rounded-xl bg-[#0F172A] border border-white/5 text-slate-400 hover:text-white hover:border-white/20 disabled:opacity-30 disabled:cursor-not-allowed transition-all">
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ═══════════════════════════════════════════ */}
      {/* PREMIUM VIEW USER MODAL                     */}
      {/* ═══════════════════════════════════════════ */}
      {viewModalOpen && selectedUser && (() => {
        const isOrgUser = !!(selectedUser.organization && typeof selectedUser.organization === 'object');
        const planColors: Record<string, { text: string; ring: string; glow: string; icon: string }> = {
          Diamond: { text: 'text-cyan-300',  ring: 'ring-cyan-500/30',   glow: 'shadow-cyan-500/20',  icon: '💎' },
          Gold:    { text: 'text-amber-300', ring: 'ring-amber-500/30',  glow: 'shadow-amber-500/20', icon: '🥇' },
          Silver:  { text: 'text-slate-300', ring: 'ring-slate-500/30',  glow: 'shadow-slate-500/20', icon: '🥈' },
        };
        const pc = selectedUser.currentPlan ? planColors[selectedUser.currentPlan] : null;

        return (
          <div
            className="fixed inset-0 z-[100] flex items-center justify-center p-4"
            style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(12px)' }}
            onClick={() => setViewModalOpen(false)}
          >
            {/* Modal Shell — stop propagation so inner clicks don't close */}
            <div
              className="relative w-full max-w-xl max-h-[90vh] flex flex-col rounded-[28px] overflow-hidden shadow-[0_32px_80px_rgba(0,0,0,0.6)] animate-in zoom-in-95 fade-in duration-300"
              style={{ background: 'linear-gradient(145deg,#0d1629 0%,#0a1021 100%)', border: '1px solid rgba(255,255,255,0.08)' }}
              onClick={e => e.stopPropagation()}
            >

              {/* ── Animated Header ── */}
              <div className="relative h-40 shrink-0 overflow-hidden">
                {/* animated gradient base */}
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600" />
                {/* noise texture overlay */}
                <div className="absolute inset-0 opacity-30" style={{
                  backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='1'/%3E%3C/svg%3E")`
                }} />
                {/* subtle grid lines */}
                <div className="absolute inset-0 opacity-10" style={{
                  backgroundImage: 'linear-gradient(rgba(255,255,255,0.15) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.15) 1px, transparent 1px)',
                  backgroundSize: '40px 40px'
                }} />
                {/* glowing orb */}
                <div className="absolute -bottom-10 -right-10 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
                <div className="absolute -top-10 -left-10 h-32 w-32 rounded-full bg-indigo-400/20 blur-2xl" />

                {/* Top-right close button */}
                <button
                  onClick={() => setViewModalOpen(false)}
                  className="absolute top-4 right-4 z-10 p-2 rounded-full bg-black/25 hover:bg-black/50 text-white/80 hover:text-white transition-all backdrop-blur-sm"
                >
                  <X className="h-5 w-5" />
                </button>

                {/* Role chip top-left */}
                <div className="absolute top-4 left-5 z-10">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 backdrop-blur-sm text-white text-[11px] font-bold uppercase tracking-widest border border-white/20">
                    {selectedUser.role === 'super_admin' ? '⚡ Super Admin' : selectedUser.role === 'admin' ? '🛡️ Admin' : '👤 User'}
                  </span>
                </div>
              </div>

              {/* ── Avatar overlap ── */}
              <div className="relative px-7 -mt-[52px] flex items-end justify-between mb-4 shrink-0">
                <div className="ring-4 ring-[#0d1629] rounded-full shadow-2xl">
                  <div className="h-[100px] w-[100px] rounded-full bg-gradient-to-br from-indigo-400 via-purple-500 to-pink-500 flex items-center justify-center text-[42px] font-black text-white shadow-inner select-none">
                    {selectedUser.name.charAt(0).toUpperCase()}
                  </div>
                </div>
                <div className="mb-2 flex flex-col items-end gap-2">
                  {getStatusBadge(selectedUser)}
                  {isOrgUser && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-indigo-500/15 border border-indigo-500/25 text-indigo-300 text-[10px] font-bold uppercase tracking-wider">
                      <Building2 className="h-3 w-3" /> Org Member
                    </span>
                  )}
                </div>
              </div>

              {/* ── Scrollable Body ── */}
              <div className="px-7 pb-7 overflow-y-auto flex-1 space-y-5"
                style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(255,255,255,0.1) transparent' }}>

                {/* Name + email */}
                <div>
                  <h2 className="text-[26px] font-extrabold text-white tracking-tight leading-tight">{selectedUser.name}</h2>
                  <div className="flex items-center gap-2 text-slate-400 mt-1.5">
                    <Mail className="h-4 w-4 shrink-0" />
                    <span className="text-sm font-medium">{selectedUser.email}</span>
                  </div>
                </div>

                {/* ── STAT PILLS row ── */}
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { label: 'Joined', value: new Date(selectedUser.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }), icon: <CalendarDays className="h-4 w-4" /> },
                    { label: 'Last Active', value: selectedUser.lastActive ? new Date(selectedUser.lastActive).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : 'Never', icon: <Clock className="h-4 w-4" /> },
                    { label: 'Verified', value: selectedUser.isVerified ? 'Yes' : 'No', icon: <CheckCircle2 className={`h-4 w-4 ${selectedUser.isVerified ? 'text-emerald-400' : 'text-rose-400'}`} /> },
                  ].map(stat => (
                    <div key={stat.label} className="flex flex-col gap-1 p-3.5 rounded-2xl border"
                      style={{ background: 'rgba(255,255,255,0.03)', borderColor: 'rgba(255,255,255,0.07)' }}>
                      <div className="flex items-center gap-1.5 text-slate-500">
                        {stat.icon}
                        <span className="text-[10px] font-semibold uppercase tracking-wider">{stat.label}</span>
                      </div>
                      <p className="text-[13px] font-bold text-white leading-tight">{stat.value}</p>
                    </div>
                  ))}
                </div>

                {/* ── DIVIDER ── */}
                <div className="h-px w-full" style={{ background: 'linear-gradient(to right, transparent, rgba(255,255,255,0.08), transparent)' }} />

                {/* ── ORGANIZATION SECTION ── */}
                {isOrgUser && typeof selectedUser.organization === 'object' && selectedUser.organization && (
                  <div className="rounded-2xl overflow-hidden border" style={{ borderColor: 'rgba(99,102,241,0.2)', background: 'linear-gradient(135deg, rgba(99,102,241,0.07) 0%, rgba(139,92,246,0.04) 100%)' }}>
                    {/* org header */}
                    <div className="px-5 pt-4 pb-3 flex items-center gap-2 border-b" style={{ borderColor: 'rgba(99,102,241,0.15)' }}>
                      <Building2 className="h-4 w-4 text-indigo-400" />
                      <span className="text-xs font-bold text-indigo-400 uppercase tracking-widest">Organization</span>
                    </div>
                    <div className="p-5 space-y-4">
                      <div className="flex items-center gap-4">
                        {selectedUser.organization.logoUrl ? (
                          <div className="h-14 w-14 rounded-2xl bg-white shadow-lg overflow-hidden shrink-0 p-1">
                            <img src={selectedUser.organization.logoUrl} alt="Logo" className="h-full w-full object-contain" />
                          </div>
                        ) : (
                          <div className="h-14 w-14 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center shrink-0">
                            <span className="text-2xl font-black text-indigo-400">
                              {selectedUser.organization.organizationName?.charAt(0) || '?'}
                            </span>
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-base font-bold text-white truncate">{selectedUser.organization.organizationName}</p>
                          {selectedUser.organization.website && (
                            <a
                              href={selectedUser.organization.website.startsWith('http') ? selectedUser.organization.website : `https://${selectedUser.organization.website}`}
                              target="_blank" rel="noreferrer"
                              className="flex items-center gap-1.5 text-xs text-indigo-400 hover:text-indigo-300 mt-1 transition-colors group"
                            >
                              <Globe className="h-3 w-3 group-hover:rotate-12 transition-transform" />
                              <span className="truncate">{selectedUser.organization.website.replace(/^https?:\/\//, '')}</span>
                            </a>
                          )}
                        </div>
                      </div>
                      {selectedUser.department && (
                        <div className="flex items-center gap-3 px-4 py-3 rounded-xl" style={{ background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.15)' }}>
                          <Briefcase className="h-4 w-4 text-indigo-400 shrink-0" />
                          <div>
                            <p className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">Department</p>
                            <p className="text-sm font-bold text-white">{selectedUser.department.departmentName}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* ── INDIVIDUAL USER SECTION ── */}
                {!isOrgUser && (
                  <div className="rounded-2xl border p-5 flex items-center justify-between gap-4"
                    style={{ background: 'linear-gradient(135deg, rgba(139,92,246,0.08) 0%, rgba(109,40,217,0.04) 100%)', borderColor: 'rgba(139,92,246,0.2)' }}>
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 rounded-xl bg-violet-500/15 border border-violet-500/20">
                        <UserCheck className="h-5 w-5 text-violet-400" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-violet-200">Individual User</p>
                        <p className="text-xs text-violet-400/60 mt-0.5">Not affiliated with any organization</p>
                      </div>
                    </div>
                    {pc ? (
                      <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl ring-1 ${pc.ring} shadow-lg ${pc.glow}`}
                        style={{ background: 'rgba(0,0,0,0.3)' }}>
                        <span className="text-base">{pc.icon}</span>
                        <span className={`text-xs font-black uppercase tracking-wider ${pc.text}`}>{selectedUser.currentPlan}</span>
                      </div>
                    ) : (
                      <span className="text-xs text-slate-500 px-3 py-1.5 rounded-xl border border-white/5 bg-white/3">Free Plan</span>
                    )}
                  </div>
                )}

                {/* ── SUBSCRIPTION CARD (individual users with active plan) ── */}
                {!isOrgUser && selectedUser.subscriptionStatus === 'active' && pc && (
                  <div className="rounded-2xl border p-5 space-y-3"
                    style={{ background: 'linear-gradient(135deg, rgba(245,158,11,0.07) 0%, rgba(217,119,6,0.03) 100%)', borderColor: 'rgba(245,158,11,0.2)' }}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Crown className="h-5 w-5 text-amber-400" />
                        <span className="text-xs font-bold text-amber-400 uppercase tracking-widest">Active Subscription</span>
                      </div>
                      <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.8)] animate-pulse" />
                    </div>
                    <div className="flex items-end justify-between">
                      <div>
                        <p className={`text-2xl font-black ${pc.text}`}>{selectedUser.currentPlan}</p>
                        <p className="text-xs text-slate-500 mt-0.5">Premium Plan</p>
                      </div>
                      {selectedUser.subscriptionExpiry && (
                        <div className="text-right">
                          <p className="text-[10px] text-slate-500 uppercase tracking-wider">Expires</p>
                          <p className="text-sm font-bold text-amber-300 mt-0.5">
                            {new Date(selectedUser.subscriptionExpiry).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* ── FOOTER QUICK ACTIONS ── */}
                <div className="flex gap-3 pt-1">
                  <button
                    onClick={() => setViewModalOpen(false)}
                    className="flex-1 py-3 rounded-2xl text-sm font-semibold text-slate-300 transition-all hover:text-white"
                    style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}
                  >
                    Close
                  </button>
                  {!isOrgUser && (
                    <button
                      onClick={() => {
                        setViewModalOpen(false);
                        setChangePlanForm({ planName: (selectedUser.currentPlan as any) || 'Silver', durationMonths: 1 });
                        setChangePlanModalOpen(true);
                      }}
                      className="flex-1 py-3 rounded-2xl text-sm font-bold text-white transition-all hover:opacity-90"
                      style={{ background: 'linear-gradient(135deg,#7c3aed,#6d28d9)', boxShadow: '0 4px 20px rgba(124,58,237,0.3)' }}
                    >
                      <span className="flex items-center justify-center gap-2">
                        <Crown className="h-4 w-4" /> Change Plan
                      </span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        );
      })()}



      {/* Edit Modal - Form logic updated to use api above */}
      {editModalOpen && selectedUser && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-[#0F172A] border border-white/10 rounded-3xl p-8 max-w-md w-full shadow-2xl relative overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 to-teal-500" />
            <button onClick={() => setEditModalOpen(false)} className="absolute top-4 right-4 p-2 rounded-full hover:bg-white/5 text-slate-400 transition-colors">
              <X className="h-5 w-5" />
            </button>
            <h3 className="text-xl font-bold text-white mb-6 text-center">Edit User</h3>
            <form onSubmit={handleUpdateUser} className="space-y-4">
              {/* Same form inputs as before */}
              <input
                type="text"
                value={editFormData.name}
                onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                className="w-full bg-[#020617] border border-white/10 rounded-xl py-3 px-4 text-sm text-white focus:ring-2 focus:ring-emerald-500/20 outline-none"
                placeholder="Name"
              />
              <input
                type="email"
                value={editFormData.email}
                onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
                className="w-full bg-[#020617] border border-white/10 rounded-xl py-3 px-4 text-sm text-white focus:ring-2 focus:ring-emerald-500/20 outline-none"
                placeholder="Email"
              />
              <button type="submit" disabled={isSaving} className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold transition-all">
                {isSaving ? "Saving..." : "Save Changes"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Archive Modal */}
      {archiveModalOpen && selectedUser && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-[#0F172A] border border-white/10 rounded-3xl p-8 max-w-sm w-full shadow-2xl text-center animate-in zoom-in-95 duration-300">
            <Archive className="h-12 w-12 text-amber-500 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-white mb-2">Archive User?</h3>
            <p className="text-slate-400 text-sm mb-6">Are you sure you want to archive {selectedUser.name}?</p>
            <div className="flex gap-3">
              <button onClick={() => setArchiveModalOpen(false)} className="flex-1 py-3 rounded-xl bg-white/5 text-slate-300">Cancel</button>
              <button onClick={() => handleSoftDeleteUser(selectedUser._id)} className="flex-1 py-3 rounded-xl bg-amber-500 text-white font-bold">Archive</button>
            </div>
          </div>
        </div>
      )}

      {/* Restore Modal */}
      {restoreModalOpen && selectedUser && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-[#0F172A] border border-white/10 rounded-3xl p-8 max-w-sm w-full shadow-2xl text-center animate-in zoom-in-95 duration-300">
            <RefreshCcw className="h-12 w-12 text-emerald-500 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-white mb-2">Restore User?</h3>
            <p className="text-slate-400 text-sm mb-6">Are you sure you want to restore {selectedUser.name}?</p>
            <div className="flex gap-3">
              <button onClick={() => setRestoreModalOpen(false)} className="flex-1 py-3 rounded-xl bg-white/5 text-slate-300">Cancel</button>
              <button onClick={() => handleRestoreUser(selectedUser._id)} className="flex-1 py-3 rounded-xl bg-emerald-600 text-white font-bold">Restore</button>
            </div>
          </div>
        </div>
      )}

      {/* ── CHANGE PLAN MODAL ── */}
      {changePlanModalOpen && selectedUser && (() => {
        const plans: { name: 'Silver' | 'Gold' | 'Diamond' | 'Free'; color: string; gradient: string; ring: string; icon: string }[] = [
          { name: 'Silver',  color: 'text-slate-300',  gradient: 'from-slate-500/20 to-slate-600/10', ring: 'ring-slate-400/50',  icon: '🥈' },
          { name: 'Gold',    color: 'text-amber-300',  gradient: 'from-amber-500/20 to-amber-600/10', ring: 'ring-amber-400/50',  icon: '🥇' },
          { name: 'Diamond', color: 'text-cyan-300',   gradient: 'from-cyan-500/20 to-cyan-600/10',   ring: 'ring-cyan-400/50',   icon: '💎' },
          { name: 'Free',    color: 'text-rose-300',   gradient: 'from-rose-500/15 to-rose-600/10',   ring: 'ring-rose-400/50',   icon: '🚫' },
        ];
        const durations: { months: 1 | 3 | 6; label: string }[] = [
          { months: 1, label: '1 Month' },
          { months: 3, label: '3 Months' },
          { months: 6, label: '6 Months' },
        ];
        const expiryDate = changePlanForm.planName !== 'Free'
          ? new Date(Date.now() + changePlanForm.durationMonths * 30 * 24 * 60 * 60 * 1000).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })
          : null;

        return (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-in fade-in duration-300">
            <div className="bg-[#0F172A] border border-white/10 rounded-3xl max-w-lg w-full shadow-2xl relative overflow-hidden animate-in zoom-in-95 duration-300">
              {/* Top gradient bar */}
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-violet-500 via-purple-500 to-indigo-500" />

              {/* Header */}
              <div className="p-6 pb-0 flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-2xl bg-violet-500/10 border border-violet-500/20">
                    <Crown className="h-5 w-5 text-violet-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white">Change Plan</h3>
                    <p className="text-xs text-slate-500 mt-0.5">Admin override · No payment charged</p>
                  </div>
                </div>
                <button onClick={() => setChangePlanModalOpen(false)} className="p-2 rounded-full hover:bg-white/5 text-slate-400 transition-colors mt-1">
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* User Info */}
              <div className="px-6 pt-4 pb-2">
                <div className="flex items-center gap-3 p-3 rounded-2xl bg-white/5 border border-white/5">
                  <div className="h-9 w-9 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-sm font-bold text-white">
                    {selectedUser.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-white truncate">{selectedUser.name}</p>
                    <p className="text-xs text-slate-500 truncate">{selectedUser.email}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-[10px] text-slate-600 uppercase tracking-wider">Current</p>
                    <p className={`text-xs font-bold ${!selectedUser.currentPlan || selectedUser.currentPlan === 'Free' ? 'text-slate-500' : 'text-amber-300'}`}>
                      {selectedUser.currentPlan || 'Free'}
                    </p>
                  </div>
                </div>
              </div>

              <div className="px-6 py-4 space-y-5">
                {/* Plan Selector */}
                <div>
                  <p className="text-[11px] text-slate-500 font-bold uppercase tracking-widest mb-3">Select Plan</p>
                  <div className="grid grid-cols-2 gap-2">
                    {plans.map(plan => (
                      <button
                        key={plan.name}
                        onClick={() => setChangePlanForm(prev => ({ ...prev, planName: plan.name }))}
                        className={`p-3 rounded-2xl border text-left transition-all duration-200 bg-gradient-to-br ${plan.gradient} ${
                          changePlanForm.planName === plan.name
                            ? `ring-2 ${plan.ring} border-transparent scale-[1.02] shadow-lg`
                            : 'border-white/5 hover:border-white/15'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-lg">{plan.icon}</span>
                          <span className={`text-sm font-bold ${plan.color}`}>{plan.name}</span>
                        </div>
                        {changePlanForm.planName === plan.name && (
                          <div className="flex items-center gap-1 mt-1">
                            <CheckCircle2 className={`h-3 w-3 ${plan.color}`} />
                            <span className={`text-[10px] font-medium ${plan.color}`}>Selected</span>
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Duration Selector (hidden for Free) */}
                {changePlanForm.planName !== 'Free' && (
                  <div>
                    <p className="text-[11px] text-slate-500 font-bold uppercase tracking-widest mb-3">Duration</p>
                    <div className="flex gap-2">
                      {durations.map(d => (
                        <button
                          key={d.months}
                          onClick={() => setChangePlanForm(prev => ({ ...prev, durationMonths: d.months }))}
                          className={`flex-1 py-2.5 rounded-xl text-sm font-semibold border transition-all ${
                            changePlanForm.durationMonths === d.months
                              ? 'bg-violet-500/15 border-violet-500/50 text-violet-300 shadow-[0_0_10px_rgba(139,92,246,0.2)]'
                              : 'bg-[#020617] border-white/5 text-slate-400 hover:border-white/15'
                          }`}
                        >
                          {d.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Expiry Preview */}
                {expiryDate && (
                  <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/15">
                    <CalendarDays className="h-4 w-4 text-emerald-400 shrink-0" />
                    <p className="text-xs text-emerald-300">
                      Access will expire on <span className="font-bold">{expiryDate}</span>
                    </p>
                  </div>
                )}
                {changePlanForm.planName === 'Free' && (
                  <div className="flex items-center gap-2 p-3 rounded-xl bg-rose-500/5 border border-rose-500/15">
                    <X className="h-4 w-4 text-rose-400 shrink-0" />
                    <p className="text-xs text-rose-300">
                      This will <span className="font-bold">revoke</span> the user's current subscription immediately.
                    </p>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex gap-3 pt-1">
                  <button
                    onClick={() => setChangePlanModalOpen(false)}
                    className="flex-1 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 font-semibold text-sm transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleChangePlan}
                    disabled={isChangingPlan}
                    className="flex-1 py-3 rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 text-white font-bold text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-violet-500/20"
                  >
                    {isChangingPlan ? (
                      <span className="flex items-center justify-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" /> Applying...
                      </span>
                    ) : (
                      `Apply ${changePlanForm.planName} Plan`
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Bulk Components */}

      {perms.bulk && (
        <AdminBulkActionBar
          selectedCount={selectedIds.size}
          onArchive={() => openBulkConfirm('archive')}
          onUnarchive={() => openBulkConfirm('unarchive')}
          onBlock={() => openBulkConfirm('block')}
          onUnblock={() => openBulkConfirm('unblock')}
          onClearSelection={() => setSelectedIds(new Set())}
        />
      )}

      <BulkConfirmModal
        isOpen={bulkConfirmOpen}
        onClose={() => setBulkConfirmOpen(false)}
        onConfirm={handleBulkAction}
        action={bulkActionType}
        count={selectedIds.size}
        loading={bulkLoading}
      />

      {/* Global CSS Keyframes (Same as before) */}
      <style jsx global>{`
        @keyframes slideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes slideDown { from { opacity: 0; transform: translateY(-20px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        .animate-slide-up { animation: slideUp 0.6s ease-out forwards; }
        .animate-slide-down { animation: slideDown 0.6s ease-out forwards; }
        .animate-pulse-slow { animation: pulse 6s cubic-bezier(0.4, 0, 0.6, 1) infinite; }
      `}</style>
    </div>
  );
}