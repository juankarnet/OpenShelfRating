/**
 * Dashboard page - Main home page for authenticated users.
 * Displays library statistics and paginated book list.
 * REQ-004, REQ-005 from SPEC-0006.
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { StatsSection } from '../components/Library/StatsSection';
import { BookList } from '../components/Library/BookList';
import { PaginationControls } from '../components/Library/PaginationControls';
import { SearchFilter } from '../components/Library/SearchFilter';
import { useLibraryBooks, useLibraryStats, useRemoveBook } from '../hooks/useLibrary';
import { usePagination } from '../hooks/usePagination';
import { ReadingState } from '../types/shared';
import { LoadingSpinner } from '../components/Common/LoadingSpinner';
import type { UserBook } from '../types/library';
import { BookDetailModal } from '../components/Modals/BookDetailModal';
import { ConfirmActionModal } from '../components/Modals/ConfirmActionModal';
import { ActionIcon } from '../components/Common/ActionIcon';
import { useAuth } from '../hooks/useAuth';
import { deleteBookFromCatalog, getBookDeletionEligibility } from '../services/libraryService';

const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { token, user } = useAuth();
  const pagination = usePagination();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedState, setSelectedState] = useState<ReadingState | null>(null);
  const [selectedBookId, setSelectedBookId] = useState<string | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showRemoveModal, setShowRemoveModal] = useState(false);
  const [showCatalogDeleteModal, setShowCatalogDeleteModal] = useState(false);
  const [removeSuccess, setRemoveSuccess] = useState<string | null>(null);
  const [removeError, setRemoveError] = useState<string | null>(null);
  const [pendingCatalogDeletion, setPendingCatalogDeletion] = useState<{ bookId: string; title: string } | null>(null);
  const [detailBook, setDetailBook] = useState<UserBook | null>(null);

  const { data: stats, isLoading: statsLoading } = useLibraryStats();
  const { data: libraryData, isLoading: booksLoading } = useLibraryBooks({
    page: pagination.state.page,
    size: pagination.state.size,
    search: searchQuery,
    state: selectedState,
  });
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

  const handleRemoveBook = async () => {
    if (!selectedBookId) return;
    const bookTitle = selectedBook?.book.title ?? 'Book';
    const catalogBookId = selectedBook?.book.bookId ?? selectedBook?.book.id;

    if (!catalogBookId) {
      setRemoveError('Cannot remove this book because its catalog identifier is missing.');
      return;
    }

    try {
      await removeMutation.mutateAsync(catalogBookId);
      setShowRemoveModal(false);
      setShowDetailModal(false);
      setDetailBook(null);
      setRemoveError(null);

      if (token && user?.userId) {
        const eligibility = await getBookDeletionEligibility(catalogBookId, user.userId, token);
        if (eligibility.canDeleteSystemBook) {
          setPendingCatalogDeletion({ bookId: catalogBookId, title: bookTitle });
          setShowCatalogDeleteModal(true);
          return;
        }
      }

      setRemoveSuccess(`"${bookTitle}" removed from your library.`);
      setTimeout(() => setRemoveSuccess(null), 4000);
    } catch (err) {
      setShowRemoveModal(false);
      setRemoveError(err instanceof Error ? err.message : 'Failed to remove book. Please try again.');
    }
  };

  const handleDeleteBookFromCatalog = async () => {
    if (!pendingCatalogDeletion || !token || !user?.userId) {
      return;
    }

    try {
      await deleteBookFromCatalog(pendingCatalogDeletion.bookId, user.userId, token);
      setShowCatalogDeleteModal(false);
      setRemoveError(null);
      setRemoveSuccess(`"${pendingCatalogDeletion.title}" removed from the system catalog.`);
      setTimeout(() => setRemoveSuccess(null), 4000);
      setPendingCatalogDeletion(null);
      await queryClient.invalidateQueries({ queryKey: ['library'] });
    } catch (err) {
      setRemoveError(err instanceof Error ? err.message : 'Failed to delete book from system catalog.');
      setShowCatalogDeleteModal(false);
    }
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

      <div className="library-filters dashboard-search-row">
        <SearchFilter onSearch={handleSearch} className="dashboard-search-filter" />
        <button
          type="button"
          className="btn btn-primary icon-only-btn"
          onClick={() => navigate('/add-book')}
          data-tooltip="Add book"
          aria-label="Add book"
        >
          <ActionIcon name="add" />
        </button>
      </div>

      {removeSuccess && (
        <div className="alert alert-success" style={{ marginBottom: '12px' }}>{removeSuccess}</div>
      )}
      {removeError && (
        <div className="alert alert-danger" style={{ marginBottom: '12px' }}>
          {removeError}
          <button
            type="button"
            className="btn btn-link btn-sm"
            style={{ marginLeft: '8px' }}
            onClick={() => setRemoveError(null)}
          >
            Dismiss
          </button>
        </div>
      )}

      {isLoading && <LoadingSpinner size="medium" />}

      {!isLoading && (
        <>
          <BookList
            books={libraryData?.content}
            isEmpty={!libraryData?.content || libraryData.content.length === 0}
            onRemove={(bookId) => {
              setSelectedBookId(bookId);
              setShowRemoveModal(true);
            }}
            onViewDetails={(book) => {
              setDetailBook(book);
              setSelectedBookId(book.id);
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
          onRemove={(userBookId) => {
            setSelectedBookId(userBookId);
            setShowRemoveModal(true);
          }}
        />
      )}

      {selectedBook && (
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
      )}

      {pendingCatalogDeletion && (
        <ConfirmActionModal
          isOpen={showCatalogDeleteModal}
          title="Delete Book From System"
          message={`You created "${pendingCatalogDeletion.title}" and no other active user library links exist. Do you want to delete it from the system catalog as well?`}
          confirmText="Delete from system"
          isDangerous={true}
          onConfirm={handleDeleteBookFromCatalog}
          onCancel={() => {
            setShowCatalogDeleteModal(false);
            setPendingCatalogDeletion(null);
          }}
          isLoading={false}
        />
      )}
    </div>
  );
};

export default DashboardPage;
