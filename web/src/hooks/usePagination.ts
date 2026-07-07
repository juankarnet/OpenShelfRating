/**
 * Custom hook for pagination state management.
 */

import { useState, useCallback } from 'react';
import type { PaginationState } from '../types/pagination';

/**
 * Hook to manage pagination state.
 * REQ-006, REQ-008 from SPEC-0006: Pagination with 10 items/page.
 */
export const usePagination = (initialPage: number = 0, initialSize: number = 10) => {
  const [state, setState] = useState<PaginationState>({
    page: initialPage,
    size: initialSize,
    totalPages: 0,
    totalElements: 0,
  });

  const goToPage = useCallback((page: number) => {
    setState((prev) => ({
      ...prev,
      page: Math.max(0, Math.min(page, prev.totalPages - 1)),
    }));
  }, []);

  const goToNextPage = useCallback(() => {
    setState((prev) => ({
      ...prev,
      page: Math.min(prev.page + 1, prev.totalPages - 1),
    }));
  }, []);

  const goToPreviousPage = useCallback(() => {
    setState((prev) => ({
      ...prev,
      page: Math.max(0, prev.page - 1),
    }));
  }, []);

  const setPageSize = useCallback((size: number) => {
    setState((prev) => ({
      ...prev,
      size,
      page: 0, // Reset to first page on size change
    }));
  }, []);

  const hasNextPage = useCallback(() => {
    return state.page < state.totalPages - 1;
  }, [state.page, state.totalPages]);

  const hasPreviousPage = useCallback(() => {
    return state.page > 0;
  }, [state.page]);

  const reset = useCallback(() => {
    setState({
      page: initialPage,
      size: initialSize,
      totalPages: 0,
      totalElements: 0,
    });
  }, [initialPage, initialSize]);

  const updatePageInfo = useCallback((totalPages: number, totalElements: number) => {
    setState((prev) => ({
      ...prev,
      totalPages,
      totalElements,
    }));
  }, []);

  return {
    state,
    goToPage,
    goToNextPage,
    goToPreviousPage,
    setPageSize,
    hasNextPage,
    hasPreviousPage,
    reset,
    updatePageInfo,
  };
};
