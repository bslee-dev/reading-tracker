import React from 'react';
import './ListToolbar.css';

const SORT_OPTIONS = [
  { value: 'date', label: '최신 완료순' },
  { value: 'date_asc', label: '오래된 완료순' },
  { value: 'title', label: '제목순' },
  { value: 'pages_desc', label: '페이지 많은 순' },
  { value: 'pages_asc', label: '페이지 적은 순' },
];

function ListToolbar({ sortOrder, onSortChange, genreFilter, onGenreChange, genres, books, onExportCsv }) {
  return (
    <div className="list-toolbar">
      <div className="toolbar-group">
        <label htmlFor="sort-books">정렬</label>
        <select
          id="sort-books"
          value={sortOrder}
          onChange={(e) => onSortChange(e.target.value)}
          className="toolbar-select"
        >
          {SORT_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>
      <div className="toolbar-group">
        <label htmlFor="filter-genre">장르</label>
        <select
          id="filter-genre"
          value={genreFilter}
          onChange={(e) => onGenreChange(e.target.value)}
          className="toolbar-select"
        >
          <option value="">전체</option>
          {genres.map((g) => (
            <option key={g} value={g}>
              {g}
            </option>
          ))}
        </select>
      </div>
      {onExportCsv && (
        <div className="toolbar-group toolbar-export">
          <label>&nbsp;</label>
          <button type="button" className="toolbar-export-btn" onClick={() => onExportCsv(books)}>
            📥 CSV 내보내기
          </button>
        </div>
      )}
    </div>
  );
}

export default ListToolbar;
