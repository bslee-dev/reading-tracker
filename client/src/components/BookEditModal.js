import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './BookEditModal.css';

function BookEditModal({ book, onClose, onSave }) {
  const [formData, setFormData] = useState({
    title: '',
    author: '',
    genre: '',
    pages: '',
    completed_date: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (book) {
      setFormData({
        title: book.title,
        author: book.author,
        genre: book.genre,
        pages: book.pages.toString(),
        completed_date: book.completed_date
      });
    }
  }, [book]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // 입력값 검증 및 제한
    let processedValue = value;
    
    if (name === 'pages') {
      // 페이지 수는 숫자만 허용
      if (value === '' || /^\d+$/.test(value)) {
        processedValue = value;
      } else {
        return; // 유효하지 않은 입력은 무시
      }
    } else if (name === 'title') {
      // 제목 길이 제한 (200자)
      if (value.length <= 200) {
        processedValue = value;
      } else {
        return;
      }
    } else if (name === 'author') {
      // 저자 길이 제한 (100자)
      if (value.length <= 100) {
        processedValue = value;
      } else {
        return;
      }
    } else if (name === 'genre') {
      // 장르 길이 제한 (50자)
      if (value.length <= 50) {
        processedValue = value;
      } else {
        return;
      }
    }
    
    setFormData({
      ...formData,
      [name]: processedValue
    });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await axios.put(`/api/books/${book.id}`, {
        ...formData,
        pages: parseInt(formData.pages)
      });
      
      onSave();
    } catch (err) {
      setError(err.response?.data?.error || '책 수정 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div className="modal-backdrop" onClick={handleBackdropClick}>
      <div className="modal-content">
        <div className="modal-header">
          <h2>책 수정</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        
        <form onSubmit={handleSubmit} className="book-edit-form">
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="edit-title">제목 *</label>
              <input
                type="text"
                id="edit-title"
                name="title"
                value={formData.title}
                onChange={handleChange}
                required
                maxLength={200}
                placeholder="책 제목을 입력하세요"
              />
            </div>

            <div className="form-group">
              <label htmlFor="edit-author">저자 *</label>
              <input
                type="text"
                id="edit-author"
                name="author"
                value={formData.author}
                onChange={handleChange}
                required
                maxLength={100}
                placeholder="저자명을 입력하세요"
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="edit-genre">장르 *</label>
              <input
                type="text"
                id="edit-genre"
                name="genre"
                value={formData.genre}
                onChange={handleChange}
                required
                maxLength={50}
                placeholder="예: 소설, 에세이, 자기계발"
              />
            </div>

            <div className="form-group">
              <label htmlFor="edit-pages">페이지 수 *</label>
              <input
                type="number"
                id="edit-pages"
                name="pages"
                value={formData.pages}
                onChange={handleChange}
                required
                min="1"
                max="100000"
                placeholder="페이지 수"
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="edit-completed_date">완료일 *</label>
            <input
              type="date"
              id="edit-completed_date"
              name="completed_date"
              value={formData.completed_date}
              onChange={handleChange}
              required
              max={new Date().toISOString().split('T')[0]}
            />
          </div>

          {error && <div className="message error">{error}</div>}

          <div className="modal-actions">
            <button 
              type="button" 
              className="btn-cancel" 
              onClick={onClose}
              disabled={loading}
            >
              취소
            </button>
            <button 
              type="submit" 
              className="btn-save"
              disabled={loading}
            >
              {loading ? '저장 중...' : '저장'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default BookEditModal;
