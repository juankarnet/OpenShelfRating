/**
 * Login page - Authentication page for unauthenticated users.
 * REQ-001, AC-001, AC-002 from SPEC-0006.
 */

import React, { useState, useEffect } from 'react';
import type { FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import {
  isAccountLocked,
  recordFailedLogin,
  recordSuccessfulLogin,
  getRemainingLockTimeSeconds,
} from '../utils/rateLimit';
import { LoadingSpinner } from '../components/Common/LoadingSpinner';

const LoginPage: React.FC = () => {
  const ALLOWED_AVATAR_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
  const MAX_AVATAR_SIZE_BYTES = 5 * 1024 * 1024;

  const navigate = useNavigate();
  const { login, register, isAuthenticated, isLoading, error, clearError } = useAuth();

  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreviewUrl, setAvatarPreviewUrl] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [lockRemaining, setLockRemaining] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  // Update lockout countdown timer
  useEffect(() => {
    if (lockRemaining <= 0) {
      return;
    }

    const timer = setInterval(() => {
      const remaining = getRemainingLockTimeSeconds();
      setLockRemaining(remaining);
    }, 1000);

    return () => clearInterval(timer);
  }, [lockRemaining]);

  // Check initial lockout state
  useEffect(() => {
    if (isAccountLocked()) {
      setLockRemaining(getRemainingLockTimeSeconds());
    }
  }, []);

  useEffect(() => {
    return () => {
      if (avatarPreviewUrl) {
        URL.revokeObjectURL(avatarPreviewUrl);
      }
    };
  }, [avatarPreviewUrl]);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    if (!file) {
      return;
    }

    if (!ALLOWED_AVATAR_MIME_TYPES.includes(file.type)) {
      setFormError('Avatar must be JPG, PNG, or WebP.');
      e.target.value = '';
      return;
    }

    if (file.size > MAX_AVATAR_SIZE_BYTES) {
      setFormError('Avatar image must be 5MB or smaller.');
      e.target.value = '';
      return;
    }

    setFormError(null);
    if (avatarPreviewUrl) {
      URL.revokeObjectURL(avatarPreviewUrl);
    }
    setAvatarFile(file);
    setAvatarPreviewUrl(URL.createObjectURL(file));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setFormError(null);
    clearError();

    // Check account lock first
    if (isAccountLocked()) {
      const remaining = getRemainingLockTimeSeconds();
      setLockRemaining(remaining);
      setFormError(`Too many failed attempts. Try again in ${remaining} seconds.`);
      return;
    }

    setIsSubmitting(true);

    try {
      if (mode === 'login') {
        await login(email, password);
        recordSuccessfulLogin();
        navigate('/dashboard', { replace: true });
      } else {
        if (!displayName.trim()) {
          setFormError('Display name is required.');
          setIsSubmitting(false);
          return;
        }
        await register(email, displayName, password, avatarFile);
        navigate('/dashboard', { replace: true });
      }
    } catch (err) {
      if (mode === 'login') {
        const count = recordFailedLogin();
        if (isAccountLocked()) {
          const remaining = getRemainingLockTimeSeconds();
          setLockRemaining(remaining);
          setFormError(`Too many failed attempts. Account locked for ${remaining} seconds.`);
        } else {
          const remaining = 10 - count;
          const suffix = remaining === 1 ? 'attempt' : 'attempts';
          setFormError(
            err instanceof Error
              ? `${err.message} (${remaining} ${suffix} remaining)`
              : `Login failed. ${remaining} ${suffix} remaining.`
          );
        }
      } else {
        setFormError(err instanceof Error ? err.message : 'Registration failed.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const switchMode = () => {
    setMode((prev) => (prev === 'login' ? 'register' : 'login'));
    setFormError(null);
    clearError();
    setEmail('');
    setPassword('');
    setDisplayName('');
    setAvatarFile(null);
    if (avatarPreviewUrl) {
      URL.revokeObjectURL(avatarPreviewUrl);
    }
    setAvatarPreviewUrl(null);
  };

  const displayedError = formError || error;
  const isLocked = isAccountLocked();

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo" aria-hidden="true">📚</div>
        <h1 className="auth-title">OpenShelfRating</h1>
        <p className="auth-subtitle">
          {mode === 'login' ? 'Sign in to your library' : 'Create your account'}
        </p>

        {isLocked && (
          <div className="alert alert-danger" role="alert">
            <span>⚠️ Account locked.</span>
            {lockRemaining > 0 && (
              <span> Try again in <strong>{lockRemaining}s</strong>.</span>
            )}
          </div>
        )}

        {displayedError && !isLocked && (
          <div className="alert alert-danger" role="alert">
            {displayedError}
          </div>
        )}

        <form className="auth-form" onSubmit={handleSubmit} noValidate>
          <div className="form-group">
            <label htmlFor="email" className="form-label">
              Email
            </label>
            <input
              id="email"
              type="email"
              className="form-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              autoComplete="email"
              disabled={isSubmitting || isLoading || isLocked}
            />
          </div>

          {mode === 'register' && (
            <>
              <div className="form-group">
                <label htmlFor="displayName" className="form-label">
                  Display Name
                </label>
                <input
                  id="displayName"
                  type="text"
                  className="form-input"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Your name"
                  required
                  autoComplete="name"
                  disabled={isSubmitting || isLoading}
                />
              </div>

              <div className="form-group">
                <label htmlFor="avatar" className="form-label">
                  Avatar (optional)
                </label>
                <input
                  id="avatar"
                  type="file"
                  className="form-input"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleAvatarChange}
                  disabled={isSubmitting || isLoading}
                />
                {avatarFile && <small>{avatarFile.name}</small>}
                {avatarPreviewUrl && (
                  <img
                    src={avatarPreviewUrl}
                    alt="Avatar preview"
                    style={{ width: '64px', height: '64px', borderRadius: '50%', objectFit: 'cover', marginTop: '8px' }}
                  />
                )}
              </div>
            </>
          )}

          <div className="form-group">
            <label htmlFor="password" className="form-label">
              Password
            </label>
            <input
              id="password"
              type="password"
              className="form-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={mode === 'register' ? 'Min. 8 chars, uppercase, number, special char' : '••••••••'}
              required
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              disabled={isSubmitting || isLoading || isLocked}
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-full"
            disabled={isSubmitting || isLoading || isLocked || !email || !password}
          >
            {isSubmitting || isLoading ? (
              <LoadingSpinner size="small" />
            ) : mode === 'login' ? (
              'Sign In'
            ) : (
              'Create Account'
            )}
          </button>
        </form>

        <div className="auth-switch">
          <span>
            {mode === 'login' ? "Don't have an account?" : 'Already have an account?'}
          </span>
          <button className="btn-link" onClick={switchMode}>
            {mode === 'login' ? 'Sign up' : 'Sign in'}
          </button>
        </div>

      </div>
    </div>
  );
};

export default LoginPage;
