/**
 * Dashboard page - Main home page for authenticated users.
 * Displays library statistics and paginated book list.
 * REQ-004, REQ-005 from SPEC-0006.
 */

import React, { useState } from 'react';
import { StatsSection } from '../components/Library/StatsSection';
import { BookList } from '../components/Library/BookList';
import { PaginationControls } from '../components/Library/PaginationControls';
import { SearchFilter } from '../components/Library/SearchFilter';
import { useLibraryBooks, useLibraryStats } from '../hooks/useLibrary';
import { usePagination } from '../hooks/usePagination';
import { ReadingState } from '../types/shared';
import { LoadingSpinner } from '../components/Common/LoadingSpinner';

const DashboardPage: React.FC = () => {
  const pagination = usePagination();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedState, setSelectedState] = useState<ReadingState | null>(null);

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

      <StatsSection stats={stats} isLoading={statsLoading} />

      <div className="library-filters">
        <SearchFilter onSearch={handleSearch} onFilterByState={handleFilterByState} />
      </div>

      {isLoading && <LoadingSpinner size="medium" />}

      {!isLoading && (
        <>
          <BookList
            books={libraryData?.content}
            isEmpty={!libraryData?.content || libraryData.content.length === 0}
          />

          {libraryData && libraryData.totalPages > 0 && (
            <PaginationControls
              currentPage={pagination.state.page}
              totalPages={libraryData.totalPages}
              onPreviousPage={pagination.goToPrevious}
              onNextPage={pagination.goToNext}
              onGoToPage={pagination.goToPage}
            />
          )}
        </>
      )}
    </div>
  );
};

export default DashboardPage;

export default DashboardPage;
