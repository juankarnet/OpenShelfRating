/**
 * Dashboard page - Main home page for authenticated users.
 * Displays library statistics and paginated book list.
 * REQ-004, REQ-005 from SPEC-0006.
 */

import React, { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { StatsSection } from '../components/Library/StatsSection';
import { BookList } from '../components/Library/BookList';
import { PaginationControls } from '../components/Library/PaginationControls';
import { SearchFilter } from '../components/Library/SearchFilter';
import { useLibraryBooks, useLibraryStats } from '../hooks/useLibrary';
import { usePagination } from '../hooks/usePagination';
import { ReadingState } from '../types/shared';
import { LoadingSpinner } from '../components/Common/LoadingSpinner';
import type { UserBook } from '../types/library';
import { BookDetailModal } from '../components/Modals/BookDetailModal';

const DashboardPage: React.FC = () => {
  const queryClient = useQueryClient();
  const pagination = usePagination();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedState, setSelectedState] = useState<ReadingState | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [detailBook, setDetailBook] = useState<UserBook | null>(null);

  const { data: stats, isLoading: statsLoading } = useLibraryStats();
  const { data: libraryData, isLoading: booksLoading } = useLibraryBooks({
    page: pagination.state.page,
    size: pagination.state.size,
    search: searchQuery,
    state: selectedState,
  });

  React.useEffect(() => {
    if (libraryData) {
      pagination.updatePageInfo(libraryData.totalPages, libraryData.totalElements);
    }
  }, [libraryData?.totalPages, libraryData?.totalElements]);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    pagination.reset();
  };

  const handleFilterByState = (state: ReadingState | null) => {
    setSelectedState(state);
    pagination.reset();
  };

  const isLoading = statsLoading || booksLoading;

  return (
    <div className="page dashboard-page">
      <h1 className="page-title">My Library</h1>

      <StatsSection
        stats={stats}
        isLoading={statsLoading}
        activeState={selectedState}
        onFilterByState={handleFilterByState}
      />

      <div className="library-filters">
        <SearchFilter onSearch={handleSearch} />
      </div>

      {isLoading && <LoadingSpinner size="medium" />}

      {!isLoading && (
        <>
          <BookList
            books={libraryData?.content}
            isEmpty={!libraryData?.content || libraryData.content.length === 0}
            onViewDetails={(book) => {
              setDetailBook(book);
              setShowDetailModal(true);
            }}
          />

          {libraryData && libraryData.totalPages > 0 && (
            <PaginationControls
              currentPage={pagination.state.page}
              totalPages={libraryData.totalPages}
              onPreviousPage={pagination.goToPreviousPage}
              onNextPage={pagination.goToNextPage}
              onGoToPage={pagination.goToPage}
            />
          )}
        </>
      )}

      {detailBook && (
        <BookDetailModal
          userBook={detailBook}
          isOpen={showDetailModal}
          onClose={() => {
            setShowDetailModal(false);
            setDetailBook(null);
          }}
          onCoverUpdated={() => {
            void queryClient.invalidateQueries({ queryKey: ['library'] });
          }}
        />
      )}
    </div>
  );
};

export default DashboardPage;
