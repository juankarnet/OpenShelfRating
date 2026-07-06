/**
 * Modal for transitioning reading state of a book.
 * REQ-009 from SPEC-0006: Show state transition history and dates.
 */

import React, { useState } from 'react';
import { ReadingState } from '../../types/shared';

interface ChangeStateModalProps {
  isOpen: boolean;
  bookTitle: string;
  currentState: ReadingState;
  onConfirm: (nextState: ReadingState, readDate?: string) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

const stateTransitions: Record<ReadingState, ReadingState[]> = {
  [ReadingState.PENDING]: [ReadingState.READING],
  [ReadingState.READING]: [ReadingState.READ, ReadingState.PENDING],
  [ReadingState.READ]: [ReadingState.READING, ReadingState.PENDING],
};

export const ChangeStateModal: React.FC<ChangeStateModalProps> = ({
  isOpen,
  bookTitle,
  currentState,
  onConfirm,
  onCancel,
  isLoading = false,
}) => {
  const [nextState, setNextState] = useState<ReadingState | null>(null);
  const [readDate, setReadDate] = useState<string>('');

  const availableStates = stateTransitions[currentState] || [];

  const handleConfirm = () => {
    if (!nextState) return;
    onConfirm(nextState, readDate);
  };

  const handleReset = () => {
    setNextState(null);
    setReadDate('');
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" role="presentation" onClick={onCancel}>
      <div className="modal-box" role="alertdialog" aria-label="Change reading state">
        <h2>Change Reading State</h2>
        <p>
          Book: <strong>{bookTitle}</strong>
        </p>

        <div className="form-group">
          <label className="form-label">Move to:</label>
          <div className="state-options">
            {availableStates.map((state) => (
              <label key={state} className="radio-label">
                <input
                  type="radio"
                  name="state"
                  value={state}
                  checked={nextState === state}
                  onChange={() => setNextState(state as ReadingState)}
                  disabled={isLoading}
                />
                {state === ReadingState.READING ? 'Reading' : state === ReadingState.READ ? 'Read' : 'To Read'}
              </label>
            ))}
          </div>
        </div>

        {nextState === ReadingState.READ && (
          <div className="form-group">
            <label htmlFor="readDate" className="form-label">
              Date Completed (optional):
            </label>
            <input
              id="readDate"
              type="date"
              className="form-input"
              value={readDate}
              onChange={(e) => setReadDate(e.target.value)}
              disabled={isLoading}
            />
          </div>
        )}

        <div className="modal-actions">
          <button className="btn btn-secondary" onClick={onCancel} disabled={isLoading}>
            Cancel
          </button>
          <button
            className="btn btn-primary"
            onClick={handleConfirm}
            disabled={!nextState || isLoading}
          >
            {isLoading ? 'Saving...' : 'Confirm'}
          </button>
        </div>
      </div>
    </div>
  );
};
