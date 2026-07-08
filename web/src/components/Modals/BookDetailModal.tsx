/**
 * Book detail modal — loads full catalog detail, allows inline metadata editing,
 * and exposes cover management for creator/admin users.
 */

import React, { useEffect, useRef, useState } from 'react';
import type { UserBook } from '../../types/library';
import { catalogApi, mediaApi } from '../../api';
import { resolveMediaUrl } from '../../utils/mediaUrl';
import { useAuth } from '../../hooks/useAuth';
import { BaseModal } from './BaseModal';
import { ActionIcon } from '../Common/ActionIcon';
import { ReadingState } from '../../types/shared';
import { transitionReadingState, updateReview } from '../../services/libraryService';

interface BookDetailModalProps {
  userBook: UserBook;
  isOpen: boolean;
  onClose: () => void;
  onCoverUpdated: () => void;
  onRemove?: (userBookId: string) => void;
}

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_SIZE_BYTES = 10 * 1024 * 1024;
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

const LANGUAGE_OPTIONS = [
  { value: 'en', label: 'English' },
  { value: 'es', label: 'Spanish' },
  { value: 'fr', label: 'French' },
  { value: 'de', label: 'German' },
  { value: 'it', label: 'Italian' },
  { value: 'pt', label: 'Portuguese' },
  { value: 'ru', label: 'Russian' },
  { value: 'ja', label: 'Japanese' },
  { value: 'zh', label: 'Chinese' },
];

const READING_STATE_OPTIONS: Array<{ value: ReadingState; label: string }> = [
  { value: ReadingState.PENDING, label: 'Pending' },
  { value: ReadingState.READING, label: 'Reading' },
  { value: ReadingState.READ, label: 'Read' },
];

