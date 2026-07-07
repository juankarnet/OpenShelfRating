/**
 * Library page - Full library view with advanced filters.
 * REQ-006, REQ-007, REQ-008 from SPEC-0006.
 */

import React, { useState } from 'react';
import { StatsSection } from '../components/Library/StatsSection';
import { BookList } from '../components/Library/BookList';
import { PaginationControls } from '../components/Library/PaginationControls';
import { SearchFilter } from '../components/Library/SearchFilter';
import { ChangeStateModal } from '../components/Modals/ChangeStateModal';
import { RateBookModal } from '../components/Modals/RateBookModal';
import { ConfirmActionModal } from '../components/Modals/ConfirmActionModal';
import { useLibraryBooks, useLibraryStats, useTransitionReadingState, useUpdateReview, useRemoveBook } from '../hooks/useLibrary';
import { usePagination } from '../hooks/usePagination';
import { ReadingState } from '../types/shared';
import { LoadingSpinner } from '../components/Common/LoadingSpinner';

const LibraryPage: React.FC = () => {
  const pagination = usePagination();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedState, setSelectedState] = useState<ReadingState | null>(null);
  const [selectedBookId, setSelectedBookId] = useState<string | null>(null);

  // Modals
  const [showStateModal, setShowStateModal] = useState(false);
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [showRemoveModal, setShowRemoveModal] = useState(false);

  const { data: stats, isLoading: statsLoading } = useLibraryStats();
  const { data: libraryData, isLoading: booksLoading } = useLibraryBooks({
    page: pagination.state.page,
    size: pagination.state.size,
    search: searchQuery,
    state: selectedState,
  });

  const transitionMutation = useTransitionReadingState();
  const reviewMutation = useUpdateReview();
  const removeMutation = useRemoveBook();

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

  const selectedBook = libraryData?.content.find((b) => b.id === selectedBookId);

  const handleChangeState = async (nextState: ReadingState, readDate?: string) => {
    if (!selectedBookId) return;
    await transitionMutation.mutateAsync({ bookId: selectedBookId, nextState, readDate });
    setShowStateModal(false);
  };

  const handleUpdateRating = async (rating: number, opinion?: string) => {
    if (!selectedBookId) return;
    await reviewMutation.mutateAsync({ bookId: selectedBookId, rating, opinion });
    setShowRatingModal(false);
  };

  const handleRemoveBook = async () => {
    if (!selectedBookId) return;
    await removeMutation.mutateAsync(selectedBookId);
    setShowRemoveModal(false);
  };

  const isLoading = statsLoading || booksLoading;

  return (
    <div className="page library-page">
      <h1 className="page-title">Library</h1>

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
            onChangeState={(id) => {
              setSelectedBookId(id);
              setShowStateModal(true);
            }}
            onEditRating={(id) => {
              setSelectedBookId(id);
              setShowRatingModal(true);
            }}
            onRemove={(id) => {
              setSelectedBookId(id);
              setShowRemoveModal(true);
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

      {selectedBook && (
        <>
          <ChangeStateModal
            isOpen={showStateModal}
            bookTitle={selectedBook.book.title}
            currentState={selectedBook.state}
            onConfirm={handleChangeState}
            onCancel={() => setShowStateModal(false)}
            isLoading={transitionMutation.isPending}
          />

          <RateBookModal
            isOpen={showRatingModal}
            bookTitle={selectedBook.book.title}
            currentRating={selectedBook.rating}
            currentOpinion={selectedBook.opinion}
            onConfirm={handleUpdateRating}
            onCancel={() => setShowRatingModal(false)}
            isLoading={reviewMutation.isPending}
          />

          <ConfirmActionModal
            isOpen={showRemoveModal}
            title="Remove Book"
            message={`Are you sure you want to remove "${selectedBook.book.title}" from your library?`}
            confirmText="Remove"
            isDangerous={true}
            onConfirm={handleRemoveBook}
            onCancel={() => setShowRemoveModal(false)}
            isLoading={removeMutation.isPending}
          />
        </>
      )}
    </div>
  );
};

export default LibraryPage;
