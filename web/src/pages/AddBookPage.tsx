/**
 * Add book page - Form to search and add books to personal library.
 * REQ-012, AC-013 from SPEC-0006.
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { catalogApi, libraryApi } from '../api';
import { BookSearchResponse, BookResponse } from '../api';
import { LoadingSpinner } from '../components/Common/LoadingSpinner';
import { ConfirmActionModal } from '../components/Modals/ConfirmActionModal';

const AddBookPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, token } = useAuth();

  // Form state
  const [isbn, setIsbn] = useState('');
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [publisher, setPublisher] = useState('');
  const [language, setLanguage] = useState('en');

  // Search & selection state
  const [searchResults, setSearchResults] = useState<BookSearchResponse[]>([]);
  const [selectedBook, setSelectedBook] = useState<BookSearchResponse | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

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

  const handleSearchByIsbn = async () => {
    if (!isbn.trim()) {
      setSearchError('Please enter an ISBN.');
      return;
    }

    setIsSearching(true);
    setSearchError(null);
    setSearchResults([]);
    setSelectedBook(null);

    try {
      const results = await catalogApi.search(isbn, 0, 10);
      if (results.books && results.books.length > 0) {
        setSearchResults(results.books);
      } else {
        setSearchError('No books found with that ISBN. You can create a new entry below.');
      }
    } catch (err) {
      setSearchError(err instanceof Error ? err.message : 'Search failed.');
    } finally {
      setIsSearching(false);
    }
  };

  const handleSelectBook = (book: BookSearchResponse) => {
    setSelectedBook(book);
    setSearchResults([]);
  };

  const handleClearSelection = () => {
    setSelectedBook(null);
    setTitle('');
    setAuthor('');
    setPublisher('');
    setIsbn('');
  };

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

      if (selectedBook) {
        // Use existing book
        bookId = selectedBook.bookId;
      } else {
        // Create new book
        const newBook = await catalogApi.create(
          {
            title: title.trim(),
            primaryAuthor: author.trim(),
            isbn13: isbn.trim() || undefined,
            publisher: publisher.trim() || undefined,
            language,
          },
          token
        );
        bookId = newBook.bookId;
      }

      // Add to user's library
      await libraryApi.addBook(user.userId, bookId, token);

      // Success - redirect to dashboard or library
      navigate('/dashboard', { replace: true, state: { bookAdded: true } });
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Failed to add book.');
      setShowConfirmAdd(false);
    } finally {
      setIsSubmitting(false);
    }
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
                ISBN-13 (optional)
              </label>
              <div className="input-with-button">
                <input
                  id="isbn"
                  type="text"
                  className="form-input"
                  value={isbn}
                  onChange={(e) => setIsbn(e.target.value)}
                  placeholder="978-0-1234-5678-9"
                  disabled={isSearching || isSubmitting}
                />
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={handleSearchByIsbn}
                  disabled={!isbn.trim() || isSearching || isSubmitting}
                >
                  {isSearching ? 'Searching...' : 'Search'}
                </button>
              </div>
            </div>

            {searchError && <div className="alert alert-warning">{searchError}</div>}

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
                          src={book.coverUrl}
                          alt={book.title}
                          className="result-cover"
                        />
                      )}
                      <div className="result-info">
                        <h4 className="result-title">{book.title}</h4>
                        <p className="result-author">{book.primaryAuthor}</p>
                      </div>
                      <button
                        type="button"
                        className="btn btn-primary btn-sm"
                        onClick={() => handleSelectBook(book)}
                      >
                        Select
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Selected Book */}
            {selectedBook && (
              <div className="selected-book">
                <div className="selected-badge">✓ Selected</div>
                <div className="selected-content">
                  {selectedBook.coverUrl && (
                    <img src={selectedBook.coverUrl} alt={selectedBook.title} />
                  )}
                  <div className="selected-info">
                    <h4>{selectedBook.title}</h4>
                    <p>{selectedBook.primaryAuthor}</p>
                  </div>
                </div>
                <button
                  type="button"
                  className="btn btn-link"
                  onClick={handleClearSelection}
                  disabled={isSubmitting}
                >
                  Change
                </button>
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

              {submitError && <div className="alert alert-danger">{submitError}</div>}

              {(isSearching || isSubmitting) && <LoadingSpinner message="Processing..." />}

              <div className="form-actions">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => navigate('/dashboard')}
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={!title.trim() || !author.trim() || isSubmitting}
                >
                  {isSubmitting ? 'Adding...' : 'Add to Library'}
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
