/**
 * Pagination controls component.
 * REQ-008 from SPEC-0006: Previous/Next buttons, page display.
 */

import React from 'react';

interface PaginationControlsProps {
  currentPage: number;
  totalPages: number;
  onPreviousPage: () => void;
  onNextPage: () => void;
  onGoToPage: (page: number) => void;
  className?: string;
}

export const PaginationControls: React.FC<PaginationControlsProps> = ({
  currentPage,
  totalPages,
  onPreviousPage,
  onNextPage,
  onGoToPage,
  className = '',
}) => {
  const hasPrevious = currentPage > 0;
  const hasNext = currentPage < totalPages - 1;

  return (
    <div className={`pagination ${className}`} role="navigation" aria-label="Pagination">
      <button
        className="btn btn-secondary btn-sm"
        onClick={onPreviousPage}
        disabled={!hasPrevious}
        aria-label="Previous page"
      >
        ← Previous
      </button>

      <div className="pagination-info">
        {totalPages > 0 ? (
          <>
            <span>Page</span>
            <div className="page-selector">
              {Array.from({ length: Math.min(totalPages, 5) }).map((_, i) => {
                const pageNum = i;
                const isCurrentOrNear = Math.abs(pageNum - currentPage) <= 2;
                if (!isCurrentOrNear && totalPages > 5) return null;

                return (
                  <button
                    key={pageNum}
                    className={`page-btn ${pageNum === currentPage ? 'active' : ''}`}
                    onClick={() => onGoToPage(pageNum)}
                    aria-current={pageNum === currentPage ? 'page' : undefined}
                    aria-label={`Go to page ${pageNum + 1}`}
                  >
                    {pageNum + 1}
                  </button>
                );
              })}
            </div>
            <span>of {totalPages}</span>
          </>
        ) : (
          <span>No results</span>
        )}
      </div>

      <button
        className="btn btn-secondary btn-sm"
        onClick={onNextPage}
        disabled={!hasNext}
        aria-label="Next page"
      >
        Next →
      </button>
    </div>
  );
};
