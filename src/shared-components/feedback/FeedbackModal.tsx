"use client";

import React, { useState, useCallback, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import {
  MessageSquarePlus, Star, Loader2, CheckCircle, AlertCircle,
  ArrowLeft, ArrowRight, Bug, Sparkles, ChevronRight,
} from 'lucide-react';
import axios from 'axios';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/shared-components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared-components/ui/select';
import { Button } from '@/shared-components/ui/button';
import { Label } from '@/shared-components/ui/label';

// ─── Constants ───────────────────────────────────────────────────────────────

interface FeedbackModalProps {
  portal: 'user' | 'organization' | 'admin' | 'public';
}

import { BACKEND_URL } from '@/lib/constants';

const HIDDEN_PATHS = ['/user/dashboard/trading'];

export const FEEDBACK_FACTORS = [
  {
    key: 'overall_experience',
    label: 'Overall Experience',
    emoji: '🌟',
    description: 'How satisfied are you with Praedico overall?',
  },
  {
    key: 'ease_of_use',
    label: 'Ease of Use',
    emoji: '🎯',
    description: 'Is the interface intuitive and easy to navigate?',
  },
  {
    key: 'data_accuracy',
    label: 'Data & Accuracy',
    emoji: '📊',
    description: 'Do you trust the market data and analytical outputs?',
  },
  {
    key: 'performance_speed',
    label: 'Performance & Speed',
    emoji: '⚡',
    description: 'How fast and responsive does the platform feel?',
  },
  {
    key: 'features_coverage',
    label: 'Features & Coverage',
    emoji: '🛠️',
    description: 'Does Praedico cover all the features you need?',
  },
  {
    key: 'support_reliability',
    label: 'Support & Reliability',
    emoji: '🛡️',
    description: 'How reliable and dependable is the platform overall?',
  },
] as const;

type FactorKey = (typeof FEEDBACK_FACTORS)[number]['key'];

// ─── Step machine ─────────────────────────────────────────────────────────
// 'mode'    → entry screen: choose experience-rating OR report
// 'factor'  → wizard step N (0-5)
// 'comment' → optional suggestion box + submit (experience path)
// 'report'  → bug / feature_request / general form
// 'success' → done
type StepKind = 'mode' | 'factor' | 'comment' | 'report' | 'success';

interface StepState {
  kind: StepKind;
  factorIndex?: number; // only used when kind === 'factor'
}

// ─── Sub-components ──────────────────────────────────────────────────────────

/** Interactive star input */
function StarInput({
  value,
  onChange,
}: {
  value: number;
  onChange: (v: number) => void;
}) {
  const [hover, setHover] = useState(0);
  const ratingLabels = ['', 'Poor', 'Fair', 'Good', 'Very Good', 'Excellent'];

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="flex items-center gap-2">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => onChange(star)}
            onMouseEnter={() => setHover(star)}
            onMouseLeave={() => setHover(0)}
            className="focus:outline-none transition-all duration-150 hover:scale-110 active:scale-95"
          >
            <Star
              className={`w-10 h-10 transition-all duration-150 ${
                (hover || value) >= star
                  ? 'text-amber-400 fill-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.5)]'
                  : 'text-slate-200 dark:text-slate-700'
              }`}
            />
          </button>
        ))}
      </div>
      <div className="h-5">
        {(hover || value) > 0 && (
          <span className="text-sm font-semibold text-amber-500 dark:text-amber-400 animate-in fade-in duration-150">
            {ratingLabels[hover || value]}
          </span>
        )}
      </div>
    </div>
  );
}

/** Read-only mini star row */
function MiniStars({ score, total = 5 }: { score: number; total?: number }) {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: total }, (_, i) => i + 1).map((s) => (
        <Star
          key={s}
          className={`w-3 h-3 ${
            score >= s ? 'text-amber-400 fill-amber-400' : 'text-slate-300 dark:text-slate-700'
          }`}
        />
      ))}
    </div>
  );
}

