/**
 * State Preservation — Save and restore form state across session expiry.
 *
 * Before redirecting to login on expiry, saves unsaved form field values
 * to sessionStorage keyed by route. After re-login, restores them.
 *
 * Sensitive fields (passwords, card numbers, OTPs) are never saved.
 */

const STORAGE_PREFIX = 'praedico_form_state_';

/**
 * Check if a form field is sensitive and should NOT be saved.
 */
function isSensitiveField(el: HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement): boolean {
  // Password fields
  if ((el as HTMLInputElement).type === 'password') return true;

  // Credit card number fields
  if (el.getAttribute('autocomplete') === 'cc-number') return true;

  // Explicitly marked sensitive
  if (el.getAttribute('data-sensitive') === 'true') return true;

  // OTP-like fields (common patterns)
  const name = (el.name || el.id || '').toLowerCase();
  if (name.includes('otp') || name.includes('cvv') || name.includes('cvc')) return true;

  return false;
}

/**
 * Save all non-sensitive form values on the current page.
 * Call this BEFORE redirecting to login on session expiry.
 */
export function saveFormState(): void {
  if (typeof window === 'undefined') return;

  const key = STORAGE_PREFIX + window.location.pathname;
  const state: Record<string, string> = {};
  let hasData = false;

  const inputs = document.querySelectorAll<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>(
    'input, textarea, select'
  );

  inputs.forEach((el, index) => {
    if (isSensitiveField(el)) return;

    // Skip hidden, submit, button, file, image inputs
    const type = (el as HTMLInputElement).type;
    if (['hidden', 'submit', 'button', 'file', 'image', 'reset'].includes(type)) return;

    const fieldId = el.id || el.name || `__field_${index}`;
    const value = el.value;

    if (value && value.trim()) {
      // For checkboxes and radios, save checked state
      if (type === 'checkbox' || type === 'radio') {
        state[fieldId] = (el as HTMLInputElement).checked ? '__checked__' : '__unchecked__';
      } else {
        state[fieldId] = value;
      }
      hasData = true;
    }
  });

  if (hasData) {
    try {
      sessionStorage.setItem(key, JSON.stringify(state));
    } catch {
      // Storage quota exceeded — silently fail
    }
  }
}

/**
 * Restore saved form values on the current page.
 * Call this AFTER re-login when the page loads.
 */
export function restoreFormState(): void {
  if (typeof window === 'undefined') return;

  const key = STORAGE_PREFIX + window.location.pathname;

  try {
    const raw = sessionStorage.getItem(key);
    if (!raw) return;

    const state: Record<string, string> = JSON.parse(raw);

    // Clear from storage immediately
    sessionStorage.removeItem(key);

    Object.entries(state).forEach(([fieldId, value]) => {
      const el = document.getElementById(fieldId) || document.querySelector(`[name="${fieldId}"]`);
      if (!el) return;

      const input = el as HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement;

      if (value === '__checked__' || value === '__unchecked__') {
        (input as HTMLInputElement).checked = value === '__checked__';
      } else {
        input.value = value;
        // Trigger React's change detection
        const event = new Event('input', { bubbles: true });
        input.dispatchEvent(event);
      }
    });
  } catch {
    // Parse error or storage issue — silently fail
  }
}

/**
 * Check if there's saved form state for the current route.
 */
export function hasSavedFormState(): boolean {
  if (typeof window === 'undefined') return false;
  const key = STORAGE_PREFIX + window.location.pathname;
  return sessionStorage.getItem(key) !== null;
}

/**
 * Clear saved form state for the current route.
 */
export function clearFormState(): void {
  if (typeof window === 'undefined') return;
  const key = STORAGE_PREFIX + window.location.pathname;
  sessionStorage.removeItem(key);
}
