/**
 * Pagination-related types.
 */

/**
 * Pagination state management.
 */
export interface PaginationState {
  page: number; // Current page (0-indexed)
  size: number; // Items per page
  totalPages: number;
  totalElements: number;
}

/**
 * Pagination context value.
 */
export interface PaginationContextType {
  state: PaginationState;
  goToPage: (page: number) => void;
  goToNextPage: () => void;
  goToPreviousPage: () => void;
  setPageSize: (size: number) => void;
  hasNextPage: () => boolean;
  hasPreviousPage: () => boolean;
  reset: () => void;
}
