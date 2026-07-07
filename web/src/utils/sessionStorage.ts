/**
 * Session storage utilities for token persistence and expiry management.
 * REQ-003, REQ-015 from SPEC-0006: 30-day token persistence with localStorage.
 */

const TOKEN_KEY = 'osr_token';
const TOKEN_EXPIRY_KEY = 'osr_token_expiry';
const USER_KEY = 'osr_user';
const SESSION_EXPIRY_DAYS = 30;

/**
 * Save authentication token to localStorage with 30-day expiry.
 * @param token JWT token from login response
 */
export const saveToken = (token: string): void => {
  const expiryTime = Date.now() + SESSION_EXPIRY_DAYS * 24 * 60 * 60 * 1000;
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(TOKEN_EXPIRY_KEY, expiryTime.toString());
};

/**
 * Load token from localStorage if not expired.
 * @returns JWT token if valid and not expired; null otherwise
 */
export const loadToken = (): string | null => {
  const token = localStorage.getItem(TOKEN_KEY);
  const expiryStr = localStorage.getItem(TOKEN_EXPIRY_KEY);

  if (!token || !expiryStr) {
    return null;
  }

  const expiry = parseInt(expiryStr, 10);

  // Token expired
  if (Date.now() > expiry) {
    clearToken();
    return null;
  }

  return token;
};

/**
 * Clear token and expiry from localStorage.
 */
export const clearToken = (): void => {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(TOKEN_EXPIRY_KEY);
  localStorage.removeItem(USER_KEY);
};

/**
 * Save minimal authenticated user profile to localStorage.
 * @param user User profile to persist across refreshes
 */
export const saveUser = (user: { userId: string; email: string; displayName: string; role: string }): void => {
  localStorage.setItem(USER_KEY, JSON.stringify(user));
};

/**
 * Load persisted user profile from localStorage.
 * @returns Stored user profile or null when unavailable/invalid
 */
export const loadUser = (): { userId: string; email: string; displayName: string; role: string } | null => {
  const raw = localStorage.getItem(USER_KEY);
  if (!raw) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    if (
      typeof parsed.userId === 'string' &&
      typeof parsed.email === 'string' &&
      typeof parsed.displayName === 'string' &&
      typeof parsed.role === 'string'
    ) {
      return {
        userId: parsed.userId,
        email: parsed.email,
        displayName: parsed.displayName,
        role: parsed.role,
      };
    }
  } catch {
    // Ignore malformed stored data and force fresh login.
  }

  localStorage.removeItem(USER_KEY);
  return null;
};

/**
 * Get remaining time in milliseconds until token expiry.
 * @returns Remaining milliseconds; 0 if expired or no token
 */
export const getTokenRemainingTime = (): number => {
  const expiryStr = localStorage.getItem(TOKEN_EXPIRY_KEY);

  if (!expiryStr) {
    return 0;
  }

  const expiry = parseInt(expiryStr, 10);
  const remaining = expiry - Date.now();

  return Math.max(0, remaining);
};

/**
 * Check if token is expired.
 * @returns true if expired or not present; false if valid
 */
export const isTokenExpired = (): boolean => {
  const expiryStr = localStorage.getItem(TOKEN_EXPIRY_KEY);

  if (!expiryStr) {
    return true;
  }

  const expiry = parseInt(expiryStr, 10);
  return Date.now() > expiry;
};

/**
 * Get token expiry date as ISO string.
 * @returns ISO date string or null if no token
 */
export const getTokenExpiryDate = (): string | null => {
  const expiryStr = localStorage.getItem(TOKEN_EXPIRY_KEY);

  if (!expiryStr) {
    return null;
  }

  const expiry = parseInt(expiryStr, 10);
  return new Date(expiry).toISOString();
};
