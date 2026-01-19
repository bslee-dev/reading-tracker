import React, { useState } from 'react';
import axios from 'axios';
import BookEditModal from './BookEditModal';
import './BookList.css';

function BookList({ books, onBookDeleted, onBookUpdated }) {
  const [editingBook, setEditingBook] = useState(null);

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

  if (books.length === 0) {
    return (
      <div className="empty-state">
        <p>아직 등록된 책이 없습니다. 첫 번째 책을 추가해보세요!</p>
      </div>
    );
  }

  return (
    <>
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
