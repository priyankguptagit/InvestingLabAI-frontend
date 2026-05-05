"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  Building2,
  ShieldOff,
  Sparkles,
  RefreshCcw,
  Search,
  Loader2,
  Clock,
  Mail,
  Users,
  Layers3,
  Settings2,
  Plus,
  TrendingUp,
  MoreVertical,
  Copy,
  ChevronDown,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/shared-components/ui/dropdown-menu";
import axiosInstance from "@/lib/axios";
import InstitutionUserView from "@/shared-components/InstitutionUserView";
import { companyApi } from "@/lib/api";

interface Organization {
  _id: string;
  organizationName: string;
  email: string;
  isActive: boolean;
  isVerified: boolean;
  createdAt: string;
  subscriptionStatus?: "active" | "inactive" | "expired";
  subscriptionPlan?: string;
  subscriptionExpiry?: string;
  maxStudents?: number;
  planSeatLimits?: {
    Silver?: number;
    Gold?: number;
    Diamond?: number;
  };
  planExpiryDates?: {
    Silver?: string;
    Gold?: string;
    Diamond?: string;
  };
  paidSeatUsage?: {
    Silver?: number;
    Gold?: number;
    Diamond?: number;
  };
  paidSeatsUsed?: number;
  paidSeatCapacity?: number;
  totalStudents: number;
}

type PlanSeatInput = {
  Silver: number;
  Gold: number;
  Diamond: number;
};
type PlanSeatTextInput = {
  Silver: string;
  Gold: string;
  Diamond: string;
};

const emptyPlanSeatText: PlanSeatTextInput = {
  Silver: "0",
  Gold: "0",
  Diamond: "0",
};

type PlanDurationInput = {
  Silver: number;
  Gold: number;
  Diamond: number;
};

