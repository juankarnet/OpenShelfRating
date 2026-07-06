/**
 * Search and filter controls for library.
 * REQ-007 from SPEC-0006: Text search + state filter.
 */

import React, { useState } from 'react';
import { ReadingState } from '../../types/shared';

interface SearchFilterProps {
  onSearch: (query: string) => void;
  onFilterByState: (state: ReadingState | null) => void;
  className?: string;
}

const states: Array<{ value: ReadingState | null; label: string }> = [
  { value: null, label: 'All Books' },
  { value: ReadingState.PENDING, label: 'To Read' },
  { value: ReadingState.READING, label: 'Reading' },
  { value: ReadingState.READ, label: 'Read' },
];

export const SearchFilter: React.FC<SearchFilterProps> = ({
  onSearch,
  onFilterByState,
  className = '',
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedState, setSelectedState] = useState<ReadingState | null>(null);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);
    onSearch(query);
  };

  const handleStateChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const state = e.target.value ? (e.target.value as ReadingState) : null;
    setSelectedState(state);
    onFilterByState(state);
  };

  const handleClearSearch = () => {
    setSearchQuery('');
    onSearch('');
  };

  return (
    <div className={`search-filter ${className}`}>
      <div className="search-input-group">
        <input
          type="text"
          className="form-input"
          placeholder="Search by title or author..."
          value={searchQuery}
          onChange={handleSearchChange}
          aria-label="Search library"
        />
        {searchQuery && (
          <button
            className="search-clear-btn"
            onClick={handleClearSearch}
            aria-label="Clear search"
            title="Clear"
          >
            ✕
          </button>
        )}
      </div>

      <select
        className="form-input"
        value={selectedState || ''}
        onChange={handleStateChange}
        aria-label="Filter by reading state"
      >
        {states.map((s) => (
          <option key={s.value || 'all'} value={s.value || ''}>
            {s.label}
          </option>
        ))}
      </select>
    </div>
  );
};
