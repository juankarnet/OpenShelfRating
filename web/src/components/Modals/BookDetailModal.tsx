/**
 * Book detail modal — displays full book metadata and allows the creator
 * to upload a cover when none exists yet.
 * REQ-008, REQ-009, RULE-006 from SPEC-0005.
 */

import React, { useRef, useState } from 'react';
import type { UserBook } from '../../types/library';
import { mediaApi } from '../../api';
import { resolveMediaUrl } from '../../utils/mediaUrl';
import { useAuth } from '../../hooks/useAuth';

interface BookDetailModalProps {
  userBook: UserBook;
  isOpen: boolean;
  onClose: () => void;
  onCoverUpdated: () => void;
}

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_SIZE_BYTES = 10 * 1024 * 1024;

export const BookDetailModal: React.FC<BookDetailModalProps> = ({
  userBook,
  isOpen,
  onClose,
  onCoverUpdated,
}) => {
  const { user, token } = useAuth();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [localCoverUrl, setLocalCoverUrl] = useState<string | null>(null);

  if (!isOpen) return null;

  const { book, state, rating, opinion, addedAt } = userBook;

  // The book may expose createdBy from the catalog response; the bookId
  // for media endpoints is stored in book.bookId (from the BookResponse) or book.id.
  const bookIdForMedia = book.bookId ?? book.id;
  const isCreator = user?.userId === book.createdBy;
  const hasCover = !!(localCoverUrl ?? book.coverUrl);
  const displayCover = localCoverUrl ?? book.coverUrl;

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
      // Use the returned presigned URL for immediate display; onCoverUpdated
      // triggers a library refetch so subsequent opens use the resolved path.
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

  const formatState = (s: string) => {
    const map: Record<string, string> = { PENDING: 'Pending', READING: 'Reading', READ: 'Read' };
    return map[s] ?? s;
  };

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="book-detail-title">
      <div className="modal-box book-detail-modal">
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

            {/* Upload control: only for creator when no cover exists */}
            {isCreator && !hasCover && token && (
              <div className="book-detail-cover-upload" style={{ marginTop: '12px' }}>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="avatar-file-input"
                  onChange={handleFileChange}
                  disabled={isUploading}
                />
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                >
                  {isUploading ? 'Uploading...' : 'Upload cover'}
                </button>
                {uploadError && (
                  <p className="form-error" style={{ marginTop: '6px', fontSize: '0.8rem' }}>{uploadError}</p>
                )}
              </div>
            )}
          </div>

          {/* Metadata column */}
          <div className="book-detail-meta-col">
            <h2 id="book-detail-title" className="book-detail-title">{book.title}</h2>
            <p className="book-detail-author">{book.author}</p>

            <table className="book-detail-table">
              <tbody>
                {book.isbn13 && (
                  <tr>
                    <th>ISBN-13</th>
                    <td>{book.isbn13}</td>
                  </tr>
                )}
                {book.publisher && (
                  <tr>
                    <th>Publisher</th>
                    <td>{book.publisher}</td>
                  </tr>
                )}
                {book.language && (
                  <tr>
                    <th>Language</th>
                    <td>{book.language.toUpperCase()}</td>
                  </tr>
                )}
                {book.pages && (
                  <tr>
                    <th>Pages</th>
                    <td>{book.pages}</td>
                  </tr>
                )}
                {book.publicationDate && (
                  <tr>
                    <th>Published</th>
                    <td>{book.publicationDate}</td>
                  </tr>
                )}
                <tr>
                  <th>Status</th>
                  <td>{formatState(state)}</td>
                </tr>
                {rating != null && (
                  <tr>
                    <th>Rating</th>
                    <td>{'★'.repeat(rating)}{'☆'.repeat(5 - rating)}</td>
                  </tr>
                )}
                {opinion && (
                  <tr>
                    <th>Opinion</th>
                    <td>{opinion}</td>
                  </tr>
                )}
                <tr>
                  <th>Added</th>
                  <td>{new Date(addedAt).toLocaleDateString()}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
