/**
 * Modal for rating and reviewing a book.
 * REQ-010 from SPEC-0006: Rate (1-5 stars), add opinion/review text.
 */

import React, { useState } from 'react';
import { ActionIcon } from '../Common/ActionIcon';

interface RateBookModalProps {
  isOpen: boolean;
  bookTitle: string;
  currentRating?: number;
  currentOpinion?: string;
  onConfirm: (rating: number, opinion?: string) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export const RateBookModal: React.FC<RateBookModalProps> = ({
  isOpen,
  bookTitle,
  currentRating,
  currentOpinion,
  onConfirm,
  onCancel,
  isLoading = false,
}) => {
  const [rating, setRating] = useState<number>(currentRating || 0);
  const [opinion, setOpinion] = useState<string>(currentOpinion || '');

  const handleConfirm = () => {
    if (rating === 0) return;
    onConfirm(rating, opinion);
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" role="presentation" onClick={onCancel}>
      <div className="modal-box" role="alertdialog" aria-label="Rate book">
        <h2>Rate & Review</h2>
        <p>
          Book: <strong>{bookTitle}</strong>
        </p>

        <div className="form-group">
          <label className="form-label">Rating:</label>
          <div className="star-rating">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                className={`star-btn ${star <= rating ? 'active' : ''}`}
                onClick={() => setRating(star)}
                disabled={isLoading}
                aria-label={`${star} stars`}
              >
                ★
              </button>
            ))}
          </div>
          <span className="rating-display">{rating > 0 ? `${rating} / 5 stars` : 'No rating'}</span>
        </div>

        <div className="form-group">
          <label htmlFor="opinion" className="form-label">
            Opinion (optional):
          </label>
          <textarea
            id="opinion"
            className="form-input"
            placeholder="Share your thoughts about this book..."
            value={opinion}
            onChange={(e) => setOpinion(e.target.value)}
            disabled={isLoading}
            rows={4}
            style={{ resize: 'vertical' }}
          />
        </div>

        <div className="modal-actions">
          <button className="btn btn-secondary icon-only-btn" onClick={onCancel} disabled={isLoading} data-tooltip="Cancel" aria-label="Cancel">
            <ActionIcon name="cancel" />
          </button>
          <button className="btn btn-primary icon-only-btn" onClick={handleConfirm} disabled={rating === 0 || isLoading} data-tooltip={isLoading ? 'Saving...' : 'Save Rating'} aria-label={isLoading ? 'Saving...' : 'Save Rating'}>
            <ActionIcon name="rating" />
          </button>
        </div>
      </div>
    </div>
  );
};
