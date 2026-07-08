/**
 * Add book page - Form to search and add books to personal library.
 * REQ-012, AC-013 from SPEC-0006.
 */

import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../hooks/useAuth';
import { catalogApi, libraryApi, mediaApi } from '../api';
import type { UnifiedSearchResult } from '../api';
import { ReadingState } from '../types/shared';
import { transitionReadingState, updateReview } from '../services/libraryService';
import { LoadingSpinner } from '../components/Common/LoadingSpinner';
import { ConfirmActionModal } from '../components/Modals/ConfirmActionModal';
import { resolveMediaUrl } from '../utils/mediaUrl';
import { ActionIcon } from '../components/Common/ActionIcon';

const BOOK_GENRES = [
  'CLASSIC',
  'FICTION',
  'MYSTERY',
  'THRILLER',
  'ROMANCE',
  'SCIENCE_FICTION',
  'FANTASY',
  'BIOGRAPHY',
  'HISTORY',
  'SELF_HELP',
  'EDUCATION',
  'TECHNICAL',
  'POETRY',
  'DRAMA',
  'CHILDREN',
  'YOUNG_ADULT',
] as const;

const AddBookPage: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user, token } = useAuth();

  // Form state
  const [isbn, setIsbn] = useState('');
  const [isbn10, setIsbn10] = useState('');
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [otherAuthors, setOtherAuthors] = useState('');
  const [publisher, setPublisher] = useState('');
  const [publicationDate, setPublicationDate] = useState('');
  const [pages, setPages] = useState('');
  const [language, setLanguage] = useState('en');
  const [genre, setGenre] = useState('');
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreviewUrl, setCoverPreviewUrl] = useState<string | null>(null);

  const ALLOWED_COVER_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
  const MAX_COVER_SIZE_BYTES = 10 * 1024 * 1024;

  // Search & selection state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<UnifiedSearchResult[]>([]);
  const [selectedBook, setSelectedBook] = useState<UnifiedSearchResult | null>(null);
  const [selectedInitialState, setSelectedInitialState] = useState<ReadingState>(ReadingState.PENDING);
  const [selectedInitialRating, setSelectedInitialRating] = useState(0);
  const [selectedInitialOpinion, setSelectedInitialOpinion] = useState('');
  const [draftSelectedInitialRating, setDraftSelectedInitialRating] = useState(0);
  const [draftSelectedInitialOpinion, setDraftSelectedInitialOpinion] = useState('');
  const [isSelectedReviewEditMode, setIsSelectedReviewEditMode] = useState(false);
  const [selectedReviewError, setSelectedReviewError] = useState<string | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [searchWarning, setSearchWarning] = useState<string | null>(null);

  // Submission state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [showConfirmAdd, setShowConfirmAdd] = useState(false);

  if (!user || !token) {
    return (
      <div className="page add-book-page">
        <div className="alert alert-warning">User not authenticated.</div>
      </div>
    );
  }

  const handleSearchByQuery = async () => {
    if (!searchQuery.trim()) {
      setSearchError('Please enter ISBN, title, or author.');
      return;
    }

    setIsSearching(true);
    setSearchError(null);
    setSearchWarning(null);
    setSearchResults([]);
    setSelectedBook(null);

    try {
      const response = await catalogApi.searchUnified(searchQuery.trim(), 10, user.userId, token);
      if (response.results && response.results.length > 0) {
        setSearchResults(response.results);
      } else {
        setSearchError('No books found. You can create a new entry below.');
      }

      if (response.externalSearchFailed) {
        setSearchWarning('Open Library is temporarily unavailable. Showing local results only.');
      }
    } catch (err) {
      setSearchError(err instanceof Error ? err.message : 'Search failed.');
    } finally {
      setIsSearching(false);
    }
  };

  const handleSelectBook = (book: UnifiedSearchResult) => {
    setSelectedBook(book);
    setSelectedInitialState(ReadingState.PENDING);
    setSelectedInitialRating(0);
    setSelectedInitialOpinion('');
    setDraftSelectedInitialRating(0);
    setDraftSelectedInitialOpinion('');
    setIsSelectedReviewEditMode(false);
    setSelectedReviewError(null);
    setSearchResults([]);
  };

  const handleClearSelection = () => {
    setSelectedBook(null);
    setSelectedInitialState(ReadingState.PENDING);
    setSelectedInitialRating(0);
    setSelectedInitialOpinion('');
    setDraftSelectedInitialRating(0);
    setDraftSelectedInitialOpinion('');
    setIsSelectedReviewEditMode(false);
    setSelectedReviewError(null);
    setTitle('');
    setAuthor('');
    setOtherAuthors('');
    setPublisher('');
    setPublicationDate('');
    setPages('');
    setGenre('');
    setIsbn10('');
    setCoverFile(null);
    setCoverPreviewUrl(null);
    setSearchQuery('');
  };

  const getStatusLabel = (book: UnifiedSearchResult): string => {
    if (book.status === 'EXISTS_IN_USER_LIBRARY') return 'Already in your library';
    if (book.status === 'EXISTS_IN_SYSTEM') return 'Available in catalog';
    return 'Import from Open Library';
  };

  const getSourceLabel = (book: UnifiedSearchResult): string =>
    book.source === 'OPEN_LIBRARY' ? 'Open Library' : 'Local catalog';

  const getBookIdentity = (book: UnifiedSearchResult): string => {
    if (book.isbn13) return `ISBN-13: ${book.isbn13}`;
    if (book.isbn10) return `ISBN-10: ${book.isbn10}`;
    return 'ISBN not available';
  };

  const shouldAutoEnableSelectedReviewEdit = (state: ReadingState, rating: number, opinion: string) =>
    state === ReadingState.READ && rating <= 0 && opinion.trim().length === 0;

  const handleSelectedStateChange = (state: ReadingState) => {
    setSelectedInitialState(state);
    setSelectedReviewError(null);
    setIsSelectedReviewEditMode(shouldAutoEnableSelectedReviewEdit(state, selectedInitialRating, selectedInitialOpinion));
  };

  const handleSaveSelectedReviewDraft = () => {
    if (draftSelectedInitialRating < 1 || draftSelectedInitialRating > 5) {
      setSelectedReviewError('Selecciona una valoración entre 1 y 5 estrellas.');
      return;
    }

    setSelectedInitialRating(draftSelectedInitialRating);
    setSelectedInitialOpinion(draftSelectedInitialOpinion);
    setIsSelectedReviewEditMode(false);
    setSelectedReviewError(null);
  };

  const handleCoverFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;
    if (!file) {
      setCoverFile(null);
      if (coverPreviewUrl) {
        URL.revokeObjectURL(coverPreviewUrl);
      }
      setCoverPreviewUrl(null);
      return;
    }

    if (!ALLOWED_COVER_MIME_TYPES.includes(file.type)) {
      setSubmitError('La portada debe ser JPG, PNG o WebP.');
      event.target.value = '';
      return;
    }

    if (file.size > MAX_COVER_SIZE_BYTES) {
      setSubmitError('La portada debe ser de 10MB o menos.');
      event.target.value = '';
      return;
    }

    setSubmitError(null);
    setCoverFile(file);
    if (coverPreviewUrl) {
      URL.revokeObjectURL(coverPreviewUrl);
    }
    setCoverPreviewUrl(URL.createObjectURL(file));
  };

  useEffect(() => {
    return () => {
      if (coverPreviewUrl) {
        URL.revokeObjectURL(coverPreviewUrl);
      }
    };
  }, [coverPreviewUrl]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);

    // Validation
    if (!title.trim()) {
      setSubmitError('Title is required.');
      return;
    }

    if (!author.trim()) {
      setSubmitError('Author is required.');
      return;
    }

    setShowConfirmAdd(true);
  };

  const handleConfirmAdd = async () => {
    setIsSubmitting(true);
    setSubmitError(null);

    try {
      let bookId: string;
      let userBookId: string | null = null;

      if (selectedBook) {
        if (selectedBook.status === 'EXISTS_IN_USER_LIBRARY') {
          setSubmitError('This book is already in your library.');
          setShowConfirmAdd(false);
          return;
        }

        const addFromSearchResponse = await catalogApi.addFromUnifiedSearch(
          {
            source: selectedBook.source,
            bookId: selectedBook.bookId ?? undefined,
            title: selectedBook.title,
            primaryAuthor: selectedBook.primaryAuthor,
            otherAuthors: selectedBook.otherAuthors,
            isbn13: selectedBook.isbn13 ?? undefined,
            isbn10: selectedBook.isbn10 ?? undefined,
            publisher: selectedBook.publisher ?? undefined,
            publicationDate: selectedBook.publicationDate ?? undefined,
            pages: selectedBook.pages ?? undefined,
            language: selectedBook.language,
            genres: selectedBook.genres,
            coverUrl: selectedBook.coverUrl ?? undefined,
            externalSourceId: selectedBook.externalSourceId ?? undefined,
          },
          user.userId,
          token,
        );

        bookId = addFromSearchResponse.bookId;
        userBookId = addFromSearchResponse.userBookId;
      } else {
        // Create new book
        const newBook = await catalogApi.create(
          {
            title: title.trim(),
            primaryAuthor: author.trim(),
            otherAuthors: otherAuthors
              .split(',')
              .map((value) => value.trim())
              .filter(Boolean),
            isbn13: isbn.trim() || undefined,
            isbn10: isbn10.trim() || undefined,
            publisher: publisher.trim() || undefined,
            publicationDate: publicationDate || undefined,
            pages: pages.trim() ? Number(pages) : undefined,
            language,
            genres: genre ? [genre] : undefined,
          },
          user.userId,
          token
        );
        bookId = newBook.bookId;

        if (coverFile) {
          await mediaApi.uploadCover(bookId, coverFile, token);
        }
      }

      if (!selectedBook) {
        const userBook = await libraryApi.addBook(user.userId, bookId, token);
        userBookId = userBook.userBookId;
      }

      const ratingToPersist = isSelectedReviewEditMode ? draftSelectedInitialRating : selectedInitialRating;
      const opinionToPersist = isSelectedReviewEditMode ? draftSelectedInitialOpinion : selectedInitialOpinion;

      if (selectedBook && selectedInitialState !== ReadingState.PENDING) {
        if (!userBookId) {
          throw new Error('Book was added but reading state could not be initialized.');
        }

        await transitionReadingState(
          user.userId,
          userBookId,
          {
            nextState: selectedInitialState,
            readDate: selectedInitialState === ReadingState.READ ? new Date().toISOString().slice(0, 10) : undefined,
          },
          token,
        );

        if (selectedInitialState === ReadingState.READ && ratingToPersist > 0) {
          await updateReview(
            user.userId,
            userBookId,
            {
              rating: ratingToPersist,
              opinion: opinionToPersist.trim() || undefined,
            },
            token,
          );
        }
      }

      // Force refetch on dashboard/library views so the new book appears immediately.
      await queryClient.invalidateQueries({ queryKey: ['library'] });

      // Success - redirect to dashboard or library
      navigate('/dashboard', { replace: true, state: { bookAdded: true } });
    } catch (err) {
      // Extract detailed error message
      let errorMsg = 'No se pudo agregar el libro.';
      if (err instanceof Error) {
        errorMsg = err.message;
      }
      setSubmitError(errorMsg);
      setShowConfirmAdd(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddSelectedBook = () => {
    if (selectedBook?.status === 'EXISTS_IN_USER_LIBRARY') {
      setSubmitError('This book is already in your library.');
      return;
    }
    setSubmitError(null);
    setShowConfirmAdd(true);
  };

  return (
    <div className="page add-book-page">
      <h1 className="page-title">Add Book to Library</h1>

      <div className="add-book-container">
        {/* Search Section */}
        <div className="search-section">
          <h2 className="section-title">Search Existing Books</h2>

          <div className="search-form">
            <div className="form-group">
              <label htmlFor="isbn" className="form-label">
                Search by ISBN, title, or author
              </label>
              <div className="input-with-button">
                <input
                  id="isbn"
                  type="text"
                  className="form-input"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="978-0-1234-5678-9 or The Hobbit or Tolkien"
                  disabled={isSearching || isSubmitting}
                />
                <button
                  type="button"
                  className="btn btn-secondary icon-only-btn"
                  onClick={handleSearchByQuery}
                  disabled={!searchQuery.trim() || isSearching || isSubmitting}
                  data-tooltip={isSearching ? 'Searching...' : 'Search'}
                  aria-label={isSearching ? 'Searching...' : 'Search'}
                >
                  <ActionIcon name="search" />
                </button>
              </div>
            </div>

            {searchError && <div className="alert alert-warning">{searchError}</div>}
            {searchWarning && <div className="alert alert-warning">{searchWarning}</div>}

            {/* Search Results */}
            {searchResults.length > 0 && (
              <div className="search-results">
                <h3 className="results-title">Results ({searchResults.length})</h3>
                <div className="results-list">
                  {searchResults.map((book) => (
                    <div
                      key={book.bookId}
                      className={`result-item ${selectedBook?.bookId === book.bookId ? 'selected' : ''}`}
                    >
                      {book.coverUrl && (
                        <img
                          src={resolveMediaUrl(book.coverUrl)}
                          alt={book.title}
                          className="result-cover"
                        />
                      )}
                      <div className="result-info">
                        <h4 className="result-title">{book.title}</h4>
                        <p className="result-author">{book.primaryAuthor}</p>
                        <p className="result-author">{getSourceLabel(book)} · {getStatusLabel(book)}</p>
                        {book.metadataCompletionStatus === 'INCOMPLETE' && (
                          <p className="result-author">Metadata incomplete</p>
                        )}
                      </div>
                      <button
                        type="button"
                        className="btn btn-primary btn-sm icon-only-btn"
                        onClick={() => handleSelectBook(book)}
                        disabled={book.status === 'EXISTS_IN_USER_LIBRARY'}
                        data-tooltip="Select"
                        aria-label="Select"
                      >
                        <ActionIcon name="confirm" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Selected Book */}
            {selectedBook && (
              <div className="selected-book">
                <div className="selected-main">
                  <div className="selected-content">
                    {selectedBook.coverUrl && (
                      <img src={resolveMediaUrl(selectedBook.coverUrl)} alt={selectedBook.title} />
                    )}
                    <div className="selected-info">
                      <h4>{selectedBook.title}</h4>
                      <p>{selectedBook.primaryAuthor}</p>
                      <p>{getSourceLabel(selectedBook)} · {getStatusLabel(selectedBook)}</p>
                      <p>{getBookIdentity(selectedBook)}</p>
                      <p>{selectedBook.publisher || 'Publisher not available'}</p>
                      <p>{selectedBook.language ? `Language: ${selectedBook.language}` : 'Language not available'}</p>
                      {selectedBook.metadataCompletionStatus === 'INCOMPLETE' && (
                        <p>Some metadata is incomplete and may be improved later.</p>
                      )}
                    </div>
                  </div>

                  {selectedBook.status === 'EXISTS_IN_USER_LIBRARY' && (
                    <div className="selected-reading-panel">
                      <h3 className="selected-reading-title">Reading setup</h3>
                      <div className="book-reading-actions selected-reading-actions">
                      {[ReadingState.PENDING, ReadingState.READING, ReadingState.READ].map((state) => (
                        <button
                          key={state}
                          type="button"
                          className={`btn btn-sm ${selectedInitialState === state ? 'btn-primary' : 'btn-secondary'}`}
                          onClick={() => handleSelectedStateChange(state)}
                          disabled={isSubmitting}
                        >
                          {state === ReadingState.PENDING ? 'Pending' : state === ReadingState.READING ? 'Reading' : 'Read'}
                        </button>
                      ))}
                      </div>

                      {selectedInitialState === ReadingState.READ && (
                        <>
                          {isSelectedReviewEditMode ? (
                            <div className="book-review-inline selected-review-inline">
                              <div className="book-review-stars" role="radiogroup" aria-label="Initial rating">
                                {[1, 2, 3, 4, 5].map((value) => (
                                  <button
                                    key={value}
                                    type="button"
                                    className={`star-btn ${value <= draftSelectedInitialRating ? 'active' : ''}`}
                                    onClick={() => setDraftSelectedInitialRating(value)}
                                    aria-label={`${value} stars`}
                                    disabled={isSubmitting}
                                  >
                                    ★
                                  </button>
                                ))}
                              </div>
                              <textarea
                                className="form-input selected-review-input"
                                value={draftSelectedInitialOpinion}
                                onChange={(event) => setDraftSelectedInitialOpinion(event.target.value)}
                                placeholder="Add a short comment (optional)"
                                rows={2}
                                disabled={isSubmitting}
                              />
                              <div className="selected-review-actions">
                                <button
                                  type="button"
                                  className="btn btn-secondary btn-sm icon-only-btn"
                                  onClick={() => {
                                    setDraftSelectedInitialRating(selectedInitialRating);
                                    setDraftSelectedInitialOpinion(selectedInitialOpinion);
                                    setIsSelectedReviewEditMode(false);
                                    setSelectedReviewError(null);
                                  }}
                                  disabled={isSubmitting}
                                  data-tooltip="Cancel"
                                  aria-label="Cancel"
                                >
                                  <ActionIcon name="cancel" />
                                </button>
                                <button
                                  type="button"
                                  className="btn btn-primary btn-sm icon-only-btn"
                                  onClick={handleSaveSelectedReviewDraft}
                                  disabled={isSubmitting}
                                  data-tooltip="Save review"
                                  aria-label="Save review"
                                >
                                  <ActionIcon name="save" />
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div className="selected-review-readonly">
                              <div className="selected-review-readonly-rating">
                                {selectedInitialRating > 0
                                  ? `${'★'.repeat(selectedInitialRating)}${'☆'.repeat(5 - selectedInitialRating)}`
                                  : 'Not rated'}
                              </div>
                              <p className="selected-review-readonly-opinion">{selectedInitialOpinion || 'No comment'}</p>
                              <div className="selected-review-actions">
                                <button
                                  type="button"
                                  className="btn btn-secondary btn-sm icon-only-btn"
                                  onClick={() => {
                                    setDraftSelectedInitialRating(selectedInitialRating);
                                    setDraftSelectedInitialOpinion(selectedInitialOpinion);
                                    setIsSelectedReviewEditMode(true);
                                    setSelectedReviewError(null);
                                  }}
                                  disabled={isSubmitting}
                                  data-tooltip="Edit review"
                                  aria-label="Edit review"
                                >
                                  <ActionIcon name="edit" />
                                </button>
                              </div>
                            </div>
                          )}

                          {selectedReviewError && <div className="alert alert-danger">{selectedReviewError}</div>}
                        </>
                      )}
                    </div>
                  )}
                </div>

                <div className="selected-controls">
                  <button
                    type="button"
                    className="btn btn-link icon-only-btn"
                    onClick={handleClearSelection}
                    disabled={isSubmitting}
                    data-tooltip="Change"
                    aria-label="Change"
                  >
                    <ActionIcon name="clear" />
                  </button>
                  <button
                    type="button"
                    className="btn btn-primary icon-only-btn"
                    onClick={handleAddSelectedBook}
                    disabled={isSubmitting || selectedBook.status === 'EXISTS_IN_USER_LIBRARY'}
                    data-tooltip={isSubmitting ? 'Adding...' : 'Add to Library'}
                    aria-label={isSubmitting ? 'Adding...' : 'Add to Library'}
                  >
                    <ActionIcon name="add" />
                  </button>
                </div>
                {submitError && <div className="alert alert-danger">{submitError}</div>}
              </div>
            )}
          </div>
        </div>

        {/* Manual Entry Section */}
        {!selectedBook && (
          <div className="manual-section">
            <h2 className="section-title">Or Enter Book Details Manually</h2>

            <form className="book-form" onSubmit={handleSubmit} noValidate>
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="title" className="form-label">
                    Title <span className="required">*</span>
                  </label>
                  <input
                    id="title"
                    type="text"
                    className="form-input"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Book title"
                    required
                    disabled={isSubmitting}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="author" className="form-label">
                    Author <span className="required">*</span>
                  </label>
                  <input
                    id="author"
                    type="text"
                    className="form-input"
                    value={author}
                    onChange={(e) => setAuthor(e.target.value)}
                    placeholder="Author name"
                    required
                    disabled={isSubmitting}
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="isbn13" className="form-label">
                    ISBN-13
                  </label>
                  <input
                    id="isbn13"
                    type="text"
                    className="form-input"
                    value={isbn}
                    onChange={(e) => setIsbn(e.target.value)}
                    placeholder="978-0-1234-5678-9"
                    disabled={isSubmitting}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="isbn10" className="form-label">
                    ISBN-10
                  </label>
                  <input
                    id="isbn10"
                    type="text"
                    className="form-input"
                    value={isbn10}
                    onChange={(e) => setIsbn10(e.target.value)}
                    placeholder="0-123456-47-9"
                    disabled={isSubmitting}
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="publisher" className="form-label">
                    Publisher
                  </label>
                  <input
                    id="publisher"
                    type="text"
                    className="form-input"
                    value={publisher}
                    onChange={(e) => setPublisher(e.target.value)}
                    placeholder="Publisher (optional)"
                    disabled={isSubmitting}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="language" className="form-label">
                    Language
                  </label>
                  <select
                    id="language"
                    className="form-input"
                    value={language}
                    onChange={(e) => setLanguage(e.target.value)}
                    disabled={isSubmitting}
                  >
                    <option value="en">English</option>
                    <option value="es">Spanish</option>
                    <option value="fr">French</option>
                    <option value="de">German</option>
                    <option value="it">Italian</option>
                    <option value="pt">Portuguese</option>
                    <option value="ru">Russian</option>
                    <option value="ja">Japanese</option>
                    <option value="zh">Chinese</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="otherAuthors" className="form-label">
                  Other authors
                </label>
                <input
                  id="otherAuthors"
                  type="text"
                  className="form-input"
                  value={otherAuthors}
                  onChange={(e) => setOtherAuthors(e.target.value)}
                  placeholder="Comma separated (optional)"
                  disabled={isSubmitting}
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="publicationDate" className="form-label">
                    Publication date
                  </label>
                  <input
                    id="publicationDate"
                    type="date"
                    className="form-input"
                    value={publicationDate}
                    onChange={(e) => setPublicationDate(e.target.value)}
                    disabled={isSubmitting}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="pages" className="form-label">
                    Pages
                  </label>
                  <input
                    id="pages"
                    type="number"
                    min="1"
                    className="form-input"
                    value={pages}
                    onChange={(e) => setPages(e.target.value)}
                    placeholder="320"
                    disabled={isSubmitting}
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="genre" className="form-label">
                  Book type
                </label>
                <select
                  id="genre"
                  className="form-input"
                  value={genre}
                  onChange={(e) => setGenre(e.target.value)}
                  disabled={isSubmitting}
                >
                  <option value="">Select one</option>
                  {BOOK_GENRES.map((option) => (
                    <option key={option} value={option}>{option.replaceAll('_', ' ')}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="coverFile" className="form-label">
                  Cover Image Upload
                </label>
                <input
                  id="coverFile"
                  type="file"
                  className="form-input"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleCoverFileChange}
                  disabled={isSubmitting}
                />
                {coverPreviewUrl && (
                  <img
                    src={coverPreviewUrl}
                    alt="Cover preview"
                    style={{ width: '120px', height: '180px', objectFit: 'cover', marginTop: '8px', borderRadius: '8px' }}
                  />
                )}
              </div>

              {submitError && <div className="alert alert-danger">{submitError}</div>}

              {(isSearching || isSubmitting) && <LoadingSpinner message="Processing..." />}

              <div className="form-actions">
                <button
                  type="button"
                  className="btn btn-secondary icon-only-btn"
                  onClick={() => navigate('/dashboard')}
                  disabled={isSubmitting}
                  data-tooltip="Cancel"
                  aria-label="Cancel"
                >
                  <ActionIcon name="cancel" />
                </button>
                <button
                  type="submit"
                  className="btn btn-primary icon-only-btn"
                  disabled={!title.trim() || !author.trim() || isSubmitting}
                  data-tooltip={isSubmitting ? 'Adding...' : 'Add to Library'}
                  aria-label={isSubmitting ? 'Adding...' : 'Add to Library'}
                >
                  <ActionIcon name="add" />
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Confirmation Modal */}
        <ConfirmActionModal
          isOpen={showConfirmAdd}
          title="Add Book to Library"
          message={
            selectedBook
              ? `Add "${selectedBook.title}" by ${selectedBook.primaryAuthor} to your library?`
              : `Add "${title}" by ${author} to your library?`
          }
          confirmText="Add"
          cancelText="Cancel"
          isLoading={isSubmitting}
          onConfirm={handleConfirmAdd}
          onCancel={() => setShowConfirmAdd(false)}
        />
      </div>
    </div>
  );
};

export default AddBookPage;
