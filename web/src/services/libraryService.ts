/**
 * Library service - API calls for library operations.
 * REQ-006, REQ-007, REQ-008 from SPEC-0006.
 */

import { API_BASE_URL } from '../api';
import { resolveMediaUrl } from '../utils/mediaUrl';

type BookState = 'PENDING' | 'READING' | 'READ';

interface ServiceBook {
  id: string;
  bookId?: string;
  title: string;
  author: string;
  primaryAuthor?: string;
  coverUrl?: string;
  createdBy?: string;
  isbn13?: string;
  publisher?: string;
  language?: string;
  pages?: number;
  publicationDate?: string;
}

interface ServiceUserBook {
  id: string;
  userId: string;
  book: ServiceBook;
  state: BookState;
  rating?: number;
  opinion?: string;
  addedAt: string;
  reviewUpdatedAt?: string;
}

interface ServiceLibraryStats {
  totalBooks: number;
  stateDistribution: Partial<Record<BookState, number>>;
  averageRating: number;
}

interface ServiceSearchLibraryRequest {
  page: number;
  size: number;
  state?: BookState | null;
  search?: string;
}

interface ServicePaginatedResponse<T> {
  content: T[];
  totalPages: number;
  totalElements: number;
  size: number;
  number: number;
}

interface ServiceTransitionStateRequest {
  bookId: string;
  nextState: BookState;
  readDate?: string;
}

interface ServiceUpdateReviewRequest {
  bookId: string;
  rating: number;
  opinion?: string;
}

const mapUserBook = (item: ServiceUserBook & { book?: { primaryAuthor?: string; author?: string } }): ServiceUserBook => ({
  ...item,
  book: {
    ...item.book,
    author: item.book?.author ?? item.book?.primaryAuthor ?? '',
    bookId: (item.book as ServiceBook & { bookId?: string })?.bookId ?? item.book?.id,
    createdBy: (item.book as ServiceBook & { createdBy?: string })?.createdBy,
    coverUrl: resolveMediaUrl(item.book?.coverUrl),
  },
});

/**
 * Fetch paginated library for authenticated user.
 * REQ-006, REQ-008 from SPEC-0006.
 */
export const fetchLibraryBooks = async (
  userId: string,
  request: ServiceSearchLibraryRequest,
  token: string
): Promise<ServicePaginatedResponse<ServiceUserBook>> => {
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
export const fetchLibraryStats = async (userId: string, token: string): Promise<ServiceLibraryStats> => {
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
export const addBookToLibrary = async (userId: string, bookId: string, token: string): Promise<ServiceUserBook> => {
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
  request: Omit<ServiceTransitionStateRequest, 'bookId'>,
  token: string
): Promise<ServiceUserBook> => {
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
  request: Omit<ServiceUpdateReviewRequest, 'bookId'>,
  token: string
): Promise<ServiceUserBook> => {
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
