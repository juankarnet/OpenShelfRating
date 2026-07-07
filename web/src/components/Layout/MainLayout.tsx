/**
 * Main application layout with header and content area.
 * Wraps all authenticated pages.
 */

import React from 'react';
import { Outlet } from 'react-router-dom';
import { Header } from './Header';
import { Breadcrumbs } from './Breadcrumbs';

export const MainLayout: React.FC = () => {
  return (
    <div className="main-layout">
      <Header />
      <Breadcrumbs />
      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
};
