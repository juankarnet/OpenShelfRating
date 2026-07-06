/**
 * Custom hook for session persistence management.
 * Handles token expiry checks and session restoration.
 */

import { useEffect, useCallback } from 'react';
import { useAuth } from './useAuth';
import { getTokenRemainingTime, isTokenExpired, getTokenExpiryDate } from '../utils/sessionStorage';

/**
 * Hook to manage session persistence and expiry.
 * Monitors token expiry and logs out user if token expires.
 * REQ-003, REQ-015 from SPEC-0006: Session persistence with 30-day expiry.
 */
export const useSessionPersistence = (): {
  isExpiring: boolean;
  expiryDate: string | null;
  remainingTime: number;
} => {
  const { logout, isAuthenticated } = useAuth();

  // State for expiry monitoring
  const [remainingTime, setRemainingTime] = useCallback(() => getTokenRemainingTime(), []);
  const [expiryDate] = useCallback(() => getTokenExpiryDate(), []);
  const [isExpiring] = useCallback(() => remainingTime < 5 * 60 * 1000, [remainingTime]); // 5 minutes

  /**
   * Check if token is expired and log out if necessary.
   */
  useEffect(() => {
    if (!isAuthenticated) {
      return;
    }

    // Check token expiry on mount and periodically
    const checkExpiry = () => {
      if (isTokenExpired()) {
        logout();
      }
    };

    checkExpiry();

    // Check expiry every minute
    const interval = setInterval(checkExpiry, 60 * 1000);

    return () => clearInterval(interval);
  }, [isAuthenticated, logout]);

  /**
   * Update remaining time periodically.
   */
  useEffect(() => {
    if (!isAuthenticated) {
      return;
    }

    const updateRemainingTime = () => {
      setRemainingTime(getTokenRemainingTime());
    };

    updateRemainingTime();

    // Update every second
    const interval = setInterval(updateRemainingTime, 1000);

    return () => clearInterval(interval);
  }, [isAuthenticated, setRemainingTime]);

  return {
    isExpiring: isExpiring(),
    expiryDate: expiryDate(),
    remainingTime: remainingTime(),
  };
};