export default function InstitutesManagementPage() {
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const [perms, setPerms] = useState<Record<string, boolean>>({});
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const copyEmail = (id: string, email: string) => {
    try {
      navigator.clipboard.writeText(email).then(() => {
        setCopiedId(id);
        setTimeout(() => setCopiedId(null), 2000);
      }).catch(() => {
        // fallback for non-secure context
        const el = document.createElement('textarea');
        el.value = email;
        document.body.appendChild(el);
        el.select();
        document.execCommand('copy');
        document.body.removeChild(el);
        setCopiedId(id);
        setTimeout(() => setCopiedId(null), 2000);
      });
    } catch {
      alert(email);
    }
  };

  useEffect(() => {
    companyApi.getMe().then(res => {
      if (res.success && res.user) {
        if (res.user.role === 'super_admin') {
          setPerms({
            view_users: true,
            activate: true,
            deactivate_subscription: true,
            manage_seats: true,
          });
        } else {
          const p = res.user.customRole?.permissions || [];
          setPerms({
            view_users: p.includes('orgs.view_users'),
            activate: p.includes('orgs.activate_subscription'),
            deactivate_subscription: p.includes('orgs.deactivate_subscription'),
            manage_seats: p.includes('orgs.manage_seats'),
          });
        }
      }
    }).catch(() => { });
  }, []);

  const [selectedOrg, setSelectedOrg] = useState<Organization | null>(null);
  const [activateModalOpen, setActivateModalOpen] = useState(false);
  const [deactivateModalOpen, setDeactivateModalOpen] = useState(false);

  const [view, setView] = useState<"list" | "users">("list");
  const [selectedOrgForUsers, setSelectedOrgForUsers] = useState<{ id: string; name: string } | null>(null);

  // Replaced global durationMonths with per-plan durations
  const [durations, setDurations] = useState<PlanDurationInput>({
    Silver: 3,
    Gold: 3,
    Diamond: 3,
  });
  const [planSeatText, setPlanSeatText] = useState<PlanSeatTextInput>(emptyPlanSeatText);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const normalizedPlanSeats = useMemo<PlanSeatInput>(
    () => ({
      Silver: parseSeatInputValue(planSeatText.Silver),
      Gold: parseSeatInputValue(planSeatText.Gold),
      Diamond: parseSeatInputValue(planSeatText.Diamond),
    }),
    [planSeatText]
  );
  const paidSeatTotal = useMemo(
    () =>
      normalizedPlanSeats.Silver + normalizedPlanSeats.Gold + normalizedPlanSeats.Diamond,
    [normalizedPlanSeats]
  );
  const hasMixedSeatAllocation = paidSeatTotal > 0;

  const inferredPlanTier = useMemo(() => {
    if (normalizedPlanSeats.Diamond > 0) return "Diamond";
    if (normalizedPlanSeats.Gold > 0) return "Gold";
    return "Silver";
  }, [normalizedPlanSeats]);

  const fetchOrganizations = async () => {
    setLoading(true);
    try {
      const response = await axiosInstance.get("/api/organization/all", {
        params: { search: searchQuery },
      });
      if (response.data.success) {
        setOrganizations(response.data.organizations || []);
      }
    } catch (err) {
      console.error("Failed to fetch organizations", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrganizations();
  }, [searchQuery]);

  const openActivateModal = (org: Organization) => {
    const existingPlanSeats: PlanSeatInput = {
      Silver: org.planSeatLimits?.Silver || 0,
      Gold: org.planSeatLimits?.Gold || 0,
      Diamond: org.planSeatLimits?.Diamond || 0,
    };

    setSelectedOrg(org);

    // Calculate approximate months left to prepopulate dropdowns
    const getMonthsDiff = (expiryDateStr?: string) => {
      if (!expiryDateStr) return 3;
      const expiry = new Date(expiryDateStr);
      const now = new Date();
      const months = (expiry.getFullYear() - now.getFullYear()) * 12 + (expiry.getMonth() - now.getMonth());
      if (months <= 1) return 1;
      if (months <= 3) return 3;
      if (months <= 6) return 6;
      return 12;
    };

    setDurations({
      Silver: getMonthsDiff(org.planExpiryDates?.Silver),
      Gold: getMonthsDiff(org.planExpiryDates?.Gold),
      Diamond: getMonthsDiff(org.planExpiryDates?.Diamond),
    });

    setPlanSeatText({
      Silver: String(existingPlanSeats.Silver),
      Gold: String(existingPlanSeats.Gold),
      Diamond: String(existingPlanSeats.Diamond),
    });
    setActivateModalOpen(true);
  };

  const updatePlanSeatText = (plan: keyof PlanSeatTextInput, value: string) => {
    if (value === "" || /^\d+$/.test(value)) {
      setPlanSeatText((prev) => ({ ...prev, [plan]: value }));
    }
  };

  const normalizePlanSeatText = (plan: keyof PlanSeatTextInput) => {
    setPlanSeatText((prev) => ({
      ...prev,
      [plan]: String(parseSeatInputValue(prev[plan])),
    }));
  };

  const handleActivate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrg) return;

    setIsSubmitting(true);
    try {
      // Convert durations to expiry dates for the backend
      const calcExpiry = (months: number) => {
        const d = new Date();
        d.setMonth(d.getMonth() + months);
        return d.toISOString();
      };
      const planExpiryDates = {
        Silver: calcExpiry(durations.Silver),
        Gold: calcExpiry(durations.Gold),
        Diamond: calcExpiry(durations.Diamond),
      };

      const response = await axiosInstance.patch(
        `/api/organization/${selectedOrg._id}/subscription/activate`,
        {
          subscriptionPlan: inferredPlanTier,
          maxStudents: hasMixedSeatAllocation ? 0 : selectedOrg.maxStudents || 0,
          planAllocations: normalizedPlanSeats,
          planExpiryDates,
        }
      );

      if (response.data.success) {
        setActivateModalOpen(false);
        fetchOrganizations();
      }
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to activate subscription.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeactivate = async () => {
    if (!selectedOrg) return;

    setIsSubmitting(true);
    try {
      const response = await axiosInstance.patch(
        `/api/organization/${selectedOrg._id}/subscription/deactivate`
      );
      if (response.data.success) {
        setDeactivateModalOpen(false);
        fetchOrganizations();
      }
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to deactivate subscription.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const activeSubs = organizations.filter((o) => o.subscriptionStatus === "active").length;
  const expiredSubs = organizations.filter((o) => o.subscriptionStatus === "expired").length;

  const getSubBadge = (org: Organization) => {
    if (org.subscriptionStatus === "active") {
      return (
        <span className="px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold rounded-full flex items-center gap-1.5 w-fit">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> Active
        </span>
      );
    }
    if (org.subscriptionStatus === "expired") {
      return (
        <span className="px-3 py-1 bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-bold rounded-full w-fit">
          Expired
        </span>
      );
    }
    return (
      <span className="px-3 py-1 bg-slate-500/10 border border-slate-500/20 text-slate-400 text-xs font-bold rounded-full w-fit">
        Inactive / Free
      </span>
    );
  };

  const getPlanSplit = (org: Organization) => {
    const s = org.planSeatLimits?.Silver || 0;
    const g = org.planSeatLimits?.Gold || 0;
    const d = org.planSeatLimits?.Diamond || 0;
    if (s + g + d === 0) return "No split configured";
    return `S:${s} · G:${g} · D:${d}`;
  };
  const hasMixedOrgAllocation = (org: Organization) =>
    (org.planSeatLimits?.Silver || 0) > 0 ||
    (org.planSeatLimits?.Gold || 0) > 0 ||
    (org.planSeatLimits?.Diamond || 0) > 0;
  const getPaidSeatCapacity = (org: Organization) =>
    org.paidSeatCapacity ?? ((org.planSeatLimits?.Silver || 0) + (org.planSeatLimits?.Gold || 0) + (org.planSeatLimits?.Diamond || 0));
  const getPaidSeatsUsed = (org: Organization) => org.paidSeatsUsed ?? 0;
  const getPaidSeatSummary = (org: Organization) => {
    const paidCapacity = getPaidSeatCapacity(org);
    const paidUsed = getPaidSeatsUsed(org);

    if (paidCapacity > 0) {
      return `${paidUsed} / ${paidCapacity}`;
    }

    if (org.maxStudents && org.maxStudents > 0) {
      return `${org.totalStudents} / ${org.maxStudents}`;
    }

    return `${org.totalStudents} / Unlimited`;
  };
  const getAvailablePaidSeats = (org: Organization) => Math.max(getPaidSeatCapacity(org) - getPaidSeatsUsed(org), 0);

  return (
    <div className="min-h-screen w-full bg-[#030712] text-slate-200 font-sans relative overflow-hidden">
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-indigo-500/10 rounded-full blur-[120px] animate-pulse-slow" />
      </div>

      <div className="relative z-10 p-4 md:p-10 max-w-[1600px] mx-auto space-y-4 md:space-y-8 animate-slide-up">
        {view === "users" && selectedOrgForUsers ? (
          <InstitutionUserView
            organizationId={selectedOrgForUsers.id}
            organizationName={selectedOrgForUsers.name}
            onBack={() => setView("list")}
          />
        ) : (
          <>
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <div className="flex items-center gap-3">
                  <h1 className="text-2xl md:text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-white via-slate-200 to-slate-400 tracking-tight">
                    Organizations Management
                  </h1>
                  <button
                    onClick={fetchOrganizations}
                    className="p-2 rounded-full bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-all"
                  >
                    <RefreshCcw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
                  </button>
                </div>
                <p className="text-slate-500 mt-2 text-sm font-medium tracking-wide">
                  Configure mixed seat allocations (Silver/Gold/Diamond) per organization.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 md:gap-6">
              <StatCard icon={<Building2 className="h-5 w-5 md:h-6 md:w-6 text-indigo-400" />} label="Total Organizations" value={String(organizations.length)} />
              <StatCard icon={<Sparkles className="h-5 w-5 md:h-6 md:w-6 text-emerald-400" />} label="Active Subscriptions" value={String(activeSubs)} valueClass="text-emerald-300" />
              <div className="col-span-2 lg:col-span-1">
                <StatCard icon={<ShieldOff className="h-5 w-5 md:h-6 md:w-6 text-rose-400" />} label="Expired / Inactive" value={String(expiredSubs)} valueClass="text-rose-300" />
              </div>
            </div>

            <div className="rounded-[32px] bg-[#0F172A]/80 backdrop-blur-2xl border border-white/5 shadow-2xl overflow-hidden">
              <div className="p-6 border-b border-white/5 bg-[#0F172A]/50">
                <div className="relative w-full lg:w-96 group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Search className="h-4 w-4 text-slate-500 group-focus-within:text-indigo-400 transition-colors" />
                  </div>
                  <input
                    type="text"
                    placeholder="Search organizations..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="block w-full pl-11 pr-4 py-3 md:py-3.5 border border-white/5 rounded-2xl bg-[#020617] text-sm text-slate-200 placeholder-slate-600 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500/50 outline-none transition-all"
                  />
                </div>
              </div>

              <div className="relative min-h-[400px]">
                {loading && organizations.length === 0 ? (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#0F172A]/50 z-20">
                    <Loader2 className="h-10 w-10 text-indigo-500 animate-spin" />
                  </div>
                ) : (
                  <>
                    {/* ── MOBILE LIST VIEW (< md) ── */}
                    <div className="block md:hidden space-y-3 p-3">
                      {organizations.map((org) => (
                        <div key={org._id} className={`bg-[#0F172A]/80 border border-white/5 rounded-2xl p-4 flex flex-col gap-4 relative ${!org.isActive ? "opacity-60" : ""}`}>
                          <div className="flex items-start gap-3 pr-8">
                            <div className="h-10 w-10 shrink-0 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 font-bold text-lg">
                              {org.organizationName.charAt(0)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="font-bold text-slate-200 truncate">{org.organizationName}</div>
                              <div className="text-[11px] text-slate-400 flex items-center gap-1.5 mt-0.5 truncate">
                                <Mail className="h-3 w-3 shrink-0" />
                                <span className="truncate">{org.email}</span>
                              </div>
                            </div>

                            <div className="absolute top-2 right-2">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <button className="p-2 rounded-lg hover:bg-white/5 text-slate-400 transition-colors">
                                    <MoreVertical className="h-4 w-4" />
                                  </button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-48 bg-[#0F172A] border-[#1e293b] text-slate-200 shadow-2xl rounded-xl p-1 font-sans z-50">
                                  <DropdownMenuItem onClick={() => copyEmail(org._id, org.email)} className="px-3 py-2 text-xs font-medium text-slate-300 focus:bg-white/5 focus:text-white cursor-pointer rounded-lg flex items-center gap-2 mb-1">
                                    {copiedId === org._id ? <>✓ Copied!</> : <><Copy className="h-3.5 w-3.5" /> Copy Email</>}
                                  </DropdownMenuItem>
                                  {perms.view_users && (
                                    <DropdownMenuItem onClick={() => { setView("users"); setSelectedOrgForUsers({ id: org._id, name: org.organizationName }); }} className="px-3 py-2 text-xs font-medium text-indigo-400 focus:bg-indigo-500/10 focus:text-indigo-300 cursor-pointer rounded-lg flex items-center gap-2 mb-1">
                                      <Users className="h-3.5 w-3.5" /> View Users
                                    </DropdownMenuItem>
                                  )}
                                  {org.subscriptionStatus === "active" && perms.deactivate_subscription && (
                                    <DropdownMenuItem onClick={() => { setSelectedOrg(org); setDeactivateModalOpen(true); }} className="px-3 py-2 text-xs font-medium text-rose-400 focus:bg-rose-500/10 focus:text-rose-300 cursor-pointer rounded-lg flex items-center gap-2 border-t border-white/5 pt-2 mt-1">
                                      <ShieldOff className="h-3.5 w-3.5" /> Deactivate Plan
                                    </DropdownMenuItem>
                                  )}
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </div>

                          <div className="flex items-center justify-between border-t border-white/5 pt-3">
                            <div className="flex flex-col gap-1">
                              <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Status</div>
                              {getSubBadge(org)}
                            </div>
                            <div className="flex flex-col gap-1 items-end">
                              <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Seats</div>
                              <div className="text-sm font-semibold text-slate-200 flex items-center gap-1">
                                <Users className="h-3.5 w-3.5 text-slate-400" />
                                {org.totalStudents} <span className="text-slate-500">/ {getPaidSeatSummary(org).split(" / ")[1]}</span>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center justify-between border-t border-white/5 pt-3">
                            <div className="flex flex-col gap-1">
                              <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Allocation</div>
                              <div className="text-xs font-semibold text-slate-300">{getPlanSplit(org)}</div>
                            </div>
                            <div className="flex items-center gap-2">
                              {perms.manage_seats && org.subscriptionStatus === "active" ? (
                                <button onClick={() => openActivateModal(org)} className="px-3 py-1.5 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 hover:bg-indigo-500 hover:text-white rounded-lg text-xs font-bold transition-all disabled:opacity-50 inline-flex items-center gap-1.5 shadow-sm">
                                  <Settings2 className="h-3.5 w-3.5" /> Manage
                                </button>
                              ) : perms.activate && org.subscriptionStatus !== "active" ? (
                                <button onClick={() => openActivateModal(org)} className="px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 hover:bg-emerald-500 hover:text-white rounded-lg text-xs font-bold transition-all disabled:opacity-50 inline-flex items-center gap-1.5 shadow-sm">
                                  <Plus className="h-3.5 w-3.5" /> Activate
                                </button>
                              ) : null}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* ── DESKTOP TABLE (md+) ── */}
                    <div className="hidden md:block overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b border-white/5 bg-[#020617]/50">
                            <th className="px-8 py-5 text-left text-[11px] font-bold text-slate-500 uppercase tracking-widest">Organization</th>
                            <th className="px-6 py-5 text-left text-[11px] font-bold text-slate-500 uppercase tracking-widest">Subscription</th>
                            <th className="px-6 py-5 text-left text-[11px] font-bold text-slate-500 uppercase tracking-widest">Allocation</th>
                            <th className="px-6 py-5 text-left text-[11px] font-bold text-slate-500 uppercase tracking-widest">Seats</th>
                            <th className="px-6 py-5 text-right text-[11px] font-bold text-slate-500 uppercase tracking-widest">Action</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                          {organizations.map((org) => (
                            <tr key={org._id} className={`hover:bg-white/[0.02] transition-colors ${!org.isActive ? "opacity-60" : ""}`}>
                              <td className="px-8 py-5">
                                <div className="flex items-center gap-4">
                                  <div className="h-11 w-11 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 font-bold">
                                    {org.organizationName.charAt(0)}
                                  </div>
                                  <div>
                                    <button
                                      onClick={() => {
                                        setSelectedOrgForUsers({ id: org._id, name: org.organizationName });
                                        setView("users");
                                      }}
                                      className="text-sm font-bold text-slate-200 hover:text-indigo-400 transition-colors text-left"
                                    >
                                      {org.organizationName}
                                    </button>
                                    <div className="flex items-center gap-2 mt-1">
                                      <Mail className="h-3 w-3 text-slate-500" />
                                      <span className="text-xs text-slate-400 font-medium">{org.email}</span>
                                    </div>
                                  </div>
                                </div>
                              </td>
                              <td className="px-6 py-5">
                                {getSubBadge(org)}
                                {org.subscriptionPlan ? (
                                  <div className="mt-2 text-xs text-slate-400 flex items-center gap-1.5">
                                    <Clock className="h-3 w-3" />
                                    {hasMixedOrgAllocation(org) ? "Mixed Allocation" : org.subscriptionPlan} • Expires {org.subscriptionExpiry ? new Date(org.subscriptionExpiry).toLocaleDateString() : "-"}
                                  </div>
                                ) : null}
                              </td>
                              <td className="px-6 py-5">
                                <div className="text-sm font-semibold text-slate-200">{getPlanSplit(org)}</div>
                                <div className="text-xs text-slate-500 mt-1">Mixed seat allocation</div>
                              </td>
                              <td className="px-6 py-5">
                                <div className="flex items-center gap-2 text-sm">
                                  <Users className="h-4 w-4 text-slate-500" />
                                  <span className="text-slate-200 font-semibold">{org.totalStudents}</span>
                                  <span className="text-slate-500">/ {getPaidSeatSummary(org).split(" / ")[1]}</span>
                                </div>
                                <div className="text-xs text-slate-500 mt-1">
                                  {getPaidSeatCapacity(org) > 0
                                    ? `${getAvailablePaidSeats(org)} paid seats available`
                                    : hasMixedOrgAllocation(org)
                                      ? "No paid seats configured"
                                      : "General student count"}
                                </div>
                              </td>
                              <td className="px-6 py-5 text-right whitespace-nowrap">
                                {org.subscriptionStatus === "active" ? (
                                  <div className="flex flex-col items-end gap-1.5">
                                    <div className="flex items-center justify-end gap-2">
                                      {perms.manage_seats && (
                                        <button
                                          onClick={() => openActivateModal(org)}
                                          className="px-4 py-2 bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 hover:bg-indigo-500 hover:text-white text-xs font-bold rounded-xl transition-all inline-flex items-center gap-1.5"
                                        >
                                          <Settings2 className="h-3.5 w-3.5" />
                                          Manage Seats
                                        </button>
                                      )}
                                      {perms.deactivate_subscription && (
                                        <button
                                          onClick={() => {
                                            setSelectedOrg(org);
                                            setDeactivateModalOpen(true);
                                          }}
                                          className="px-4 py-2 bg-rose-500/10 border border-rose-500/20 text-rose-400 hover:bg-rose-500 hover:text-white text-xs font-bold rounded-xl transition-all"
                                        >
                                          Deactivate
                                        </button>
                                      )}
                                    </div>
                                    <div className="flex items-center gap-1.5 mt-2">
                                      <button
                                        onClick={() => copyEmail(org._id, org.email)}
                                        className={`text-[10px] uppercase font-bold tracking-wider transition-colors ${copiedId === org._id ? 'text-emerald-400' : 'text-slate-500 hover:text-slate-300'}`}
                                      >
                                        {copiedId === org._id ? '✓ Copied!' : 'Copy Email'}
                                      </button>
                                      {perms.view_users && (
                                        <>
                                          <span className="text-slate-700 mx-1">•</span>
                                          <button
                                            onClick={() => {
                                              setView("users");
                                              setSelectedOrgForUsers({ id: org._id, name: org.organizationName });
                                            }}
                                            className="text-[10px] uppercase font-bold tracking-wider text-indigo-400 hover:text-indigo-300 transition-colors"
                                          >
                                            View Users
                                          </button>
                                        </>
                                      )}
                                    </div>
                                  </div>
                                ) : perms.activate ? (
                                  <button
                                    onClick={() => openActivateModal(org)}
                                    className="px-4 py-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 hover:bg-emerald-500 hover:text-white text-xs font-bold rounded-xl transition-all inline-flex items-center gap-1.5"
                                  >
                                    <Plus className="h-3.5 w-3.5" />
                                    Activate Plan
                                  </button>
                                ) : null}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </>
                )}
              </div>
            </div>
          </>
        )}
      </div>

      {
        activateModalOpen && selectedOrg && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
            <div className="bg-[#0F172A] border border-white/10 rounded-2xl md:rounded-3xl p-5 md:p-8 max-w-2xl w-full shadow-2xl relative max-h-[90vh] overflow-y-auto">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 to-teal-500" />
              <h3 className="text-xl font-bold text-white mb-2">
                {selectedOrg.subscriptionStatus === "active" ? "Manage Paid Seats" : "Activate Paid Seats"}
              </h3>
              <p className="text-slate-400 text-sm mb-6">
                Configure how many paid students <span className="text-white font-semibold">{selectedOrg.organizationName}</span> can have in each tier. Increase these seats whenever you want to add more paid users.
              </p>

              <form onSubmit={handleActivate} className="space-y-5">
                <div className="rounded-2xl border border-white/10 bg-[#020617] p-4 grid grid-cols-1 md:grid-cols-3 gap-3">
                  <SummaryChip label="Paid Seats Used" value={getPaidSeatsUsed(selectedOrg)} icon={<Users className="h-4 w-4 text-emerald-300" />} />
                  <SummaryChip label="Paid Seats Configured" value={paidSeatTotal} icon={<Layers3 className="h-4 w-4 text-indigo-300" />} />
                  <SummaryChip label="Seats Left After Save" value={Math.max(paidSeatTotal - getPaidSeatsUsed(selectedOrg), 0)} icon={<TrendingUp className="h-4 w-4 text-amber-300" />} />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-3">
                    <SeatInput
                      label="Silver Seats"
                      value={planSeatText.Silver}
                      onChange={(v) => updatePlanSeatText("Silver", v)}
                      onBlur={() => normalizePlanSeatText("Silver")}
                    />
                    <div>
                      <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 ml-1">Silver Expiry</label>
                      <div className="mt-1">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button type="button" className="w-full flex items-center justify-between bg-[#020617] border border-white/10 hover:border-white/20 rounded-xl py-2.5 px-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all">
                              <span>{durations.Silver === 1 ? "1 Month" : durations.Silver === 12 ? "1 Year" : durations.Silver + " Months"}</span>
                              <ChevronDown className="h-4 w-4 text-slate-500" />
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent className="w-[--radix-dropdown-menu-trigger-width] min-w-[8rem] bg-[#0F172A] border-white/10 shadow-2xl rounded-xl p-1 z-[200]">
                            {[1, 3, 6, 12].map(val => (
                              <DropdownMenuItem
                                key={val}
                                onClick={() => setDurations(prev => ({ ...prev, Silver: val }))}
                                className={`px-3 py-2 text-sm cursor-pointer rounded-lg mb-0.5 last:mb-0 ${durations.Silver === val ? "bg-emerald-500/20 text-emerald-300 font-bold" : "text-slate-200 hover:bg-white/5 hover:text-white"}`}
                              >
                                {val === 1 ? "1 Month" : val === 12 ? "1 Year" : val + " Months"}
                              </DropdownMenuItem>
                            ))}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <SeatInput
                      label="Gold Seats"
                      value={planSeatText.Gold}
                      onChange={(v) => updatePlanSeatText("Gold", v)}
                      onBlur={() => normalizePlanSeatText("Gold")}
                    />
                    <div>
                      <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 ml-1">Gold Expiry</label>
                      <div className="mt-1">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button type="button" className="w-full flex items-center justify-between bg-[#020617] border border-white/10 hover:border-white/20 rounded-xl py-2.5 px-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all">
                              <span>{durations.Gold === 1 ? "1 Month" : durations.Gold === 12 ? "1 Year" : durations.Gold + " Months"}</span>
                              <ChevronDown className="h-4 w-4 text-slate-500" />
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent className="w-[--radix-dropdown-menu-trigger-width] min-w-[8rem] bg-[#0F172A] border-white/10 shadow-2xl rounded-xl p-1 z-[200]">
                            {[1, 3, 6, 12].map(val => (
                              <DropdownMenuItem
                                key={val}
                                onClick={() => setDurations(prev => ({ ...prev, Gold: val }))}
                                className={`px-3 py-2 text-sm cursor-pointer rounded-lg mb-0.5 last:mb-0 ${durations.Gold === val ? "bg-emerald-500/20 text-emerald-300 font-bold" : "text-slate-200 hover:bg-white/5 hover:text-white"}`}
                              >
                                {val === 1 ? "1 Month" : val === 12 ? "1 Year" : val + " Months"}
                              </DropdownMenuItem>
                            ))}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <SeatInput
                      label="Diamond Seats"
                      value={planSeatText.Diamond}
                      onChange={(v) => updatePlanSeatText("Diamond", v)}
                      onBlur={() => normalizePlanSeatText("Diamond")}
                    />
                    <div>
                      <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 ml-1">Diamond Expiry</label>
                      <div className="mt-1">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button type="button" className="w-full flex items-center justify-between bg-[#020617] border border-white/10 hover:border-white/20 rounded-xl py-2.5 px-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all">
                              <span>{durations.Diamond === 1 ? "1 Month" : durations.Diamond === 12 ? "1 Year" : durations.Diamond + " Months"}</span>
                              <ChevronDown className="h-4 w-4 text-slate-500" />
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent className="w-[--radix-dropdown-menu-trigger-width] min-w-[8rem] bg-[#0F172A] border-white/10 shadow-2xl rounded-xl p-1 z-[200]">
                            {[1, 3, 6, 12].map(val => (
                              <DropdownMenuItem
                                key={val}
                                onClick={() => setDurations(prev => ({ ...prev, Diamond: val }))}
                                className={`px-3 py-2 text-sm cursor-pointer rounded-lg mb-0.5 last:mb-0 ${durations.Diamond === val ? "bg-emerald-500/20 text-emerald-300 font-bold" : "text-slate-200 hover:bg-white/5 hover:text-white"}`}
                              >
                                {val === 1 ? "1 Month" : val === 12 ? "1 Year" : val + " Months"}
                              </DropdownMenuItem>
                            ))}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl border border-white/10 bg-[#020617] p-4 space-y-2">
                  <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">What this changes</div>
                  <ul className="text-sm text-slate-300 space-y-1.5">
                    <li>Each paid seat allows one student to use that tier.</li>
                    <li>Use this panel whenever you need to add more paid users later.</li>
                    <li>Students beyond paid seats can still remain on the Free plan.</li>
                  </ul>
                </div>

                <div className="text-xs text-slate-500">
                  Current total students: <span className="text-slate-300 font-semibold">{selectedOrg.totalStudents}</span>
                  {" · "}
                  Current paid allocation: <span className="text-slate-300 font-semibold">{getPlanSplit(selectedOrg)}</span>
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setActivateModalOpen(false)}
                    className="flex-1 py-3 rounded-xl bg-white/5 text-slate-300 text-sm font-bold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-bold transition-all disabled:opacity-50"
                  >
                    {isSubmitting ? (selectedOrg.subscriptionStatus === "active" ? "Saving..." : "Activating...") : (selectedOrg.subscriptionStatus === "active" ? "Save Seats" : "Activate Seats")}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )
      }

      {
        deactivateModalOpen && selectedOrg && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
            <div className="bg-[#0F172A] border border-white/10 rounded-2xl md:rounded-3xl p-6 md:p-8 max-w-sm w-full shadow-2xl text-center">
              <ShieldOff className="h-12 w-12 text-rose-500 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-white mb-2">Deactivate Plan?</h3>
              <p className="text-slate-400 text-sm mb-6">
                Deactivate subscription for <span className="text-white font-semibold">{selectedOrg.organizationName}</span>? Students will lose premium access immediately.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setDeactivateModalOpen(false)}
                  disabled={isSubmitting}
                  className="flex-1 py-3 rounded-xl bg-white/5 text-slate-300 text-sm font-bold"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeactivate}
                  disabled={isSubmitting}
                  className="flex-1 py-3 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-sm font-bold transition-all disabled:opacity-50"
                >
                  {isSubmitting ? "Deactivating..." : "Deactivate"}
                </button>
              </div>
            </div>
          </div>
        )
      }

      <style jsx global>{`
        @keyframes slideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        .animate-slide-up { animation: slideUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        .animate-pulse-slow { animation: pulse 6s cubic-bezier(0.4, 0, 0.6, 1) infinite; }
      `}</style>
    </div >
  );
}

function StatCard({
  icon,
  label,
  value,
  valueClass,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  valueClass?: string;
}) {
  return (
    <div className="p-4 md:p-6 rounded-2xl md:rounded-3xl bg-[#0F172A]/60 backdrop-blur-xl border border-white/5 flex flex-col md:flex-row items-start md:items-center gap-3 md:gap-4 h-full">
      <div className="p-3 md:p-4 rounded-xl md:rounded-2xl bg-white/5 border border-white/10 shrink-0">{icon}</div>
      <div>
        <p className="text-slate-500 text-[10px] md:text-xs font-bold uppercase tracking-wider mb-0.5 md:mb-1">{label}</p>
        <h3 className={`text-2xl md:text-3xl font-bold tracking-tight ${valueClass || "text-white"}`}>{value}</h3>
      </div>
    </div>
  );
}

function SeatInput({
  label,
  value,
  onChange,
  onBlur,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  onBlur?: () => void;
}) {
  return (
    <div>
      <label className="text-xs font-medium text-slate-400 ml-1">{label}</label>
      <input
        type="text"
        inputMode="numeric"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onBlur={onBlur}
        className="w-full mt-1 bg-[#020617] border border-white/10 rounded-xl py-3 px-4 text-sm text-white focus:ring-2 focus:ring-emerald-500/20 outline-none"
      />
    </div>
  );
}

function parseSeatInputValue(value: string): number {
  if (!value) return 0;
  const parsed = Number.parseInt(value, 10);
  if (Number.isNaN(parsed) || parsed < 0) return 0;
  return parsed;
}

function SummaryChip({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
}) {
  return (
    <div className="rounded-xl border border-white/10 bg-[#0B1220] px-3 py-2">
      <div className="flex items-center gap-2 text-slate-400 text-xs">{icon}{label}</div>
      <div className="text-white font-semibold text-sm mt-1">{value}</div>
    </div>
  );
}
