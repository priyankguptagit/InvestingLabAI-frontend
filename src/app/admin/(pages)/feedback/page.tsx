"use client";

import { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import {
  Trash2, RefreshCw, ChevronLeft, ChevronRight,
  Filter, MessageSquare, Eye, CheckCircle, XCircle,
  Clock, ShieldAlert, Star, Bug, Lightbulb, MessageCircle,
  MoreHorizontal, CheckCheck, BarChart2,
} from 'lucide-react';
import { Button } from '@/shared-components/ui/button';
import { companyApi } from "@/lib/api";
import { Badge } from '@/shared-components/ui/badge';
import {
  Card, CardHeader, CardTitle, CardDescription, CardContent,
} from '@/shared-components/ui/card';
import {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuCheckboxItem, DropdownMenuItem,
} from '@/shared-components/ui/dropdown-menu';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from '@/shared-components/ui/dialog';
import { Separator } from '@/shared-components/ui/separator';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001';

interface FactorRating {
  factor: string;
  score: number;
}

interface Feedback {
  _id: string;
  authorName: string;
  authorEmail: string;
  type: 'multi_factor' | 'testimonial' | 'bug' | 'feature_request' | 'general';
  content?: string;
  rating?: number;
  factorRatings?: FactorRating[];
  portal: string;
  status: 'pending' | 'approved' | 'rejected' | 'resolved';
  createdAt: string;
}

type StatusOption = Feedback['status'];
type TypeOption = Feedback['type'];

const STATUS_CONFIG: Record<StatusOption, { label: string; color: string; dotColor: string }> = {
  pending: { label: 'Pending', color: 'bg-amber-500/15 text-amber-400 border-amber-500/25', dotColor: 'bg-amber-400' },
  approved: { label: 'Approved', color: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/25', dotColor: 'bg-emerald-400' },
  resolved: { label: 'Resolved', color: 'bg-blue-500/15 text-blue-400 border-blue-500/25', dotColor: 'bg-blue-400' },
  rejected: { label: 'Rejected/Spam', color: 'bg-red-500/15 text-red-400 border-red-500/25', dotColor: 'bg-red-400' },
};

const TYPE_CONFIG: Record<TypeOption, { label: string; icon: any; color: string }> = {
  multi_factor: { label: 'Experience Rating', icon: BarChart2, color: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/25' },
  testimonial: { label: 'Testimonial', icon: Star, color: 'bg-indigo-500/15 text-indigo-400 border-indigo-500/25' },
  bug: { label: 'Bug Report', icon: Bug, color: 'bg-red-500/15 text-red-400 border-red-500/25' },
  feature_request: { label: 'Feature Request', icon: Lightbulb, color: 'bg-violet-500/15 text-violet-400 border-violet-500/25' },
  general: { label: 'General', icon: MessageCircle, color: 'bg-slate-500/15 text-slate-400 border-slate-500/25' },
};

// Status state machine — only meaningful transitions per type
// multi_factor / Testimonials: pending → approved | rejected
// Bug/Feature:  pending → resolved | rejected | approved
// General:      pending → resolved | rejected
const VALID_NEXT_STATUSES: Record<TypeOption, StatusOption[]> = {
  multi_factor: ['approved', 'rejected'],
  testimonial: ['approved', 'rejected'],
  bug: ['approved', 'resolved', 'rejected'],
  feature_request: ['approved', 'resolved', 'rejected'],
  general: ['resolved', 'rejected'],
};

const STATUS_ACTION_CONFIG: Record<StatusOption, { label: string; icon: any; iconClass: string; itemClass: string }> = {
  approved: { label: 'Approve', icon: CheckCircle, iconClass: 'text-emerald-400', itemClass: 'focus:bg-emerald-500/10 focus:text-emerald-300' },
  resolved: { label: 'Mark Resolved', icon: CheckCheck, iconClass: 'text-blue-400', itemClass: 'focus:bg-blue-500/10 focus:text-blue-300' },
  rejected: { label: 'Mark as Spam', icon: ShieldAlert, iconClass: 'text-amber-400', itemClass: 'focus:bg-amber-500/10 focus:text-amber-300' },
  pending: { label: 'Reset to Pending', icon: Clock, iconClass: 'text-slate-400', itemClass: 'focus:bg-white/10 focus:text-slate-200' },
};

const STATUSES: { value: StatusOption; label: string }[] = [
  { value: 'pending', label: 'Pending' },
  { value: 'approved', label: 'Approved' },
  { value: 'resolved', label: 'Resolved' },
  { value: 'rejected', label: 'Rejected/Spam' },
];

const TYPES: { value: TypeOption; label: string }[] = [
  { value: 'multi_factor', label: 'Experience Ratings' },
  { value: 'testimonial', label: 'Testimonials' },
  { value: 'bug', label: 'Bug Reports' },
  { value: 'feature_request', label: 'Feature Requests' },
  { value: 'general', label: 'General' },
];

// Human-readable labels for multi-factor keys
const FACTOR_LABELS: Record<string, { label: string; emoji: string }> = {
  overall_experience: { label: 'Overall Experience', emoji: '🌟' },
  ease_of_use: { label: 'Ease of Use', emoji: '🎯' },
  data_accuracy: { label: 'Data & Accuracy', emoji: '📊' },
  performance_speed: { label: 'Performance & Speed', emoji: '⚡' },
  features_coverage: { label: 'Features & Coverage', emoji: '🛠️' },
  support_reliability: { label: 'Support & Reliability', emoji: '🛡️' },
};

function StatusBadge({ status }: { status: StatusOption }) {
  const cfg = STATUS_CONFIG[status];
  if (!cfg) return null;
  return (
    <Badge variant="outline" className={`text-[10px] font-bold uppercase tracking-wider gap-1.5 px-2 py-0.5 ${cfg.color}`}>
      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${cfg.dotColor}`} />
      {cfg.label}
    </Badge>
  );
}

function TypeBadge({ type }: { type: TypeOption }) {
  const cfg = TYPE_CONFIG[type];
  if (!cfg) return null;
  const Icon = cfg.icon;
  return (
    <Badge variant="outline" className={`text-[10px] font-bold uppercase tracking-wider gap-1.5 px-2 py-0.5 ${cfg.color}`}>
      <Icon className="w-3 h-3 shrink-0" />
      {cfg.label}
    </Badge>
  );
}

function StarDisplay({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <Star key={s} className={`w-3 h-3 ${rating >= s ? 'text-amber-400 fill-amber-400' : 'text-slate-700'}`} />
      ))}
    </div>
  );
}

// Shadcn-based confirmation dialog — replaces native confirm()
function DeleteConfirmDialog({
  open,
  onOpenChange,
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onConfirm: () => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm bg-[#0f172a] border-white/10 text-white rounded-2xl">
        <DialogHeader>
          <DialogTitle className="text-base font-semibold">Delete Feedback</DialogTitle>
          <DialogDescription className="text-slate-400 text-sm">
            This will permanently delete the feedback entry and cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <div className="flex justify-end gap-2 mt-2">
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}
            className="border-white/10 bg-transparent hover:bg-white/5 text-slate-300">
            Cancel
          </Button>
          <Button size="sm" onClick={() => { onConfirm(); onOpenChange(false); }}
            className="bg-red-600 hover:bg-red-700 text-white">
            Delete
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function AdminFeedbackPage() {
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [selectedStatuses, setSelectedStatuses] = useState<Set<StatusOption>>(new Set());
  const [selectedTypes, setSelectedTypes] = useState<Set<TypeOption>>(new Set());

  // Detail view state
  const [viewItem, setViewItem] = useState<Feedback | null>(null);

  // Delete confirmation state
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

  // Permission states
  const [hasUpdatePermission, setHasUpdatePermission] = useState(false);
  const [hasDeletePermission, setHasDeletePermission] = useState(false);

  useEffect(() => {
    companyApi.getMe().then(res => {
      if (res.success && res.user) {
        if (res.user.role === 'super_admin') {
          setHasUpdatePermission(true);
          setHasDeletePermission(true);
        } else {
          const perms = res.user.customRole?.permissions || [];
          setHasUpdatePermission(perms.includes('feedback.update_status'));
          setHasDeletePermission(perms.includes('feedback.delete'));
        }
      }
    }).catch(() => { });
  }, []);

  const fetchFeedbacks = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_URL}/api/feedback/admin/all`, {
        params: {
          page,
          limit: 12,
          status: Array.from(selectedStatuses).join(',') || undefined,
          type: Array.from(selectedTypes).join(',') || undefined,
        },
        withCredentials: true,
      });
      setFeedbacks(res.data.feedbacks ?? []);
      setPages(res.data.pagination.pages ?? 1);
      setTotal(res.data.pagination.total ?? 0);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [page, selectedStatuses, selectedTypes]);

  useEffect(() => { fetchFeedbacks(); }, [fetchFeedbacks]);

  // Optimistic status update — update local state immediately, then sync with server
  const updateStatus = useCallback(async (id: string, newStatus: StatusOption) => {
    // Optimistic update
    setFeedbacks(prev => prev.map(f => f._id === id ? { ...f, status: newStatus } : f));
    setViewItem(v => v?._id === id ? { ...v, status: newStatus } : v);

    try {
      await axios.patch(
        `${API_URL}/api/feedback/admin/${id}/status`,
        { status: newStatus },
        { withCredentials: true }
      );
    } catch (err) {
      // Rollback on failure — re-fetch
      console.error('Status update failed, rolling back', err);
      fetchFeedbacks();
    }
  }, [fetchFeedbacks]);

  const executedDelete = useCallback(async (id: string) => {
    // Optimistic removal
    setFeedbacks(prev => prev.filter(f => f._id !== id));
    setViewItem(v => v?._id === id ? null : v);
    setDeleteTarget(null);

    try {
      await axios.delete(`${API_URL}/api/feedback/admin/${id}`, { withCredentials: true });
      // Refresh total count
      setTotal(t => t - 1);
    } catch (err) {
      console.error('Delete failed, rolling back', err);
      fetchFeedbacks();
    }
  }, [fetchFeedbacks]);

  const toggleStatus = (s: StatusOption) => {
    setSelectedStatuses(prev => {
      const n = new Set(prev);
      n.has(s) ? n.delete(s) : n.add(s);
      return n;
    });
    setPage(1);
  };

  const toggleType = (t: TypeOption) => {
    setSelectedTypes(prev => {
      const n = new Set(prev);
      n.has(t) ? n.delete(t) : n.add(t);
      return n;
    });
    setPage(1);
  };

  const activeFilterCount = selectedStatuses.size + selectedTypes.size;

  // Infer which status actions are valid for a given feedback
  const getAvailableActions = (f: Feedback): StatusOption[] => {
    return VALID_NEXT_STATUSES[f.type].filter(s => s !== f.status);
  };

  return (
    <div className="p-6 md:p-8 max-w-[1400px] mx-auto space-y-6 text-slate-100 min-h-full">

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-5">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <div className="h-8 w-8 rounded-xl bg-indigo-500/20 flex items-center justify-center">
              <MessageSquare className="w-4 h-4 text-indigo-400" />
            </div>
            <h1 className="text-2xl font-bold text-white tracking-tight">Feedback Hub</h1>
            {total > 0 && (
              <Badge variant="outline" className="text-slate-400 border-white/10 text-[10px]">
                {total} entries
              </Badge>
            )}
          </div>
          <p className="text-slate-500 text-sm ml-10.5">
            Manage bug reports, feature requests, and testimonials across all portals.
          </p>
        </div>

        {/* Filter controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Status filter */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm"
                className={`border-white/10 bg-[#0B0C15] text-slate-300 hover:bg-white/5 hover:text-white gap-2 ${selectedStatuses.size > 0 ? 'border-indigo-500/40 text-indigo-300' : ''}`}
              >
                <Filter className="w-3.5 h-3.5" />
                Status
                {selectedStatuses.size > 0 && (
                  <span className="bg-indigo-500 text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                    {selectedStatuses.size}
                  </span>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-52 bg-[#0f172a] border-white/10 text-white" align="end">
              <DropdownMenuLabel className="text-slate-400 text-xs">Filter by Status</DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-white/10" />
              {STATUSES.map((s) => (
                <DropdownMenuCheckboxItem
                  key={s.value}
                  checked={selectedStatuses.has(s.value)}
                  onCheckedChange={() => toggleStatus(s.value)}
                  className="cursor-pointer focus:bg-white/5 focus:text-white"
                >
                  <div className="flex items-center gap-2">
                    <span className={`w-1.5 h-1.5 rounded-full ${STATUS_CONFIG[s.value].dotColor}`} />
                    {s.label}
                  </div>
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Type filter */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm"
                className={`border-white/10 bg-[#0B0C15] text-slate-300 hover:bg-white/5 hover:text-white gap-2 ${selectedTypes.size > 0 ? 'border-violet-500/40 text-violet-300' : ''}`}
              >
                <Filter className="w-3.5 h-3.5" />
                Category
                {selectedTypes.size > 0 && (
                  <span className="bg-violet-500 text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                    {selectedTypes.size}
                  </span>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-52 bg-[#0f172a] border-white/10 text-white" align="end">
              <DropdownMenuLabel className="text-slate-400 text-xs">Filter by Category</DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-white/10" />
              {TYPES.map((t) => {
                const Icon = TYPE_CONFIG[t.value].icon;
                return (
                  <DropdownMenuCheckboxItem
                    key={t.value}
                    checked={selectedTypes.has(t.value)}
                    onCheckedChange={() => toggleType(t.value)}
                    className="cursor-pointer focus:bg-white/5 focus:text-white"
                  >
                    <div className="flex items-center gap-2">
                      <Icon className="w-3.5 h-3.5 text-slate-400" />
                      {t.label}
                    </div>
                  </DropdownMenuCheckboxItem>
                );
              })}
            </DropdownMenuContent>
          </DropdownMenu>

          {activeFilterCount > 0 && (
            <Button variant="ghost" size="sm"
              onClick={() => { setSelectedStatuses(new Set()); setSelectedTypes(new Set()); setPage(1); }}
              className="text-slate-400 hover:text-red-400 hover:bg-red-500/10 text-xs h-8"
            >
              Clear ({activeFilterCount})
            </Button>
          )}

          <Button variant="outline" size="icon" onClick={fetchFeedbacks}
            className="w-8 h-8 border-white/10 bg-[#0B0C15] hover:bg-white/5 text-slate-400 hover:text-white shrink-0">
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {/* Table */}
      <Card className="bg-[#0B0C15]/80 backdrop-blur-xl border-white/5 shadow-2xl">
        <CardHeader className="border-b border-white/5 py-4 px-6">
          <CardTitle className="text-base font-semibold text-white">All Feedback</CardTitle>
          <CardDescription className="text-slate-500 text-xs">
            Click <strong className="text-slate-400">⋯</strong> to view actions. Click the preview to read the full message.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {/* Overflow must NOT be on a parent that clips portals. Keep the table scroll wrapper tight. */}
          <div className="w-full overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-white/5 bg-white/[0.02]">
                  <th className="px-5 py-3.5 text-slate-500 font-medium text-xs uppercase tracking-wider">Submitter</th>
                  <th className="px-5 py-3.5 text-slate-500 font-medium text-xs uppercase tracking-wider">Category</th>
                  <th className="px-5 py-3.5 text-slate-500 font-medium text-xs uppercase tracking-wider w-[35%]">Message</th>
                  <th className="px-5 py-3.5 text-slate-500 font-medium text-xs uppercase tracking-wider">Portal</th>
                  <th className="px-5 py-3.5 text-slate-500 font-medium text-xs uppercase tracking-wider">Status</th>
                  <th className="px-5 py-3.5 text-slate-500 font-medium text-xs uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04]">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="py-20 text-center">
                      <RefreshCw className="w-6 h-6 animate-spin text-indigo-400 mx-auto" />
                      <p className="text-slate-500 text-xs mt-3">Loading feedback…</p>
                    </td>
                  </tr>
                ) : feedbacks.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-20 text-center">
                      <MessageSquare className="w-8 h-8 text-slate-700 mx-auto mb-3" />
                      <p className="text-slate-500 text-sm">No feedback entries match your filters.</p>
                    </td>
                  </tr>
                ) : (
                  feedbacks.map((f) => {
                    const availableActions = getAvailableActions(f);
                    return (
                      <tr key={f._id} className="hover:bg-white/[0.02] transition-colors group">

                        {/* Submitter */}
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-600 to-violet-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
                              {f.authorName.charAt(0).toUpperCase()}
                            </div>
                            <div className="min-w-0">
                              <p className="font-semibold text-white text-sm truncate max-w-[140px]">{f.authorName}</p>
                              <p className="text-xs text-slate-500 truncate max-w-[140px]">{f.authorEmail}</p>
                            </div>
                          </div>
                        </td>

                        {/* Type */}
                        <td className="px-5 py-4">
                          <div className="space-y-1">
                            <TypeBadge type={f.type} />
                            {f.type === 'testimonial' && f.rating && (
                              <StarDisplay rating={f.rating} />
                            )}
                            {f.type === 'multi_factor' && f.rating && (
                              <div className="flex items-center gap-1">
                                <StarDisplay rating={Math.round(f.rating)} />
                                <span className="text-[10px] text-slate-500 ml-1">{f.rating.toFixed(1)} avg</span>
                              </div>
                            )}
                          </div>
                        </td>

                        {/* Message — click to expand */}
                        <td className="px-5 py-4">
                          <p
                            className="text-slate-300 text-xs line-clamp-2 leading-relaxed cursor-pointer hover:text-white transition-colors"
                            onClick={() => setViewItem(f)}
                            title="Click to read full message"
                          >
                            {f.content ?? <span className="italic text-slate-600">No comment</span>}
                          </p>
                        </td>

                        {/* Portal */}
                        <td className="px-5 py-4">
                          <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500 bg-white/5 border border-white/8 px-2 py-1 rounded-md">
                            {f.portal}
                          </span>
                        </td>

                        {/* Status */}
                        <td className="px-5 py-4">
                          <StatusBadge status={f.status} />
                        </td>

                        {/* Actions — DropdownMenu portal escapes overflow container */}
                        <td className="px-5 py-4 text-right">
                          <DropdownMenu modal={false}>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-slate-500 hover:text-white hover:bg-white/10 data-[state=open]:bg-white/10 data-[state=open]:text-white"
                              >
                                <span className="sr-only">Open actions</span>
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent
                              align="end"
                              sideOffset={4}
                              className="w-[190px] bg-[#0f172a] border-white/10 text-white shadow-2xl rounded-xl z-[9999]"
                            >
                              <DropdownMenuItem
                                onClick={() => setViewItem(f)}
                                className="cursor-pointer focus:bg-white/5 focus:text-white gap-2 rounded-lg py-2"
                              >
                                <Eye className="w-4 h-4 text-slate-400" />
                                Read Full Message
                              </DropdownMenuItem>

                              {hasUpdatePermission && availableActions.length > 0 && (
                                <>
                                  <DropdownMenuSeparator className="bg-white/10 my-1" />
                                  <DropdownMenuLabel className="text-[10px] text-slate-500 uppercase tracking-widest font-bold px-2 py-1">
                                    Change Status
                                  </DropdownMenuLabel>

                                  {availableActions.map(action => {
                                    const cfg = STATUS_ACTION_CONFIG[action];
                                    const Icon = cfg.icon;
                                    return (
                                      <DropdownMenuItem
                                        key={action}
                                        onClick={() => updateStatus(f._id, action)}
                                        className={`cursor-pointer gap-2 rounded-lg py-2 ${cfg.itemClass}`}
                                      >
                                        <Icon className={`w-4 h-4 ${cfg.iconClass}`} />
                                        {cfg.label}
                                      </DropdownMenuItem>
                                    );
                                  })}

                                  {/* Allow resetting to pending if item was already actioned */}
                                  {f.status !== 'pending' && (
                                    <DropdownMenuItem
                                      onClick={() => updateStatus(f._id, 'pending')}
                                      className="cursor-pointer focus:bg-white/5 focus:text-slate-200 gap-2 rounded-lg py-2 text-slate-500"
                                    >
                                      <Clock className="w-4 h-4 text-slate-600" />
                                      Reset to Pending
                                    </DropdownMenuItem>
                                  )}
                                </>
                              )}

                              {hasDeletePermission && (
                                <>
                                  <DropdownMenuSeparator className="bg-white/10 my-1" />
                                  <DropdownMenuItem
                                    onClick={() => setDeleteTarget(f._id)}
                                    className="cursor-pointer focus:bg-red-500/10 focus:text-red-400 text-red-500 gap-2 rounded-lg py-2"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                    Delete Permanently
                                  </DropdownMenuItem>
                                </>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </CardContent>

        {/* Pagination */}
        {pages > 1 && (
          <div className="px-6 py-4 border-t border-white/5 flex items-center justify-between">
            <p className="text-xs text-slate-500">
              Page <strong className="text-slate-300">{page}</strong> of <strong className="text-slate-300">{pages}</strong>
              <span className="ml-2 text-slate-600">· {total} total</span>
            </p>
            <div className="flex gap-1.5">
              <Button variant="outline" size="icon" disabled={page === 1}
                onClick={() => setPage(p => p - 1)}
                className="w-7 h-7 border-white/10 bg-transparent text-slate-400 hover:text-white hover:bg-white/5 disabled:opacity-30">
                <ChevronLeft className="w-3.5 h-3.5" />
              </Button>
              <Button variant="outline" size="icon" disabled={page === pages}
                onClick={() => setPage(p => p + 1)}
                className="w-7 h-7 border-white/10 bg-transparent text-slate-400 hover:text-white hover:bg-white/5 disabled:opacity-30">
                <ChevronRight className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* ── Full Detail Dialog ── */}
      <Dialog open={!!viewItem} onOpenChange={() => setViewItem(null)}>
        <DialogContent className="sm:max-w-lg bg-[#0f172a] border-white/10 rounded-2xl p-0 overflow-hidden gap-0">
          {/* Accent bar */}
          <div className="h-1 w-full bg-gradient-to-r from-indigo-500 via-violet-500 to-fuchsia-500" />
          <div className="p-7">
            {viewItem && (
              <>
                <DialogHeader className="mb-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-indigo-600 to-violet-600 flex items-center justify-center text-white font-bold shrink-0 text-sm">
                        {viewItem.authorName.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <DialogTitle className="text-base font-semibold text-white leading-tight">
                          {viewItem.authorName}
                        </DialogTitle>
                        <DialogDescription className="text-xs text-slate-500 mt-0.5">
                          {viewItem.authorEmail}
                        </DialogDescription>
                      </div>
                    </div>
                    <StatusBadge status={viewItem.status} />
                  </div>
                </DialogHeader>

                {/* Meta badges */}
                <div className="flex flex-wrap gap-2 mb-5">
                  <TypeBadge type={viewItem.type} />
                  <Badge variant="outline" className="text-[10px] uppercase tracking-wider text-slate-400 border-white/10">
                    {viewItem.portal} portal
                  </Badge>
                  <Badge variant="outline" className="text-[10px] uppercase tracking-wider text-slate-400 border-white/10">
                    {new Date(viewItem.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </Badge>
                </div>

                {/* Legacy testimonial single-rating */}
                {viewItem.type === 'testimonial' && viewItem.rating && (
                  <div className="mb-4">
                    <StarDisplay rating={viewItem.rating} />
                  </div>
                )}

                {/* Multi-factor breakdown */}
                {viewItem.type === 'multi_factor' && viewItem.factorRatings && viewItem.factorRatings.length > 0 && (
                  <div className="mb-5 p-4 rounded-xl bg-white/[0.04] border border-white/8">
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Factor Ratings</p>
                      {viewItem.rating && (
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs text-slate-400">Avg</span>
                          <span className="text-sm font-bold text-amber-400">{viewItem.rating.toFixed(1)}</span>
                          <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                        </div>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      {viewItem.factorRatings.map((fr) => {
                        const meta = FACTOR_LABELS[fr.factor];
                        return (
                          <div key={fr.factor} className="flex items-center gap-2 min-w-0">
                            <span className="text-base leading-none shrink-0">{meta?.emoji ?? '•'}</span>
                            <div className="flex-1 min-w-0">
                              <p className="text-[10px] text-slate-400 truncate">{meta?.label ?? fr.factor}</p>
                              <div className="flex gap-0.5 mt-0.5">
                                {[1, 2, 3, 4, 5].map((s) => (
                                  <Star
                                    key={s}
                                    className={`w-3 h-3 ${fr.score >= s ? 'text-amber-400 fill-amber-400' : 'text-slate-700'
                                      }`}
                                  />
                                ))}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Message */}
                {viewItem.content ? (
                  <div className="bg-white/[0.04] border border-white/8 rounded-xl p-5 mb-6">
                    <p className="text-slate-200 leading-relaxed text-sm whitespace-pre-wrap">{viewItem.content}</p>
                  </div>
                ) : (
                  <div className="bg-white/[0.04] border border-white/8 rounded-xl px-5 py-4 mb-6">
                    <p className="text-slate-600 text-sm italic">No additional comment provided.</p>
                  </div>
                )}

                <Separator className="bg-white/8 mb-5" />

                {/* Status actions — type-aware */}
                <div>
                  <p className="text-xs text-slate-500 font-semibold uppercase tracking-widest mb-3">Actions</p>
                  <div className="flex flex-wrap gap-2">
                    {hasUpdatePermission && VALID_NEXT_STATUSES[viewItem.type].map(s => {
                      const cfg = STATUS_CONFIG[s];
                      const isActive = viewItem.status === s;
                      const actionCfg = STATUS_ACTION_CONFIG[s];
                      const Icon = actionCfg.icon;
                      return (
                        <button
                          key={s}
                          onClick={() => !isActive && updateStatus(viewItem._id, s)}
                          disabled={isActive}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all
                            ${isActive
                              ? `${cfg.color} cursor-default`
                              : 'border-white/10 bg-white/5 text-slate-400 hover:border-white/20 hover:text-white'
                            }`}
                        >
                          <Icon className={`w-3.5 h-3.5 ${isActive ? '' : actionCfg.iconClass}`} />
                          {isActive ? `✓ ${cfg.label}` : actionCfg.label}
                        </button>
                      );
                    })}

                    {hasUpdatePermission && viewItem.status !== 'pending' && (
                      <button
                        onClick={() => updateStatus(viewItem._id, 'pending')}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border border-white/10 bg-white/5 text-slate-500 hover:text-slate-200 hover:border-white/20 transition-all"
                      >
                        <Clock className="w-3.5 h-3.5" />
                        Reset to Pending
                      </button>
                    )}

                    {hasDeletePermission && (
                      <button
                        onClick={() => setDeleteTarget(viewItem._id)}
                        className="ml-auto flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border border-red-500/20 text-red-400 hover:bg-red-500/10 transition-all"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        Delete
                      </button>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Delete Confirmation Dialog ── */}
      <DeleteConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(o) => !o && setDeleteTarget(null)}
        onConfirm={() => deleteTarget && executedDelete(deleteTarget)}
      />
    </div>
  );
}
