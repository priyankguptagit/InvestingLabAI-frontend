"use client";
import React, { useState, useEffect } from "react";
import {
  X, Users, Edit, Trash2, MoreVertical, Loader2,
  ChevronLeft, ChevronRight, Sparkles, Shield,
  Clock, RotateCcw, Save, Mail, Archive,
  RefreshCcw, Filter, Download, Eye, Ban, Search, ArrowLeft
} from "lucide-react";

// 👇 IMPORT API & TYPES
import { userApi, User, UserStats, Pagination } from "@/lib/api/user.api";
import axiosInstance from "@/lib/axios";
import AdminBulkActionBar from "@/shared-components/AdminBulkActionBar";
import BulkConfirmModal, { BulkActionType } from "@/shared-components/BulkConfirmModal";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/shared-components/ui/dropdown-menu";

interface InstitutionUserViewProps {
  organizationId: string;
  organizationName: string;
  onBack: () => void;
}

interface Department {
  _id: string;
  departmentName: string;
}

export default function InstitutionUserView({ organizationId, organizationName, onBack }: InstitutionUserViewProps) {
  // ============================================
  // STATE MANAGEMENT
  // ============================================

  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [departmentFilter, setDepartmentFilter] = useState("all");
  const [departments, setDepartments] = useState<Department[]>([]);

  const [users, setUsers] = useState<User[]>([]);
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

  // Edit Form State
  const [editFormData, setEditFormData] = useState({
    name: "",
    email: "",
    role: "user"
  });
  const [isSaving, setIsSaving] = useState(false);

  // ============================================
  // API FUNCTIONS
  // ============================================

  const fetchDepartments = async () => {
    try {
      const response = await axiosInstance.get(`/api/department/public/${organizationId}`);
      if (response.data.success) {
        setDepartments(response.data.departments || []);
      }
    } catch (err) {
      console.error("Failed to fetch departments", err);
    }
  };

  const fetchUsers = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await userApi.getAllUsers({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        search: searchQuery,
        role: roleFilter,
        status: statusFilter,
        organization: organizationId,
        department: departmentFilter
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

  // --- ARCHIVE USER ---
  const handleSoftDeleteUser = async (userId: string) => {
    const previousUsers = [...users];
    setUsers((current) =>
      current.map(u => u._id === userId ? { ...u, isDeleted: true, deletedAt: new Date().toISOString() } : u)
    );
    setArchiveModalOpen(false);
    setActionMenuOpen(null);

    try {
      const data = await userApi.softDelete(userId);
      if (data.success) {
        if (statusFilter !== 'deleted' && statusFilter !== 'all') {
          setUsers(prev => prev.filter(u => u._id !== userId));
        }
      }
    } catch (err: any) {
      setUsers(previousUsers);
      alert("Failed to archive user");
    }
  };

  // --- RESTORE USER ---
  const handleRestoreUser = async (userId: string) => {
    const previousUsers = [...users];
    setUsers((current) =>
      current.map(u => u._id === userId ? { ...u, isDeleted: false, deletedAt: undefined, isActive: false } : u)
    );
    setRestoreModalOpen(false);
    setActionMenuOpen(null);

    try {
      const data = await userApi.restore(userId);
      if (data.success) {
        if (statusFilter === 'deleted') {
          setUsers(prev => prev.filter(u => u._id !== userId));
        }
      }
    } catch (err: any) {
      setUsers(previousUsers);
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
      const data = await userApi.toggleActive(userId);
      if (!data.success) {
        setUsers(previousUsers);
        alert("Server failed to update status");
      }
    } catch (err: any) {
      setUsers(previousUsers);
      alert("Failed to update status.");
    }
  };

  const handleEditClick = (user: User) => {
    setSelectedUser(user);
    setEditFormData({
      name: user.name,
      email: user.email,
      role: user.role
    });
    setEditModalOpen(true);
  };

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;

    setIsSaving(true);
    try {
      const data = await userApi.updateUser(selectedUser._id, editFormData as any);
      if (data.success) {
        setUsers(prev => prev.map(u =>
          u._id === selectedUser._id ? { ...u, ...editFormData, role: editFormData.role as User["role"] } : u
        ));
        setEditModalOpen(false);
      }
    } catch (err: any) {
      alert("Failed to update user");
    } finally {
      setIsSaving(false);
    }
  };

  const handleExport = () => {
    const csv = [
      ["Name", "Email", "Role", "Status", "Department", "Joined"],
      ...users.map((u) => [
        u.name,
        u.email,
        u.role,
        u.isDeleted ? "Archived" : u.isActive && u.isVerified ? "Active" : "Inactive",
        (u as any).department?.departmentName || "N/A",
        new Date(u.createdAt).toLocaleDateString(),
      ]),
    ].map((row) => row.join(",")).join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${organizationName}-users-${new Date().toISOString()}.csv`;
    a.click();
  };

  // --- BULK SELECTION ---
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
    if (newSelected.has(id)) newSelected.delete(id);
    else newSelected.add(id);
    setSelectedIds(newSelected);
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
      }
    } catch (err: any) {
      alert(`Failed to perform bulk ${bulkActionType}`);
    } finally {
      setBulkLoading(false);
    }
  };

  // ============================================
  // EFFECTS
  // ============================================

  useEffect(() => {
    fetchDepartments();
  }, [organizationId]);

  useEffect(() => {
    fetchUsers();
  }, [pagination.page, searchQuery, roleFilter, statusFilter, departmentFilter]);

  useEffect(() => {
    setPagination((prev) => ({ ...prev, page: 1 }));
    setSelectedIds(new Set());
  }, [searchQuery, roleFilter, statusFilter, departmentFilter]);

  // ============================================
  // UI HELPERS
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

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'super_admin':
        return <span className="px-2 py-0.5 rounded border border-purple-500/30 bg-purple-500/10 text-purple-300 text-[10px] font-bold tracking-wider uppercase">Super Admin</span>
      case 'admin':
        return <span className="px-2 py-0.5 rounded border border-blue-500/30 bg-blue-500/10 text-blue-300 text-[10px] font-bold tracking-wider uppercase">Admin</span>
      default:
        return <span className="px-2 py-0.5 rounded border border-slate-500/30 bg-slate-500/10 text-slate-400 text-[10px] font-bold tracking-wider uppercase">User</span>
    }
  }

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

  return (
    <div className="space-y-8 animate-slide-up">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex flex-col gap-4">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-indigo-400 hover:text-indigo-300 transition-colors text-sm font-semibold w-fit"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Organizations
          </button>
          <div className="flex items-center gap-3">
            <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-white via-slate-200 to-slate-400 tracking-tight">
              {organizationName} Users
            </h1>
            <button
              onClick={fetchUsers}
              className="p-2 rounded-full bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-all"
            >
              <RotateCcw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

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
      </div>

      {/* Filters & Table */}
      <div className="rounded-[32px] bg-[#0F172A]/80 backdrop-blur-2xl border border-white/5 shadow-2xl overflow-hidden animate-slide-up">
        <div className="p-4 md:p-6 border-b border-white/5 flex flex-col md:flex-row gap-3 justify-between items-stretch bg-[#0F172A]/50">
          <div className="relative w-full md:w-72 md:shrink-0 group">
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
          <div className="flex gap-2 justify-end w-full md:w-auto">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex-1 md:flex-none flex items-center justify-between gap-2 px-4 py-3 md:py-3.5 bg-[#020617] border border-white/5 hover:bg-white/5 rounded-xl md:rounded-2xl text-sm font-medium text-slate-300 transition-colors">
                  <div className="flex items-center gap-2 truncate">
                    <Filter className="h-4 w-4 text-slate-500 shrink-0" />
                    <span className="truncate">
                      {departmentFilter === "all" ? "All Departments" : departments.find((d) => d._id === departmentFilter)?.departmentName || "Selected Department"}
                    </span>
                  </div>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-[calc(100vw-2rem)] md:w-72 bg-[#0F172A] border-white/10 text-slate-200 shadow-xl rounded-xl p-2 font-sans max-h-[60vh] overflow-y-auto">
                <DropdownMenuItem
                  onClick={() => setDepartmentFilter("all")}
                  className={`px-3 py-2.5 text-xs font-medium cursor-pointer rounded-lg flex items-center mb-1 ${departmentFilter === "all" ? "bg-indigo-500/20 text-indigo-300" : "text-slate-300 hover:bg-white/5 hover:text-white"}`}
                >
                  All Departments
                </DropdownMenuItem>
                {departments.map((dept) => (
                  <DropdownMenuItem
                    key={dept._id}
                    onClick={() => setDepartmentFilter(dept._id)}
                    className={`px-3 py-2.5 text-xs font-medium cursor-pointer rounded-lg flex items-center mb-1 break-words whitespace-normal ${departmentFilter === dept._id ? "bg-indigo-500/20 text-indigo-300" : "text-slate-300 hover:bg-white/5 hover:text-white"}`}
                  >
                    {dept.departmentName}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        <div className="relative min-h-[400px]">
          {loading && users.length === 0 ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#0F172A]/50 z-20">
              <Loader2 className="h-10 w-10 text-indigo-500 animate-spin" />
              <p className="mt-4 text-sm text-slate-400 font-medium animate-pulse">Fetching data...</p>
            </div>
          ) : users.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <div className="h-20 w-20 bg-slate-800/50 rounded-full flex items-center justify-center mb-6 border border-white/5">
                <Search className="h-8 w-8 text-slate-500" />
              </div>
              <h3 className="text-xl font-semibold text-white">No users found</h3>
              <p className="text-slate-500 mt-2 max-w-xs mx-auto">We couldn't find any users matching your current filters.</p>
            </div>
          ) : (
            <>
              {/* ── MOBILE LIST VIEW (< md) ── */}
              <div className="block md:hidden space-y-3 p-3">
                {users.map((user) => (
                  <div key={user._id} className={`bg-[#0F172A]/80 border border-white/5 rounded-2xl p-4 flex flex-col gap-4 relative ${user.isDeleted ? 'opacity-50' : ''}`}>
                    <div className="absolute top-4 right-4">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button className="p-2 rounded-lg hover:bg-white/5 text-slate-400 transition-colors focus:ring-2 focus:ring-indigo-500/50 outline-none">
                            <MoreVertical className="h-4 w-4" />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48 bg-[#0F172A] border-[#1e293b] text-slate-200 shadow-2xl rounded-xl p-1 font-sans z-50">
                          <DropdownMenuItem onClick={() => { setSelectedUser(user); setViewModalOpen(true); }} className="px-3 py-2 text-xs font-medium text-slate-300 focus:bg-white/5 focus:text-white cursor-pointer rounded-lg flex items-center gap-2 mb-1">
                            <Eye className="h-3.5 w-3.5" /> View Details
                          </DropdownMenuItem>
                          {!user.isDeleted && (
                            <DropdownMenuItem onClick={() => handleEditClick(user)} className="px-3 py-2 text-xs font-medium text-slate-300 focus:bg-white/5 focus:text-white cursor-pointer rounded-lg flex items-center gap-2 mb-1 border-t border-white/5 pt-2">
                              <Edit className="h-3.5 w-3.5" /> Edit User
                            </DropdownMenuItem>
                          )}
                          {!user.isDeleted ? (
                            <>
                              <DropdownMenuItem onClick={() => handleToggleActive(user._id)} className="px-3 py-2 text-xs font-medium text-slate-300 focus:bg-white/5 focus:text-white cursor-pointer rounded-lg flex items-center gap-2 border-t border-white/5 pt-2 mb-1">
                                <Ban className="h-3.5 w-3.5" /> {user.isActive ? "Block Access" : "Unblock"}
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => { setSelectedUser(user); setArchiveModalOpen(true); }} className="px-3 py-2 text-xs font-medium text-amber-400 focus:bg-amber-500/10 focus:text-amber-300 cursor-pointer rounded-lg flex items-center gap-2 border-t border-white/5 pt-2">
                                <Archive className="h-3.5 w-3.5" /> Archive User
                              </DropdownMenuItem>
                            </>
                          ) : (
                            <DropdownMenuItem onClick={() => { setSelectedUser(user); setRestoreModalOpen(true); }} className="px-3 py-2 text-xs font-medium text-emerald-400 focus:bg-emerald-500/10 focus:text-emerald-300 cursor-pointer rounded-lg flex items-center gap-2 border-t border-white/5 pt-2">
                              <RefreshCcw className="h-3.5 w-3.5" /> Restore Account
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>

                    <div className="flex items-start gap-3 pr-10">
                      <input
                        type="checkbox"
                        className="h-4 w-4 mt-2 rounded border-white/10 bg-[#020617] text-indigo-500 focus:ring-indigo-500/20 cursor-pointer shrink-0"
                        checked={selectedIds.has(user._id)}
                        onChange={() => toggleSelection(user._id)}
                      />
                      <div className="h-10 w-10 shrink-0 rounded-full flex items-center justify-center text-xs font-bold text-white shadow-lg bg-gradient-to-br from-indigo-500 to-blue-500">
                        {user.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-bold text-slate-200 truncate">{user.name}</div>
                        <div className="text-[11px] text-slate-400 truncate mt-0.5">{user.email}</div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between border-t border-white/5 pt-3">
                      <div className="flex flex-col gap-1">
                        <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Status</div>
                        {getStatusBadge(user)}
                      </div>
                      <div className="flex flex-col gap-1 items-end">
                        <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Department</div>
                        <div className="text-xs font-semibold text-slate-300 truncate max-w-[120px]">{(user as any).department?.departmentName || "General"}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* ── DESKTOP TABLE (md+) ── */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-left">
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
                      <th className="px-8 py-5 text-[11px] font-bold text-slate-500 uppercase tracking-widest">User Details</th>
                      <th className="px-6 py-5 text-[11px] font-bold text-slate-500 uppercase tracking-widest">Department</th>
                      <th className="px-6 py-5 text-[11px] font-bold text-slate-500 uppercase tracking-widest">Role</th>
                      <th className="px-6 py-5 text-[11px] font-bold text-slate-500 uppercase tracking-widest">Status</th>
                      <th className="px-6 py-5 text-[11px] font-bold text-slate-500 uppercase tracking-widest">Last Active</th>
                      <th className="px-6 py-5 text-right text-[11px] font-bold text-slate-500 uppercase tracking-widest">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {users.map((user, index) => (
                      <tr
                        key={user._id}
                        className={`group hover:bg-white/[0.02] transition-colors duration-300 ${user.isDeleted ? 'opacity-50' : ''}`}
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
                            <div className="h-11 w-11 rounded-full flex items-center justify-center text-sm font-bold text-white shadow-lg bg-gradient-to-br from-indigo-500 to-blue-500">
                              {user.name.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <p className="text-sm font-semibold text-slate-200 group-hover:text-indigo-400 transition-colors">{user.name}</p>
                              <p className="text-xs text-slate-500 font-medium mt-0.5">{user.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-5 text-sm font-medium text-slate-400">
                          {(user as any).department?.departmentName || "General"}
                        </td>
                        <td className="px-6 py-5">{getRoleBadge(user.role)}</td>
                        <td className="px-6 py-5">{getStatusBadge(user)}</td>
                        <td className="px-6 py-5 text-xs text-slate-400 font-medium">
                          {getTimeAgo(user.lastActive || user.lastLogin)}
                        </td>
                        <td className="px-6 py-5 text-right">
                          <div className="flex items-center justify-end gap-1 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                            <button onClick={() => { setSelectedUser(user); setViewModalOpen(true); }} className="p-2 rounded-lg hover:bg-white/5 text-slate-400">
                              <Eye className="h-4 w-4" />
                            </button>
                            {!user.isDeleted && (
                              <button onClick={() => handleEditClick(user)} className="p-2 rounded-lg hover:bg-white/5 text-slate-400">
                                <Edit className="h-4 w-4" />
                              </button>
                            )}
                            <div className="relative">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <button className="p-2 rounded-lg hover:bg-white/5 text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/50">
                                    <MoreVertical className="h-4 w-4" />
                                  </button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-48 bg-[#0F172A] border-[#1e293b] text-slate-200 shadow-2xl rounded-xl p-1 font-sans z-50">
                                  {!user.isDeleted ? (
                                    <>
                                      <DropdownMenuItem onClick={() => handleToggleActive(user._id)} className="px-3 py-2.5 text-xs font-medium text-slate-300 focus:bg-white/5 focus:text-white cursor-pointer rounded-lg flex items-center gap-2">
                                        <Ban className="h-3.5 w-3.5" /> {user.isActive ? "Block Access" : "Unblock"}
                                      </DropdownMenuItem>
                                      <DropdownMenuItem onClick={() => { setSelectedUser(user); setArchiveModalOpen(true); }} className="px-3 py-2.5 text-xs font-medium text-amber-400 focus:bg-amber-500/10 focus:text-amber-300 cursor-pointer rounded-lg flex items-center gap-2 border-t border-white/5 pt-2 mt-1">
                                        <Archive className="h-3.5 w-3.5" /> Archive User
                                      </DropdownMenuItem>
                                    </>
                                  ) : (
                                    <DropdownMenuItem onClick={() => { setSelectedUser(user); setRestoreModalOpen(true); }} className="px-3 py-2.5 text-xs font-medium text-emerald-400 focus:bg-emerald-500/10 focus:text-emerald-300 cursor-pointer rounded-lg flex items-center gap-2">
                                      <RefreshCcw className="h-3.5 w-3.5" /> Restore Account
                                    </DropdownMenuItem>
                                  )}
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>

        {/* Pagination */}
        {!loading && users.length > 0 && (
          <div className="p-6 border-t border-white/5 bg-[#020617]/30 flex items-center justify-between">
            <p className="text-xs font-medium text-slate-500">
              Page <span className="text-white">{pagination.page}</span> of {pagination.totalPages} • {pagination.total} total users
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setPagination(prev => ({ ...prev, page: Math.max(1, prev.page - 1) }))}
                disabled={pagination.page === 1}
                className="p-2 rounded-xl bg-white/5 border border-white/5 hover:border-white/10 disabled:opacity-20 transition-all"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                onClick={() => setPagination(prev => ({ ...prev, page: Math.min(prev.totalPages, prev.page + 1) }))}
                disabled={pagination.page >= pagination.totalPages}
                className="p-2 rounded-xl bg-white/5 border border-white/5 hover:border-white/10 disabled:opacity-20 transition-all"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* --- MODALS --- */}
      {viewModalOpen && selectedUser && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
          <div className="bg-[#0F172A] border border-white/10 rounded-3xl p-8 max-w-md w-full shadow-2xl relative animate-in zoom-in-95 duration-200">
            <button onClick={() => setViewModalOpen(false)} className="absolute top-4 right-4 p-2 text-slate-400"><X className="h-5 w-5" /></button>
            <div className="flex flex-col items-center mb-6">
              <div className="h-20 w-20 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-3xl font-bold text-white mb-4">
                {selectedUser.name.charAt(0).toUpperCase()}
              </div>
              <h3 className="text-2xl font-bold text-white">{selectedUser.name}</h3>
              <p className="text-slate-500 text-sm">{selectedUser.email}</p>
            </div>
            <div className="space-y-4">
              <div className="flex justify-between p-4 rounded-xl bg-[#020617] border border-white/5 text-sm">
                <span className="text-slate-500">System Role</span>
                {getRoleBadge(selectedUser.role)}
              </div>
              <div className="flex justify-between p-4 rounded-xl bg-[#020617] border border-white/5 text-sm">
                <span className="text-slate-500">Department</span>
                <span className="text-slate-300 font-semibold">{(selectedUser as any).department?.departmentName || "General"}</span>
              </div>
              <div className="flex justify-between p-4 rounded-xl bg-[#020617] border border-white/5 text-sm">
                <span className="text-slate-500">Status</span>
                {getStatusBadge(selectedUser)}
              </div>
            </div>
          </div>
        </div>
      )}

      {editModalOpen && selectedUser && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
          <div className="bg-[#0F172A] border border-white/10 rounded-3xl p-8 max-w-md w-full shadow-2xl relative animate-in zoom-in-95 duration-200">
            <button onClick={() => setEditModalOpen(false)} className="absolute top-4 right-4 p-2 text-slate-400"><X className="h-5 w-5" /></button>
            <h3 className="text-xl font-bold text-white mb-6">Edit User</h3>
            <form onSubmit={handleUpdateUser} className="space-y-4">
              <input type="text" value={editFormData.name} onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })} className="w-full bg-[#020617] border border-white/10 rounded-xl py-3 px-4 text-sm text-white focus:ring-2 focus:ring-indigo-500/20 outline-none" placeholder="Name" />
              <input type="email" value={editFormData.email} onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })} className="w-full bg-[#020617] border border-white/10 rounded-xl py-3 px-4 text-sm text-white focus:ring-2 focus:ring-indigo-500/20 outline-none" placeholder="Email" />
              <select value={editFormData.role} onChange={(e) => setEditFormData({ ...editFormData, role: e.target.value as any })} className="w-full bg-[#020617] border border-white/10 rounded-xl py-3 px-4 text-sm text-white focus:ring-2 focus:ring-indigo-500/20 outline-none">
                <option value="user">User</option>
                <option value="admin">Admin</option>
                <option value="super_admin">Super Admin</option>
              </select>
              <button type="submit" disabled={isSaving} className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold transition-all disabled:opacity-50">
                {isSaving ? "Saving..." : "Save Changes"}
              </button>
            </form>
          </div>
        </div>
      )}

      {archiveModalOpen && selectedUser && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
          <div className="bg-[#0F172A] border border-white/10 rounded-3xl p-8 max-w-sm w-full shadow-2xl text-center">
            <Archive className="h-12 w-12 text-rose-500 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-white mb-2">Archive User?</h3>
            <p className="text-slate-400 text-sm mb-6">Are you sure you want to archive {selectedUser.name}?</p>
            <div className="flex gap-3">
              <button onClick={() => setArchiveModalOpen(false)} className="flex-1 py-3 rounded-xl bg-white/5 text-slate-300">Cancel</button>
              <button onClick={() => handleSoftDeleteUser(selectedUser._id)} className="flex-1 py-3 rounded-xl bg-rose-600 text-white font-bold">Archive</button>
            </div>
          </div>
        </div>
      )}

      {restoreModalOpen && selectedUser && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
          <div className="bg-[#0F172A] border border-white/10 rounded-3xl p-8 max-w-sm w-full shadow-2xl text-center">
            <RefreshCcw className="h-12 w-12 text-emerald-500 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-white mb-2">Restore User?</h3>
            <p className="text-slate-400 text-sm mb-6">Restore account for {selectedUser.name}?</p>
            <div className="flex gap-3">
              <button onClick={() => setRestoreModalOpen(false)} className="flex-1 py-3 rounded-xl bg-white/5 text-slate-300">Cancel</button>
              <button onClick={() => handleRestoreUser(selectedUser._id)} className="flex-1 py-3 rounded-xl bg-emerald-600 text-white font-bold">Restore</button>
            </div>
          </div>
        </div>
      )}

      <AdminBulkActionBar
        selectedCount={selectedIds.size}
        onArchive={() => { setBulkActionType('archive'); setBulkConfirmOpen(true); }}
        onUnarchive={() => { setBulkActionType('unarchive'); setBulkConfirmOpen(true); }}
        onBlock={() => { setBulkActionType('block'); setBulkConfirmOpen(true); }}
        onUnblock={() => { setBulkActionType('unblock'); setBulkConfirmOpen(true); }}
        onClearSelection={() => setSelectedIds(new Set())}
      />

      <BulkConfirmModal
        isOpen={bulkConfirmOpen}
        onClose={() => setBulkConfirmOpen(false)}
        onConfirm={handleBulkAction}
        action={bulkActionType}
        count={selectedIds.size}
        loading={bulkLoading}
      />
    </div>
  );
}
