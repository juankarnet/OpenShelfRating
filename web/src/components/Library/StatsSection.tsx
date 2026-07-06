/**
 * Library statistics section component.
 * REQ-004, REQ-005 from SPEC-0006: Display total, state distribution, average rating.
 */

import React from 'react';
import { LibraryStats } from '../../types/library';
import { ReadingState } from '../../types/shared';
import { formatRating } from '../../utils/formatters';

interface StatsSectionProps {
  stats: LibraryStats | undefined;
  isLoading?: boolean;
  className?: string;
}

export const StatsSection: React.FC<StatsSectionProps> = ({
  stats,
  isLoading = false,
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

  return (
    <div className={`stats-section ${className}`}>
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon" aria-hidden="true">
            📚
          </div>
          <div className="stat-content">
            <span className="stat-label">Total Books</span>
            <span className="stat-value">{stats.totalBooks}</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" aria-hidden="true">
            ⌛
          </div>
          <div className="stat-content">
            <span className="stat-label">To Read</span>
            <span className="stat-value">{pendingCount}</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" aria-hidden="true">
            📖
          </div>
          <div className="stat-content">
            <span className="stat-label">Reading</span>
            <span className="stat-value">{readingCount}</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" aria-hidden="true">
            ✓
          </div>
          <div className="stat-content">
            <span className="stat-label">Read</span>
            <span className="stat-value">{readCount}</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" aria-hidden="true">
            ⭐
          </div>
          <div className="stat-content">
            <span className="stat-label">Avg Rating</span>
            <span className="stat-value">{formatRating(stats.averageRating)}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
