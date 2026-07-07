/**
 * Search and filter controls for library.
 * REQ-007 from SPEC-0006: Text search.
 */

import React, { useState } from 'react';
import { ActionIcon } from '../Common/ActionIcon';

interface SearchFilterProps {
  onSearch: (query: string) => void;
  className?: string;
}

export const SearchFilter: React.FC<SearchFilterProps> = ({
  onSearch,
  className = '',
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);
    onSearch(query);
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
            <ActionIcon name="clear" />
          </button>
        )}
      </div>
    </div>
  );
};
