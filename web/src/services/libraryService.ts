/**
 * Library service - API calls for library operations.
 * REQ-006, REQ-007, REQ-008 from SPEC-0006.
 */

import { API_BASE_URL } from '../api';
import { PaginatedResponse, ReadingState } from '../types/shared';
import {
  UserBook,
  LibraryStats,
  SearchLibraryRequest,
  TransitionStateRequest,
  UpdateReviewRequest,
  AddBookResponse,
  RemoveBookResponse,
  Book,
} from '../types/library';

const API_URL = `${API_BASE_URL}/library`;

/**
 * Fetch paginated library for authenticated user.
 * REQ-006, REQ-008 from SPEC-0006.
 */
export const fetchLibraryBooks = async (
  request: SearchLibraryRequest,
  token: string
): Promise<PaginatedResponse<UserBook>> => {
  const params = new URLSearchParams({
    page: request.page.toString(),
    size: request.size.toString(),
    ...(request.state && { state: request.state }),
    ...(request.search && { search: request.search }),
  });

  const response = await fetch(`${API_URL}?${params}`, {
    method: 'GET',
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!response.ok) {
    throw new Error('Failed to fetch library');
  }

  return response.json();
};

/**
 * Fetch library statistics.
 * REQ-004, REQ-005 from SPEC-0006.
 */
export const fetchLibraryStats = async (token: string): Promise<LibraryStats> => {
  const response = await fetch(`${API_URL}/stats`, {
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
export const addBookToLibrary = async (bookId: string, token: string): Promise<AddBookResponse> => {
  const response = await fetch(`${API_URL}`, {
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

  return response.json();
};

/**
 * Remove book from user's library.
 */
export const removeBookFromLibrary = async (bookId: string, token: string): Promise<RemoveBookResponse> => {
  const response = await fetch(`${API_URL}/${bookId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!response.ok) {
    throw new Error('Failed to remove book');
  }

  return response.json();
};

/**
 * Transition reading state of a book.
 * REQ-004 from SPEC-0006 (state transition modal).
 */
export const transitionReadingState = async (
  bookId: string,
  request: Omit<TransitionStateRequest, 'bookId'>,
  token: string
): Promise<UserBook> => {
  const response = await fetch(`${API_URL}/${bookId}/state`, {
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

  return response.json();
};

/**
 * Update book review (rating + opinion).
 * REQ-004 from SPEC-0006 (rate book modal).
 */
export const updateReview = async (
  bookId: string,
  request: Omit<UpdateReviewRequest, 'bookId'>,
  token: string
): Promise<UserBook> => {
  const response = await fetch(`${API_URL}/${bookId}/review`, {
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

  return response.json();
};