export const BookDetailModal: React.FC<BookDetailModalProps> = ({
  userBook,
  isOpen,
  onClose,
  onCoverUpdated,
  onRemove,
}) => {
  const { user, token } = useAuth();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [isLoadingDetails, setIsLoadingDetails] = useState(false);
  const [detailsError, setDetailsError] = useState<string | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [localCoverUrl, setLocalCoverUrl] = useState<string | null>(null);
  const [title, setTitle] = useState(userBook.book.title);
  const [primaryAuthor, setPrimaryAuthor] = useState(userBook.book.author);
  const [otherAuthors, setOtherAuthors] = useState('');
  const [isbn13, setIsbn13] = useState(userBook.book.isbn13 ?? '');
  const [isbn10, setIsbn10] = useState(userBook.book.isbn10 ?? '');
  const [publisher, setPublisher] = useState(userBook.book.publisher ?? '');
  const [publicationDate, setPublicationDate] = useState(userBook.book.publicationDate ?? '');
  const [pages, setPages] = useState(userBook.book.pages?.toString() ?? '');
  const [language, setLanguage] = useState(userBook.book.language ?? 'en');
  const [genre, setGenre] = useState(userBook.book.genres?.[0] ?? '');
  const [allGenres, setAllGenres] = useState<string[]>(userBook.book.genres ?? []);
  const [createdByValue, setCreatedByValue] = useState(userBook.book.createdBy ?? '');
  const [createdByName, setCreatedByName] = useState('');
  const [bookCreatedAt, setBookCreatedAt] = useState(userBook.book.createdAt ?? '');
  const [synopsis, setSynopsis] = useState(userBook.book.synopsis ?? '');

  const [currentState, setCurrentState] = useState<ReadingState>(userBook.state);
  const [reviewRating, setReviewRating] = useState<number>(userBook.rating ?? 0);
  const [reviewOpinion, setReviewOpinion] = useState<string>(userBook.opinion ?? '');
  const [draftReviewRating, setDraftReviewRating] = useState<number>(userBook.rating ?? 0);
  const [draftReviewOpinion, setDraftReviewOpinion] = useState<string>(userBook.opinion ?? '');
  const [isReviewEditMode, setIsReviewEditMode] = useState(false);
  const [isUpdatingState, setIsUpdatingState] = useState(false);
  const [isSavingReview, setIsSavingReview] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const { book, addedAt } = userBook;
  const bookIdForMedia = book.bookId ?? book.id;
  const normalizedUserId = (user?.userId ?? '').trim().toLowerCase();
  const effectiveCreatedBy = (createdByValue || book.createdBy || '').trim();
  const normalizedCreatedBy = effectiveCreatedBy.toLowerCase();
  const isCreator = Boolean(normalizedUserId && normalizedCreatedBy && normalizedUserId === normalizedCreatedBy);
  const isAdmin = user?.role === 'ADMIN';
  // If backend detail does not provide createdBy, keep actions visible and let backend enforce final authorization.
  const canManageBook = Boolean(token && user && (isCreator || isAdmin || !normalizedCreatedBy));
  const hasCover = !!(localCoverUrl ?? book.coverUrl);
  const displayCover = localCoverUrl ?? book.coverUrl;

  const resetEditableState = (source: {
    title: string;
    primaryAuthor: string;
    otherAuthors?: string[];
    isbn13?: string | null;
    isbn10?: string | null;
    publisher?: string | null;
    publicationDate?: string | null;
    pages?: number | null;
    language?: string | null;
    genres?: string[];
    coverUrl?: string | null;
    createdBy?: string;
    createdByName?: string | null;
    synopsis?: string | null;
    createdAt?: string;
    updatedAt?: string;
    canonical?: boolean;
    existing?: boolean;
  }) => {
    setTitle(source.title ?? '');
    setPrimaryAuthor(source.primaryAuthor ?? '');
    setOtherAuthors((source.otherAuthors ?? []).join(', '));
    setIsbn13(source.isbn13 ?? '');
    setIsbn10(source.isbn10 ?? '');
    setPublisher(source.publisher ?? '');
    setPublicationDate(source.publicationDate ?? '');
    setPages(source.pages != null ? String(source.pages) : '');
    setLanguage(source.language ?? 'en');
    setGenre(source.genres?.[0] ?? '');
    setAllGenres(source.genres ?? []);
    setLocalCoverUrl(source.coverUrl ? resolveMediaUrl(source.coverUrl) ?? source.coverUrl : null);
    setCreatedByValue(source.createdBy ?? book.createdBy ?? '');
    setCreatedByName(source.createdByName ?? '');
    setSynopsis(source.synopsis ?? '');
    setBookCreatedAt(source.createdAt ?? book.createdAt ?? '');
  };

  useEffect(() => {
    if (!isOpen) {
      setIsEditMode(false);
      setUploadError(null);
      setDetailsError(null);
      setActionError(null);
      setCurrentState(userBook.state);
      setReviewRating(userBook.rating ?? 0);
      setReviewOpinion(userBook.opinion ?? '');
      setDraftReviewRating(userBook.rating ?? 0);
      setDraftReviewOpinion(userBook.opinion ?? '');
      setIsReviewEditMode(shouldAutoEnableReviewEdit(userBook.state, userBook.rating ?? 0, userBook.opinion ?? ''));
      resetEditableState({
        title: userBook.book.title,
        primaryAuthor: userBook.book.author,
        otherAuthors: userBook.book.otherAuthors,
        isbn13: userBook.book.isbn13,
        isbn10: userBook.book.isbn10,
        publisher: userBook.book.publisher,
        publicationDate: userBook.book.publicationDate,
        pages: userBook.book.pages,
        language: userBook.book.language,
        genres: userBook.book.genres,
        coverUrl: userBook.book.coverUrl,
        createdBy: userBook.book.createdBy,        createdByName: undefined,
        synopsis: userBook.book.synopsis,        createdAt: userBook.book.createdAt,
        updatedAt: userBook.book.updatedAt,
        canonical: userBook.book.canonical,
        existing: userBook.book.existing,
      });
      return;
    }

    let isCancelled = false;

    const loadDetails = async () => {
      setIsLoadingDetails(true);
      setDetailsError(null);
      try {
        const details = await catalogApi.getById(bookIdForMedia);
        if (isCancelled) return;
        resetEditableState(details);
      } catch (err) {
        if (isCancelled) return;
        setDetailsError(err instanceof Error ? err.message : 'No se pudo cargar el detalle del libro.');
      } finally {
        if (!isCancelled) {
          setIsLoadingDetails(false);
        }
      }
    };

    void loadDetails();

    return () => {
      isCancelled = true;
    };
  }, [isOpen, bookIdForMedia]);

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;
    if (!file) return;

    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      setUploadError('La portada debe ser JPG, PNG o WebP.');
      event.target.value = '';
      return;
    }

    if (file.size > MAX_SIZE_BYTES) {
      setUploadError('La portada debe ser de 10 MB o menos.');
      event.target.value = '';
      return;
    }

    setUploadError(null);
    setIsUploading(true);

    try {
      const result = await mediaApi.uploadCover(bookIdForMedia, file, token!);
      const resolved = resolveMediaUrl(result.presignedUrl) ?? result.presignedUrl;
      setLocalCoverUrl(resolved);
      onCoverUpdated();
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : 'Error al subir la portada.');
    } finally {
      setIsUploading(false);
      event.target.value = '';
    }
  };

  const handleDeleteCover = async () => {
    if (!token) return;

    setUploadError(null);
    setIsUploading(true);
    try {
      await mediaApi.deleteCover(bookIdForMedia, token);
      setLocalCoverUrl(null);
      onCoverUpdated();
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : 'Error al eliminar la portada.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleSave = async () => {
    if (!token || !user) return;

    if (!title.trim()) {
      setDetailsError('El título es obligatorio.');
      return;
    }

    if (!primaryAuthor.trim()) {
      setDetailsError('El autor principal es obligatorio.');
      return;
    }

    setIsSaving(true);
    setDetailsError(null);

    try {
      const updated = await catalogApi.update(
        bookIdForMedia,
        {
          title: title.trim(),
          primaryAuthor: primaryAuthor.trim(),
          otherAuthors: otherAuthors
            .split(',')
            .map((value) => value.trim())
            .filter(Boolean),
          isbn13: isbn13.trim() || undefined,
          isbn10: isbn10.trim() || undefined,
          publisher: publisher.trim() || undefined,
          publicationDate: publicationDate || undefined,
          pages: pages.trim() ? Number(pages) : undefined,
          language: language.trim() || undefined,
          genres: genre ? [genre] : [],
        },
        user.userId,
        token,
      );

      resetEditableState(updated);
      setIsEditMode(false);
      onCoverUpdated();
    } catch (err) {
      setDetailsError(err instanceof Error ? err.message : 'No se pudo guardar el libro.');
    } finally {
      setIsSaving(false);
    }
  };

  const shouldAutoEnableReviewEdit = (state: ReadingState, rating: number, opinion: string) =>
    state === ReadingState.READ && rating <= 0 && opinion.trim().length === 0;

  const handleChangeStateFromDetail = async (nextState: ReadingState) => {
    if (!user || !token || isUpdatingState) return;

    setActionError(null);
    setIsUpdatingState(true);
    try {
      const payload: { newState: ReadingState; readingDate?: string } = { newState: nextState };
      if (nextState === ReadingState.READ) {
        payload.readingDate = new Date().toISOString().slice(0, 10);
      }

      const updated = await transitionReadingState(user.userId, userBook.id, {
        nextState,
        readDate: payload.readingDate,
      }, token);
      const nextRating = updated.rating ?? 0;
      const nextOpinion = updated.opinion ?? '';
      const updatedState = updated.state as ReadingState;

      setCurrentState(updatedState);
      setReviewRating(nextRating);
      setReviewOpinion(nextOpinion);
      setDraftReviewRating(nextRating);
      setDraftReviewOpinion(nextOpinion);
      setIsReviewEditMode(shouldAutoEnableReviewEdit(updatedState, nextRating, nextOpinion));
      onCoverUpdated();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'No se pudo actualizar el estado.');
    } finally {
      setIsUpdatingState(false);
    }
  };

  const handleSaveReviewFromDetail = async () => {
    if (!user || !token || currentState !== ReadingState.READ || isSavingReview) return;
    if (draftReviewRating < 1 || draftReviewRating > 5) {
      setActionError('Selecciona una valoración entre 1 y 5 estrellas.');
      return;
    }

    setActionError(null);
    setIsSavingReview(true);
    try {
      const updated = await updateReview(
        user.userId,
        userBook.id,
        { rating: draftReviewRating, opinion: draftReviewOpinion.trim() || undefined },
        token,
      );
      const nextRating = updated.rating ?? draftReviewRating;
      const nextOpinion = updated.opinion ?? draftReviewOpinion;
      setReviewRating(nextRating);
      setReviewOpinion(nextOpinion);
      setDraftReviewRating(nextRating);
      setDraftReviewOpinion(nextOpinion);
      setCurrentState(updated.state as ReadingState);
      setIsReviewEditMode(false);
      onCoverUpdated();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'No se pudo guardar la valoración.');
    } finally {
      setIsSavingReview(false);
    }
  };

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      labelledBy="book-detail-title"
      className="book-detail-modal"
      closeOnOutsideClick={true}
      closeOnEscape={true}
    >
        <button
          className="modal-close-btn"
          onClick={onClose}
          aria-label="Close"
        >
          ✕
        </button>

        <div className="book-detail-layout">
          {/* Cover column */}
          <div className="book-detail-cover-col">
            {displayCover ? (
              <img
                src={displayCover}
                alt={`Cover of ${book.title}`}
                className="book-detail-cover-img"
              />
            ) : (
              <div className="book-detail-cover-placeholder" aria-hidden="true">📘</div>
            )}

            {canManageBook && token && (
              <div className="book-detail-cover-upload" style={{ marginTop: '12px' }}>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="avatar-file-input"
                  onChange={handleFileChange}
                  disabled={isUploading}
                />
                <div className="modal-actions" style={{ justifyContent: 'flex-start', marginTop: '8px' }}>
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm icon-only-btn"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading}
                    data-tooltip={isUploading ? 'Uploading...' : hasCover ? 'Replace cover' : 'Upload cover'}
                    aria-label={isUploading ? 'Uploading...' : hasCover ? 'Replace cover' : 'Upload cover'}
                  >
                    <ActionIcon name={hasCover ? 'replace' : 'upload'} />
                  </button>
                  {hasCover && (
                    <button
                      type="button"
                      className="btn btn-danger btn-sm icon-only-btn"
                      onClick={handleDeleteCover}
                      disabled={isUploading}
                      data-tooltip={isUploading ? 'Deleting...' : 'Delete cover'}
                      aria-label={isUploading ? 'Deleting...' : 'Delete cover'}
                    >
                      <ActionIcon name="delete" />
                    </button>
                  )}
                </div>
                {uploadError && (
                  <p className="form-error" style={{ marginTop: '6px', fontSize: '0.8rem' }}>{uploadError}</p>
                )}
              </div>
            )}
          </div>

          {/* Metadata column */}
          <div className="book-detail-meta-col">
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', alignItems: 'flex-start' }}>
              <div>
                <h2 id="book-detail-title" className="book-detail-title">{title}</h2>
                <p className="book-detail-author">{primaryAuthor}</p>
              </div>
              {canManageBook && (
                <button
                  type="button"
                  className="btn btn-secondary btn-sm icon-only-btn"
                  onClick={() => {
                    setIsEditMode((current) => !current);
                    setDetailsError(null);
                  }}
                  data-tooltip={isEditMode ? 'Cancel edit' : 'Edit'}
                  aria-label={isEditMode ? 'Cancel edit' : 'Edit'}
                >
                  <ActionIcon name={isEditMode ? 'cancel' : 'edit'} />
                </button>
              )}
            </div>

            {detailsError && <div className="alert alert-danger">{detailsError}</div>}
            {actionError && <div className="alert alert-danger">{actionError}</div>}
            {isLoadingDetails && <p className="modal-body">Loading book details...</p>}

            {!isLoadingDetails && (
              <div className="book-reading-panel">
                <h3 className="form-label" style={{ marginBottom: '8px' }}>Reading state</h3>
                <div className="book-reading-actions">
                  {READING_STATE_OPTIONS.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      className={`btn btn-sm ${currentState === option.value ? 'btn-primary' : 'btn-secondary'}`}
                      onClick={() => handleChangeStateFromDetail(option.value)}
                      disabled={isUpdatingState}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>

                {currentState === ReadingState.READ && (
                  <div className="book-review-inline">
                    {isReviewEditMode ? (
                      <>
                        <div className="book-review-stars" role="radiogroup" aria-label="Rating">
                          {[1, 2, 3, 4, 5].map((value) => (
                            <button
                              key={value}
                              type="button"
                              className={`star-btn ${value <= draftReviewRating ? 'active' : ''}`}
                              onClick={() => setDraftReviewRating(value)}
                              aria-label={`${value} stars`}
                              disabled={isSavingReview}
                            >
                              ★
                            </button>
                          ))}
                        </div>
                        <textarea
                          className="form-input"
                          value={draftReviewOpinion}
                          onChange={(event) => setDraftReviewOpinion(event.target.value)}
                          placeholder="Añade un comentario corto"
                          rows={3}
                          disabled={isSavingReview}
                        />
                        <div className="modal-actions" style={{ marginTop: '10px' }}>
                          <button
                            type="button"
                            className="btn btn-secondary icon-only-btn"
                            onClick={() => {
                              setDraftReviewRating(reviewRating);
                              setDraftReviewOpinion(reviewOpinion);
                              setIsReviewEditMode(false);
                              setActionError(null);
                            }}
                            disabled={isSavingReview}
                            data-tooltip="Cancel"
                            aria-label="Cancel"
                          >
                            <ActionIcon name="cancel" />
                          </button>
                          <button
                            type="button"
                            className="btn btn-primary icon-only-btn"
                            onClick={handleSaveReviewFromDetail}
                            disabled={isSavingReview}
                            data-tooltip={isSavingReview ? 'Saving...' : 'Save rating'}
                            aria-label={isSavingReview ? 'Saving...' : 'Save rating'}
                          >
                            <ActionIcon name="save" />
                          </button>
                        </div>
                      </>
                    ) : (
                      <div className="book-review-readonly">
                        <div className="book-review-readonly-rating">
                          {reviewRating > 0 ? `${'★'.repeat(reviewRating)}${'☆'.repeat(5 - reviewRating)}` : 'Not rated'}
                        </div>
                        <p className="book-review-readonly-opinion">{reviewOpinion || 'No comment'}</p>
                        <div className="modal-actions" style={{ marginTop: '10px' }}>
                          <button
                            type="button"
                            className="btn btn-secondary icon-only-btn"
                            onClick={() => {
                              setDraftReviewRating(reviewRating);
                              setDraftReviewOpinion(reviewOpinion);
                              setIsReviewEditMode(true);
                              setActionError(null);
                            }}
                            disabled={isSavingReview || isUpdatingState}
                            data-tooltip="Edit review"
                            aria-label="Edit review"
                          >
                            <ActionIcon name="edit" />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {!isLoadingDetails && isEditMode ? (
              <div className="book-form" style={{ display: 'grid', gap: '12px' }}>
                <div className="form-group">
                  <label htmlFor="detail-title" className="form-label">Title</label>
                  <input id="detail-title" className="form-input" value={title} onChange={(e) => setTitle(e.target.value)} disabled={isSaving} />
                </div>
                <div className="form-group">
                  <label htmlFor="detail-primary-author" className="form-label">Primary author</label>
                  <input id="detail-primary-author" className="form-input" value={primaryAuthor} onChange={(e) => setPrimaryAuthor(e.target.value)} disabled={isSaving} />
                </div>
                <div className="form-group">
                  <label htmlFor="detail-other-authors" className="form-label">Other authors</label>
                  <input id="detail-other-authors" className="form-input" value={otherAuthors} onChange={(e) => setOtherAuthors(e.target.value)} placeholder="Comma separated" disabled={isSaving} />
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="detail-isbn13" className="form-label">ISBN-13</label>
                    <input id="detail-isbn13" className="form-input" value={isbn13} onChange={(e) => setIsbn13(e.target.value)} disabled={isSaving} />
                  </div>
                  <div className="form-group">
                    <label htmlFor="detail-isbn10" className="form-label">ISBN-10</label>
                    <input id="detail-isbn10" className="form-input" value={isbn10} onChange={(e) => setIsbn10(e.target.value)} disabled={isSaving} />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="detail-publisher" className="form-label">Publisher</label>
                    <input id="detail-publisher" className="form-input" value={publisher} onChange={(e) => setPublisher(e.target.value)} disabled={isSaving} />
                  </div>
                  <div className="form-group">
                    <label htmlFor="detail-language" className="form-label">Language</label>
                    <select id="detail-language" className="form-input" value={language} onChange={(e) => setLanguage(e.target.value)} disabled={isSaving}>
                      {LANGUAGE_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>{option.label}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="detail-publication-date" className="form-label">Publication date</label>
                    <input id="detail-publication-date" type="date" className="form-input" value={publicationDate} onChange={(e) => setPublicationDate(e.target.value)} disabled={isSaving} />
                  </div>
                  <div className="form-group">
                    <label htmlFor="detail-pages" className="form-label">Pages</label>
                    <input id="detail-pages" type="number" min="1" className="form-input" value={pages} onChange={(e) => setPages(e.target.value)} disabled={isSaving} />
                  </div>
                </div>
                <div className="form-group">
                  <label htmlFor="detail-genre" className="form-label">Book type</label>
                  <select id="detail-genre" className="form-input" value={genre} onChange={(e) => setGenre(e.target.value)} disabled={isSaving}>
                    <option value="">Select one</option>
                    {BOOK_GENRES.map((option) => (
                      <option key={option} value={option}>{option.replaceAll('_', ' ')}</option>
                    ))}
                  </select>
                </div>
                <div className="modal-actions">
                  <button type="button" className="btn btn-secondary icon-only-btn" onClick={() => setIsEditMode(false)} disabled={isSaving} data-tooltip="Cancel" aria-label="Cancel"><ActionIcon name="cancel" /></button>
                  <button type="button" className="btn btn-primary icon-only-btn" onClick={handleSave} disabled={isSaving} data-tooltip={isSaving ? 'Saving...' : 'Save changes'} aria-label={isSaving ? 'Saving...' : 'Save changes'}><ActionIcon name="save" /></button>
                </div>
              </div>
            ) : (
              <>
                <table className="book-detail-table">
                  <tbody>
                  {(isbn13 || isbn10) && (
                    <tr>
                      <th>ISBN</th>
                      <td>{isbn13 || isbn10}</td>
                    </tr>
                  )}
                  {publisher && (
                    <tr>
                      <th>Publisher</th>
                      <td>{publisher}</td>
                    </tr>
                  )}
                  {language && (
                    <tr>
                      <th>Language</th>
                      <td>{LANGUAGE_OPTIONS.find((o) => o.value === language)?.label ?? language}</td>
                    </tr>
                  )}
                  {genre && (
                    <tr>
                      <th>Type</th>
                      <td>{allGenres.length > 0 ? allGenres.map((v) => v.replaceAll('_', ' ')).join(', ') : genre.replaceAll('_', ' ')}</td>
                    </tr>
                  )}
                  {pages && (
                    <tr>
                      <th>Pages</th>
                      <td>{pages}</td>
                    </tr>
                  )}
                  {publicationDate && (
                    <tr>
                      <th>Published</th>
                      <td>{publicationDate}</td>
                    </tr>
                  )}
                  {otherAuthors && (
                    <tr>
                      <th>Other authors</th>
                      <td>{otherAuthors}</td>
                    </tr>
                  )}
                  {synopsis && (
                    <tr>
                      <th>Synopsis</th>
                      <td style={{ whiteSpace: 'pre-wrap' }}>{synopsis}</td>
                    </tr>
                  )}
                  {reviewRating > 0 && (
                    <tr>
                      <th>Rating</th>
                      <td>{'★'.repeat(reviewRating)}{'☆'.repeat(5 - reviewRating)}</td>
                    </tr>
                  )}
                  {reviewOpinion && (
                    <tr>
                      <th>Opinion</th>
                      <td>{reviewOpinion}</td>
                    </tr>
                  )}
                  <tr>
                    <th>Added to library</th>
                    <td>{new Date(addedAt).toLocaleDateString()}</td>
                  </tr>
                  {bookCreatedAt && (
                    <tr>
                      <th>Catalog date</th>
                      <td>{bookCreatedAt ? new Date(bookCreatedAt).toLocaleDateString() : '-'}</td>
                    </tr>
                  )}
                  {(createdByName || createdByValue) && (
                    <tr>
                      <th>Added by</th>
                      <td>{createdByName || createdByValue}</td>
                    </tr>
                  )}
                  </tbody>
                </table>
              </>
            )}

            {onRemove && !isEditMode && (
              <div style={{ marginTop: '16px', borderTop: '1px solid var(--color-border)', paddingTop: '12px' }}>
                <button
                  type="button"
                  className="btn btn-danger btn-sm icon-only-btn"
                  onClick={() => onRemove(userBook.id)}
                  data-tooltip="Remove from library"
                  aria-label="Remove from library"
                >
                  <ActionIcon name="delete" />
                </button>
              </div>
            )}
          </div>
        </div>
    </BaseModal>
  );
};
