/**
 * Profile page - User profile view and editing.
 * REQ-011, AC-012 from SPEC-0006.
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { ConfirmActionModal } from '../components/Modals/ConfirmActionModal';
import { LoadingSpinner } from '../components/Common/LoadingSpinner';

const ProfilePage: React.FC = () => {
  const navigate = useNavigate();
  const { user, logout, updateProfile, isLoading, error, clearError } = useAuth();

  const [isEditingName, setIsEditingName] = useState(false);
  const [displayName, setDisplayName] = useState(user?.displayName || '');
  const [formError, setFormError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

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

  const displayedError = formError || error;

  return (
    <div className="page profile-page">
      <h1 className="page-title">Profile</h1>

      <div className="profile-container">
        {/* Profile Header Card */}
        <div className="profile-card">
          <div className="profile-avatar">
            <div className="avatar-placeholder">
              {user.displayName.charAt(0).toUpperCase()}
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
        {(isLoading || isSaving) && <LoadingSpinner message="Processing..." />}

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
