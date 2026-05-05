/**
 * SessionManager — Framework-agnostic vanilla TS class for session timeout tracking.
 *
 * Driven by the X-Session-Expires-At header from the server, NOT local timers.
 * Emits custom events for the UI layer to react to.
 */

type SessionEventType =
  | 'session:warning'
  | 'session:expired'
  | 'session:extended'
  | 'session:offline'
  | 'session:online';

interface SessionManagerOptions {
  warningBeforeMs?: number;  // How early to show warning (default: 2 min)
  typingDelayMs?: number;    // Delay warning if user is typing (default: 30s)
}

class SessionManager {
  private expiresAt: number = 0;          // Server-provided expiry (ms since epoch)
  private intervalId: ReturnType<typeof setInterval> | null = null;
  private isWarningShown: boolean = false;
  private isOffline: boolean = false;
  private warningBeforeMs: number;
  private typingDelayMs: number;
  private typingDelayTimeout: ReturnType<typeof setTimeout> | null = null;
  private started: boolean = false;
  private firstExpiryReceived: boolean = false; // Track if we've seen server expiry

  constructor(options?: SessionManagerOptions) {
    // Default: 2 minutes. Will be dynamically adjusted when we receive
    // the first server expiry (if the total session window is shorter).
    this.warningBeforeMs = options?.warningBeforeMs ?? 2 * 60 * 1000;   // 2 minutes
    this.typingDelayMs = options?.typingDelayMs ?? 5 * 1000;            // 5 seconds (reduced from 30s)
  }

  /**
   * Start the session monitor. Call once after login.
   */
  start(serverExpiresAt?: string): void {
    if (this.started) return;
    this.started = true;

    if (serverExpiresAt) {
      this.updateExpiry(serverExpiresAt);
    }

    // Set up offline/online listeners
    window.addEventListener('offline', this.handleOffline);
    window.addEventListener('online', this.handleOnline);
    this.isOffline = !navigator.onLine;

    // Tick every second
    this.intervalId = setInterval(() => this.tick(), 1000);
  }

  /**
   * Stop the session monitor. Call on logout or cleanup.
   */
  stop(): void {
    this.started = false;

    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    if (this.typingDelayTimeout) {
      clearTimeout(this.typingDelayTimeout);
      this.typingDelayTimeout = null;
    }

    window.removeEventListener('offline', this.handleOffline);
    window.removeEventListener('online', this.handleOnline);

    this.isWarningShown = false;
    this.expiresAt = 0;
    this.firstExpiryReceived = false;
  }

  /**
   * Update the expiry from server header (called by axios interceptor).
   */
  updateExpiry(isoTimestamp: string): void {
    const ts = new Date(isoTimestamp).getTime();
    if (!isNaN(ts) && ts > 0) {
      this.expiresAt = ts;

      // Auto-calibrate warning threshold on the first server expiry received.
      // If the total window is shorter than our default warning window (2 min),
      // we shrink the warning window to ~80% of the remaining time.
      // E.g., 30s idle → warn at ~24s remaining (show warning immediately).
      if (!this.firstExpiryReceived) {
        this.firstExpiryReceived = true;
        const totalWindowMs = ts - Date.now();
        if (totalWindowMs > 0 && totalWindowMs < this.warningBeforeMs * 1.5) {
          // Dev mode: the total window is shorter than our warning threshold.
          // Set warning to trigger when we're at 80% of the way through.
          this.warningBeforeMs = Math.floor(totalWindowMs * 0.8);
          this.typingDelayMs = Math.min(this.typingDelayMs, 3000); // 3s max in dev
          console.log(`[SessionManager] Dev-calibrated: warning at ${Math.round(this.warningBeforeMs / 1000)}s before expiry`);
        }
      }

      // If warning was showing and session got extended, dismiss it
      if (this.isWarningShown && this.getSecondsRemaining() > this.warningBeforeMs / 1000) {
        this.isWarningShown = false;
        this.emit('session:extended');
      }
    }
  }

  /**
   * Get seconds remaining until expiry.
   */
  getSecondsRemaining(): number {
    if (!this.expiresAt) return Infinity;
    return Math.max(0, Math.floor((this.expiresAt - Date.now()) / 1000));
  }

  /**
   * Check if the warning is currently active.
   */
  getIsWarningShown(): boolean {
    return this.isWarningShown;
  }

  /**
   * Check if offline.
   */
  getIsOffline(): boolean {
    return this.isOffline;
  }

  /**
   * Force dismiss the warning (e.g., after extend-session success).
   */
  dismissWarning(): void {
    this.isWarningShown = false;
  }

  // ─── Internal ──────────────────────────────────────────────────────────

  private tick = (): void => {
    if (!this.expiresAt || this.isOffline) return;

    const secondsLeft = this.getSecondsRemaining();

    // Session expired
    if (secondsLeft <= 0) {
      this.isWarningShown = false;
      this.emit('session:expired');
      this.stop();
      return;
    }

    // Warning threshold reached
    const warningThresholdSec = this.warningBeforeMs / 1000;
    if (secondsLeft <= warningThresholdSec && !this.isWarningShown) {
      // Check if user is actively typing — delay warning
      if (this.isUserTyping()) {
        if (!this.typingDelayTimeout) {
          this.typingDelayTimeout = setTimeout(() => {
            this.typingDelayTimeout = null;
            // Re-check: if still within warning range, show it
            if (this.getSecondsRemaining() <= warningThresholdSec && !this.isWarningShown) {
              this.isWarningShown = true;
              this.emit('session:warning');
            }
          }, this.typingDelayMs);
        }
        return;
      }

      this.isWarningShown = true;
      this.emit('session:warning');
    }
  };

  private isUserTyping(): boolean {
    const el = document.activeElement;
    if (!el) return false;
    const tag = el.tagName.toLowerCase();
    if (tag === 'input' || tag === 'textarea') return true;
    if ((el as HTMLElement).contentEditable === 'true') return true;
    return false;
  }

  private handleOffline = (): void => {
    this.isOffline = true;
    this.emit('session:offline');
  };

  private handleOnline = (): void => {
    this.isOffline = false;
    this.emit('session:online');
  };

  private emit(eventType: SessionEventType): void {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent(eventType, {
        detail: {
          secondsRemaining: this.getSecondsRemaining(),
          expiresAt: this.expiresAt,
          isOffline: this.isOffline,
        },
      }));
    }
  }
}

// Singleton instance
export const sessionManager = new SessionManager();
export default SessionManager;
