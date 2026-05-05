"use client";

import React, { useEffect, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/shared-components/ui/dialog";
import { Button } from "@/shared-components/ui/button";

interface SessionWarningModalProps {
  isOpen: boolean;
  secondsLeft: number;
  isOffline: boolean;
  isExtending: boolean;
  onExtend: () => void;
  onLogout: () => void;
}

export default function SessionWarningModal({
  isOpen,
  secondsLeft,
  isOffline,
  isExtending,
  onExtend,
  onLogout,
}: SessionWarningModalProps) {
  const extendButtonRef = useRef<HTMLButtonElement>(null);

  // Focus the extend button when modal opens (accessibility)
  useEffect(() => {
    if (isOpen && extendButtonRef.current) {
      // Small delay to let the dialog animation complete
      const timer = setTimeout(() => {
        extendButtonRef.current?.focus();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  const minutes = Math.floor(secondsLeft / 60);
  const seconds = secondsLeft % 60;
  const timeDisplay = `${minutes}:${seconds.toString().padStart(2, "0")}`;

  // Color coding based on urgency
  const isUrgent = secondsLeft <= 30;

  return (
    <Dialog open={isOpen}>
      <DialogContent
        showCloseButton={false}
        className="sm:max-w-md border-amber-500/30 bg-background/95 backdrop-blur-xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby="session-warning-title"
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <DialogHeader className="items-center text-center">
          {/* Animated warning icon */}
          <div className="mx-auto mb-2 flex h-16 w-16 items-center justify-center rounded-full bg-amber-500/10 ring-2 ring-amber-500/20">
            <svg
              className="h-8 w-8 text-amber-500 animate-pulse"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4.5c-.77-.833-2.694-.833-3.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z"
              />
            </svg>
          </div>

          <DialogTitle id="session-warning-title" className="text-xl">
            Session Expiring Soon
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Your session will expire due to inactivity. Would you like to stay
            logged in?
          </DialogDescription>
        </DialogHeader>

        {/* Countdown display */}
        <div className="flex flex-col items-center gap-3 py-4">
          <div
            className={`
              text-5xl font-mono font-bold tracking-wider tabular-nums
              transition-colors duration-300
              ${isUrgent ? "text-red-500 animate-pulse" : "text-amber-500"}
            `}
            role="timer"
            aria-live="polite"
            aria-label={`${minutes} minutes and ${seconds} seconds remaining`}
          >
            {timeDisplay}
          </div>

          {/* Progress bar — scale based on 120s or actual initial value */}
          <div className="w-full h-1.5 rounded-full bg-muted overflow-hidden">
            <div
              className={`
                h-full rounded-full transition-all duration-1000 ease-linear
                ${isUrgent ? "bg-red-500" : "bg-amber-500"}
              `}
              style={{ width: `${Math.min(100, (secondsLeft / Math.max(secondsLeft, 1)) * 100)}%` }}
              ref={(el) => {
                // On first render, set 100%; subsequent renders use the actual ratio
                if (el && !el.dataset.initialized) {
                  el.dataset.initialized = "true";
                  el.dataset.maxSeconds = String(secondsLeft || 120);
                }
                if (el && el.dataset.maxSeconds) {
                  const max = parseInt(el.dataset.maxSeconds, 10);
                  el.style.width = `${Math.min(100, (secondsLeft / max) * 100)}%`;
                }
              }}
            />
          </div>

          {/* Offline notice */}
          {isOffline && (
            <div className="flex items-center gap-2 rounded-md bg-orange-500/10 px-3 py-2 text-sm text-orange-400 border border-orange-500/20">
              <svg
                className="h-4 w-4 shrink-0"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M18.364 5.636a9 9 0 010 12.728M5.636 18.364a9 9 0 010-12.728M12 9v4m0 4h.01"
                />
              </svg>
              <span>
                You appear to be offline. Countdown paused until connection is
                restored.
              </span>
            </div>
          )}
        </div>

        <DialogFooter className="flex-row gap-3 sm:justify-center">
          <Button
            variant="outline"
            onClick={onLogout}
            className="flex-1 border-muted-foreground/20 hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30"
            id="session-logout-btn"
          >
            Log out now
          </Button>
          <Button
            ref={extendButtonRef}
            onClick={onExtend}
            disabled={isExtending || isOffline}
            className="flex-1 bg-amber-500 text-white hover:bg-amber-600 disabled:opacity-50"
            id="session-extend-btn"
          >
            {isExtending ? (
              <span className="flex items-center gap-2">
                <svg
                  className="h-4 w-4 animate-spin"
                  viewBox="0 0 24 24"
                  fill="none"
                  aria-hidden="true"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                Extending...
              </span>
            ) : (
              "Extend session"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
