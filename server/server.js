const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const app = express();
const PORT = 3001;

// 미들웨어
app.use(cors());
app.use(express.json());

// 데이터베이스 초기화
const dbPath = path.join(__dirname, 'books.db');
const db = new sqlite3.Database(dbPath);

// 테이블 생성
db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS books (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    author TEXT NOT NULL,
    genre TEXT NOT NULL,
    pages INTEGER NOT NULL,
    completed_date TEXT NOT NULL
  )`);
});

// 모든 책 조회
app.get('/api/books', (req, res) => {
  db.all('SELECT * FROM books ORDER BY completed_date DESC', (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(rows);
  });
});

// 책 추가
app.post('/api/books', (req, res) => {
  const { title, author, genre, pages, completed_date } = req.body;
  
  if (!title || !author || !genre || !pages || !completed_date) {
    res.status(400).json({ error: '모든 필드를 입력해주세요.' });
    return;
  }

  db.run(
    'INSERT INTO books (title, author, genre, pages, completed_date) VALUES (?, ?, ?, ?, ?)',
    [title, author, genre, pages, completed_date],
    function(err) {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      res.json({ id: this.lastID, title, author, genre, pages, completed_date });
    }
  );
});

// 월별 통계 조회
app.get('/api/books/monthly', (req, res) => {
  db.all(
    `SELECT 
      strftime('%Y-%m', completed_date) as month,
      COUNT(*) as count
    FROM books
    GROUP BY month
    ORDER BY month`,
    (err, rows) => {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      res.json(rows);
    }
  );
});

app.listen(PORT, () => {
  console.log(`서버가 포트 ${PORT}에서 실행 중입니다.`);
});
