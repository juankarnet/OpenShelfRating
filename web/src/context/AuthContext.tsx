/**
 * Authentication context for managing user session state.
 * Provides login, register, logout, and profile management.
 */

import React, { createContext, useState, useCallback, useEffect } from 'react';
import type { AuthContextType, UserProfile } from '../types/auth';
import { UserRole } from '../types/auth';
import { saveToken, loadToken, clearToken, saveUser, loadUser } from '../utils/sessionStorage';
import { recordSuccessfulLogin } from '../utils/rateLimit';

/**
 * Safely parses the response body as JSON.
 * Returns null if the body is empty or not valid JSON.
 */
const parseResponseBody = async (response: Response): Promise<Record<string, unknown> | null> => {
  const text = await response.text();
  if (!text.trim()) return null;
  try {
    return JSON.parse(text) as Record<string, unknown>;
  } catch {
    return null;
  }
};

/**
 * Extracts a user-friendly message from an error response.
 */
const extractErrorMessage = (body: Record<string, unknown> | null, fallback: string): string => {
  if (!body) return fallback;
  if (typeof body.message === 'string' && body.message) return body.message;
  if (typeof body.error === 'string' && body.error) return body.error;
  return fallback;
};

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

  const fetchProfile = useCallback(async (userId: string, authToken: string) => {
    const response = await fetch(`/api/users/${userId}/profile`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
    });

    if (!response.ok) {
      throw new Error('No se pudo recuperar el perfil del usuario.');
    }

    return response.json() as Promise<Record<string, unknown>>;
  }, []);

  /**
   * Initialize auth state from localStorage on component mount.
   */
  useEffect(() => {
    const initAuth = async () => {
      try {
        const storedToken = loadToken();
        const storedUser = loadUser();
        if (storedToken && storedUser) {
          setToken(storedToken);
          setUser({
            userId: storedUser.userId,
            email: storedUser.email,
            displayName: storedUser.displayName,
            role: storedUser.role as UserRole,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          });
        } else if (storedToken && !storedUser) {
          clearToken();
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
        const errorBody = await parseResponseBody(response);
        const msg = extractErrorMessage(errorBody, 'Credenciales incorrectas. Revisa tu email y contraseña.');
        throw new Error(msg);
      }

      const data = await response.json();
      const { token: newToken, userId, role } = data;

      // Store token
      saveToken(newToken);
      setToken(newToken);

      let profile: UserProfile;
      try {
        const remoteProfile = await fetchProfile(String(userId), String(newToken));
        profile = {
          userId: String(remoteProfile.userId ?? userId),
          email: String(remoteProfile.email ?? email),
          displayName: String(remoteProfile.displayName ?? email.split('@')[0] ?? 'User'),
          role: (String(remoteProfile.role ?? role ?? UserRole.USER) as UserRole),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
      } catch {
        profile = {
          userId: String(userId),
          email,
          displayName: email.split('@')[0] ?? 'User',
          role: (String(role ?? UserRole.USER) as UserRole),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
      }

      setUser(profile);
      saveUser({ userId: profile.userId, email: profile.email, displayName: profile.displayName, role: profile.role });

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
        const errorBody = await parseResponseBody(response);
        const msg = extractErrorMessage(errorBody, 'No se pudo crear la cuenta. El email puede estar en uso.');
        throw new Error(msg);
      }

      const data = await response.json();
      const { token: newToken, userId, role } = data;

      // Store token
      saveToken(newToken);
      setToken(newToken);

      let profile: UserProfile;
      try {
        const remoteProfile = await fetchProfile(String(userId), String(newToken));
        profile = {
          userId: String(remoteProfile.userId ?? userId),
          email: String(remoteProfile.email ?? email),
          displayName: String(remoteProfile.displayName ?? displayName),
          role: (String(remoteProfile.role ?? role ?? UserRole.USER) as UserRole),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
      } catch {
        profile = {
          userId: String(userId),
          email,
          displayName,
          role: (String(role ?? UserRole.USER) as UserRole),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
      }

      setUser(profile);
      saveUser({ userId: profile.userId, email: profile.email, displayName: profile.displayName, role: profile.role });
      recordSuccessfulLogin();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Registration failed';
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [fetchProfile]);

  /**
   * Handle logout.
   * REQ-010, AC-011 from SPEC-0006: Logout clears token and redirects to login.
   */
  const logout = useCallback(() => {
    clearToken();
    setToken(null);
    setUser(null);
    setError(null);
  }, [fetchProfile]);

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
        const errorBody = await parseResponseBody(response);
        const msg = extractErrorMessage(errorBody, 'No se pudo actualizar el perfil.');
        throw new Error(msg);
      }

      const updatedProfile = await response.json();
      const mergedProfile = { ...user, ...updatedProfile };
      setUser(mergedProfile);
      saveUser({
        userId: mergedProfile.userId,
        email: mergedProfile.email,
        displayName: mergedProfile.displayName,
        role: mergedProfile.role,
      });
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
