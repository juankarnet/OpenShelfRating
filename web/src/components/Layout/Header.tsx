/**
 * Application header with branding and user menu.
 * REQ-010 from SPEC-0006: Header accessible from all authenticated pages.
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { UserMenu } from './UserMenu';

export const Header: React.FC = () => {
  const navigate = useNavigate();

  return (
    <header className="app-header">
      <button
        className="app-logo"
        onClick={() => navigate('/dashboard')}
        aria-label="Go to Home"
      >
        <span className="app-logo-icon">📚</span>
        <span className="app-logo-text">OpenShelfRating</span>
      </button>
      <nav className="app-nav" aria-label="Main navigation">
        <UserMenu />
      </nav>
    </header>
  );
};
