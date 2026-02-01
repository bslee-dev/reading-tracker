import React, { useState, useEffect } from 'react';
import axios from 'axios';
import BookList from './components/BookList';
import BookForm from './components/BookForm';
import MonthlyChart from './components/MonthlyChart';
import StatsCards from './components/StatsCards';
import SearchBar from './components/SearchBar';
import ReadingGoal from './components/ReadingGoal';
import ListToolbar from './components/ListToolbar';
import './App.css';

function App() {
  const [books, setBooks] = useState([]);
  const [monthlyData, setMonthlyData] = useState([]);
  const [genres, setGenres] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortOrder, setSortOrder] = useState('date');
  const [genreFilter, setGenreFilter] = useState('');

  const fetchBooks = async (opts = {}) => {
    try {
      const sort = opts.sort !== undefined ? opts.sort : sortOrder;
      const genre = opts.genre !== undefined ? opts.genre : genreFilter;
      const params = {};
      if (sort) params.sort = sort;
      if (genre) params.genre = genre;
      const response = await axios.get('/api/books', { params });
      setBooks(response.data);
    } catch (error) {
      console.error('책 목록을 불러오는 중 오류 발생:', error);
    }
  };

  const fetchGenres = async () => {
    try {
      const response = await axios.get('/api/books/genres');
      setGenres(response.data);
    } catch (error) {
      console.error('장르 목록을 불러오는 중 오류 발생:', error);
    }
  };

  const fetchMonthlyData = async () => {
    try {
      const response = await axios.get('/api/books/monthly');
      setMonthlyData(response.data);
    } catch (error) {
      console.error('월별 데이터를 불러오는 중 오류 발생:', error);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([fetchBooks(), fetchMonthlyData(), fetchGenres()]);
      setLoading(false);
    };
    loadData();
  }, []);


  const handleBookAdded = () => {
    fetchBooks();
    fetchMonthlyData();
  };

  const handleBookDeleted = () => {
    fetchBooks();
    fetchMonthlyData();
  };

  const handleBookUpdated = () => {
    fetchBooks();
    fetchMonthlyData();
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>📚 독서 기록 대시보드</h1>
      </header>
      <main className="App-main">
        <div className="container">
          {!loading && <StatsCards books={books} />}

          {!loading && (
            <section className="goal-section">
              <ReadingGoal monthlyData={monthlyData} onGoalUpdated={fetchMonthlyData} />
            </section>
          )}
          
          <section className="chart-section">
            <h2>월별 읽은 책 수</h2>
            {loading ? (
              <p>로딩 중...</p>
            ) : (
              <MonthlyChart data={monthlyData} />
            )}
          </section>
          
          <section className="form-section">
            <h2>새 책 추가</h2>
            <BookForm onBookAdded={handleBookAdded} />
          </section>

          <section className="list-section">
            <h2>책 목록</h2>
            {!loading && (
              <>
                <ListToolbar
                  sortOrder={sortOrder}
                  onSortChange={(v) => { setSortOrder(v); fetchBooks({ sort: v }); }}
                  genreFilter={genreFilter}
                  onGenreChange={(v) => { setGenreFilter(v); fetchBooks({ genre: v }); }}
                  genres={genres}
                />
                <SearchBar 
                  searchTerm={searchTerm}
                  onSearchChange={setSearchTerm}
                />
              </>
            )}
            {loading ? (
              <p>로딩 중...</p>
            ) : (
              <BookList 
                books={books}
                searchTerm={searchTerm}
                onBookDeleted={handleBookDeleted}
                onBookUpdated={handleBookUpdated}
              />
            )}
          </section>
        </div>
      </main>
    </div>
  );
}

export default App;
