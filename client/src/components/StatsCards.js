import React from 'react';
import './StatsCards.css';

function StatsCards({ books }) {
  const totalBooks = books.length;
  const totalPages = books.reduce((sum, book) => sum + book.pages, 0);
  const avgPages = totalBooks > 0 ? Math.round(totalPages / totalBooks) : 0;
  const booksWithRating = books.filter((b) => b.rating != null && b.rating >= 1);
  const avgRating =
    booksWithRating.length > 0
      ? (booksWithRating.reduce((s, b) => s + b.rating, 0) / booksWithRating.length).toFixed(1)
      : null;

  return (
    <div className="stats-cards">
      <div className="stat-card">
        <div className="stat-icon">📚</div>
        <div className="stat-content">
          <div className="stat-value">{totalBooks}</div>
          <div className="stat-label">총 읽은 책</div>
        </div>
      </div>
      
      <div className="stat-card">
        <div className="stat-icon">📄</div>
        <div className="stat-content">
          <div className="stat-value">{totalPages.toLocaleString()}</div>
          <div className="stat-label">총 페이지</div>
        </div>
      </div>
      
      <div className="stat-card">
        <div className="stat-icon">📊</div>
        <div className="stat-content">
          <div className="stat-value">{avgPages}</div>
          <div className="stat-label">평균 페이지</div>
        </div>
      </div>

      {avgRating != null && (
        <div className="stat-card">
          <div className="stat-icon">⭐</div>
          <div className="stat-content">
            <div className="stat-value">{avgRating}</div>
            <div className="stat-label">평균 평점</div>
          </div>
        </div>
      )}
    </div>
  );
}

export default StatsCards;
