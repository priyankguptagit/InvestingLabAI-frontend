"use client";

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { careerApi } from '@/lib/api/career.api';
import { Application, STATUS_CFG, StatCard, StatusPill, Avatar, DetailModal } from './_components';
import { Briefcase, Search, RefreshCw, CheckCircle, Clock, Filter, MoreHorizontal, Download, Mail, ChevronLeft, ChevronRight, Users, TrendingUp } from 'lucide-react';
import { Button } from '@/shared-components/ui/button';
import { Input } from '@/shared-components/ui/input';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuLabel, DropdownMenuCheckboxItem } from '@/shared-components/ui/dropdown-menu';

const ITEMS_PER_PAGE = 10;
const STATUSES = ['Pending', 'Reviewing', 'Interviewed', 'Hired', 'Rejected'];

export default function JobApplicationsPage() {
  const [apps, setApps] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Application | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<Set<string>>(new Set());
  const [page, setPage] = useState(1);

  const fetchApps = useCallback(async () => {
    setLoading(true);
    try {
      const r = await careerApi.getAllApplications();
      if (r.success) setApps(r.data);
    } catch { /* silent */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchApps(); }, [fetchApps]);

  const updateStatus = useCallback(async (id: string, status: string) => {
    setApps(p => p.map(a => a._id === id ? { ...a, status: status as any } : a));
    setSelected(p => p?._id === id ? { ...p, status: status as any } : p);
    try { await careerApi.updateApplicationStatus(id, status); }
    catch { fetchApps(); }
  }, [fetchApps]);

  const toggleStatus = (s: string) => {
    setStatusFilter(p => { const n = new Set(p); n.has(s) ? n.delete(s) : n.add(s); return n; });
    setPage(1);
  };

  const filtered = useMemo(() => apps.filter(a => {
    const q = search.toLowerCase();
    return (a.fullName.toLowerCase().includes(q) || a.email.toLowerCase().includes(q) || a.inquiryType.toLowerCase().includes(q))
      && (statusFilter.size === 0 || statusFilter.has(a.status));
  }), [apps, search, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  const pageApps = filtered.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  const stats = useMemo(() => ({
    total: apps.length,
    pending: apps.filter(a => a.status === 'Pending').length,
    inProgress: apps.filter(a => ['Reviewing', 'Interviewed'].includes(a.status)).length,
    hired: apps.filter(a => a.status === 'Hired').length,
  }), [apps]);

  return (
    <>
      <style>{`
        @keyframes fadeSlideIn { from { opacity:0; transform:translateY(12px); } to { opacity:1; transform:translateY(0); } }
        @keyframes statBarGrow { from { width:0; } to { width:var(--bar-w,60%); } }
        @keyframes pulseGlow { 0%,100% { box-shadow:0 0 0 0 rgba(99,102,241,0); } 50% { box-shadow:0 0 0 4px rgba(99,102,241,0.15); } }
        @keyframes rowFadeIn { from { opacity:0; transform:translateX(-6px); } to { opacity:1; transform:translateX(0); } }

        .page-wrap { animation: fadeSlideIn .5s ease both; }
        .stat-card { animation: fadeSlideIn .4s ease both; }
        .stat-bar { animation: statBarGrow 1s .6s ease both; width: 60%; }
        .app-row { animation: rowFadeIn .3s ease both; }
        .app-row:hover { background: rgba(255,255,255,0.035); }
        .app-row td { transition: background .15s; }
        .candidate-link:hover .cname { color: #a5b4fc; }
        .candidate-link:hover .cavatar { box-shadow: 0 0 0 3px rgba(99,102,241,0.35); }
        .modal-scroll::-webkit-scrollbar { width:4px; }
        .modal-scroll::-webkit-scrollbar-track { background:transparent; }
        .modal-scroll::-webkit-scrollbar-thumb { background:#334155; border-radius:4px; }
        .status-btn { transition: all .2s; }
        .status-btn:hover { transform: translateY(-1px); }
        .pill-filter.active { background: rgba(99,102,241,0.15); border-color: rgba(99,102,241,0.4); color:#a5b4fc; }
        .dl-btn:hover { transform:scale(1.03); box-shadow:0 8px 24px rgba(99,102,241,0.35); }
        .dl-btn:active { transform:scale(0.97); }
      `}</style>

      <div className="page-wrap p-6 md:p-8 max-w-[1440px] mx-auto min-h-full text-slate-100 space-y-7">

        {/* ── Header ── */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-indigo-600/30 to-violet-600/30 border border-indigo-500/25 flex items-center justify-center shadow-lg shadow-indigo-500/10">
                <Briefcase className="w-4.5 h-4.5 text-indigo-400" />
              </div>
              <h1 className="text-2xl font-black text-white tracking-tight">Job Applications</h1>
              {!loading && apps.length > 0 && (
                <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-indigo-500/15 text-indigo-300 border border-indigo-500/25">
                  {apps.length}
                </span>
              )}
            </div>
            <p className="text-slate-500 text-sm pl-12">Review, shortlist and manage incoming candidates</p>
          </div>
          <Button variant="outline" size="sm" onClick={fetchApps}
            className="border-white/10 bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white gap-2 self-start md:self-auto">
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>

        {/* ── Stat Cards ── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="Total Applications" value={stats.total}  icon={<Users className="w-5 h-5" />}      accent="bg-indigo-500/10"  delay="0ms" />
          <StatCard label="Pending Review"      value={stats.pending} icon={<Clock className="w-5 h-5" />}     accent="bg-amber-500/10"   delay="60ms" />
          <StatCard label="In Progress"         value={stats.inProgress} icon={<TrendingUp className="w-5 h-5" />} accent="bg-violet-500/10" delay="120ms" />
          <StatCard label="Hired"               value={stats.hired}   icon={<CheckCircle className="w-5 h-5" />} accent="bg-emerald-500/10" delay="180ms" />
        </div>

        {/* ── Toolbar ── */}
        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between rounded-2xl bg-white/[0.025] border border-white/8 backdrop-blur-sm px-5 py-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <Input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
              placeholder="Search candidates, role, email…"
              className="pl-9 bg-white/5 border-white/10 text-white placeholder:text-slate-600 h-9 focus:border-indigo-500/50 transition-colors" />
          </div>
          <div className="flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm"
                  className={`border-white/10 bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white gap-2 transition-all pill-filter ${statusFilter.size > 0 ? 'active' : ''}`}>
                  <Filter className="w-3.5 h-3.5" />
                  Filter
                  {statusFilter.size > 0 && (
                    <span className="w-4 h-4 rounded-full bg-indigo-500 text-white text-[10px] font-bold flex items-center justify-center">
                      {statusFilter.size}
                    </span>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48 bg-[#0f172a] border-white/10 text-white rounded-xl shadow-2xl">
                <DropdownMenuLabel className="text-slate-500 text-xs">Filter by Status</DropdownMenuLabel>
                <DropdownMenuSeparator className="bg-white/10" />
                {STATUSES.map(s => (
                  <DropdownMenuCheckboxItem key={s} checked={statusFilter.has(s)} onCheckedChange={() => toggleStatus(s)}
                    className="cursor-pointer focus:bg-white/5 gap-2">
                    <span className={`w-2 h-2 rounded-full ${STATUS_CFG[s].dot}`} />
                    {STATUS_CFG[s].label}
                  </DropdownMenuCheckboxItem>
                ))}
                {statusFilter.size > 0 && (
                  <>
                    <DropdownMenuSeparator className="bg-white/10" />
                    <DropdownMenuItem onClick={() => setStatusFilter(new Set())} className="cursor-pointer focus:bg-red-500/10 text-red-400 text-xs">
                      Clear filters
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* ── Table ── */}
        <div className="rounded-2xl border border-white/8 bg-white/[0.02] backdrop-blur-sm overflow-hidden shadow-2xl shadow-black/30">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/8 bg-white/[0.02]">
                  {['Candidate', 'Role Applied', 'Applied On', 'Status', ''].map((h, i) => (
                    <th key={i} className={`px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-widest ${i === 4 ? 'text-right' : ''}`}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.05]">
                {loading ? (
                  <tr><td colSpan={5} className="py-24 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-10 h-10 rounded-full border-2 border-indigo-500/30 border-t-indigo-500 animate-spin" />
                      <p className="text-slate-500 text-sm">Loading candidates…</p>
                    </div>
                  </td></tr>
                ) : pageApps.length === 0 ? (
                  <tr><td colSpan={5} className="py-24 text-center">
                    <Briefcase className="w-10 h-10 text-slate-700 mx-auto mb-3" />
                    <p className="text-slate-500 text-sm">No applications match your criteria</p>
                    {(search || statusFilter.size > 0) && (
                      <button onClick={() => { setSearch(''); setStatusFilter(new Set()); }}
                        className="mt-2 text-indigo-400 text-xs hover:text-indigo-300 transition-colors">Clear filters</button>
                    )}
                  </td></tr>
                ) : pageApps.map((app, idx) => (
                  <tr key={app._id} className="app-row cursor-pointer" style={{ animationDelay: `${idx * 40}ms` }}
                      onClick={() => setSelected(app)}>
                    <td className="px-6 py-4">
                      <div className="candidate-link flex items-center gap-3">
                        <span className="cavatar transition-all duration-200"><Avatar name={app.fullName} size="sm" /></span>
                        <div>
                          <p className="cname font-semibold text-white text-sm transition-colors duration-200">{app.fullName}</p>
                          <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                            <Mail className="w-3 h-3" />{app.email}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                        {app.inquiryType}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-400 text-xs">
                      {new Date(app.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </td>
                    <td className="px-6 py-4"><StatusPill status={app.status} /></td>
                    <td className="px-6 py-4 text-right" onClick={e => e.stopPropagation()}>
                      <DropdownMenu modal={false}>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon"
                            className="h-8 w-8 text-slate-500 hover:text-white hover:bg-white/10 data-[state=open]:bg-white/10 data-[state=open]:text-white rounded-lg transition-all">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" sideOffset={4}
                          className="w-52 bg-[#0f172a] border-white/10 text-white shadow-2xl rounded-xl z-[9999]">
                          <DropdownMenuItem onClick={() => setSelected(app)}
                            className="cursor-pointer focus:bg-white/5 gap-2 rounded-lg py-2 text-sm">
                            View Full Profile
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => careerApi.downloadResume(app._id, app.fullName)}
                            className="cursor-pointer focus:bg-white/5 gap-2 rounded-lg py-2 text-sm">
                            <Download className="w-4 h-4 text-slate-400" /> Download Resume
                          </DropdownMenuItem>
                          <DropdownMenuSeparator className="bg-white/10 my-1" />
                          <DropdownMenuLabel className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">
                            Move to Stage
                          </DropdownMenuLabel>
                          {STATUSES.map(s => {
                            const c = STATUS_CFG[s];
                            return (
                              <DropdownMenuItem key={s} disabled={app.status === s}
                                onClick={() => updateStatus(app._id, s)}
                                className={`cursor-pointer gap-2 rounded-lg py-2 text-sm focus:bg-white/5 ${app.status === s ? 'opacity-40' : ''}`}>
                                <span className={`w-2 h-2 rounded-full shrink-0 ${c.dot}`} />
                                {c.label}
                                {app.status === s && <CheckCircle className="w-3.5 h-3.5 text-emerald-400 ml-auto" />}
                              </DropdownMenuItem>
                            );
                          })}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="px-6 py-4 border-t border-white/8 flex items-center justify-between">
              <p className="text-xs text-slate-500">
                <span className="text-slate-300 font-semibold">{(page - 1) * ITEMS_PER_PAGE + 1}–{Math.min(page * ITEMS_PER_PAGE, filtered.length)}</span>
                {' '}of{' '}
                <span className="text-slate-300 font-semibold">{filtered.length}</span> results
              </p>
              <div className="flex gap-1">
                <Button variant="outline" size="icon" disabled={page === 1} onClick={() => setPage(p => p - 1)}
                  className="w-8 h-8 border-white/10 bg-transparent text-slate-400 hover:text-white hover:bg-white/8 disabled:opacity-30 rounded-lg">
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  const pg = totalPages <= 5 ? i + 1 : Math.max(1, Math.min(page - 2, totalPages - 4)) + i;
                  return (
                    <Button key={pg} variant="outline" size="icon" onClick={() => setPage(pg)}
                      className={`w-8 h-8 rounded-lg text-xs font-semibold transition-all ${pg === page ? 'border-indigo-500/50 bg-indigo-500/20 text-indigo-300' : 'border-white/10 bg-transparent text-slate-500 hover:text-white hover:bg-white/8'}`}>
                      {pg}
                    </Button>
                  );
                })}
                <Button variant="outline" size="icon" disabled={page === totalPages} onClick={() => setPage(p => p + 1)}
                  className="w-8 h-8 border-white/10 bg-transparent text-slate-400 hover:text-white hover:bg-white/8 disabled:opacity-30 rounded-lg">
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      <DetailModal app={selected} open={!!selected} onClose={() => setSelected(null)} onStatusChange={updateStatus} />
    </>
  );
}
