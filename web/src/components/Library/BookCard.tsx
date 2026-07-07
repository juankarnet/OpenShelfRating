/**
 * Book card component for displaying a user's book in the library.
 * REQ-006 from SPEC-0006: Book card with cover, title, author, state, rating.
 */

import React, { useState } from 'react';
import type { UserBook } from '../../types/library';
import { formatRating, formatReadingState, formatTitle, formatAuthor } from '../../utils/formatters';

interface BookCardProps {
  book: UserBook;
  onChangeState?: (bookId: string) => void;
  onEditRating?: (bookId: string) => void;
  onRemove?: (bookId: string) => void;
  onViewDetails?: (bookId: string) => void;
}

export const BookCard: React.FC<BookCardProps> = ({
  book,
  onChangeState,
  onEditRating,
  onRemove,
  onViewDetails,
}) => {
  const [showActions, setShowActions] = useState(false);

  return (
    <div className="book-card" role="article">
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
        </div>
      </div>

      <div className="book-card-actions">
        <button
          className="book-card-menu-btn"
          onClick={() => setShowActions((prev) => !prev)}
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
                onClick={() => {
                  onViewDetails(book.id);
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
                onClick={() => {
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
                onClick={() => {
                  onEditRating(book.id);
                  setShowActions(false);
                }}
                role="menuitem"
              >
                {book.rating ? 'Edit' : 'Add'} Rating
              </button>
            )}
            {onRemove && (
              <button
                className="book-card-menu-item book-card-menu-item--danger"
                onClick={() => {
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
