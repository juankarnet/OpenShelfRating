/**
 * Custom hook for accessing authentication context.
 */

import { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { AuthContextType } from '../types/auth';

/**
 * Hook to access authentication context.
 * Must be used within AuthProvider.
 * @returns AuthContextType with auth state and methods
 * @throws Error if used outside AuthProvider
 */
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);

  if (context === undefined) {
    throw new Error('useAuth must be used within AuthProvider');
  }

  return context;
};
