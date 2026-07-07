import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ActionIcon } from '../Common/ActionIcon';

const LABELS: Record<string, string> = {
  dashboard: 'Dashboard',
  library: 'Library',
  profile: 'Profile',
  'add-book': 'Add Book',
  settings: 'Settings',
  help: 'Help',
};

const toTitleCase = (value: string): string =>
  value
    .split('-')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');

export const Breadcrumbs: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const pathnames = location.pathname.split('/').filter(Boolean);
  const crumbs = pathnames.map((segment, index) => {
    const to = `/${pathnames.slice(0, index + 1).join('/')}`;
    const label = LABELS[segment] ?? toTitleCase(segment);
    return { to, label };
  });

  const canGoBack = typeof window !== 'undefined' && window.history.length > 1;

  return (
    <div className="app-breadcrumbs" aria-label="Breadcrumb navigation">
      <button
        type="button"
        className="btn btn-secondary btn-sm breadcrumbs-back icon-only-btn"
        onClick={() => (canGoBack ? navigate(-1) : navigate('/dashboard'))}
        data-tooltip="Atras"
        aria-label="Atras"
      >
        <ActionIcon name="back" />
      </button>

      <nav className="breadcrumbs-trail" aria-label="Current location">
        <Link to="/dashboard" className="breadcrumbs-link">
          Home
        </Link>

        {crumbs.map((crumb, index) => {
          const isLast = index === crumbs.length - 1;
          return (
            <React.Fragment key={crumb.to}>
              <span className="breadcrumbs-separator" aria-hidden="true">
                /
              </span>
              {isLast ? (
                <span className="breadcrumbs-current" aria-current="page">
                  {crumb.label}
                </span>
              ) : (
                <Link to={crumb.to} className="breadcrumbs-link">
                  {crumb.label}
                </Link>
              )}
            </React.Fragment>
          );
        })}
      </nav>
    </div>
  );
};
