/**
 * Rate limiting utilities for login attempts.
 * REQ-016 from SPEC-0006: Block login after 10 failed attempts for 2 minutes.
 * RULE-003 from SPEC-0006: Rate-limiting 10 attempts per 30-minute window; 2-minute block.
 */

const FAILED_LOGINS_KEY = 'osr_failed_logins';
const LOCK_UNTIL_KEY = 'osr_login_locked_until';
const MAX_ATTEMPTS = 30;
const ATTEMPT_WINDOW_MS = 30 * 60 * 1000; // 30 minutes
const LOCK_DURATION_MS = 2 * 60 * 1000; // 2 minutes

/**
 * Record a failed login attempt and check if account should be locked.
 * @returns Number of recent failed attempts
 */
export const recordFailedLogin = (): number => {
  const attemptsStr = localStorage.getItem(FAILED_LOGINS_KEY) || '[]';
  let attempts: number[] = [];

  try {
    attempts = JSON.parse(attemptsStr);
  } catch {
    attempts = [];
  }

  const now = Date.now();
  const windowStart = now - ATTEMPT_WINDOW_MS;

  // Filter out attempts older than 30 minutes
  const recentAttempts = attempts.filter((timestamp: number) => timestamp > windowStart);
  recentAttempts.push(now);

  localStorage.setItem(FAILED_LOGINS_KEY, JSON.stringify(recentAttempts));

  // Lock account if 10 attempts reached
  if (recentAttempts.length >= MAX_ATTEMPTS) {
    lockAccount();
  }

  return recentAttempts.length;
};

/**
 * Record a successful login and clear failed attempts.
 */
export const recordSuccessfulLogin = (): void => {
  localStorage.removeItem(FAILED_LOGINS_KEY);
  localStorage.removeItem(LOCK_UNTIL_KEY);
};

/**
 * Check if account is currently locked due to too many failed attempts.
 * @returns true if locked; false otherwise
 */
export const isAccountLocked = (): boolean => {
  const lockUntilStr = localStorage.getItem(LOCK_UNTIL_KEY);

  if (!lockUntilStr) {
    return false;
  }

  const lockUntil = parseInt(lockUntilStr, 10);
  const now = Date.now();

  if (now > lockUntil) {
    // Lock expired, clear it
    localStorage.removeItem(LOCK_UNTIL_KEY);
    localStorage.removeItem(FAILED_LOGINS_KEY);
    return false;
  }

  return true;
};

/**
 * Lock account for 2 minutes after too many failed attempts.
 */
export const lockAccount = (): void => {
  const lockUntil = Date.now() + LOCK_DURATION_MS;
  localStorage.setItem(LOCK_UNTIL_KEY, lockUntil.toString());
};

/**
 * Get remaining lock time in seconds.
 * @returns Seconds remaining; 0 if not locked
 */
export const getRemainingLockTimeSeconds = (): number => {
  const lockUntilStr = localStorage.getItem(LOCK_UNTIL_KEY);

  if (!lockUntilStr) {
    return 0;
  }

  const lockUntil = parseInt(lockUntilStr, 10);
  const remaining = lockUntil - Date.now();

  if (remaining <= 0) {
    localStorage.removeItem(LOCK_UNTIL_KEY);
    localStorage.removeItem(FAILED_LOGINS_KEY);
    return 0;
  }

  return Math.ceil(remaining / 1000);
};

/**
 * Get lock expiry time as ISO string.
 * @returns ISO date string or null if not locked
 */
export const getLockExpiryDate = (): string | null => {
  const lockUntilStr = localStorage.getItem(LOCK_UNTIL_KEY);

  if (!lockUntilStr) {
    return null;
  }

  const lockUntil = parseInt(lockUntilStr, 10);
  return new Date(lockUntil).toISOString();
};

/**
 * Clear all rate-limiting data (for admin/testing purposes).
 */
export const clearRateLimitData = (): void => {
  localStorage.removeItem(FAILED_LOGINS_KEY);
  localStorage.removeItem(LOCK_UNTIL_KEY);
};

/**
 * Get number of recent failed attempts.
 * @returns Count of failed attempts in the past 30 minutes
 */
export const getRecentFailedAttempts = (): number => {
  const attemptsStr = localStorage.getItem(FAILED_LOGINS_KEY) || '[]';
  let attempts: number[] = [];

  try {
    attempts = JSON.parse(attemptsStr);
  } catch {
    attempts = [];
  }

  const now = Date.now();
  const windowStart = now - ATTEMPT_WINDOW_MS;

  return attempts.filter((timestamp: number) => timestamp > windowStart).length;
};
