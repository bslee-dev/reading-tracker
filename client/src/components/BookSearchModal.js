import React, { useState } from 'react';
import axios from 'axios';
import './BookSearchModal.css'; // We will create this CSS file

const BookSearchModal = ({ isOpen, onClose, onSelectBook }) => {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    if (!isOpen) return null;

    const searchBooks = async () => {
        if (!query.trim()) return;

        setLoading(true);
        setError(null);
        try {
            const response = await axios.get(`https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(query)}&maxResults=10`);
            setResults(response.data.items || []);
        } catch (err) {
            console.error('Book search error:', err);
            setError('책을 검색하는 중 오류가 발생했습니다.');
        } finally {
            setLoading(false);
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') {
            searchBooks();
        }
    };

    const handleSelect = (book) => {
        const info = book.volumeInfo;
        const selectedBook = {
            title: info.title || '',
            author: info.authors ? info.authors.join(', ') : '',
            genre: info.categories ? info.categories[0] : '', // First category as genre
            pages: info.pageCount || '',
            image_url: info.imageLinks ? (info.imageLinks.thumbnail || info.imageLinks.smallThumbnail) : ''
        };
        onSelectBook(selectedBook);
        onClose();
    };

    return (
        <div className="modal-overlay">
            <div className="modal-content search-modal">
                <div className="modal-header">
                    <h2>책 검색</h2>
                    <button className="close-button" onClick={onClose}>&times;</button>
                </div>

                <div className="search-bar-container">
                    <input
                        type="text"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="책 제목, 저자 등을 입력하세요..."
                        autoFocus
                    />
                    <button onClick={searchBooks} disabled={loading}>
                        {loading ? '검색 중...' : '검색'}
                    </button>
                </div>

                {error && <div className="error-message">{error}</div>}

                <div className="search-results">
                    {results.length === 0 && !loading && query && !error && (
                        <p className="no-results">검색 결과가 없습니다.</p>
                    )}

                    {results.map((book) => {
                        const info = book.volumeInfo;
                        const thumbnail = info.imageLinks ? (info.imageLinks.smallThumbnail || info.imageLinks.thumbnail) : null;

                        return (
                            <div key={book.id} className="search-item" onClick={() => handleSelect(book)}>
                                <div className="search-item-image">
                                    {thumbnail ? (
                                        <img src={thumbnail} alt={info.title} />
                                    ) : (
                                        <div className="no-image-placeholder">No Image</div>
                                    )}
                                </div>
                                <div className="search-item-info">
                                    <h3>{info.title}</h3>
                                    <p className="search-item-author">{info.authors ? info.authors.join(', ') : '저자 미상'}</p>
                                    <p className="search-item-meta">
                                        {info.publishedDate ? info.publishedDate.substring(0, 4) : ''}
                                        {info.publisher ? ` • ${info.publisher}` : ''}
                                    </p>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

export default BookSearchModal;
