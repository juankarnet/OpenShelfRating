/**
 * User context menu with navigation options.
 * REQ-009 from SPEC-0006: Menu options - Profile, Home, Add Book, Settings, Help, Logout.
 */

import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { ActionIcon } from '../Common/ActionIcon';

interface MenuItem {
  label: string;
  icon: React.ReactNode;
  path?: string;
  action?: () => void;
  separator?: boolean;
  className?: string;
}

export const UserMenu: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [triggerAvatarError, setTriggerAvatarError] = useState(false);
  const [menuAvatarError, setMenuAvatarError] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  useEffect(() => {
    setTriggerAvatarError(false);
    setMenuAvatarError(false);
  }, [user?.avatarUrl]);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleNavigate = (path: string) => {
    navigate(path);
    setIsOpen(false);
  };

  const handleLogoutClick = () => {
    setIsOpen(false);
    setShowLogoutConfirm(true);
  };

  const handleLogoutConfirm = () => {
    logout();
    setShowLogoutConfirm(false);
    navigate('/login');
  };

  const menuItems: MenuItem[] = [
    { label: 'Home', icon: <ActionIcon name="details" />, path: '/dashboard' },
    { label: 'Profile', icon: <ActionIcon name="edit" />, path: '/profile' },
    { label: 'Add Book', icon: <ActionIcon name="add" />, path: '/add-book' },
    { label: 'Settings', icon: <ActionIcon name="confirm" />, path: '/settings' },
    { label: 'Help', icon: <ActionIcon name="details" />, path: '/help' },
    { label: '', icon: null, separator: true },
    { label: 'Logout', icon: <ActionIcon name="logout" />, action: handleLogoutClick, className: 'menu-item-danger' },
  ];

  const displayName = user?.displayName || user?.email || 'User';
  const initials = displayName.charAt(0).toUpperCase();

  return (
    <>
      <div className="user-menu" ref={menuRef}>
        <button
          className="user-menu-trigger"
          onClick={() => setIsOpen((prev) => !prev)}
          aria-expanded={isOpen}
          aria-haspopup="menu"
          aria-label={`User menu for ${displayName}`}
        >
          <span className="user-avatar" aria-hidden="true">
            {user?.avatarUrl && !triggerAvatarError ? (
              <img
                src={user.avatarUrl}
                alt=""
                className="user-avatar-image"
                onError={() => setTriggerAvatarError(true)}
              />
            ) : (
              initials
            )}
          </span>
          <span className="user-name">{displayName}</span>
          <span className="menu-chevron" aria-hidden="true">
            {isOpen ? '▲' : '▼'}
          </span>
        </button>

        {isOpen && (
          <div className="user-menu-dropdown" role="menu" aria-label="User menu">
            <div className="menu-user-info">
              <div className="menu-user-avatar">
                {user?.avatarUrl && !menuAvatarError ? (
                  <img
                    src={user.avatarUrl}
                    alt=""
                    className="menu-user-avatar-image"
                    onError={() => setMenuAvatarError(true)}
                  />
                ) : (
                  initials
                )}
              </div>
              <div className="menu-user-details">
                <span className="menu-user-name">{displayName}</span>
                {user?.email && <span className="menu-user-email">{user.email}</span>}
              </div>
            </div>
            <hr className="menu-divider" />
            {menuItems.map((item, index) => {
              if (item.separator) {
                return <hr key={index} className="menu-divider" />;
              }
              return (
                <button
                  key={item.label}
                  className={`menu-item ${item.className ?? ''}`}
                  role="menuitem"
                  onClick={() => {
                    if (item.path) {
                      handleNavigate(item.path);
                    } else if (item.action) {
                      item.action();
                    }
                  }}
                >
                  <span className="menu-item-icon" aria-hidden="true">
                    {item.icon}
                  </span>
                  <span className="menu-item-label">{item.label}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Logout confirmation dialog */}
      {showLogoutConfirm && (
        <div className="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="logout-title">
          <div className="modal-box">
            <h2 id="logout-title" className="modal-title">
              Log out
            </h2>
            <p className="modal-body">Are you sure you want to log out?</p>
            <div className="modal-actions">
              <button
                className="btn btn-secondary icon-only-btn"
                onClick={() => setShowLogoutConfirm(false)}
                data-tooltip="Cancel"
                aria-label="Cancel"
              >
                <ActionIcon name="cancel" />
              </button>
              <button className="btn btn-danger icon-only-btn" onClick={handleLogoutConfirm} data-tooltip="Log out" aria-label="Log out">
                <ActionIcon name="logout" />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
