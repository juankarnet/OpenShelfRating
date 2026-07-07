/**
 * Library statistics section component.
 * REQ-004, REQ-005 from SPEC-0006: Display total, state distribution, average rating.
 */

import React from 'react';
import type { LibraryStats } from '../../types/library';
import { ReadingState } from '../../types/shared';
import { formatAverageRatingValue } from '../../utils/formatters';

interface StatsSectionProps {
  stats: LibraryStats | undefined;
  isLoading?: boolean;
  activeState?: ReadingState | null;
  onFilterByState?: (state: ReadingState | null) => void;
  className?: string;
}

export const StatsSection: React.FC<StatsSectionProps> = ({
  stats,
  isLoading = false,
  activeState = null,
  onFilterByState,
  className = '',
}) => {
  if (isLoading) {
    return <div className={`stats-section ${className}`}>Loading...</div>;
  }

  if (!stats) {
    return null;
  }

  const pendingCount = stats.stateDistribution[ReadingState.PENDING] || 0;
  const readingCount = stats.stateDistribution[ReadingState.READING] || 0;
  const readCount = stats.stateDistribution[ReadingState.READ] || 0;

  const makeCardClass = (state: ReadingState | null) =>
    `stat-card stat-card--button ${activeState === state ? 'stat-card--active' : ''}`.trim();

  return (
    <div className={`stats-section ${className}`}>
      <div className="stats-grid">
        <button
          type="button"
          className={makeCardClass(null)}
          onClick={() => onFilterByState?.(null)}
          aria-pressed={activeState === null}
          title="Show all books"
        >
          <div className="stat-icon" aria-hidden="true">
            📚
          </div>
          <div className="stat-content">
            <span className="stat-label">Total Books</span>
            <span className="stat-value">{stats.totalBooks}</span>
          </div>
        </button>

        <button
          type="button"
          className={makeCardClass(ReadingState.PENDING)}
          onClick={() => onFilterByState?.(ReadingState.PENDING)}
          aria-pressed={activeState === ReadingState.PENDING}
          title="Filter by To Read"
        >
          <div className="stat-icon" aria-hidden="true">
            ⌛
          </div>
          <div className="stat-content">
            <span className="stat-label">To Read</span>
            <span className="stat-value">{pendingCount}</span>
          </div>
        </button>

        <button
          type="button"
          className={makeCardClass(ReadingState.READING)}
          onClick={() => onFilterByState?.(ReadingState.READING)}
          aria-pressed={activeState === ReadingState.READING}
          title="Filter by Reading"
        >
          <div className="stat-icon" aria-hidden="true">
            📖
          </div>
          <div className="stat-content">
            <span className="stat-label">Reading</span>
            <span className="stat-value">{readingCount}</span>
          </div>
        </button>

        <button
          type="button"
          className={makeCardClass(ReadingState.READ)}
          onClick={() => onFilterByState?.(ReadingState.READ)}
          aria-pressed={activeState === ReadingState.READ}
          title="Filter by Read"
        >
          <div className="stat-icon" aria-hidden="true">
            ✓
          </div>
          <div className="stat-content">
            <span className="stat-label">Read</span>
            <span className="stat-value">{readCount}</span>
          </div>
        </button>

        <div className="stat-card">
          <div className="stat-icon" aria-hidden="true">
            ⭐
          </div>
          <div className="stat-content">
            <span className="stat-label">Avg Rating</span>
            <span className="stat-value">{formatAverageRatingValue(stats.averageRating)}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
