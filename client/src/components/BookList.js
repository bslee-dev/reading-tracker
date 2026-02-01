import React, { useState } from 'react';
import axios from 'axios';
import BookEditModal from './BookEditModal';
import './BookList.css';

function BookList({ books, searchTerm, onBookDeleted, onBookUpdated }) {
  const [editingBook, setEditingBook] = useState(null);

  // 검색어로 필터링
  const filteredBooks = books.filter(book => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      book.title.toLowerCase().includes(term) ||
      book.author.toLowerCase().includes(term)
    );
  });

  const handleDelete = async (id) => {
    if (!window.confirm('정말 이 책을 삭제하시겠습니까?')) {
      return;
    }

    try {
      await axios.delete(`/api/books/${id}`);
      onBookDeleted();
    } catch (error) {
      alert('책 삭제 중 오류가 발생했습니다.');
      console.error(error);
    }
  };

  const handleEdit = (book) => {
    setEditingBook(book);
  };

  const handleEditClose = () => {
    setEditingBook(null);
  };

  const handleEditSave = () => {
    onBookUpdated();
    setEditingBook(null);
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'reading': return '읽는 중';
      case 'wishlist': return '읽고 싶음';
      case 'paused': return '중단';
      case 'completed': return '완료';
      default: return '완료'; // Default for old data
    }
  };

  const getStatusClass = (status) => {
    return `status-badge status-${status || 'completed'}`;
  };

  if (books.length === 0) {
    return (
      <div className="empty-state">
        <p>아직 등록된 책이 없습니다. 첫 번째 책을 추가해보세요!</p>
      </div>
    );
  }

  if (filteredBooks.length === 0) {
    return (
      <div className="empty-state">
        <p>검색 결과가 없습니다. 다른 검색어를 시도해보세요.</p>
      </div>
    );
  }

  return (
    <>
      {searchTerm && (
        <div className="search-result-info">
          <p>"{searchTerm}" 검색 결과: {filteredBooks.length}권</p>
        </div>
      )}
      <div className="book-list">
        {filteredBooks.map((book) => (
          <div key={book.id} className="book-card">
            {book.image_url && (
              <div className="book-cover">
                <img src={book.image_url} alt={book.title} />
              </div>
            )}
            <div className="book-content">
              <div className="book-header">
                <span className={getStatusClass(book.status)}>{getStatusLabel(book.status)}</span>
              </div>
              <h3 className="book-title">{book.title}</h3>
              <p className="book-author">저자: {book.author}</p>
              <div className="book-details">
                {book.rating != null && (
                  <span className="book-rating" title={`평점 ${book.rating}/5`}>
                    {'★'.repeat(book.rating)}{'☆'.repeat(5 - book.rating)}
                  </span>
                )}
                <span className="book-genre">{book.genre}</span>
                <span className="book-pages">{book.pages}페이지</span>
                {book.completed_date && (
                  <span className="book-date">
                    완료: {new Date(book.completed_date).toLocaleDateString('ko-KR')}
                  </span>
                )}
              </div>
            </div>
            <div className="book-actions">
              <button
                className="btn-edit"
                onClick={() => handleEdit(book)}
              >
                수정
              </button>
              <button
                className="btn-delete"
                onClick={() => handleDelete(book.id)}
              >
                삭제
              </button>
            </div>
          </div>
        ))}
      </div>
      {editingBook && (
        <BookEditModal
          book={editingBook}
          onClose={handleEditClose}
          onSave={handleEditSave}
        />
      )}
    </>
  );
}

export default BookList;
