/**
 * Library-related types and interfaces.
 */

import { ReadingState } from './shared';

/**
 * Book information from the global catalog.
 */
export interface Book {
  id: string;
  title: string;
  author: string;
  isbn13?: string;
  publisher?: string;
  language?: string;
  coverUrl?: string;
}

/**
 * User's book in their personal library.
 */
export interface UserBook {
  id: string;
  userId: string;
  book: Book;
  state: ReadingState;
  rating?: number; // 1-5 stars
  opinion?: string;
  addedAt: string;
  reviewUpdatedAt?: string;
}

/**
 * Library statistics for a user.
 */
export interface LibraryStats {
  totalBooks: number;
  stateDistribution: {
    [key in ReadingState]?: number;
  };
  averageRating: number; // Average of read books with ratings
}

/**
 * Request to search/filter library.
 */
export interface SearchLibraryRequest {
  page: number; // 0-indexed
  size: number; // Items per page
  state?: ReadingState | null; // Filter by reading state
  search?: string; // Text search on title/author
}

/**
 * Book state transition request.
 */
export interface TransitionStateRequest {
  bookId: string;
  nextState: ReadingState;
  readDate?: string; // ISO date string when transitioned to READ
}

/**
 * Review/rating update request.
 */
export interface UpdateReviewRequest {
  bookId: string;
  rating: number; // 1-5
  opinion?: string;
}

/**
 * Response from add book to library.
 */
export interface AddBookResponse {
  userBook: UserBook;
  message: string;
}

/**
 * Response from remove book.
 */
export interface RemoveBookResponse {
  message: string;
  bookId: string;
}
