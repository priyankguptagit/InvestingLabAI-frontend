// ============================================
// SAVED ACCOUNTS — localStorage utility
// ============================================
// Stores non-sensitive account info (email, name, loginMode)
// for quick login. No passwords or tokens are stored.

const STORAGE_KEY = "praedico_saved_accounts";

export interface SavedAccount {
  email: string;
  name: string;
  loginMode: "user" | "organization"; // which tab they logged in from
  role?: string; // "user" | "org_admin" | "coordinator"
  savedAt: number; // timestamp
}

/**
 * Get all saved accounts, sorted by most recently used first.
 */
export function getSavedAccounts(): SavedAccount[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const accounts: SavedAccount[] = JSON.parse(raw);
    return accounts.sort((a, b) => b.savedAt - a.savedAt);
  } catch {
    return [];
  }
}

/**
 * Save or update an account entry (upserts by email).
 */
export function saveAccount(account: Omit<SavedAccount, "savedAt">) {
  const accounts = getSavedAccounts();
  const existing = accounts.findIndex(
    (a) => a.email.toLowerCase() === account.email.toLowerCase()
  );

  const entry: SavedAccount = {
    ...account,
    savedAt: Date.now(),
  };

  if (existing >= 0) {
    accounts[existing] = entry;
  } else {
    accounts.unshift(entry);
  }

  // Cap at 5 saved accounts
  const capped = accounts.slice(0, 5);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(capped));
}

/**
 * Remove a saved account by email.
 */
export function removeSavedAccount(email: string) {
  const accounts = getSavedAccounts().filter(
    (a) => a.email.toLowerCase() !== email.toLowerCase()
  );
  localStorage.setItem(STORAGE_KEY, JSON.stringify(accounts));
}

/**
 * Clear all saved accounts.
 */
export function clearSavedAccounts() {
  localStorage.removeItem(STORAGE_KEY);
}
