/**
 * idleDetector.ts
 *
 * Tracks genuine user activity (mouse, keyboard, scroll, touch, visibility).
 * Dispatches a throttled `user:activity` CustomEvent on the window.
 *
 * Used by useAdminSessionTimeout to issue silent session heartbeats while
 * the admin is actively working, so the modal only appears during true idle.
 */

const THROTTLE_MS = 30_000; // at most once per 30 seconds

class IdleDetector {
  private lastActivity = 0;
  private started = false;
  private readonly events = [
    'mousemove', 'mousedown', 'keydown',
    'touchstart', 'scroll', 'visibilitychange',
  ] as const;

  start(): void {
    if (this.started || typeof window === 'undefined') return;
    this.started = true;
    this.events.forEach(e => window.addEventListener(e, this.handleActivity, { passive: true }));
  }

  stop(): void {
    if (!this.started) return;
    this.started = false;
    this.events.forEach(e => window.removeEventListener(e, this.handleActivity));
  }

  private handleActivity = (): void => {
    const now = Date.now();
    if (now - this.lastActivity < THROTTLE_MS) return;
    this.lastActivity = now;
    window.dispatchEvent(new CustomEvent('user:activity'));
  };
}

export const idleDetector = new IdleDetector();
export default IdleDetector;
