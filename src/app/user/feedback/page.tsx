"use client";

import { useEffect, useState, useCallback } from "react";
import axios from "axios";
import {
  Star, BarChart2, Bug, Lightbulb, MessageCircle,
  RefreshCw, Pencil, CheckCircle, Clock, XCircle, CheckCheck,
  ShieldAlert, MessageSquarePlus, AlertCircle, Loader2, ArrowLeft,
  ArrowRight, Sparkles, Plus
} from "lucide-react";
import { Button } from "@/shared-components/ui/button";
import { Badge } from "@/shared-components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/shared-components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/shared-components/ui/select";
import { Label } from "@/shared-components/ui/label";
import { FEEDBACK_FACTORS } from "@/shared-components/feedback/FeedbackModal";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001";

// ─── Types ────────────────────────────────────────────────────────────────────

interface FactorRating {
  factor: string;
  score: number;
}

interface MyFeedback {
  _id: string;
  type: "multi_factor" | "testimonial" | "bug" | "feature_request" | "general";
  content?: string;
  rating?: number;
  factorRatings?: FactorRating[];
  portal: string;
  status: "pending" | "approved" | "rejected" | "resolved";
  createdAt: string;
}

// ─── Config maps ─────────────────────────────────────────────────────────────

const STATUS_CONFIG = {
  pending:  { label: "Pending Review", icon: Clock,       color: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20" },
  approved: { label: "Approved",       icon: CheckCircle, color: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20" },
  resolved: { label: "Resolved",       icon: CheckCheck,  color: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20" },
  rejected: { label: "Rejected",       icon: ShieldAlert, color: "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20" },
};

const TYPE_CONFIG = {
  multi_factor:    { label: "Experience Rating", icon: BarChart2,     color: "text-emerald-600 dark:text-emerald-400" },
  testimonial:     { label: "Testimonial",        icon: Star,          color: "text-indigo-600 dark:text-indigo-400" },
  bug:             { label: "Bug Report",          icon: Bug,           color: "text-red-600 dark:text-red-400" },
  feature_request: { label: "Feature Request",    icon: Lightbulb,     color: "text-violet-600 dark:text-violet-400" },
  general:         { label: "General",             icon: MessageCircle, color: "text-slate-600 dark:text-slate-400" },
};

const FACTOR_META: Record<string, { label: string; emoji: string }> = {
  overall_experience:  { label: "Overall Experience",    emoji: "🌟" },
  ease_of_use:         { label: "Ease of Use",           emoji: "🎯" },
  data_accuracy:       { label: "Data & Accuracy",       emoji: "📊" },
  performance_speed:   { label: "Performance & Speed",   emoji: "⚡" },
  features_coverage:   { label: "Features & Coverage",   emoji: "🛠️" },
  support_reliability: { label: "Support & Reliability", emoji: "🛡️" },
};

// ─── Mini Components ──────────────────────────────────────────────────────────

function MiniStars({ score }: { score: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <Star key={s} className={`w-3 h-3 ${score >= s ? "text-amber-400 fill-amber-400" : "text-slate-200 dark:text-slate-700"}`} />
      ))}
    </div>
  );
}

function BigStarInput({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const [hover, setHover] = useState(0);
  const labels = ["", "Poor", "Fair", "Good", "Very Good", "Excellent"];
  return (
    <div className="flex flex-col items-center gap-2">
      <div className="flex gap-2">
        {[1, 2, 3, 4, 5].map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => onChange(s)}
            onMouseEnter={() => setHover(s)}
            onMouseLeave={() => setHover(0)}
            className="focus:outline-none transition-all hover:scale-110 active:scale-95"
          >
            <Star
              className={`w-9 h-9 transition-all duration-150 ${
                (hover || value) >= s
                  ? "text-amber-400 fill-amber-400 drop-shadow-[0_0_6px_rgba(251,191,36,0.5)]"
                  : "text-slate-200 dark:text-slate-700"
              }`}
            />
          </button>
        ))}
      </div>
      <div className="h-5">
        {(hover || value) > 0 && (
          <span className="text-sm font-semibold text-amber-500">{labels[hover || value]}</span>
        )}
      </div>
    </div>
  );
}

// ─── Edit Dialog (Experience) ─────────────────────────────────────────────────

type EditStep = { kind: "factor"; index: number } | { kind: "comment" };

