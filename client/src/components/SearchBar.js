import React from 'react';
import './SearchBar.css';

function SearchBar({ searchTerm, onSearchChange }) {
  return (
    <div className="search-bar-container">
      <div className="search-bar">
        <span className="search-icon">🔍</span>
        <input
          type="text"
          className="search-input"
          placeholder="제목 또는 저자로 검색..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
        />
        {searchTerm && (
          <button
            className="search-clear"
            onClick={() => onSearchChange('')}
            aria-label="검색어 지우기"
          >
            ×
          </button>
        )}
      </div>
    </div>
  );
}

export default SearchBar;
