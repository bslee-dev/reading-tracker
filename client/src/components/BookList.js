import React from 'react';
import './BookList.css';

function BookList({ books }) {
  if (books.length === 0) {
    return (
      <div className="empty-state">
        <p>아직 등록된 책이 없습니다. 첫 번째 책을 추가해보세요!</p>
      </div>
    );
  }

  return (
    <div className="book-list">
      {books.map((book) => (
        <div key={book.id} className="book-card">
          <div className="book-info">
            <h3 className="book-title">{book.title}</h3>
            <p className="book-author">저자: {book.author}</p>
            <div className="book-details">
              <span className="book-genre">{book.genre}</span>
              <span className="book-pages">{book.pages}페이지</span>
              <span className="book-date">
                완료일: {new Date(book.completed_date).toLocaleDateString('ko-KR')}
              </span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export default BookList;