/** Animated horizontal progress bar */
function ProgressBar({ current, total }: { current: number; total: number }) {
  const pct = Math.round((current / total) * 100);
  return (
    <div className="w-full h-1 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden mb-5">
      <div
        className="h-full bg-gradient-to-r from-indigo-500 to-violet-500 rounded-full transition-all duration-500 ease-out"
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

/** Inline error banner */
function ErrorBanner({ message }: { message: string }) {
  return (
    <div className="flex items-start gap-2 p-3 mb-4 text-sm rounded-lg bg-red-50 text-red-600 dark:bg-red-900/10 dark:text-red-400 animate-in fade-in duration-200">
      <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
      <p>{message}</p>
    </div>
  );
}

// ─── Main component ──────────────────────────────────────────────────────────

export default function FeedbackModal({ portal }: FeedbackModalProps) {
  const pathname = usePathname();

  // Dialog
  const [isOpen, setIsOpen] = useState(false);

  // Step machine
  const [step, setStep] = useState<StepState>({ kind: 'mode' });

  // Experience (multi-factor) state
  const [factorScores, setFactorScores] = useState<Record<FactorKey | string, number>>({});
  const [comment, setComment] = useState('');

  // Report state
  const [reportType, setReportType] = useState('bug');
  const [reportContent, setReportContent] = useState('');

  // Shared async state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // One-time experience rating guard
  const [hasExperienceRating, setHasExperienceRating] = useState(false);
  const [checkingRating, setCheckingRating] = useState(false);

  // ── Experience wizard helpers ── (must be above any conditional return)

  const factorIndex = step.kind === 'factor' ? (step.factorIndex ?? 0) : 0;
  const activeFactor = FEEDBACK_FACTORS[factorIndex];
  const activeScore = factorScores[activeFactor?.key ?? ''] ?? 0;

  const setScore = useCallback(
    (score: number) => {
      if (activeFactor) {
        setFactorScores((prev) => ({ ...prev, [activeFactor.key]: score }));
      }
    },
    [activeFactor]
  );

  // ── Reset ──
  const resetState = () => {
    setStep({ kind: 'mode' });
    setFactorScores({});
    setComment('');
    setReportType('bug');
    setReportContent('');
    setLoading(false);
    setError('');
  };

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (!open) {
      setTimeout(resetState, 300);
    } else {
      resetState();
      // Check if user already has an experience rating
      setCheckingRating(true);
      axios
        .get(`${BACKEND_URL}/api/feedback/my`, { withCredentials: true })
        .then((res) => {
          const feedbacks: Array<{ type: string }> = res.data.feedbacks ?? [];
          setHasExperienceRating(feedbacks.some((f) => f.type === 'multi_factor'));
        })
        .catch(() => {
          // silently ignore — don't block the modal
        })
        .finally(() => setCheckingRating(false));
    }
  };

  // Listen for programmatic open requests
  useEffect(() => {
    const handleOpenRequest = () => setIsOpen(true);
    window.addEventListener('feedback:open', handleOpenRequest);
    return () => window.removeEventListener('feedback:open', handleOpenRequest);
  }, []);

  // ── Guards ── (after all hooks)
  if (pathname && HIDDEN_PATHS.some((p) => pathname.startsWith(p))) {
    return null;
  }

  const goNextFactor = () => {
    if (activeScore === 0) {
      setError('Please select a rating to continue.');
      return;
    }
    setError('');
    if (factorIndex < FEEDBACK_FACTORS.length - 1) {
      setStep({ kind: 'factor', factorIndex: factorIndex + 1 });
    } else {
      setStep({ kind: 'comment' });
    }
  };

  const goBackFactor = () => {
    setError('');
    if (factorIndex === 0) {
      setStep({ kind: 'mode' });
    } else {
      setStep({ kind: 'factor', factorIndex: factorIndex - 1 });
    }
  };

  // ── Submit experience ──

  const handleSubmitExperience = async () => {
    const factorRatings = FEEDBACK_FACTORS.map((f) => ({
      factor: f.key,
      score: factorScores[f.key] ?? 0,
    }));

    if (factorRatings.some((r) => r.score === 0)) {
      setError('All ratings are required.');
      return;
    }

    setLoading(true);
    setError('');
    try {
      await axios.post(
        `${BACKEND_URL}/api/feedback/submit`,
        {
          type: 'multi_factor',
          portal,
          factorRatings,
          content: comment.trim() || undefined,
        },
        { withCredentials: true }
      );
      window.dispatchEvent(new CustomEvent('feedback:submitted'));
      setStep({ kind: 'success' });
      setTimeout(() => handleOpenChange(false), 2500);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to submit. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // ── Submit report ──

  const handleSubmitReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (reportContent.trim().length < 5) {
      setError('Please write at least 5 characters.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await axios.post(
        `${BACKEND_URL}/api/feedback/submit`,
        { type: reportType, content: reportContent, portal },
        { withCredentials: true }
      );
      window.dispatchEvent(new CustomEvent('feedback:submitted'));
      setStep({ kind: 'success' });
      setTimeout(() => handleOpenChange(false), 2500);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to submit. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // ── Render ───────────────────────────────────────────────────────────────

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      {/* ── Floating action button ── */}
      <button
        id="feedback-fab"
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-[49] w-12 h-12 rounded-full shadow-[0_8px_32px_rgba(99,102,241,0.45)] bg-indigo-600 hover:bg-indigo-700 text-white transition-all duration-200 hover:scale-110 active:scale-95 flex items-center justify-center"
        title="Send Feedback"
        aria-label="Open feedback modal"
      >
        <MessageSquarePlus className="w-5 h-5" />
      </button>

      {/* ── Modal ── */}
      <DialogContent
        className="sm:max-w-md bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-2xl p-0 rounded-2xl overflow-hidden gap-0"
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        {/* Gradient accent bar */}
        <div className="h-1 w-full bg-gradient-to-r from-indigo-500 via-violet-500 to-fuchsia-500 shrink-0" />

        {/* Content pane */}
        <div className="p-6">

          {/* ════ SUCCESS ════ */}
          {step.kind === 'success' && (
            <div className="flex flex-col items-center justify-center gap-4 py-10 text-center animate-in fade-in zoom-in duration-300">
              <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                <CheckCircle className="w-8 h-8 text-emerald-500" />
              </div>
              <div>
                <p className="font-bold text-xl text-slate-800 dark:text-slate-100">Thank You!</p>
                <p className="text-sm text-slate-500 mt-1.5">
                  Your feedback has been submitted successfully.
                </p>
              </div>
            </div>
          )}

          {/* ════ MODE SELECT ════ */}
          {step.kind === 'mode' && (
            <div className="animate-in fade-in slide-in-from-bottom-3 duration-300">
              <DialogHeader className="mb-6">
                <DialogTitle className="text-xl font-bold text-slate-800 dark:text-slate-100">
                  Share Your Feedback
                </DialogTitle>
                <DialogDescription>
                  Help us improve Praedico — every rating counts!
                </DialogDescription>
              </DialogHeader>

              <div className="flex flex-col gap-3">
                {/* Rate experience path — one-time only */}
                {hasExperienceRating ? (
                  // Already rated — show locked state
                  <div className="flex items-center gap-4 p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/60 dark:bg-slate-800/30 opacity-70 cursor-not-allowed">
                    <div className="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-900/40 flex items-center justify-center shrink-0">
                      <Sparkles className="w-5 h-5 text-indigo-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-slate-500 dark:text-slate-400">Rate Your Experience</p>
                      <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-0.5 font-medium">
                        ✓ Already submitted — edit from <span className="underline underline-offset-2">My Feedback</span>
                      </p>
                    </div>
                    <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />
                  </div>
                ) : (
                  <button
                    id="feedback-mode-experience"
                    onClick={() => { setError(''); setStep({ kind: 'factor', factorIndex: 0 }); }}
                    disabled={checkingRating}
                    className="group flex items-center gap-4 p-4 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-indigo-400 dark:hover:border-indigo-500 hover:bg-indigo-50/60 dark:hover:bg-indigo-900/10 transition-all duration-200 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 disabled:opacity-60 disabled:cursor-wait"
                  >
                    <div className="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-900/40 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform duration-200">
                      <Sparkles className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-slate-800 dark:text-slate-100">Rate Your Experience</p>
                      <p className="text-xs text-slate-500 mt-0.5">Rate 6 key areas of the platform</p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-indigo-500 transition-colors shrink-0" />
                  </button>
                )}

                {/* Report / request path — unlimited */}
                <button
                  id="feedback-mode-report"
                  onClick={() => { setError(''); setStep({ kind: 'report' }); }}
                  className="group flex items-center gap-4 p-4 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-violet-400 dark:hover:border-violet-500 hover:bg-violet-50/60 dark:hover:bg-violet-900/10 transition-all duration-200 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2"
                >
                  <div className="w-10 h-10 rounded-xl bg-violet-100 dark:bg-violet-900/40 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform duration-200">
                    <Bug className="w-5 h-5 text-violet-600 dark:text-violet-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-slate-800 dark:text-slate-100">Report an Issue</p>
                    <p className="text-xs text-slate-500 mt-0.5">Report a bug or request a new feature</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-violet-500 transition-colors shrink-0" />
                </button>
              </div>
            </div>
          )}

          {/* ════ FACTOR WIZARD STEP ════ */}
          {step.kind === 'factor' && activeFactor && (
            <div
              key={`factor-${factorIndex}`}
              className="animate-in fade-in slide-in-from-right-4 duration-300"
            >
              {/* Top row: back + step counter */}
              <div className="flex items-center justify-between mb-1">
                <button
                  onClick={goBackFactor}
                  className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors focus:outline-none"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  Back
                </button>
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  {factorIndex + 1} / {FEEDBACK_FACTORS.length}
                </span>
              </div>

              {/* Progress bar */}
              <ProgressBar current={factorIndex + 1} total={FEEDBACK_FACTORS.length} />

              {/* Factor content */}
              <div className="text-center mb-8">
                <div className="text-5xl mb-3 leading-none">{activeFactor.emoji}</div>
                <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">
                  {activeFactor.label}
                </h2>
                <p className="text-sm text-slate-500 mt-1.5 max-w-xs mx-auto leading-relaxed">
                  {activeFactor.description}
                </p>
              </div>

              {/* Star input */}
              <div className="flex justify-center mb-6">
                <StarInput value={activeScore} onChange={setScore} />
              </div>

              {/* Error */}
              {error && <ErrorBanner message={error} />}

              {/* Next / Continue */}
              <Button
                id={`feedback-factor-next-${factorIndex}`}
                onClick={goNextFactor}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold"
              >
                {factorIndex < FEEDBACK_FACTORS.length - 1 ? (
                  <>
                    Next
                    <ArrowRight className="w-4 h-4 ml-1.5" />
                  </>
                ) : (
                  'Continue'
                )}
              </Button>
            </div>
          )}

          {/* ════ COMMENT / SUBMIT STEP ════ */}
          {step.kind === 'comment' && (
            <div className="animate-in fade-in slide-in-from-right-4 duration-300">
              {/* Top row */}
              <div className="flex items-center justify-between mb-1">
                <button
                  onClick={() => { setError(''); setStep({ kind: 'factor', factorIndex: FEEDBACK_FACTORS.length - 1 }); }}
                  className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors focus:outline-none"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  Back
                </button>
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Final Step
                </span>
              </div>

              {/* Progress — full */}
              <ProgressBar current={FEEDBACK_FACTORS.length} total={FEEDBACK_FACTORS.length} />

              {/* Ratings summary */}
              <div className="mb-5 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700/60">
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-3">
                  Your Ratings
                </p>
                <div className="grid grid-cols-2 gap-2.5">
                  {FEEDBACK_FACTORS.map((f) => (
                    <div key={f.key} className="flex items-center gap-2 min-w-0">
                      <span className="text-sm leading-none shrink-0">{f.emoji}</span>
                      <span className="text-xs text-slate-500 dark:text-slate-400 truncate">
                        {f.label}
                      </span>
                      <MiniStars score={factorScores[f.key] ?? 0} />
                    </div>
                  ))}
                </div>
              </div>

              {/* Comment box */}
              <div className="space-y-1.5 mb-4">
                <Label htmlFor="feedback-comment" className="flex items-center gap-2 text-sm">
                  Any suggestions or comments?
                  <span className="text-xs text-slate-400 font-normal">(optional)</span>
                </Label>
                <textarea
                  id="feedback-comment"
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Share any additional thoughts, ideas, or suggestions..."
                  rows={3}
                  className="flex w-full rounded-md border border-slate-200 dark:border-slate-700 bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-slate-400 dark:placeholder:text-slate-600 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-indigo-500 dark:focus-visible:ring-indigo-400 resize-none transition-shadow"
                />
              </div>

              {/* Error */}
              {error && <ErrorBanner message={error} />}

              {/* Submit */}
              <Button
                id="feedback-submit-experience"
                onClick={handleSubmitExperience}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Submitting…
                  </>
                ) : (
                  'Submit Feedback'
                )}
              </Button>
            </div>
          )}

          {/* ════ REPORT FORM ════ */}
          {step.kind === 'report' && (
            <div className="animate-in fade-in slide-in-from-right-4 duration-300">
              {/* Top row */}
              <div className="flex items-center gap-3 mb-5">
                <button
                  onClick={() => { setError(''); setStep({ kind: 'mode' }); }}
                  className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors focus:outline-none"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  Back
                </button>
              </div>

              <DialogHeader className="mb-5">
                <DialogTitle className="text-lg font-bold text-slate-800 dark:text-slate-100">
                  Report an Issue
                </DialogTitle>
                <DialogDescription>
                  Tell us what's wrong or what you'd like to see.
                </DialogDescription>
              </DialogHeader>

              <form onSubmit={handleSubmitReport} className="space-y-4">
                {/* Type selector */}
                <div className="space-y-1.5">
                  <Label htmlFor="report-type">Category</Label>
                  <Select value={reportType} onValueChange={setReportType}>
                    <SelectTrigger id="report-type" className="w-full">
                      <SelectValue placeholder="Select a category" />
                    </SelectTrigger>
                    <SelectContent className="z-[9999]">
                      <SelectItem value="bug">🐛 Report a Bug</SelectItem>
                      <SelectItem value="feature_request">💡 Feature Request</SelectItem>
                      <SelectItem value="general">💬 General Feedback</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Message */}
                <div className="space-y-1.5">
                  <Label htmlFor="report-content">Message</Label>
                  <textarea
                    id="report-content"
                    value={reportContent}
                    onChange={(e) => setReportContent(e.target.value)}
                    placeholder="Describe the issue or your suggestion in detail..."
                    rows={5}
                    className="flex w-full rounded-md border border-slate-200 dark:border-slate-700 bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-slate-400 dark:placeholder:text-slate-600 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-indigo-500 dark:focus-visible:ring-indigo-400 resize-none transition-shadow"
                  />
                </div>

                {/* Error */}
                {error && <ErrorBanner message={error} />}

                {/* Submit */}
                <Button
                  id="feedback-submit-report"
                  type="submit"
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Submitting…
                    </>
                  ) : (
                    'Submit Report'
                  )}
                </Button>
              </form>
            </div>
          )}

        </div>
      </DialogContent>
    </Dialog>
  );
}
