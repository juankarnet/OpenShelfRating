/**
 * Library page - Full library view with advanced filters.
 * REQ-006, REQ-007, REQ-008 from SPEC-0006.
 */

import React, { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
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
import { mediaApi } from '../api';
import { useAuth } from '../hooks/useAuth';
import { BookDetailModal } from '../components/Modals/BookDetailModal';

const LibraryPage: React.FC = () => {
  const queryClient = useQueryClient();
  const { token } = useAuth();
  const pagination = usePagination();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedState, setSelectedState] = useState<ReadingState | null>(null);
  const [selectedBookId, setSelectedBookId] = useState<string | null>(null);

  // Modals
  const [showStateModal, setShowStateModal] = useState(false);
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [showRemoveModal, setShowRemoveModal] = useState(false);
  const [showCoverModal, setShowCoverModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [isCoverSubmitting, setIsCoverSubmitting] = useState(false);
  const [coverError, setCoverError] = useState<string | null>(null);

  const ALLOWED_COVER_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
  const MAX_COVER_SIZE_BYTES = 10 * 1024 * 1024;

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

  const handleSelectCoverFile = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;
    if (!file) {
      setCoverFile(null);
      return;
    }

    if (!ALLOWED_COVER_MIME_TYPES.includes(file.type)) {
      setCoverError('Cover must be JPG, PNG, or WebP.');
      event.target.value = '';
      return;
    }

    if (file.size > MAX_COVER_SIZE_BYTES) {
      setCoverError('Cover image must be 10MB or smaller.');
      event.target.value = '';
      return;
    }

    setCoverError(null);
    setCoverFile(file);
  };

  const handleUploadCover = async () => {
    if (!selectedBook?.book?.id || !token || !coverFile) {
      return;
    }

    setIsCoverSubmitting(true);
    setCoverError(null);
    try {
      await mediaApi.uploadCover(selectedBook.book.id, coverFile, token);
      await queryClient.invalidateQueries({ queryKey: ['library'] });
      setShowCoverModal(false);
      setCoverFile(null);
    } catch (err) {
      setCoverError(err instanceof Error ? err.message : 'Failed to upload cover.');
    } finally {
      setIsCoverSubmitting(false);
    }
  };

  const handleDeleteCover = async () => {
    if (!selectedBook?.book?.id || !token) {
      return;
    }

    setIsCoverSubmitting(true);
    setCoverError(null);
    try {
      await mediaApi.deleteCover(selectedBook.book.id, token);
      await queryClient.invalidateQueries({ queryKey: ['library'] });
      setShowCoverModal(false);
      setCoverFile(null);
    } catch (err) {
      setCoverError(err instanceof Error ? err.message : 'Failed to delete cover.');
    } finally {
      setIsCoverSubmitting(false);
    }
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
            onViewDetails={(id) => {
              setSelectedBookId(id);
              setShowDetailModal(true);
            }}
            onManageCover={(id) => {
              setSelectedBookId(id);
              setCoverFile(null);
              setCoverError(null);
              setShowCoverModal(true);
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

          <BookDetailModal
            userBook={selectedBook}
            isOpen={showDetailModal}
            onClose={() => setShowDetailModal(false)}
            onCoverUpdated={() => {
              void queryClient.invalidateQueries({ queryKey: ['library'] });
            }}
          />

          {showCoverModal && (
            <div className="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="cover-title">
              <div className="modal-box">
                <h2 id="cover-title" className="modal-title">Manage Cover</h2>
                <p className="modal-body">{selectedBook.book.title}</p>

                <div className="form-group" style={{ textAlign: 'left' }}>
                  <label htmlFor="cover-upload" className="form-label">Upload new cover</label>
                  <input
                    id="cover-upload"
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    className="form-input"
                    onChange={handleSelectCoverFile}
                    disabled={isCoverSubmitting}
                  />
                </div>

                {coverError && <div className="alert alert-danger">{coverError}</div>}

                <div className="modal-actions">
                  <button
                    className="btn btn-secondary"
                    onClick={() => {
                      setShowCoverModal(false);
                      setCoverFile(null);
                      setCoverError(null);
                    }}
                    disabled={isCoverSubmitting}
                  >
                    Cancel
                  </button>
                  <button
                    className="btn btn-primary"
                    onClick={handleUploadCover}
                    disabled={isCoverSubmitting || !coverFile}
                  >
                    {isCoverSubmitting ? 'Uploading...' : 'Upload'}
                  </button>
                  <button
                    className="btn btn-danger"
                    onClick={handleDeleteCover}
                    disabled={isCoverSubmitting}
                  >
                    {isCoverSubmitting ? 'Processing...' : 'Delete Cover'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default LibraryPage;
