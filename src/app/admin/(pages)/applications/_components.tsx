"use client";

import { Badge } from '@/shared-components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/shared-components/ui/dialog';
import { Separator } from '@/shared-components/ui/separator';
import { Button } from '@/shared-components/ui/button';
import { careerApi } from '@/lib/api/career.api';
import { Mail, Phone, FileText, Download, Briefcase, Users, Clock, CheckCircle2 } from 'lucide-react';

export interface Application {
  _id: string;
  fullName: string;
  email: string;
  mobile: string;
  inquiryType: string;
  description: string;
  resumeUrl: string;
  status: 'Pending' | 'Reviewing' | 'Interviewed' | 'Hired' | 'Rejected';
  createdAt: string;
}

export const STATUS_CFG: Record<string, { label: string; pill: string; dot: string; glow: string }> = {
  Pending:    { label: 'Pending',     pill: 'bg-amber-500/10 text-amber-300 border-amber-400/25',   dot: 'bg-amber-400',   glow: 'shadow-amber-500/20' },
  Reviewing:  { label: 'Reviewing',   pill: 'bg-sky-500/10 text-sky-300 border-sky-400/25',         dot: 'bg-sky-400',     glow: 'shadow-sky-500/20' },
  Interviewed:{ label: 'Interviewed', pill: 'bg-violet-500/10 text-violet-300 border-violet-400/25',dot: 'bg-violet-400',  glow: 'shadow-violet-500/20' },
  Hired:      { label: 'Hired',       pill: 'bg-emerald-500/10 text-emerald-300 border-emerald-400/25', dot: 'bg-emerald-400', glow: 'shadow-emerald-500/20' },
  Rejected:   { label: 'Rejected',    pill: 'bg-red-500/10 text-red-300 border-red-400/25',         dot: 'bg-red-400',     glow: 'shadow-red-500/20' },
};

export function StatusPill({ status }: { status: string }) {
  const c = STATUS_CFG[status] || STATUS_CFG['Pending'];
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border ${c.pill}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${c.dot} animate-pulse`} />
      {c.label}
    </span>
  );
}

export function Avatar({ name, size = 'md' }: { name: string; size?: 'sm' | 'md' | 'lg' }) {
  const s = { sm: 'w-8 h-8 text-xs', md: 'w-10 h-10 text-sm', lg: 'w-14 h-14 text-lg' }[size];
  const colors = [
    'from-indigo-500 to-violet-600',
    'from-sky-500 to-blue-600',
    'from-fuchsia-500 to-pink-600',
    'from-emerald-500 to-teal-600',
    'from-orange-500 to-amber-600',
  ];
  const color = colors[name.charCodeAt(0) % colors.length];
  return (
    <div className={`${s} rounded-full bg-gradient-to-br ${color} flex items-center justify-center text-white font-bold shrink-0 ring-2 ring-white/10`}>
      {name.charAt(0).toUpperCase()}
    </div>
  );
}

interface StatCardProps { label: string; value: number; icon: React.ReactNode; accent: string; delay: string; }
export function StatCard({ label, value, icon, accent, delay }: StatCardProps) {
  return (
    <div className={`stat-card relative overflow-hidden rounded-2xl border border-white/8 bg-white/[0.03] backdrop-blur-sm p-5 group hover:border-white/15 hover:bg-white/[0.05] transition-all duration-300`}
         style={{ animationDelay: delay }}>
      <div className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 ${accent} blur-3xl`} />
      <div className="relative z-10 flex items-start justify-between">
        <div>
          <p className="text-xs text-slate-500 font-medium tracking-wide uppercase mb-1">{label}</p>
          <p className="text-3xl font-black text-white tracking-tight">{value}</p>
        </div>
        <div className={`p-2.5 rounded-xl bg-white/5 border border-white/8 text-slate-400 group-hover:text-white group-hover:bg-white/10 transition-all duration-300`}>
          {icon}
        </div>
      </div>
      <div className="relative z-10 mt-3 h-1 rounded-full bg-white/5 overflow-hidden">
        <div className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-violet-500 stat-bar" />
      </div>
    </div>
  );
}

