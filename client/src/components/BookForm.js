import React, { useState } from 'react';
import axios from 'axios';
import BookSearchModal from './BookSearchModal';
import './BookForm.css';

function BookForm({ onBookAdded }) {
  const [formData, setFormData] = useState({
    title: '',
    author: '',
    genre: '',
    pages: '',
    completed_date: '',
    status: 'reading', // Default status
    image_url: '',
    rating: ''
  });
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

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
    setSuccess('');
  };

  const handleBookSelect = (book) => {
    setFormData({
      ...formData,
      title: book.title,
      author: book.author,
      genre: book.genre || formData.genre,
      pages: book.pages || formData.pages,
      image_url: book.image_url || '',
      rating: book.rating ?? formData.rating
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      // completed status requires a date
      if (formData.status === 'completed' && !formData.completed_date) {
        setError('완료 상태일 때는 완료일을 입력해야 합니다.');
        return;
      }

      await axios.post('/api/books', {
        ...formData,
        pages: parseInt(formData.pages),
        rating: formData.rating === '' ? null : parseInt(formData.rating, 10)
      });

      setSuccess('책이 성공적으로 추가되었습니다!');
      setFormData({
        title: '',
        author: '',
        genre: '',
        pages: '',
        completed_date: '',
        status: 'reading',
        image_url: '',
        rating: ''
      });

      onBookAdded();
    } catch (err) {
      setError(err.response?.data?.error || '책 추가 중 오류가 발생했습니다.');
    }
  };

  return (
    <div className="book-form-container">
      <div className="form-header">
        <h3>새 책 추가</h3>
        <button
          type="button"
          className="search-btn"
          onClick={() => setIsSearchOpen(true)}
        >
          🔍 책 검색
        </button>
      </div>

      <form onSubmit={handleSubmit} className="book-form">
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="title">제목 *</label>
            <input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleChange}
              required
              maxLength={200}
              placeholder="책 제목을 입력하세요"
            />
          </div>

          <div className="form-group">
            <label htmlFor="author">저자 *</label>
            <input
              type="text"
              id="author"
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
            <label htmlFor="genre">장르 *</label>
            <input
              type="text"
              id="genre"
              name="genre"
              value={formData.genre}
              onChange={handleChange}
              required
              maxLength={50}
              placeholder="예: 소설, 에세이, 자기계발"
            />
          </div>

          <div className="form-group">
            <label htmlFor="pages">페이지 수 *</label>
            <input
              type="number"
              id="pages"
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

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="status">상태</label>
            <select
              id="status"
              name="status"
              value={formData.status}
              onChange={handleChange}
            >
              <option value="reading">읽는 중</option>
              <option value="wishlist">읽고 싶음</option>
              <option value="paused">일시 중지</option>
              <option value="completed">완료</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="completed_date">완료일 {formData.status === 'completed' && '*'}</label>
            <input
              type="date"
              id="completed_date"
              name="completed_date"
              value={formData.completed_date}
              onChange={handleChange}
              required={formData.status === 'completed'}
              max={new Date().toISOString().split('T')[0]}
              disabled={formData.status !== 'completed'}
            />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="rating">평점 (선택)</label>
            <select
              id="rating"
              name="rating"
              value={formData.rating}
              onChange={handleChange}
            >
              <option value="">미선택</option>
              <option value="1">★ 1</option>
              <option value="2">★★ 2</option>
              <option value="3">★★★ 3</option>
              <option value="4">★★★★ 4</option>
              <option value="5">★★★★★ 5</option>
            </select>
          </div>
        </div>

        {formData.image_url && (
          <div className="form-preview">
            <img src={formData.image_url} alt="Cover Preview" className="cover-preview" />
            <span className="preview-label">표지 미리보기</span>
          </div>
        )}

        {error && <div className="message error">{error}</div>}
        {success && <div className="message success">{success}</div>}

        <button type="submit" className="submit-btn">
          책 추가하기
        </button>
      </form>

      <BookSearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        onSelectBook={handleBookSelect}
      />
    </div>
  );
}

export default BookForm;
