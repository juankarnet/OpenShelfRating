/**
 * Confirmation modal for destructive actions (remove book).
 * REQ-011 from SPEC-0006.
 */

import React from 'react';

interface ConfirmActionModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  isDangerous?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export const ConfirmActionModal: React.FC<ConfirmActionModalProps> = ({
  isOpen,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  isDangerous = false,
  onConfirm,
  onCancel,
  isLoading = false,
}) => {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" role="presentation" onClick={onCancel}>
      <div className="modal-box" role="alertdialog" aria-label={title}>
        <h2>{title}</h2>
        <p>{message}</p>

        <div className="modal-actions">
          <button className="btn btn-secondary" onClick={onCancel} disabled={isLoading}>
            {cancelText}
          </button>
          <button
            className={`btn ${isDangerous ? 'btn-danger' : 'btn-primary'}`}
            onClick={onConfirm}
            disabled={isLoading}
          >
            {isLoading ? 'Processing...' : confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};