interface DetailModalProps {
  app: Application | null;
  open: boolean;
  onClose: () => void;
  onStatusChange: (id: string, status: string) => void;
}
export function DetailModal({ app, open, onClose, onStatusChange }: DetailModalProps) {
  if (!app) return null;
  const STATUSES = ['Pending', 'Reviewing', 'Interviewed', 'Hired', 'Rejected'];
  const stepIdx = STATUSES.indexOf(app.status);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl bg-[#0C0D18] border border-white/10 rounded-3xl p-0 overflow-hidden gap-0 shadow-2xl shadow-black/60">
        {/* Gradient top bar */}
        <div className="h-1 w-full bg-gradient-to-r from-indigo-500 via-violet-500 to-fuchsia-500" />

        {/* Header */}
        <div className="relative px-8 pt-7 pb-5 border-b border-white/8">
          <div className="absolute inset-0 bg-gradient-to-b from-indigo-500/5 to-transparent pointer-events-none" />
          <div className="relative flex items-start justify-between gap-4">
            <div className="flex items-center gap-4">
              <Avatar name={app.fullName} size="lg" />
              <div>
                <DialogTitle className="text-xl font-bold text-white leading-tight">{app.fullName}</DialogTitle>
                <div className="flex flex-col gap-1 mt-1.5">
                  <DialogDescription className="text-sm text-slate-400 flex items-center gap-2">
                    <Mail className="w-3.5 h-3.5 text-indigo-400 shrink-0" /> {app.email}
                  </DialogDescription>
                  <DialogDescription className="text-sm text-slate-400 flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5 text-indigo-400 shrink-0" /> {app.mobile}
                  </DialogDescription>
                </div>
              </div>
            </div>
            <StatusPill status={app.status} />
          </div>
        </div>

        <div className="px-8 py-6 space-y-6 max-h-[65vh] overflow-y-auto modal-scroll">
          {/* Position + Date row */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white/[0.03] border border-white/8 rounded-xl p-4">
              <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold mb-2">Position Applied</p>
              <Badge variant="outline" className="text-xs font-semibold text-indigo-300 border-indigo-500/25 bg-indigo-500/10">
                {app.inquiryType}
              </Badge>
            </div>
            <div className="bg-white/[0.03] border border-white/8 rounded-xl p-4">
              <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold mb-2">Applied On</p>
              <p className="text-sm font-semibold text-slate-200">
                {new Date(app.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
              </p>
            </div>
          </div>

          {/* Pipeline stepper */}
          <div className="bg-white/[0.03] border border-white/8 rounded-xl p-4">
            <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold mb-4">Hiring Pipeline</p>
            <div className="relative flex items-center justify-between">
              <div className="absolute left-0 right-0 top-4 h-0.5 bg-white/8 z-0" />
              <div
                className="absolute left-0 top-4 h-0.5 bg-gradient-to-r from-indigo-500 to-violet-500 z-0 transition-all duration-700"
                style={{ width: app.status === 'Rejected' ? '100%' : `${(stepIdx / (STATUSES.length - 1)) * 100}%` }}
              />
              {STATUSES.map((s, i) => {
                const done = i < stepIdx || (i === stepIdx && app.status !== 'Rejected');
                const active = i === stepIdx;
                const rejected = app.status === 'Rejected' && s === 'Rejected';
                return (
                  <button key={s} onClick={() => onStatusChange(app._id, s)}
                    className="relative z-10 flex flex-col items-center gap-2 group/step">
                    <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center text-xs font-bold transition-all duration-300
                      ${rejected ? 'border-red-500 bg-red-500/20 text-red-300' :
                        active ? 'border-indigo-500 bg-indigo-500 text-white shadow-lg shadow-indigo-500/40' :
                        done ? 'border-violet-500 bg-violet-500/20 text-violet-300' :
                        'border-white/15 bg-white/5 text-slate-600 group-hover/step:border-white/30 group-hover/step:text-slate-400'}`}>
                      {done && !active && !rejected ? '✓' : i + 1}
                    </div>
                    <span className={`text-[10px] font-semibold hidden sm:block ${active ? 'text-indigo-300' : done ? 'text-slate-400' : 'text-slate-600'}`}>{s}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Cover Letter */}
          <div className="bg-white/[0.03] border border-white/8 rounded-xl p-5">
            <h4 className="text-[10px] text-slate-500 uppercase tracking-widest font-bold mb-3 flex items-center gap-2">
              <FileText className="w-3.5 h-3.5 text-indigo-400" /> Cover Letter
            </h4>
            <p className="text-slate-300 text-sm leading-relaxed whitespace-pre-wrap">{app.description}</p>
          </div>

          {/* Resume download */}
          <div className="flex items-center justify-between bg-gradient-to-r from-indigo-500/10 to-violet-500/10 border border-indigo-500/20 rounded-xl p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center">
                <FileText className="w-5 h-5 text-indigo-400" />
              </div>
              <div>
                <p className="text-sm font-semibold text-white">Candidate Resume</p>
                <p className="text-xs text-slate-500">PDF Document</p>
              </div>
            </div>
            <Button size="sm" onClick={() => careerApi.downloadResume(app._id, app.fullName)}
              className="bg-indigo-600 hover:bg-indigo-500 text-white gap-2 shadow-lg shadow-indigo-500/25 transition-all duration-200 hover:shadow-indigo-500/40 hover:scale-105 active:scale-95">
              <Download className="w-4 h-4" /> Download
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
