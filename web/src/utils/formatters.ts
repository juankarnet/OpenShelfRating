/**
 * Utility functions for formatting data for display.
 */

import { formatDistanceToNow } from 'date-fns';
import { ReadingState } from '../types/shared';

/**
 * Format date to relative time (e.g., "2 hours ago").
 * @param date ISO date string or Date object
 * @returns Formatted relative time string
 */
export const formatRelativeTime = (date: string | Date): string => {
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return formatDistanceToNow(dateObj, { addSuffix: true });
  } catch {
    return 'Unknown date';
  }
};

/**
 * Format date to readable format (e.g., "Jul 6, 2026").
 * @param date ISO date string or Date object
 * @returns Formatted date string
 */
export const formatDate = (date: string | Date): string => {
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return dateObj.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return 'Unknown date';
  }
};

/**
 * Format datetime to readable format (e.g., "Jul 6, 2026, 3:30 PM").
 * @param date ISO date string or Date object
 * @returns Formatted datetime string
 */
export const formatDateTime = (date: string | Date): string => {
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return dateObj.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return 'Unknown date';
  }
};

/**
 * Format reading state to display label.
 * @param state ReadingState enum value
 * @returns Formatted label (e.g., "To Read" for PENDING)
 */
export const formatReadingState = (state: ReadingState): string => {
  const stateLabels: Record<ReadingState, string> = {
    [ReadingState.PENDING]: 'To Read',
    [ReadingState.READING]: 'Reading',
    [ReadingState.READ]: 'Read',
  };
  return stateLabels[state] || state;
};

/**
 * Format rating to display format.
 * @param rating Number 1-5 or undefined
 * @returns Formatted rating string (e.g., "4.5★" or "Not rated")
 */
export const formatRating = (rating?: number): string => {
  if (rating === undefined || rating === null) {
    return 'Not rated';
  }
  return `${rating}★`;
};

/**
 * Truncate text to maximum length with ellipsis.
 * @param text Text to truncate
 * @param maxLength Maximum length before truncation
 * @returns Truncated text
 */
export const truncateText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) {
    return text;
  }
  return `${text.substring(0, maxLength)}...`;
};

/**
 * Format title for display (truncate to reasonable length).
 * @param title Book title
 * @returns Formatted title (max 40 chars)
 */
export const formatTitle = (title: string): string => {
  return truncateText(title, 40);
};

/**
 * Format author for display (truncate to reasonable length).
 * @param author Author name
 * @returns Formatted author (max 30 chars)
 */
export const formatAuthor = (author: string): string => {
  return truncateText(author, 30);
};

/**
 * Format number as currency (for future use).
 * @param amount Amount to format
 * @param currency Currency code (default USD)
 * @returns Formatted currency string
 */
export const formatCurrency = (amount: number, currency: string = 'USD'): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
  }).format(amount);
};

/**
 * Calculate average rating or return N/A.
 * @param ratings Array of ratings
 * @returns Formatted average or "N/A"
 */
export const formatAverageRating = (ratings: number[]): string => {
  if (!ratings || ratings.length === 0) {
    return 'N/A';
  }
  const avg = ratings.reduce((a, b) => a + b, 0) / ratings.length;
  return formatRating(Math.round(avg * 10) / 10);
};

/**
 * Format precomputed average rating with two decimals.
 * @param value Average rating value
 * @returns Formatted average (e.g., "4.25★") or "Not rated"
 */
export const formatAverageRatingValue = (value?: number | null): string => {
  if (value === undefined || value === null) {
    return 'Not rated';
  }
  return `${value.toFixed(2)}★`;
};
