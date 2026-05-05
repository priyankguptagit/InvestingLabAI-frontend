"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { sessionManager } from "@/lib/sessionManager";
import { sessionSync } from "@/lib/sessionSync";
import { saveFormState, restoreFormState } from "@/lib/statePreservation";
import axiosInstance from "@/lib/axios";
import { API_ENDPOINTS } from "@/lib/constants";

interface UseSessionTimeoutReturn {
  showWarning: boolean;
  secondsLeft: number;
  isOffline: boolean;
  isExtending: boolean;
  extendSession: () => Promise<void>;
  logout: () => Promise<void>;
}

/**
 * Checks whether ANY auth session is active.
 * The backend sends access tokens via HttpOnly cookies only — not in the
 * JSON response body — so localStorage 'accessToken' is unreliable.
 * We check for the keys that ARE set during login.
 */
function isLoggedIn(): boolean {
  if (typeof window === "undefined") return false;
  return !!(
    localStorage.getItem("praedico_auth_session_type") ||
    localStorage.getItem("user") ||
    localStorage.getItem("organization") ||
    localStorage.getItem("coordinator")
  );
}

export function useSessionTimeout(): UseSessionTimeoutReturn {
  const [showWarning, setShowWarning] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(120);
  const [isOffline, setIsOffline] = useState(false);
  const [isExtending, setIsExtending] = useState(false);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const sessionActiveRef = useRef(false);  // whether session monitoring is running
  const cleanupRef = useRef<(() => void) | null>(null);

  // Start the countdown ticker when warning is shown
  useEffect(() => {
    if (showWarning) {
      setSecondsLeft(sessionManager.getSecondsRemaining());

      countdownRef.current = setInterval(() => {
        const remaining = sessionManager.getSecondsRemaining();
        setSecondsLeft(remaining);

        if (remaining <= 0) {
          handleExpiry();
        }
      }, 1000);
    } else {
      if (countdownRef.current) {
        clearInterval(countdownRef.current);
        countdownRef.current = null;
      }
    }

    return () => {
      if (countdownRef.current) {
        clearInterval(countdownRef.current);
      }
    };
  }, [showWarning]);

  const handleExpiry = useCallback(() => {
    saveFormState();
    sessionStorage.setItem("session_expired_reason", "inactivity");
    sessionSync.broadcast({ type: "SESSION_EXPIRED" });

    sessionManager.stop();
    sessionSync.stop();
    sessionActiveRef.current = false;

    localStorage.removeItem("user");
    localStorage.removeItem("admin");
    localStorage.removeItem("coordinator");
    localStorage.removeItem("organization");
    localStorage.removeItem("praedico_auth_session_type");

    window.location.href = "/";
  }, []);

  const extendSession = useCallback(async () => {
    if (isExtending) return;
    setIsExtending(true);

    try {
      const { data } = await axiosInstance.post(API_ENDPOINTS.AUTH.EXTEND_SESSION);
      if (data.success && data.expiresAt) {
        sessionManager.updateExpiry(data.expiresAt);
        sessionManager.dismissWarning();
        setShowWarning(false);

        sessionSync.broadcast({
          type: "SESSION_EXTENDED",
          expiresAt: data.expiresAt,
        });
      }
    } catch (error) {
      console.error("[Session] Extend failed:", error);
      handleExpiry();
    } finally {
      setIsExtending(false);
    }
  }, [isExtending, handleExpiry]);

  const logout = useCallback(async () => {
    try {
      await axiosInstance.post(API_ENDPOINTS.AUTH.LOGOUT);
    } catch {
      // Even if logout API fails, we still redirect
    }

    sessionSync.broadcast({ type: "SESSION_LOGOUT" });
    sessionManager.stop();
    sessionSync.stop();
    sessionActiveRef.current = false;

    localStorage.removeItem("user");
    localStorage.removeItem("admin");
    localStorage.removeItem("coordinator");
    localStorage.removeItem("organization");
    localStorage.removeItem("praedico_auth_session_type");

    window.location.href = "/";
  }, []);

  // ── Core: Start monitoring ─────────────────────────────────────────
  const startMonitoring = useCallback(() => {
    if (sessionActiveRef.current) return; // already running
    if (!isLoggedIn()) return;

    sessionActiveRef.current = true;
    sessionManager.start();
    sessionSync.start();

    // Restore any form state saved before session expiry
    setTimeout(() => restoreFormState(), 500);

    // ── Event Listeners ────────────────────────────────────────
    const handleWarning = () => {
      setShowWarning(true);
      setSecondsLeft(sessionManager.getSecondsRemaining());
    };
    const handleExpired = () => handleExpiry();
    const handleExtended = () => setShowWarning(false);
    const handleOfflineEvent = () => setIsOffline(true);
    const handleOnlineEvent = () => setIsOffline(false);

    window.addEventListener("session:warning", handleWarning);
    window.addEventListener("session:expired", handleExpired);
    window.addEventListener("session:extended", handleExtended);
    window.addEventListener("session:offline", handleOfflineEvent);
    window.addEventListener("session:online", handleOnlineEvent);

    // ── Cross-tab sync ─────────────────────────────────────────
    const unsubSync = sessionSync.onMessage((msg) => {
      switch (msg.type) {
        case "SESSION_EXTENDED":
          sessionManager.updateExpiry(msg.expiresAt);
          sessionManager.dismissWarning();
          setShowWarning(false);
          break;
        case "SESSION_EXPIRED":
        case "SESSION_LOGOUT":
          sessionManager.stop();
          saveFormState();
          sessionStorage.setItem("session_expired_reason", "inactivity");
          localStorage.removeItem("user");
          localStorage.removeItem("praedico_auth_session_type");
          window.location.href = "/";
          break;
      }
    });

    // ── Fetch initial session status ──────────────────────────
    axiosInstance
      .get(API_ENDPOINTS.AUTH.SESSION_STATUS, {
        headers: { "X-Polling": "true" },
      })
      .then(({ data }) => {
        if (data.success && data.expiresAt) {
          sessionManager.updateExpiry(data.expiresAt);
        }
      })
      .catch(() => {
        // No valid session — the getMe call will create one and the
        // axios interceptor will pick up X-Session-Expires-At from it.
      });

    // Save cleanup for when we need to tear down
    cleanupRef.current = () => {
      window.removeEventListener("session:warning", handleWarning);
      window.removeEventListener("session:expired", handleExpired);
      window.removeEventListener("session:extended", handleExtended);
      window.removeEventListener("session:offline", handleOfflineEvent);
      window.removeEventListener("session:online", handleOnlineEvent);
      unsubSync();
      sessionManager.stop();
      sessionSync.stop();
      sessionActiveRef.current = false;
    };
  }, [handleExpiry]);

  // ── Initialize on mount + listen for login ────────────────────────
  useEffect(() => {
    if (typeof window === "undefined") return;

    // Try to start immediately (user might already be logged in)
    startMonitoring();

    // Listen for the login_success event to start monitoring after login.
    // In Next.js, GlobalAuthListener stays mounted across client-side
    // navigation, so we need this event to re-initialize after login.
    const handleLoginSuccess = () => {
      // Small delay to let localStorage be populated by the login API
      setTimeout(() => startMonitoring(), 300);
    };

    window.addEventListener("login_success", handleLoginSuccess);
    // Also listen for page navigation - router.push in Next.js
    // triggers popstate-like behavior
    window.addEventListener("session:start", handleLoginSuccess);

    return () => {
      window.removeEventListener("login_success", handleLoginSuccess);
      window.removeEventListener("session:start", handleLoginSuccess);
      cleanupRef.current?.();
    };
  }, [startMonitoring]);

  return {
    showWarning,
    secondsLeft,
    isOffline,
    isExtending,
    extendSession,
    logout,
  };
}
