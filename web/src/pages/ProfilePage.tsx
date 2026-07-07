/**
 * Profile page - User profile view and editing.
 * REQ-011, AC-012 from SPEC-0006.
 */

import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { ConfirmActionModal } from '../components/Modals/ConfirmActionModal';
import { LoadingSpinner } from '../components/Common/LoadingSpinner';

const ProfilePage: React.FC = () => {
  const ALLOWED_AVATAR_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
  const MAX_AVATAR_SIZE_BYTES = 5 * 1024 * 1024;

  const navigate = useNavigate();
  const { user, logout, updateProfile, uploadAvatar, deleteAvatar, refreshAvatarUrl, isLoading, error, clearError } = useAuth();

  const [isEditingName, setIsEditingName] = useState(false);
  const [displayName, setDisplayName] = useState(user?.displayName || '');
  const [formError, setFormError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [isDeletingAvatar, setIsDeletingAvatar] = useState(false);
  const [avatarLoadError, setAvatarLoadError] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    void refreshAvatarUrl();
  }, [refreshAvatarUrl]);

  useEffect(() => {
    setAvatarLoadError(false);
  }, [user?.avatarUrl]);

  if (!user) {
    return (
      <div className="page profile-page">
        <div className="alert alert-warning">User information not available.</div>
      </div>
    );
  }

  const handleEditName = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    clearError();

    if (!displayName.trim()) {
      setFormError('Display name cannot be empty.');
      return;
    }

    if (displayName === user.displayName) {
      setIsEditingName(false);
      return;
    }

    setIsSaving(true);

    try {
      await updateProfile({ displayName });
      setIsEditingName(false);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Failed to update profile.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancelEdit = () => {
    setDisplayName(user.displayName);
    setIsEditingName(false);
    setFormError(null);
  };

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  const handleAvatarFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;
    if (!file) {
      return;
    }

    if (!ALLOWED_AVATAR_MIME_TYPES.includes(file.type)) {
      setFormError('Avatar must be JPG, PNG, or WebP.');
      event.target.value = '';
      return;
    }

    if (file.size > MAX_AVATAR_SIZE_BYTES) {
      setFormError('Avatar image must be 5MB or smaller.');
      event.target.value = '';
      return;
    }

    setFormError(null);
    clearError();
    setIsUploadingAvatar(true);
    try {
      await uploadAvatar(file);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Failed to upload avatar.');
    } finally {
      event.target.value = '';
      setIsUploadingAvatar(false);
    }
  };

  const handleDeleteAvatar = async () => {
    setFormError(null);
    clearError();
    setIsDeletingAvatar(true);
    try {
      await deleteAvatar();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Failed to delete avatar.');
    } finally {
      setIsDeletingAvatar(false);
    }
  };

  const displayedError = formError || error;

  return (
    <div className="page profile-page">
      <h1 className="page-title">Profile</h1>

      <div className="profile-container">
        {/* Profile Header Card */}
        <div className="profile-card">
          <div className="profile-avatar">
            {user.avatarUrl && !avatarLoadError ? (
              <img
                className="profile-avatar-image"
                src={user.avatarUrl}
                alt={`${user.displayName} avatar`}
                onError={() => setAvatarLoadError(true)}
              />
            ) : (
              <div className="avatar-placeholder">
                {user.displayName.charAt(0).toUpperCase()}
              </div>
            )}
            <div className="avatar-actions">
              <input
                ref={avatarInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="avatar-file-input"
                onChange={handleAvatarFileChange}
                disabled={isLoading || isSaving || isUploadingAvatar || isDeletingAvatar}
              />
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => avatarInputRef.current?.click()}
                disabled={isLoading || isSaving || isUploadingAvatar || isDeletingAvatar}
              >
                {isUploadingAvatar ? 'Uploading...' : 'Change avatar'}
              </button>
              {user.avatarUrl && (
                <button
                  type="button"
                  className="btn btn-link"
                  onClick={handleDeleteAvatar}
                  disabled={isLoading || isSaving || isUploadingAvatar || isDeletingAvatar}
                >
                  {isDeletingAvatar ? 'Removing...' : 'Remove avatar'}
                </button>
              )}
            </div>
          </div>

          <div className="profile-info">
            <div className="profile-field">
              <label className="profile-label">Email</label>
              <p className="profile-value readonly">{user.email}</p>
            </div>

            <div className="profile-field">
              <label className="profile-label">Display Name</label>
              {isEditingName ? (
                <form className="profile-edit-form" onSubmit={handleEditName}>
                  <input
                    type="text"
                    className="form-input"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="Your display name"
                    disabled={isSaving || isLoading}
                    autoFocus
                  />
                  <div className="form-actions">
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={handleCancelEdit}
                      disabled={isSaving || isLoading}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="btn btn-primary"
                      disabled={isSaving || isLoading}
                    >
                      {isSaving ? 'Saving...' : 'Save'}
                    </button>
                  </div>
                </form>
              ) : (
                <div className="profile-value-with-action">
                  <p className="profile-value">{user.displayName}</p>
                  <button
                    className="btn btn-link"
                    onClick={() => setIsEditingName(true)}
                    disabled={isLoading}
                  >
                    Edit
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Error Message */}
        {displayedError && (
          <div className="alert alert-danger" role="alert">
            {displayedError}
          </div>
        )}

        {/* Loading State */}
        {(isLoading || isSaving || isUploadingAvatar || isDeletingAvatar) && <LoadingSpinner message="Processing..." />}

        {/* Logout Button */}
        <div className="profile-actions">
          <button
            className="btn btn-danger"
            onClick={() => setShowLogoutConfirm(true)}
            disabled={isLoading || isSaving}
          >
            Logout
          </button>
        </div>
      </div>

      {/* Logout Confirmation Modal */}
      <ConfirmActionModal
        isOpen={showLogoutConfirm}
        title="Confirm Logout"
        message="Are you sure you want to logout? You will need to sign in again."
        confirmText="Logout"
        cancelText="Cancel"
        isDangerous={true}
        isLoading={isLoading}
        onConfirm={handleLogout}
        onCancel={() => setShowLogoutConfirm(false)}
      />
    </div>
  );
};

export default ProfilePage;
