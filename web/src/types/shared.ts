/**
 * Shared types and interfaces across the application.
 */

/**
 * Reading state enumeration for books in user's library.
 */
export const ReadingState = {
  PENDING: 'PENDING',
  READING: 'READING',
  READ: 'READ',
} as const;

export type ReadingState = typeof ReadingState[keyof typeof ReadingState];

/**
 * Media resource type enumeration.
 */
export const MediaResourceType = {
  USER_AVATAR: 'USER_AVATAR',
  BOOK_COVER: 'BOOK_COVER',
} as const;

export type MediaResourceType = typeof MediaResourceType[keyof typeof MediaResourceType];

/**
 * Generic API error response.
 */
export interface ApiErrorResponse {
  status: number;
  message: string;
  details?: Record<string, unknown>;
  timestamp?: string;
}

/**
 * Generic paginated API response.
 */
export interface PaginatedResponse<T> {
  totalPages: number;
  totalElements: number;
  currentPage: number;
  content: T[];
}

/**
 * Generic API response wrapper.
 */
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: ApiErrorResponse;
}
