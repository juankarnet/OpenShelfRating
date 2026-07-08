/**
 * Book card component for displaying a user's book in the library.
 * REQ-006 from SPEC-0006: Book card with cover, title, author, state, rating.
 */

import React, { useState } from 'react';
import type { UserBook } from '../../types/library';
import { formatRating, formatReadingState, formatTitle, formatAuthor, formatDate } from '../../utils/formatters';

interface BookCardProps {
  book: UserBook;
  onChangeState?: (bookId: string) => void;
  onEditRating?: (bookId: string) => void;
  onRemove?: (bookId: string) => void;
  onViewDetails?: (book: UserBook) => void;
  onManageCover?: (bookId: string) => void;
}

export const BookCard: React.FC<BookCardProps> = ({
  book,
  onChangeState,
  onEditRating,
  onRemove,
  onViewDetails,
  onManageCover,
}) => {
  const [showActions, setShowActions] = useState(false);

  const handleOpenDetails = () => {
    if (onViewDetails) {
      onViewDetails(book);
    }
  };

  return (
    <div
      className={`book-card ${onViewDetails ? 'book-card--clickable' : ''}`}
      role={onViewDetails ? 'button' : 'article'}
      tabIndex={onViewDetails ? 0 : -1}
      onClick={onViewDetails ? handleOpenDetails : undefined}
      onKeyDown={onViewDetails ? (event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          handleOpenDetails();
        }
      } : undefined}
      aria-label={onViewDetails ? `View details for ${book.book.title}` : undefined}
    >
      <div className="book-card-cover">
        {book.book.coverUrl ? (
          <img src={book.book.coverUrl} alt={book.book.title} className="book-card-cover-img" />
        ) : (
          <div className="book-card-cover-placeholder" aria-hidden="true">
            📘
          </div>
        )}
      </div>

      <div className="book-card-content">
        <div className="book-card-meta">
          <h3 className="book-card-title">{formatTitle(book.book.title)}</h3>
          <p className="book-card-author">{formatAuthor(book.book.author)}</p>
        </div>

        <div className="book-card-info">
          <span className="book-card-state" data-state={book.state}>
            {formatReadingState(book.state)}
          </span>
          <span className="book-card-rating">{formatRating(book.rating)}</span>
          {book.addedAt && (
            <span className="book-card-added" title="Added to library">
              {formatDate(book.addedAt)}
            </span>
          )}
        </div>
      </div>

      <div className="book-card-actions">
        <button
          className="book-card-menu-btn"
          onClick={(event) => {
            event.stopPropagation();
            setShowActions((prev) => !prev);
          }}
          aria-label={`Actions for ${book.book.title}`}
          aria-expanded={showActions}
          aria-haspopup="menu"
        >
          ⋮
        </button>

        {showActions && (
          <div className="book-card-menu" role="menu">
            {onViewDetails && (
              <button
                className="book-card-menu-item"
                onClick={(event) => {
                  event.stopPropagation();
                  onViewDetails(book);
                  setShowActions(false);
                }}
                role="menuitem"
              >
                View Details
              </button>
            )}
            {onChangeState && (
              <button
                className="book-card-menu-item"
                onClick={(event) => {
                  event.stopPropagation();
                  onChangeState(book.id);
                  setShowActions(false);
                }}
                role="menuitem"
              >
                Change State
              </button>
            )}
            {onEditRating && book.state === 'READ' && (
              <button
                className="book-card-menu-item"
                onClick={(event) => {
                  event.stopPropagation();
                  onEditRating(book.id);
                  setShowActions(false);
                }}
                role="menuitem"
              >
                {book.rating ? 'Edit' : 'Add'} Rating
              </button>
            )}
            {onManageCover && (
              <button
                className="book-card-menu-item"
                onClick={(event) => {
                  event.stopPropagation();
                  onManageCover(book.id);
                  setShowActions(false);
                }}
                role="menuitem"
              >
                Manage Cover
              </button>
            )}
            {onRemove && (
              <button
                className="book-card-menu-item book-card-menu-item--danger"
                onClick={(event) => {
                  event.stopPropagation();
                  onRemove(book.id);
                  setShowActions(false);
                }}
                role="menuitem"
              >
                Remove
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
