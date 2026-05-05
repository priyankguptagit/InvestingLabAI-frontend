"use client";

import React, { useEffect, useRef } from "react";

interface AdminSessionWarningModalProps {
  isOpen: boolean;
  secondsLeft: number;
  isOffline: boolean;
  isExtending: boolean;
  onExtend: () => void;
  onLogout: () => void;
}

const INITIAL_SECONDS = 120; // warning window — matches sessionManager warningBeforeMs / 1000

export default function AdminSessionWarningModal({
  isOpen,
  secondsLeft,
  isOffline,
  isExtending,
  onExtend,
  onLogout,
}: AdminSessionWarningModalProps) {
  const stayButtonRef = useRef<HTMLButtonElement>(null);
  const maxSeconds = useRef(INITIAL_SECONDS);

  // Capture initial seconds on first open for the ring calculation
  useEffect(() => {
    if (isOpen) {
      maxSeconds.current = secondsLeft > 0 ? secondsLeft : INITIAL_SECONDS;
      setTimeout(() => stayButtonRef.current?.focus(), 120);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const minutes = Math.floor(secondsLeft / 60);
  const secs = secondsLeft % 60;
  const timeDisplay = `${String(minutes).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  const isUrgent = secondsLeft <= 30;
  const isCritical = secondsLeft <= 10;

  // SVG circular progress ring
  const RADIUS = 54;
  const CIRCUMFERENCE = 2 * Math.PI * RADIUS;
  const progress = Math.max(0, secondsLeft / Math.max(maxSeconds.current, 1));
  const strokeDashoffset = CIRCUMFERENCE * (1 - progress);

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-[9998] bg-black/70 backdrop-blur-md"
        aria-hidden="true"
      />

      {/* Modal */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="admin-session-title"
        className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
      >
        <div
          className={`
            relative w-full max-w-md rounded-3xl
            bg-[#0F172A] border shadow-2xl shadow-black/60
            transition-all duration-300
            ${isUrgent ? "border-rose-500/40" : "border-indigo-500/20"}
            ${isCritical ? "animate-pulse" : ""}
          `}
        >
          {/* Top accent bar */}
          <div
            className={`absolute top-0 left-0 w-full h-1 rounded-t-3xl transition-colors duration-500 ${
              isCritical
                ? "bg-rose-500"
                : isUrgent
                ? "bg-amber-500"
                : "bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-500"
            }`}
          />

          <div className="px-8 pt-10 pb-8">
            {/* Header */}
            <div className="flex flex-col items-center text-center mb-6">
              {/* Circular countdown ring */}
              <div className="relative mb-5">
                <svg width="128" height="128" className="-rotate-90">
                  {/* Track */}
                  <circle
                    cx="64" cy="64" r={RADIUS}
                    fill="none"
                    stroke="rgba(255,255,255,0.06)"
                    strokeWidth="8"
                  />
                  {/* Progress */}
                  <circle
                    cx="64" cy="64" r={RADIUS}
                    fill="none"
                    stroke={isCritical ? "#ef4444" : isUrgent ? "#f59e0b" : "#6366f1"}
                    strokeWidth="8"
                    strokeLinecap="round"
                    strokeDasharray={CIRCUMFERENCE}
                    strokeDashoffset={strokeDashoffset}
                    style={{ transition: "stroke-dashoffset 1s linear, stroke 0.5s" }}
                  />
                </svg>
                {/* Center content */}
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  {/* Shield icon */}
                  <svg
                    className={`h-6 w-6 mb-1 transition-colors ${isCritical ? "text-rose-400" : isUrgent ? "text-amber-400" : "text-indigo-400"}`}
                    fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round"
                      d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z" />
                  </svg>
                  <span
                    role="timer"
                    aria-live="polite"
                    aria-label={`${minutes} minutes ${secs} seconds remaining`}
                    className={`font-mono font-bold tabular-nums text-xl tracking-wider transition-colors ${
                      isCritical ? "text-rose-400" : isUrgent ? "text-amber-400" : "text-white"
                    }`}
                  >
                    {timeDisplay}
                  </span>
                </div>
              </div>

              <h2
                id="admin-session-title"
                className="text-xl font-bold text-white mb-2 tracking-tight"
              >
                Admin Session Expiring
              </h2>
              <p className="text-sm text-slate-400 leading-relaxed max-w-xs">
                Your privileged session will end due to inactivity. Stay logged in to continue
                managing the platform.
              </p>
            </div>

            {/* Offline notice */}
            {isOffline && (
              <div className="mb-4 flex items-start gap-3 rounded-xl bg-amber-500/10 border border-amber-500/20 px-4 py-3">
                <svg className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 5.636a9 9 0 010 12.728M5.636 18.364a9 9 0 010-12.728M12 9v4m0 4h.01" />
                </svg>
                <span className="text-xs text-amber-300">
                  You appear to be offline. Countdown paused until reconnected.
                </span>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3 mt-2">
              <button
                onClick={onLogout}
                className="flex-1 py-3 rounded-2xl bg-white/5 border border-white/10 text-slate-300 text-sm font-semibold hover:bg-rose-500/10 hover:border-rose-500/30 hover:text-rose-300 transition-all"
              >
                Log Out Now
              </button>
              <button
                ref={stayButtonRef}
                onClick={onExtend}
                disabled={isExtending || isOffline}
                className={`flex-1 py-3 rounded-2xl text-sm font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 ${
                  isUrgent
                    ? "bg-amber-500 hover:bg-amber-400 text-black"
                    : "bg-indigo-600 hover:bg-indigo-500 text-white"
                }`}
              >
                {isExtending ? (
                  <>
                    <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Extending…
                  </>
                ) : (
                  "Stay Logged In"
                )}
              </button>
            </div>

            {/* Security footnote */}
            <p className="mt-5 text-center text-[11px] text-slate-600 tracking-wide">
              Protected by enterprise-grade session security · 15 min idle · 4 hr max
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
