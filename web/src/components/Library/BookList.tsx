/**
 * Book list component - renders array of book cards.
 * REQ-006 from SPEC-0006.
 */

import React from 'react';
import type { UserBook } from '../../types/library';
import { BookCard } from './BookCard';

interface BookListProps {
  books: UserBook[] | undefined;
  isLoading?: boolean;
  isEmpty?: boolean;
  onChangeState?: (bookId: string) => void;
  onEditRating?: (bookId: string) => void;
  onRemove?: (bookId: string) => void;
  onViewDetails?: (bookId: string) => void;
  onManageCover?: (bookId: string) => void;
  className?: string;
}

export const BookList: React.FC<BookListProps> = ({
  books,
  isLoading = false,
  isEmpty = false,
  onChangeState,
  onEditRating,
  onRemove,
  onViewDetails,
  onManageCover,
  className = '',
}) => {
  if (isLoading) {
    return <div className={`book-list ${className}`}>Loading books...</div>;
  }

  if (isEmpty || !books || books.length === 0) {
    return <div className={`book-list book-list--empty ${className}`}>No books found.</div>;
  }

  return (
    <div className={`book-list ${className}`} role="list">
      {books.map((book) => (
        <div key={book.id} role="listitem">
          <BookCard
            book={book}
            onChangeState={onChangeState}
            onEditRating={onEditRating}
            onRemove={onRemove}
            onViewDetails={onViewDetails}
            onManageCover={onManageCover}
          />
        </div>
      ))}
    </div>
  );
};
