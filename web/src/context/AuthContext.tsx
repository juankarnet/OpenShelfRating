/**
 * Authentication context for managing user session state.
 * Provides login, register, logout, and profile management.
 */

import React, { createContext, useState, useCallback, useEffect } from 'react';
import type { AuthContextType, UserProfile } from '../types/auth';
import { UserRole } from '../types/auth';
import { mediaApi } from '../api';
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
  const MEDIA_BUCKET_NAME =
    ((import.meta.env.VITE_MEDIA_BUCKET_NAME as string | undefined)?.trim() || 'openshelfrating-media');
  const MEDIA_PUBLIC_BASE_URL =
    ((import.meta.env.VITE_MEDIA_PUBLIC_BASE_URL as string | undefined)?.trim() ||
      `${window.location.protocol}//${window.location.hostname}:9000/${MEDIA_BUCKET_NAME}`);

  const [user, setUser] = useState<UserProfile | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const persistUser = useCallback((profile: UserProfile) => {
    saveUser({
      userId: profile.userId,
      email: profile.email,
      displayName: profile.displayName,
      role: profile.role,
      avatarUrl: profile.avatarUrl ?? null,
    });
  }, []);

  const normalizeMediaUrl = useCallback((rawUrl: string | null | undefined): string | null => {
    if (!rawUrl) {
      return null;
    }

    try {
      const parsedUrl = new URL(rawUrl);

      // When backend signs against an internal MinIO hostname (e.g., Docker network),
      // rewrite it to the browser-reachable host while preserving path and signature.
      const hostname = parsedUrl.hostname.toLowerCase();
      const isInternalMinioHost =
        hostname === 'minio' ||
        hostname.includes('minio') ||
        hostname.endsWith('.local');

      if (isInternalMinioHost) {
        parsedUrl.hostname = window.location.hostname || 'localhost';
        parsedUrl.port = '9000';
      }

      return parsedUrl.toString();
    } catch {
      return rawUrl;
    }
  }, []);

  const resolveAvatarFromProfileValue = useCallback((avatarValue: unknown): string | null => {
    if (typeof avatarValue !== 'string' || !avatarValue.trim()) {
      return null;
    }

    const trimmedValue = avatarValue.trim();

    // If backend already returns a full URL, normalize it.
    if (/^https?:\/\//i.test(trimmedValue)) {
      return normalizeMediaUrl(trimmedValue);
    }

    // Backend profile returns persisted object path (e.g. avatars/<userId>/<ts>.jpg).
    const objectPath = trimmedValue.replace(/^\/+/, '');
    return `${MEDIA_PUBLIC_BASE_URL.replace(/\/+$/, '')}/${objectPath}`;
  }, [MEDIA_PUBLIC_BASE_URL, normalizeMediaUrl]);

  const resolveAvatarUrl = useCallback(async (userId: string, authToken: string): Promise<string | null> => {
    const avatarAccess = await mediaApi.getAvatar(userId, authToken);
    return avatarAccess.placeholder ? null : normalizeMediaUrl(avatarAccess.url);
  }, [normalizeMediaUrl]);

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
          let hydratedUser: UserProfile = {
            userId: storedUser.userId,
            email: storedUser.email,
            displayName: storedUser.displayName,
            avatarUrl: storedUser.avatarUrl ?? null,
            role: storedUser.role as UserRole,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };

          try {
            const remoteProfile = await fetchProfile(storedUser.userId, storedToken);
            hydratedUser = {
              ...hydratedUser,
              email: String(remoteProfile.email ?? hydratedUser.email),
              displayName: String(remoteProfile.displayName ?? hydratedUser.displayName),
              role: (String(remoteProfile.role ?? hydratedUser.role) as UserRole),
              avatarUrl:
                resolveAvatarFromProfileValue(remoteProfile.avatarUrl) ??
                await resolveAvatarUrl(storedUser.userId, storedToken),
            };
          } catch {
            // Keep stored profile if backend profile/media is temporarily unavailable.
          }

          setUser(hydratedUser);
          persistUser(hydratedUser);
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
  }, [fetchProfile, persistUser, resolveAvatarFromProfileValue, resolveAvatarUrl]);

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
          avatarUrl:
            resolveAvatarFromProfileValue(remoteProfile.avatarUrl) ??
            await resolveAvatarUrl(String(userId), String(newToken)),
          role: (String(remoteProfile.role ?? role ?? UserRole.USER) as UserRole),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
      } catch {
        profile = {
          userId: String(userId),
          email,
          displayName: email.split('@')[0] ?? 'User',
          avatarUrl: null,
          role: (String(role ?? UserRole.USER) as UserRole),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
      }

      setUser(profile);
      persistUser(profile);

      // Clear rate-limit data on successful login
      recordSuccessfulLogin();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Login failed';
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [fetchProfile, persistUser, resolveAvatarFromProfileValue, resolveAvatarUrl]);

  /**
   * Handle user registration.
   * REQ-002, AC-001 from SPEC-0006: Register with email+password+name.
   */
  const register = useCallback(async (email: string, displayName: string, password: string, avatarFile?: File | null): Promise<void> => {
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
          avatarUrl:
            resolveAvatarFromProfileValue(remoteProfile.avatarUrl) ??
            await resolveAvatarUrl(String(userId), String(newToken)),
          role: (String(remoteProfile.role ?? role ?? UserRole.USER) as UserRole),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
      } catch {
        profile = {
          userId: String(userId),
          email,
          displayName,
          avatarUrl: null,
          role: (String(role ?? UserRole.USER) as UserRole),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
      }

      if (avatarFile) {
        const uploadResult = await mediaApi.uploadAvatar(profile.userId, avatarFile, String(newToken));
        let avatarUrlFromProfile: string | null = null;
        try {
          const refreshedProfile = await fetchProfile(profile.userId, String(newToken));
          avatarUrlFromProfile = resolveAvatarFromProfileValue(refreshedProfile.avatarUrl);
        } catch {
          // Keep fallback from upload response below.
        }
        profile = {
          ...profile,
          avatarUrl: avatarUrlFromProfile ?? normalizeMediaUrl(uploadResult.presignedUrl),
        };
      }

      setUser(profile);
      persistUser(profile);
      recordSuccessfulLogin();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Registration failed';
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [fetchProfile, normalizeMediaUrl, persistUser, resolveAvatarFromProfileValue, resolveAvatarUrl]);

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
        const errorBody = await parseResponseBody(response);
        const msg = extractErrorMessage(errorBody, 'No se pudo actualizar el perfil.');
        throw new Error(msg);
      }

      const updatedProfile = await response.json();
      const mergedProfile = { ...user, ...updatedProfile };
      setUser(mergedProfile);
      persistUser(mergedProfile);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Profile update failed';
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [user, token, persistUser]);

  const uploadAvatar = useCallback(async (file: File): Promise<void> => {
    if (!user || !token) {
      throw new Error('User not authenticated');
    }

    setIsLoading(true);
    setError(null);

    try {
      const uploadResult = await mediaApi.uploadAvatar(user.userId, file, token);
      let avatarUrl = normalizeMediaUrl(uploadResult.presignedUrl);
      try {
        const refreshedProfile = await fetchProfile(user.userId, token);
        avatarUrl = resolveAvatarFromProfileValue(refreshedProfile.avatarUrl) ?? avatarUrl;
      } catch {
        // Keep fallback URL from upload response.
      }
      const updatedUser = { ...user, avatarUrl };
      setUser(updatedUser);
      persistUser(updatedUser);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Avatar upload failed';
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [fetchProfile, normalizeMediaUrl, persistUser, resolveAvatarFromProfileValue, token, user]);

  const deleteAvatar = useCallback(async (): Promise<void> => {
    if (!user || !token) {
      throw new Error('User not authenticated');
    }

    setIsLoading(true);
    setError(null);

    try {
      await mediaApi.deleteAvatar(user.userId, token);
      const updatedUser = { ...user, avatarUrl: null };
      setUser(updatedUser);
      persistUser(updatedUser);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Avatar delete failed';
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [persistUser, token, user]);

  const refreshAvatarUrl = useCallback(async (): Promise<void> => {
    if (!user || !token) {
      throw new Error('User not authenticated');
    }

    try {
      let avatarUrl: string | null = null;
      try {
        const refreshedProfile = await fetchProfile(user.userId, token);
        avatarUrl = resolveAvatarFromProfileValue(refreshedProfile.avatarUrl);
      } catch {
        // Fall back to media access endpoint below.
      }

      if (!avatarUrl) {
        avatarUrl = await resolveAvatarUrl(user.userId, token);
      }

      if (!avatarUrl && user.avatarUrl) {
        // Keep current URL to avoid UI flicker/disappear on transient refresh failures.
        return;
      }

      const updatedUser = { ...user, avatarUrl };
      setUser(updatedUser);
      persistUser(updatedUser);
    } catch {
      // Keep previous avatar URL if refresh fails.
    }
  }, [fetchProfile, persistUser, resolveAvatarFromProfileValue, resolveAvatarUrl, token, user]);

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
    uploadAvatar,
    deleteAvatar,
    refreshAvatarUrl,
    clearError,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
