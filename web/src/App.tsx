/**
 * Application root with routing setup.
 * Hierarchical SPA navigation as per SPEC-0006 REQ-001, REQ-002.
 */

import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './context/AuthContext';
import { useAuth } from './hooks/useAuth';
import { MainLayout } from './components/Layout/MainLayout';
import { ErrorBoundary } from './components/Common/ErrorBoundary';
import { LoadingSpinner } from './components/Common/LoadingSpinner';

// Pages
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import LibraryPage from './pages/LibraryPage';
import ProfilePage from './pages/ProfilePage';
import AddBookPage from './pages/AddBookPage';
import SettingsPage from './pages/SettingsPage';
import HelpPage from './pages/HelpPage';

// Create TanStack Query client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 2, // 2 minutes
      retry: 2,
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: 1,
    },
  },
});

/**
 * Route guard for authenticated routes.
 * REQ-002 from SPEC-0006: redirect unauthenticated users to /login.
 */
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="init-loading">
        <LoadingSpinner message="Loading..." size="large" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

/**
 * Route guard for guest-only routes (login page).
 * Authenticated users are redirected to /dashboard.
 */
const GuestRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="init-loading">
        <LoadingSpinner message="Loading..." size="large" />
      </div>
    );
  }

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

/**
 * Inner app with access to AuthContext.
 */
const AppRoutes: React.FC = () => {
  return (
    <Routes>
      {/* Public routes */}
      <Route
        path="/login"
        element={
          <GuestRoute>
            <LoginPage />
          </GuestRoute>
        }
      />

      {/* Authenticated routes under MainLayout */}
      <Route
        element={
          <ProtectedRoute>
            <MainLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/library" element={<LibraryPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/add-book" element={<AddBookPage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="/help" element={<HelpPage />} />
      </Route>

      {/* Root redirect */}
      <Route path="/" element={<Navigate to="/dashboard" replace />} />

      {/* 404 fallback */}
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
};

/**
 * Application root component.
 */
const App: React.FC = () => {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <AuthProvider>
            <AppRoutes />
          </AuthProvider>
        </BrowserRouter>
      </QueryClientProvider>
    </ErrorBoundary>
  );
};

export default App;
