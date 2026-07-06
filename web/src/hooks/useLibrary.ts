/**
 * Custom hooks for library operations using TanStack Query.
 * Handles fetching, caching, and mutations for library data.
 * REQ-005 from SPEC-0006: TanStack Query for server state management.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from './useAuth';
import {
  fetchLibraryBooks,
  fetchLibraryStats,
  addBookToLibrary,
  removeBookFromLibrary,
  transitionReadingState,
  updateReview,
} from '../services/libraryService';
import {
  PaginatedResponse,
  ReadingState,
} from '../types/shared';
import {
  UserBook,
  LibraryStats,
  SearchLibraryRequest,
  TransitionStateRequest,
  UpdateReviewRequest,
} from '../types/library';

// Query keys for cache management
const libraryKeys = {
  all: ['library'] as const,
  books: (filters?: SearchLibraryRequest) => [...libraryKeys.all, 'books', filters] as const,
  stats: () => [...libraryKeys.all, 'stats'] as const,
};

/**
 * Hook to fetch paginated library books.
 * REQ-006, REQ-007, REQ-008 from SPEC-0006.
 */
export const useLibraryBooks = (filters: SearchLibraryRequest) => {
  const { token } = useAuth();

  return useQuery({
    queryKey: libraryKeys.books(filters),
    queryFn: () => {
      if (!token) throw new Error('No token');
      return fetchLibraryBooks(filters, token);
    },
    enabled: !!token,
    staleTime: 1000 * 60 * 2, // 2 minutes
  });
};

/**
 * Hook to fetch library statistics.
 * REQ-004, REQ-005 from SPEC-0006.
 */
export const useLibraryStats = () => {
  const { token } = useAuth();

  return useQuery({
    queryKey: libraryKeys.stats(),
    queryFn: () => {
      if (!token) throw new Error('No token');
      return fetchLibraryStats(token);
    },
    enabled: !!token,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};

/**
 * Hook to add book to library.
 */
export const useAddBook = () => {
  const { token } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (bookId: string) => {
      if (!token) throw new Error('No token');
      return addBookToLibrary(bookId, token);
    },
    onSuccess: () => {
      // Invalidate both books list and stats
      queryClient.invalidateQueries({ queryKey: libraryKeys.books() });
      queryClient.invalidateQueries({ queryKey: libraryKeys.stats() });
    },
  });
};

/**
 * Hook to remove book from library.
 */
export const useRemoveBook = () => {
  const { token } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (bookId: string) => {
      if (!token) throw new Error('No token');
      return removeBookFromLibrary(bookId, token);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: libraryKeys.books() });
      queryClient.invalidateQueries({ queryKey: libraryKeys.stats() });
    },
  });
};

/**
 * Hook to transition reading state.
 * REQ-004 from SPEC-0006.
 */
export const useTransitionReadingState = () => {
  const { token } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      bookId,
      nextState,
      readDate,
    }: { bookId: string; nextState: ReadingState; readDate?: string }) => {
      if (!token) throw new Error('No token');
      return transitionReadingState(bookId, { nextState, readDate }, token);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: libraryKeys.books() });
      queryClient.invalidateQueries({ queryKey: libraryKeys.stats() });
    },
  });
};

/**
 * Hook to update book review (rating + opinion).
 * REQ-004 from SPEC-0006.
 */
export const useUpdateReview = () => {
  const { token } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ bookId, rating, opinion }: { bookId: string; rating: number; opinion?: string }) => {
      if (!token) throw new Error('No token');
      return updateReview(bookId, { rating, opinion }, token);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: libraryKeys.books() });
      queryClient.invalidateQueries({ queryKey: libraryKeys.stats() });
    },
  });
};
