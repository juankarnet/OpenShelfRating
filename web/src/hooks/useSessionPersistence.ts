/**
 * Custom hook for session persistence management.
 * Handles token expiry checks and auto-logout.
 * REQ-003, REQ-015 from SPEC-0006: Session persistence with 30-day expiry.
 */

import { useEffect, useState } from 'react';
import { useAuth } from './useAuth';
import { getTokenRemainingTime, isTokenExpired, getTokenExpiryDate } from '../utils/sessionStorage';

/**
 * Hook to manage session persistence and expiry.
 * Monitors token expiry and logs out user if token expires.
 */
export const useSessionPersistence = (): {
  isExpiring: boolean;
  expiryDate: string | null;
  remainingTime: number;
} => {
  const { logout, isAuthenticated } = useAuth();
  const [remainingTime, setRemainingTime] = useState(getTokenRemainingTime());
  const expiryDate = getTokenExpiryDate();
  const isExpiring = remainingTime > 0 && remainingTime < 5 * 60 * 1000; // 5 minutes

  /**
   * Check if token is expired and log out if necessary.
   */
  useEffect(() => {
    if (!isAuthenticated) {
      return;
    }

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
   * Update remaining time every second when authenticated.
   */
  useEffect(() => {
    if (!isAuthenticated) {
      return;
    }

    const interval = setInterval(() => {
      setRemainingTime(getTokenRemainingTime());
    }, 1000);

    return () => clearInterval(interval);
  }, [isAuthenticated]);

  return { isExpiring, expiryDate, remainingTime };
};
