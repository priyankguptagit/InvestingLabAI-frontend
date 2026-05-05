"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { sessionManager } from "@/lib/sessionManager";
import { sessionSync } from "@/lib/sessionSync";
import { idleDetector } from "@/lib/idleDetector";
import { companyApi } from "@/lib/api";

// ── Admin session singleton ───────────────────────────────────────────────────
// We reuse the existing SessionManager class but create a named alias so it is
// completely isolated from the User portal's sessionManager singleton.
import SessionManager from "@/lib/sessionManager";

const adminSessionManager = new SessionManager({ warningBeforeMs: 2 * 60 * 1000 });

// ── Admin BroadcastChannel ────────────────────────────────────────────────────
// Separate channel so admin tabs don't interfere with user-portal tabs.
let adminChannel: BroadcastChannel | null = null;
function getAdminChannel(): BroadcastChannel | null {
  if (typeof window === "undefined") return null;
  if (!adminChannel) {
    try { adminChannel = new BroadcastChannel("praedico-admin-session"); } catch { /* unsupported */ }
  }
  return adminChannel;
}

function broadcastAdmin(msg: object) {
  getAdminChannel()?.postMessage(msg);
}

// ── Helper ─────────────────────────────────────────────────────────────────
function isAdminLoggedIn(): boolean {
  if (typeof window === "undefined") return false;
  return !!localStorage.getItem("praedico_company_member");
}

// ── Heartbeat ─────────────────────────────────────────────────────────────────
// When user is active, silently call extend-session every ~10 minutes.
const HEARTBEAT_INTERVAL_MS = 10 * 60 * 1000;

// ── Hook ───────────────────────────────────────────────────────────────────────
export interface UseAdminSessionTimeoutReturn {
  showWarning: boolean;
  secondsLeft: number;
  isOffline: boolean;
  isExtending: boolean;
  extendSession: () => Promise<void>;
  logout: () => Promise<void>;
}

