/**
 * Shared types and interfaces across the application.
 */

/**
 * Reading state enumeration for books in user's library.
 */
export enum ReadingState {
  PENDING = 'PENDING',
  READING = 'READING',
  READ = 'READ',
}

/**
 * Media resource type enumeration.
 */
export enum MediaResourceType {
  USER_AVATAR = 'USER_AVATAR',
  BOOK_COVER = 'BOOK_COVER',
}

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
