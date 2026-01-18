import React, { useState } from 'react';
import axios from 'axios';
import './BookForm.css';

function BookForm({ onBookAdded }) {
  const [formData, setFormData] = useState({
    title: '',
    author: '',
    genre: '',
    pages: '',
    completed_date: ''
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setError('');
    setSuccess('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      await axios.post('/api/books', {
        ...formData,
        pages: parseInt(formData.pages)
      });
      
      setSuccess('책이 성공적으로 추가되었습니다!');
      setFormData({
        title: '',
        author: '',
        genre: '',
        pages: '',
        completed_date: ''
      });
      
      onBookAdded();
    } catch (err) {
      setError(err.response?.data?.error || '책 추가 중 오류가 발생했습니다.');
    }
  };

  return (
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
            placeholder="페이지 수"
          />
        </div>
      </div>

      <div className="form-group">
        <label htmlFor="completed_date">완료일 *</label>
        <input
          type="date"
          id="completed_date"
          name="completed_date"
          value={formData.completed_date}
          onChange={handleChange}
          required
        />
      </div>

      {error && <div className="message error">{error}</div>}
      {success && <div className="message success">{success}</div>}

      <button type="submit" className="submit-btn">
        책 추가하기
      </button>
    </form>
  );
}

export default BookForm;