export function useAdminSessionTimeout(): UseAdminSessionTimeoutReturn {
  const [showWarning, setShowWarning] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(120);
  const [isOffline, setIsOffline] = useState(false);
  const [isExtending, setIsExtending] = useState(false);

  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const heartbeatRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const sessionActiveRef = useRef(false);
  const cleanupRef = useRef<(() => void) | null>(null);

  // ── Expiry handler ──────────────────────────────────────────────────────
  const handleExpiry = useCallback((reason = "inactivity") => {
    adminSessionManager.stop();
    idleDetector.stop();
    if (heartbeatRef.current) clearInterval(heartbeatRef.current);
    sessionActiveRef.current = false;

    broadcastAdmin({ type: "ADMIN_SESSION_EXPIRED" });

    localStorage.removeItem("praedico_company_member");
    sessionStorage.setItem("admin_session_expired_reason", reason);
    window.location.href = "/admin/staff-access-portal?reason=" + reason;
  }, []);

  // ── Extend session ──────────────────────────────────────────────────────
  const extendSession = useCallback(async () => {
    if (isExtending) return;
    setIsExtending(true);
    try {
      const data = await companyApi.extendSession();
      if (data.success && data.expiresAt) {
        adminSessionManager.updateExpiry(data.expiresAt);
        adminSessionManager.dismissWarning();
        setShowWarning(false);
        broadcastAdmin({ type: "ADMIN_SESSION_EXTENDED", expiresAt: data.expiresAt });
      }
    } catch {
      handleExpiry("inactivity");
    } finally {
      setIsExtending(false);
    }
  }, [isExtending, handleExpiry]);

  // ── Manual logout ───────────────────────────────────────────────────────
  const logout = useCallback(async () => {
    try { await companyApi.logout(); } catch { /* proceed anyway */ }
    adminSessionManager.stop();
    idleDetector.stop();
    if (heartbeatRef.current) clearInterval(heartbeatRef.current);
    sessionActiveRef.current = false;
    broadcastAdmin({ type: "ADMIN_SESSION_LOGOUT" });
    localStorage.removeItem("praedico_company_member");
    window.location.href = "/admin/staff-access-portal";
  }, []);

  // ── Countdown ticker ───────────────────────────────────────────────────
  useEffect(() => {
    if (showWarning) {
      setSecondsLeft(adminSessionManager.getSecondsRemaining());
      countdownRef.current = setInterval(() => {
        const rem = adminSessionManager.getSecondsRemaining();
        setSecondsLeft(rem);
        if (rem <= 0) handleExpiry("inactivity");
      }, 1000);
    } else {
      if (countdownRef.current) clearInterval(countdownRef.current);
    }
    return () => { if (countdownRef.current) clearInterval(countdownRef.current); };
  }, [showWarning, handleExpiry]);

  // ── Core monitor ────────────────────────────────────────────────────────
  const startMonitoring = useCallback(() => {
    if (sessionActiveRef.current || !isAdminLoggedIn()) return;
    sessionActiveRef.current = true;
    adminSessionManager.start();
    idleDetector.start();

    // ── Event listeners ──
    const onWarning = () => { setShowWarning(true); setSecondsLeft(adminSessionManager.getSecondsRemaining()); };
    const onExpired = () => handleExpiry("inactivity");
    const onExtended = () => setShowWarning(false);
    const onOffline = () => setIsOffline(true);
    const onOnline = () => setIsOffline(false);

    window.addEventListener("session:warning", onWarning);
    window.addEventListener("session:expired", onExpired);
    window.addEventListener("session:extended", onExtended);
    window.addEventListener("session:offline", onOffline);
    window.addEventListener("session:online", onOnline);

    // ── Heartbeat: extend silently every 10 min when user is active ──
    let lastHeartbeat = Date.now();
    const onActivity = () => {
      if (Date.now() - lastHeartbeat >= HEARTBEAT_INTERVAL_MS) {
        lastHeartbeat = Date.now();
        companyApi.extendSession()
          .then(data => { if (data.success && data.expiresAt) adminSessionManager.updateExpiry(data.expiresAt); })
          .catch(() => { /* silent fail */ });
      }
    };
    window.addEventListener("user:activity", onActivity);

    // ── Cross-tab sync ──
    const ch = getAdminChannel();
    if (ch) {
      ch.onmessage = (ev: MessageEvent) => {
        switch (ev.data?.type) {
          case "ADMIN_SESSION_EXTENDED":
            adminSessionManager.updateExpiry(ev.data.expiresAt);
            adminSessionManager.dismissWarning();
            setShowWarning(false);
            break;
          case "ADMIN_SESSION_EXPIRED":
          case "ADMIN_SESSION_LOGOUT":
            adminSessionManager.stop();
            localStorage.removeItem("praedico_company_member");
            window.location.href = "/admin/staff-access-portal";
            break;
        }
      };
    }

    // ── Fetch initial session expiry ──
    companyApi.getSessionStatus()
      .then(data => { if (data.success && data.expiresAt) adminSessionManager.updateExpiry(data.expiresAt); })
      .catch(() => { /* no session — login page will catch it */ });

    cleanupRef.current = () => {
      window.removeEventListener("session:warning", onWarning);
      window.removeEventListener("session:expired", onExpired);
      window.removeEventListener("session:extended", onExtended);
      window.removeEventListener("session:offline", onOffline);
      window.removeEventListener("session:online", onOnline);
      window.removeEventListener("user:activity", onActivity);
      adminSessionManager.stop();
      idleDetector.stop();
      if (heartbeatRef.current) clearInterval(heartbeatRef.current);
      sessionActiveRef.current = false;
    };
  }, [handleExpiry]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    startMonitoring();

    const onLoginSuccess = () => setTimeout(startMonitoring, 300);
    window.addEventListener("login_success", onLoginSuccess);

    return () => {
      window.removeEventListener("login_success", onLoginSuccess);
      cleanupRef.current?.();
    };
  }, [startMonitoring]);

  return { showWarning, secondsLeft, isOffline, isExtending, extendSession, logout };
}
