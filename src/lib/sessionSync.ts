/**
 * SessionSync — Multi-tab synchronisation via BroadcastChannel (with fallback).
 *
 * Ensures all tabs share the same session state: if one tab extends/expires/logs out,
 * all other tabs react accordingly.
 */

type SessionSyncMessage =
  | { type: 'SESSION_EXTENDED'; expiresAt: string }
  | { type: 'SESSION_EXPIRED' }
  | { type: 'SESSION_LOGOUT' };

type SessionSyncHandler = (msg: SessionSyncMessage) => void;

class SessionSync {
  private channel: BroadcastChannel | null = null;
  private handlers: Set<SessionSyncHandler> = new Set();
  private started: boolean = false;

  /**
   * Start listening for cross-tab messages.
   */
  start(): void {
    if (this.started || typeof window === 'undefined') return;
    this.started = true;

    try {
      if (typeof BroadcastChannel !== 'undefined') {
        this.channel = new BroadcastChannel('praedico-session');
        this.channel.onmessage = (event: MessageEvent<SessionSyncMessage>) => {
          this.notifyHandlers(event.data);
        };
      } else {
        // Fallback: use localStorage events for older browsers
        window.addEventListener('storage', this.handleStorageEvent);
      }
    } catch {
      // BroadcastChannel failed — use localStorage fallback
      window.addEventListener('storage', this.handleStorageEvent);
    }
  }

  /**
   * Stop listening and clean up.
   */
  stop(): void {
    this.started = false;

    if (this.channel) {
      this.channel.close();
      this.channel = null;
    }

    window.removeEventListener('storage', this.handleStorageEvent);
    this.handlers.clear();
  }

  /**
   * Register a handler for cross-tab messages.
   */
  onMessage(handler: SessionSyncHandler): () => void {
    this.handlers.add(handler);
    return () => this.handlers.delete(handler);
  }

  /**
   * Broadcast a message to all other tabs.
   */
  broadcast(msg: SessionSyncMessage): void {
    if (this.channel) {
      this.channel.postMessage(msg);
    } else {
      // localStorage fallback: write a key so other tabs pick it up
      try {
        localStorage.setItem(
          '__praedico_session_sync',
          JSON.stringify({ ...msg, _ts: Date.now() })
        );
        // Immediately remove so the next write triggers another event
        localStorage.removeItem('__praedico_session_sync');
      } catch {
        // Quota or private mode — silently fail
      }
    }
  }

  // ─── Internal ──────────────────────────────────────────────────────────

  private handleStorageEvent = (event: StorageEvent): void => {
    if (event.key !== '__praedico_session_sync' || !event.newValue) return;

    try {
      const msg = JSON.parse(event.newValue) as SessionSyncMessage;
      this.notifyHandlers(msg);
    } catch {
      // Malformed data — ignore
    }
  };

  private notifyHandlers(msg: SessionSyncMessage): void {
    this.handlers.forEach((handler) => {
      try {
        handler(msg);
      } catch (err) {
        console.error('[SessionSync] Handler error:', err);
      }
    });
  }
}

// Singleton
export const sessionSync = new SessionSync();
export default SessionSync;
