/**
 * Library service - API calls for library operations.
 * REQ-006, REQ-007, REQ-008 from SPEC-0006.
 */

import { API_BASE_URL } from '../api';
import type { PaginatedResponse } from '../types/shared';
import type {
  UserBook,
  LibraryStats,
  SearchLibraryRequest,
  TransitionStateRequest,
  UpdateReviewRequest,
} from '../types/library';

const mapUserBook = (item: UserBook & { book?: { primaryAuthor?: string; author?: string } }): UserBook => ({
  ...item,
  book: {
    ...item.book,
    author: item.book?.author ?? item.book?.primaryAuthor ?? '',
  },
});

/**
 * Fetch paginated library for authenticated user.
 * REQ-006, REQ-008 from SPEC-0006.
 */
export const fetchLibraryBooks = async (
  userId: string,
  request: SearchLibraryRequest,
  token: string
): Promise<PaginatedResponse<UserBook>> => {
  const params = new URLSearchParams({
    page: request.page.toString(),
    size: request.size.toString(),
    ...(request.state && { state: request.state }),
    ...(request.search && { q: request.search }),
  });

  const response = await fetch(`${API_BASE_URL}/users/${userId}/library?${params}`, {
    method: 'GET',
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!response.ok) {
    throw new Error('Failed to fetch library');
  }

  const page = await response.json();

  return {
    ...page,
    content: (page.content ?? []).map(mapUserBook),
  };
};

/**
 * Fetch library statistics.
 * REQ-004, REQ-005 from SPEC-0006.
 */
export const fetchLibraryStats = async (userId: string, token: string): Promise<LibraryStats> => {
  const response = await fetch(`${API_BASE_URL}/users/${userId}/library/stats`, {
    method: 'GET',
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!response.ok) {
    throw new Error('Failed to fetch library stats');
  }

  return response.json();
};

/**
 * Add book to user's library.
 */
export const addBookToLibrary = async (userId: string, bookId: string, token: string): Promise<UserBook> => {
  const response = await fetch(`${API_BASE_URL}/users/${userId}/library`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ bookId }),
  });

  if (!response.ok) {
    throw new Error('Failed to add book');
  }

  const item = await response.json();
  return mapUserBook(item);
};

/**
 * Remove book from user's library.
 */
export const removeBookFromLibrary = async (userId: string, bookId: string, token: string): Promise<void> => {
  const response = await fetch(`${API_BASE_URL}/users/${userId}/library/${bookId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!response.ok) {
    throw new Error('Failed to remove book');
  }
};

/**
 * Transition reading state of a book.
 * REQ-004 from SPEC-0006 (state transition modal).
 */
export const transitionReadingState = async (
  userId: string,
  bookId: string,
  request: Omit<TransitionStateRequest, 'bookId'>,
  token: string
): Promise<UserBook> => {
  const response = await fetch(`${API_BASE_URL}/users/${userId}/library/${bookId}/state`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    throw new Error('Failed to transition reading state');
  }

  const item = await response.json();
  return mapUserBook(item);
};

/**
 * Update book review (rating + opinion).
 * REQ-004 from SPEC-0006 (rate book modal).
 */
export const updateReview = async (
  userId: string,
  bookId: string,
  request: Omit<UpdateReviewRequest, 'bookId'>,
  token: string
): Promise<UserBook> => {
  const response = await fetch(`${API_BASE_URL}/users/${userId}/library/${bookId}/review`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    throw new Error('Failed to update review');
  }

  const item = await response.json();
  return mapUserBook(item);
};