function EditExperienceDialog({
  feedback,
  onClose,
  onSaved,
}: {
  feedback: MyFeedback;
  onClose: () => void;
  onSaved: (updated: MyFeedback) => void;
}) {
  const [step, setStep] = useState<EditStep>({ kind: "factor", index: 0 });
  const initScores = () => {
    const m: Record<string, number> = {};
    FEEDBACK_FACTORS.forEach((f) => {
      const existing = feedback.factorRatings?.find((r) => r.factor === f.key);
      m[f.key] = existing?.score ?? 0;
    });
    return m;
  };
  const [scores, setScores] = useState<Record<string, number>>(initScores);
  const [comment, setComment] = useState(feedback.content ?? "");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const factorIndex = step.kind === "factor" ? step.index : 0;
  const activeFactor = FEEDBACK_FACTORS[factorIndex];
  const activeScore = scores[activeFactor.key] ?? 0;

  const goNext = () => {
    if (activeScore === 0) { setError("Please select a rating."); return; }
    setError("");
    if (factorIndex < FEEDBACK_FACTORS.length - 1) setStep({ kind: "factor", index: factorIndex + 1 });
    else setStep({ kind: "comment" });
  };

  const goBack = () => {
    setError("");
    if (step.kind === "comment") setStep({ kind: "factor", index: FEEDBACK_FACTORS.length - 1 });
    else if (factorIndex > 0) setStep({ kind: "factor", index: factorIndex - 1 });
  };

  const handleSave = async () => {
    const factorRatings = FEEDBACK_FACTORS.map((f) => ({ factor: f.key, score: scores[f.key] ?? 0 }));
    if (factorRatings.some((r) => r.score === 0)) { setError("All ratings are required."); return; }
    setLoading(true);
    setError("");
    try {
      const res = await axios.put(
        `${API_URL}/api/feedback/my/${feedback._id}`,
        { type: "multi_factor", factorRatings, content: comment.trim() || undefined },
        { withCredentials: true }
      );
      onSaved(res.data.feedback);
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to save. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const progress = step.kind === "factor" ? factorIndex + 1 : FEEDBACK_FACTORS.length;

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 rounded-2xl p-0 gap-0">
        <div className="h-1 w-full bg-gradient-to-r from-indigo-500 via-violet-500 to-fuchsia-500" />
        <div className="p-6">
          {/* Progress */}
          <div className="flex items-center justify-between mb-1">
            {(step.kind === "comment" || factorIndex > 0) ? (
              <button onClick={goBack} className="flex items-center gap-1 text-xs text-slate-400 hover:text-slate-700 dark:hover:text-white transition-colors">
                <ArrowLeft className="w-3.5 h-3.5" /> Back
              </button>
            ) : <div />}
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              {step.kind === "comment" ? "Final Step" : `${factorIndex + 1} / ${FEEDBACK_FACTORS.length}`}
            </span>
          </div>
          <div className="w-full h-1 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden mb-5">
            <div className="h-full bg-gradient-to-r from-indigo-500 to-violet-500 rounded-full transition-all duration-500" style={{ width: `${(progress / FEEDBACK_FACTORS.length) * 100}%` }} />
          </div>

          {step.kind === "factor" && (
            <div key={factorIndex} className="animate-in fade-in slide-in-from-right-4 duration-300">
              <div className="text-center mb-6">
                <div className="text-4xl mb-2">{activeFactor.emoji}</div>
                <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">{activeFactor.label}</h3>
                <p className="text-sm text-slate-500 mt-1">{activeFactor.description}</p>
              </div>
              <div className="flex justify-center mb-6">
                <BigStarInput
                  value={activeScore}
                  onChange={(v) => setScores((prev) => ({ ...prev, [activeFactor.key]: v }))}
                />
              </div>
              {error && (
                <div className="flex items-center gap-2 p-3 mb-4 text-sm rounded-lg bg-red-50 text-red-600 dark:bg-red-900/10 dark:text-red-400">
                  <AlertCircle className="w-4 h-4 shrink-0" /> {error}
                </div>
              )}
              <Button onClick={goNext} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white">
                {factorIndex < FEEDBACK_FACTORS.length - 1 ? <>Next <ArrowRight className="w-4 h-4 ml-1.5" /></> : "Continue"}
              </Button>
            </div>
          )}

          {step.kind === "comment" && (
            <div className="animate-in fade-in slide-in-from-right-4 duration-300">
              <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-1">Update Comment</h3>
              <p className="text-sm text-slate-500 mb-4">Optionally update your suggestion or comment.</p>
              <div className="grid grid-cols-2 gap-2 mb-4 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700/60">
                {FEEDBACK_FACTORS.map((f) => (
                  <div key={f.key} className="flex items-center gap-2">
                    <span className="text-sm">{f.emoji}</span>
                    <MiniStars score={scores[f.key] ?? 0} />
                  </div>
                ))}
              </div>
              <div className="space-y-1.5 mb-4">
                <Label htmlFor="edit-comment">Suggestions <span className="text-xs text-slate-400 font-normal">(optional)</span></Label>
                <textarea
                  id="edit-comment"
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  rows={3}
                  className="flex w-full rounded-md border border-slate-200 dark:border-slate-700 bg-transparent px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-indigo-500 resize-none placeholder:text-slate-400 dark:placeholder:text-slate-600"
                  placeholder="Any additional thoughts..."
                />
              </div>
              {error && (
                <div className="flex items-center gap-2 p-3 mb-4 text-sm rounded-lg bg-red-50 text-red-600 dark:bg-red-900/10 dark:text-red-400">
                  <AlertCircle className="w-4 h-4 shrink-0" /> {error}
                </div>
              )}
              <Button onClick={handleSave} disabled={loading} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white">
                {loading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving…</> : "Save Changes"}
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── Edit Dialog (Report) ─────────────────────────────────────────────────────

function EditReportDialog({
  feedback,
  onClose,
  onSaved,
}: {
  feedback: MyFeedback;
  onClose: () => void;
  onSaved: (updated: MyFeedback) => void;
}) {
  const [reportType, setReportType] = useState(feedback.type);
  const [content, setContent] = useState(feedback.content ?? "");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (content.trim().length < 5) { setError("Please write at least 5 characters."); return; }
    setLoading(true);
    setError("");
    try {
      const res = await axios.put(
        `${API_URL}/api/feedback/my/${feedback._id}`,
        { type: reportType, content },
        { withCredentials: true }
      );
      onSaved(res.data.feedback);
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to save.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 rounded-2xl p-0 gap-0">
        <div className="h-1 w-full bg-gradient-to-r from-violet-500 to-fuchsia-500" />
        <div className="p-6">
          <DialogHeader className="mb-5">
            <DialogTitle className="text-lg font-bold">Edit Report</DialogTitle>
            <DialogDescription>Update your bug report or feature request.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSave} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="edit-report-type">Category</Label>
              <Select value={reportType} onValueChange={(v) => setReportType(v as any)}>
                <SelectTrigger id="edit-report-type" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="z-[9999]">
                  <SelectItem value="bug">🐛 Report a Bug</SelectItem>
                  <SelectItem value="feature_request">💡 Feature Request</SelectItem>
                  <SelectItem value="general">💬 General Feedback</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="edit-report-content">Message</Label>
              <textarea
                id="edit-report-content"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={5}
                className="flex w-full rounded-md border border-slate-200 dark:border-slate-700 bg-transparent px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-indigo-500 resize-none placeholder:text-slate-400 dark:placeholder:text-slate-600"
                placeholder="Describe in detail..."
              />
            </div>
            {error && (
              <div className="flex items-center gap-2 p-3 text-sm rounded-lg bg-red-50 text-red-600 dark:bg-red-900/10 dark:text-red-400">
                <AlertCircle className="w-4 h-4 shrink-0" /> {error}
              </div>
            )}
            <Button type="submit" disabled={loading} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white">
              {loading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving…</> : "Save Changes"}
            </Button>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── Feedback Card ────────────────────────────────────────────────────────────

function FeedbackCard({ item, onEdit }: { item: MyFeedback; onEdit: () => void }) {
  const typeCfg = TYPE_CONFIG[item.type] ?? TYPE_CONFIG.general;
  const statusCfg = STATUS_CONFIG[item.status];
  const TypeIcon = typeCfg.icon;
  const StatusIcon = statusCfg.icon;
  const canEdit = item.status === "pending";

  return (
    <div className="group relative bg-white dark:bg-slate-900/70 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all duration-200 hover:-translate-y-0.5">
      {/* Top row */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-2.5">
          <div className={`w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0`}>
            <TypeIcon className={`w-4 h-4 ${typeCfg.color}`} />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">{typeCfg.label}</p>
            <p className="text-[10px] text-slate-400 uppercase tracking-wider">
              {new Date(item.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
            </p>
          </div>
        </div>
        <Badge variant="outline" className={`text-[10px] font-bold uppercase tracking-wider gap-1.5 px-2 py-0.5 ${statusCfg.color}`}>
          <StatusIcon className="w-3 h-3 shrink-0" />
          {statusCfg.label}
        </Badge>
      </div>

      {/* Multi-factor scores */}
      {item.type === "multi_factor" && item.factorRatings && item.factorRatings.length > 0 && (
        <div className="grid grid-cols-2 gap-2 mb-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700/50">
          {item.factorRatings.map((fr) => {
            const meta = FACTOR_META[fr.factor];
            return (
              <div key={fr.factor} className="flex items-center gap-2 min-w-0">
                <span className="text-sm shrink-0">{meta?.emoji ?? "•"}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] text-slate-400 truncate">{meta?.label ?? fr.factor}</p>
                  <MiniStars score={fr.score} />
                </div>
              </div>
            );
          })}
          {item.rating != null && (
            <div className="col-span-2 flex items-center justify-end gap-1 pt-1 border-t border-slate-200 dark:border-slate-700 mt-1">
              <span className="text-xs text-slate-400">Avg:</span>
              <span className="text-sm font-bold text-amber-500">{item.rating.toFixed(1)}</span>
              <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
            </div>
          )}
        </div>
      )}

      {/* Content */}
      {item.content && (
        <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed line-clamp-3 mb-3">
          {item.content}
        </p>
      )}

      {/* Edit button (only if pending) */}
      {canEdit && (
        <button
          onClick={onEdit}
          className="flex items-center gap-1.5 text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors"
        >
          <Pencil className="w-3.5 h-3.5" />
          Edit submission
        </button>
      )}
      {!canEdit && (
        <p className="text-[10px] text-slate-400 italic">
          This submission has been reviewed and can no longer be edited.
        </p>
      )}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function UserFeedbackPage() {
  const [feedbacks, setFeedbacks] = useState<MyFeedback[]>([]);
  const [loading, setLoading] = useState(true);
  const [editTarget, setEditTarget] = useState<MyFeedback | null>(null);

  const fetchMyFeedbacks = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_URL}/api/feedback/my`, { withCredentials: true });
      setFeedbacks(res.data.feedbacks ?? []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchMyFeedbacks(); }, [fetchMyFeedbacks]);

  // Auto-reconcile when FeedbackModal fires a submission event
  useEffect(() => {
    const handleFeedbackSubmitted = () => fetchMyFeedbacks();
    window.addEventListener('feedback:submitted', handleFeedbackSubmitted);
    return () => window.removeEventListener('feedback:submitted', handleFeedbackSubmitted);
  }, [fetchMyFeedbacks]);

  const handleSaved = (updated: MyFeedback) => {
    setFeedbacks((prev) => prev.map((f) => f._id === updated._id ? updated : f));
    setEditTarget(null);
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-10 pt-28">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="w-9 h-9 rounded-xl bg-indigo-100 dark:bg-indigo-900/40 flex items-center justify-center">
              <MessageSquarePlus className="w-4.5 h-4.5 text-indigo-600 dark:text-indigo-400" />
            </div>
            <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">My Feedback</h1>
          </div>
          <p className="text-sm text-slate-500 ml-12">
            View and edit your submitted feedback. Pending submissions can still be updated.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            onClick={() => window.dispatchEvent(new CustomEvent('feedback:open'))}
            className="bg-indigo-600 hover:bg-indigo-700 text-white flex items-center gap-2 shrink-0 h-9"
          >
            <Plus className="w-4 h-4" />
            <span className="text-sm font-medium">Add Feedback</span>
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={fetchMyFeedbacks}
            className="w-9 h-9 border-slate-200 dark:border-slate-700 shrink-0"
            title="Refresh"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          </Button>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <RefreshCw className="w-6 h-6 animate-spin text-indigo-400" />
          <p className="text-sm text-slate-400">Loading your feedback…</p>
        </div>
      ) : feedbacks.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
          <div className="w-16 h-16 rounded-2xl bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center">
            <Sparkles className="w-7 h-7 text-indigo-400" />
          </div>
          <div>
            <p className="text-lg font-semibold text-slate-700 dark:text-slate-200">No feedback yet</p>
            <p className="text-sm text-slate-400 mt-1">Use the feedback button at the bottom-right to share your experience.</p>
          </div>
        </div>
      ) : (
        <div className="grid gap-4">
          {feedbacks.map((item) => (
            <FeedbackCard
              key={item._id}
              item={item}
              onEdit={() => setEditTarget(item)}
            />
          ))}
        </div>
      )}

      {/* Edit dialogs */}
      {editTarget && editTarget.type === "multi_factor" && (
        <EditExperienceDialog
          feedback={editTarget}
          onClose={() => setEditTarget(null)}
          onSaved={handleSaved}
        />
      )}
      {editTarget && editTarget.type !== "multi_factor" && (
        <EditReportDialog
          feedback={editTarget}
          onClose={() => setEditTarget(null)}
          onSaved={handleSaved}
        />
      )}
    </div>
  );
}
