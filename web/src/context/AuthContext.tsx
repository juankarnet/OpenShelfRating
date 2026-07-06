/**
 * Authentication context for managing user session state.
 * Provides login, register, logout, and profile management.
 */

import React, { createContext, useState, useCallback, useEffect } from 'react';
import { AuthContextType, UserProfile, LoginRequest, RegisterRequest, UserRole } from '../types/auth';
import { saveToken, loadToken, clearToken } from '../utils/sessionStorage';
import { recordSuccessfulLogin } from '../utils/rateLimit';

/**
 * Create authentication context.
 */
export const AuthContext = createContext<AuthContextType | undefined>(undefined);

/**
 * Authentication context provider component.
 */
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /**
   * Initialize auth state from localStorage on component mount.
   */
  useEffect(() => {
    const initAuth = async () => {
      try {
        const storedToken = loadToken();
        if (storedToken) {
          setToken(storedToken);
          // In real scenario, validate token with backend
          // For now, assume valid token
        }
      } catch (err) {
        console.error('Error initializing auth:', err);
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();
  }, []);

  /**
   * Handle login with email and password.
   * REQ-001, AC-002 from SPEC-0006: Login with email+password, store token.
   */
  const login = useCallback(async (email: string, password: string): Promise<void> => {
    setIsLoading(true);
    setError(null);

    try {
      // Call backend login endpoint
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Login failed');
      }

      const data = await response.json();
      const { token: newToken, userId, displayName, role } = data;

      // Store token
      saveToken(newToken);
      setToken(newToken);

      // Create user profile
      const profile: UserProfile = {
        userId,
        email,
        displayName,
        role: role as UserRole,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      setUser(profile);

      // Clear rate-limit data on successful login
      recordSuccessfulLogin();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Login failed';
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Handle user registration.
   * REQ-002, AC-001 from SPEC-0006: Register with email+password+name.
   */
  const register = useCallback(async (email: string, displayName: string, password: string): Promise<void> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, displayName, password }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Registration failed');
      }

      const data = await response.json();
      const { token: newToken, userId, role } = data;

      // Store token
      saveToken(newToken);
      setToken(newToken);

      // Create user profile
      const profile: UserProfile = {
        userId,
        email,
        displayName,
        role: role as UserRole,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      setUser(profile);
      recordSuccessfulLogin();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Registration failed';
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Handle logout.
   * REQ-010, AC-011 from SPEC-0006: Logout clears token and redirects to login.
   */
  const logout = useCallback(() => {
    clearToken();
    setToken(null);
    setUser(null);
    setError(null);
  }, []);

  /**
   * Update user profile.
   * AC-012 from SPEC-0006: Edit profile (name, avatar).
   */
  const updateProfile = useCallback(async (updates: { displayName?: string; avatarUrl?: string }): Promise<void> => {
    if (!user) {
      throw new Error('User not authenticated');
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/users/${user.userId}/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(updates),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Profile update failed');
      }

      const updatedProfile = await response.json();
      setUser({ ...user, ...updatedProfile });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Profile update failed';
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [user, token]);

  /**
   * Clear error message.
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const value: AuthContextType = {
    user,
    token,
    isAuthenticated: !!user && !!token,
    isLoading,
    error,
    login,
    register,
    logout,
    updateProfile,
    clearError,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
