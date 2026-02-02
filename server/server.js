const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const app = express();
const PORT = 3001;

// 보안 설정 상수
// 보안 설정 상수
const VALIDATION_LIMITS = {
  TITLE_MAX_LENGTH: 200,
  AUTHOR_MAX_LENGTH: 100,
  GENRE_MAX_LENGTH: 50,
  MEMO_MAX_LENGTH: 500,
  PAGES_MIN: 1,
  PAGES_MAX: 100000,
  RATING_MIN: 1,
  RATING_MAX: 5,
  DATE_PATTERN: /^\d{4}-\d{2}-\d{2}$/,
  STATUS_VALUES: ['reading', 'wishlist', 'paused', 'completed']
};

// 미들웨어
app.use(cors());
app.use(express.json({ limit: '10kb' })); // 요청 크기 제한

// 데이터베이스 초기화
const dbPath = path.join(__dirname, 'books.db');
const db = new sqlite3.Database(dbPath);

// 테이블 생성 및 마이그레이션
db.serialize(() => {
  // 1. 테이블이 없으면 생성
  db.run(`CREATE TABLE IF NOT EXISTS books (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    author TEXT NOT NULL,
    genre TEXT NOT NULL,
    pages INTEGER NOT NULL,
    completed_date TEXT,
    status TEXT DEFAULT 'completed',
    image_url TEXT,
    rating INTEGER,
    memo TEXT
  )`);

  // 2. 기존 테이블에 컬럼이 없는 경우 추가 (마이그레이션)
  db.all("PRAGMA table_info(books)", (err, rows) => {
    if (err) {
      console.error("테이블 정보 조회 오류:", err);
      return;
    }

    const columns = rows.map(row => row.name);
    
    if (!columns.includes('status')) {
      console.log('status 컬럼 추가 중...');
      db.run("ALTER TABLE books ADD COLUMN status TEXT DEFAULT 'completed'", (err) => {
        if (err) console.error('status 컬럼 추가 실패:', err);
        else console.log('status 컬럼 추가 완료');
      });
    }

    if (!columns.includes('image_url')) {
      console.log('image_url 컬럼 추가 중...');
      db.run("ALTER TABLE books ADD COLUMN image_url TEXT", (err) => {
        if (err) console.error('image_url 컬럼 추가 실패:', err);
        else console.log('image_url 컬럼 추가 완료');
      });
    }

    if (!columns.includes('rating')) {
      console.log('rating 컬럼 추가 중...');
      db.run("ALTER TABLE books ADD COLUMN rating INTEGER", (err) => {
        if (err) console.error('rating 컬럼 추가 실패:', err);
        else console.log('rating 컬럼 추가 완료');
      });
    }

    if (!columns.includes('memo')) {
      console.log('memo 컬럼 추가 중...');
      db.run("ALTER TABLE books ADD COLUMN memo TEXT", (err) => {
        if (err) console.error('memo 컬럼 추가 실패:', err);
        else console.log('memo 컬럼 추가 완료');
      });
    }
  });

  // 독서 목표 테이블 (년월별 목표 권수)
  db.run(`CREATE TABLE IF NOT EXISTS reading_goals (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    year INTEGER NOT NULL,
    month INTEGER NOT NULL,
    target_count INTEGER NOT NULL DEFAULT 1,
    UNIQUE(year, month)
  )`);
});

// 보안 유틸리티 함수들

/**
 * 문자열 sanitization - XSS 방지
 * HTML 태그와 위험한 문자 제거
 */
function sanitizeString(str) {
  if (typeof str !== 'string') return '';
  return str
    .replace(/[<>]/g, '') // HTML 태그 제거
    .trim();
}

/**
 * 문자열 검증
 */
function validateString(value, fieldName, maxLength, required = true) {
  if (!required && (value === undefined || value === null || value === '')) {
    return { valid: true, value: '' }; // 필수가 아니면 빈 값 허용
  }

  if (!value || typeof value !== 'string') {
    return { valid: false, error: `${fieldName}는 필수 항목입니다.` };
  }
  
  const sanitized = sanitizeString(value);
  
  if (required && sanitized.length === 0) {
    return { valid: false, error: `${fieldName}는 비어있을 수 없습니다.` };
  }
  
  if (maxLength && sanitized.length > maxLength) {
    return { valid: false, error: `${fieldName}는 ${maxLength}자 이하여야 합니다.` };
  }
  
  return { valid: true, value: sanitized };
}

/**
 * 상태 값 검증
 */
function validateStatus(value) {
  if (!value) return { valid: true, value: 'completed' }; // 기본값
  
  if (!VALIDATION_LIMITS.STATUS_VALUES.includes(value)) {
    return { valid: false, error: '유효하지 않은 상태 값입니다.' };
  }
  return { valid: true, value: value };
}

/**
 * 숫자 검증
 */
function validateNumber(value, fieldName, min, max) {
  if (value === undefined || value === null || value === '') {
    return { valid: false, error: `${fieldName}는 필수 항목입니다.` };
  }
  
  const num = typeof value === 'string' ? parseInt(value, 10) : Number(value);
  
  if (isNaN(num) || !isFinite(num)) {
    return { valid: false, error: `${fieldName}는 유효한 숫자여야 합니다.` };
  }
  
  if (num < min || num > max) {
    return { valid: false, error: `${fieldName}는 ${min}과 ${max} 사이의 값이어야 합니다.` };
  }
  
  if (!Number.isInteger(num)) {
    return { valid: false, error: `${fieldName}는 정수여야 합니다.` };
  }
  
  return { valid: true, value: num };
}

/**
 * 날짜 검증
 */
function validateDate(value, fieldName, required = true) {
  if (!required && !value) {
    return { valid: true, value: '' };
  }

  if (!value || typeof value !== 'string') {
    return { valid: false, error: `${fieldName}는 필수 항목입니다.` };
  }
  
  if (!VALIDATION_LIMITS.DATE_PATTERN.test(value)) {
    return { valid: false, error: `${fieldName}는 YYYY-MM-DD 형식이어야 합니다.` };
  }
  
  const date = new Date(value);
  if (isNaN(date.getTime())) {
    return { valid: false, error: `${fieldName}는 유효한 날짜여야 합니다.` };
  }
  
  // 미래 날짜 검증 (완료일은 미래일 수 없음)
  const today = new Date();
  today.setHours(23, 59, 59, 999);
  if (date > today) {
    return { valid: false, error: `${fieldName}는 오늘 이후의 날짜일 수 없습니다.` };
  }
  
  return { valid: true, value: value };
}

/**
 * 평점 검증 (1~5, 선택)
 */
function validateRating(value) {
  if (value === undefined || value === null || value === '') {
    return { valid: true, value: null };
  }
  const num = typeof value === 'string' ? parseInt(value, 10) : Number(value);
  if (isNaN(num) || !Number.isInteger(num) || num < VALIDATION_LIMITS.RATING_MIN || num > VALIDATION_LIMITS.RATING_MAX) {
    return { valid: false, error: `평점은 ${VALIDATION_LIMITS.RATING_MIN}~${VALIDATION_LIMITS.RATING_MAX} 사이의 정수여야 합니다.` };
  }
  return { valid: true, value: num };
}

/**
 * ID 파라미터 검증
 */
function validateId(id) {
  if (!id) {
    return { valid: false, error: 'ID가 필요합니다.' };
  }
  
  const numId = parseInt(id, 10);
  if (isNaN(numId) || numId <= 0 || !Number.isInteger(numId)) {
    return { valid: false, error: '유효하지 않은 ID입니다.' };
  }
  
  return { valid: true, value: numId };
}

/**
 * 책 데이터 검증
 */
function validateBookData(body) {
  const errors = [];
  const validated = {};
  
  // 제목 검증
  const titleResult = validateString(body.title, '제목', VALIDATION_LIMITS.TITLE_MAX_LENGTH);
  if (!titleResult.valid) errors.push(titleResult.error);
  else validated.title = titleResult.value;
  
  // 저자 검증
  const authorResult = validateString(body.author, '저자', VALIDATION_LIMITS.AUTHOR_MAX_LENGTH);
  if (!authorResult.valid) errors.push(authorResult.error);
  else validated.author = authorResult.value;
  
  // 장르 검증
  const genreResult = validateString(body.genre, '장르', VALIDATION_LIMITS.GENRE_MAX_LENGTH);
  if (!genreResult.valid) errors.push(genreResult.error);
  else validated.genre = genreResult.value;
  
  // 페이지 수 검증
  const pagesResult = validateNumber(
    body.pages, 
    '페이지 수', 
    VALIDATION_LIMITS.PAGES_MIN, 
    VALIDATION_LIMITS.PAGES_MAX
  );
  if (!pagesResult.valid) errors.push(pagesResult.error);
  else validated.pages = pagesResult.value;
  
  // 상태 검증
  const statusResult = validateStatus(body.status);
  if (!statusResult.valid) errors.push(statusResult.error);
  else validated.status = statusResult.value;

  // 완료일 검증 (완료 상태일 때만 필수, 그 외엔 선택)
  const isCompleted = validated.status === 'completed';
  const dateResult = validateDate(body.completed_date, '완료일', isCompleted);
  if (!dateResult.valid) errors.push(dateResult.error);
  else validated.completed_date = dateResult.value;

  // 이미지 URL (선택, 간단한 길이 체크만)
  if (body.image_url && typeof body.image_url === 'string') {
    validated.image_url = body.image_url.trim(); // 엄격한 URL 검증은 생략하고 trim만
  } else {
    validated.image_url = '';
  }

  // 평점 (선택, 1~5)
  const ratingResult = validateRating(body.rating);
  if (!ratingResult.valid) errors.push(ratingResult.error);
  else validated.rating = ratingResult.value;

  // 메모 (선택, 500자 이하)
  const memoResult = validateString(body.memo, '메모', VALIDATION_LIMITS.MEMO_MAX_LENGTH, false);
  if (!memoResult.valid) errors.push(memoResult.error);
  else validated.memo = memoResult.value || '';

  return {
    valid: errors.length === 0,
    errors: errors,
    data: validated
  };
}

// 정렬/필터 허용 값
const SORT_OPTIONS = ['date', 'date_asc', 'title', 'pages_desc', 'pages_asc'];

// 모든 책 조회 (정렬: sort=date|date_asc|title|pages_desc|pages_asc, 장르: genre=값)
app.get('/api/books', (req, res) => {
  const sort = SORT_OPTIONS.includes(req.query.sort) ? req.query.sort : 'date';
  const genre = typeof req.query.genre === 'string' && req.query.genre.trim() ? req.query.genre.trim() : null;

  let sql = 'SELECT * FROM books';
  const params = [];
  if (genre) {
    sql += ' WHERE genre = ?';
    params.push(genre);
  }
  switch (sort) {
    case 'date_asc':
      sql += ' ORDER BY (completed_date IS NULL), completed_date ASC, id ASC';
      break;
    case 'title':
      sql += ' ORDER BY title ASC, id ASC';
      break;
    case 'pages_desc':
      sql += ' ORDER BY pages DESC, id DESC';
      break;
    case 'pages_asc':
      sql += ' ORDER BY pages ASC, id ASC';
      break;
    default:
      sql += ' ORDER BY (completed_date IS NULL), completed_date DESC, id DESC';
  }

  db.all(sql, params, (err, rows) => {
    if (err) {
      console.error('데이터베이스 오류:', err);
      res.status(500).json({ error: '책 목록을 불러오는 중 오류가 발생했습니다.' });
      return;
    }
    res.json(rows);
  });
});

// 장르 목록 조회 (필터용)
app.get('/api/books/genres', (req, res) => {
  db.all('SELECT DISTINCT genre FROM books ORDER BY genre', (err, rows) => {
    if (err) {
      console.error('데이터베이스 오류:', err);
      res.status(500).json({ error: '장르 목록을 불러오는 중 오류가 발생했습니다.' });
      return;
    }
    res.json(rows.map(r => r.genre));
  });
});

// 책 추가
app.post('/api/books', (req, res) => {
  const validation = validateBookData(req.body);
  
  if (!validation.valid) {
    res.status(400).json({ error: validation.errors.join(' ') });
    return;
  }
  
  const { title, author, genre, pages, completed_date, status, image_url, rating, memo } = validation.data;

  db.run(
    'INSERT INTO books (title, author, genre, pages, completed_date, status, image_url, rating, memo) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
    [title, author, genre, pages, completed_date || null, status, image_url, rating ?? null, memo || ''],
    function(err) {
      if (err) {
        console.error('데이터베이스 오류:', err);
        res.status(500).json({ error: '책을 추가하는 중 오류가 발생했습니다.' });
        return;
      }
      res.json({ id: this.lastID, title, author, genre, pages, completed_date, status, image_url, rating: rating ?? null, memo: memo || '' });
    }
  );
});

// 책 수정
app.put('/api/books/:id', (req, res) => {
  const idValidation = validateId(req.params.id);
  if (!idValidation.valid) {
    res.status(400).json({ error: idValidation.error });
    return;
  }
  
  const validation = validateBookData(req.body);
  if (!validation.valid) {
    res.status(400).json({ error: validation.errors.join(' ') });
    return;
  }
  
  const { title, author, genre, pages, completed_date, status, image_url, rating, memo } = validation.data;
  const id = idValidation.value;

  db.run(
    'UPDATE books SET title = ?, author = ?, genre = ?, pages = ?, completed_date = ?, status = ?, image_url = ?, rating = ?, memo = ? WHERE id = ?',
    [title, author, genre, pages, completed_date || null, status, image_url, rating ?? null, memo || '', id],
    function(err) {
      if (err) {
        console.error('데이터베이스 오류:', err);
        res.status(500).json({ error: '책을 수정하는 중 오류가 발생했습니다.' });
        return;
      }
      if (this.changes === 0) {
        res.status(404).json({ error: '책을 찾을 수 없습니다.' });
        return;
      }
      res.json({ id: id, title, author, genre, pages, completed_date, status, image_url, rating: rating ?? null, memo: memo || '' });
    }
  );
});

// 책 삭제
app.delete('/api/books/:id', (req, res) => {
  const idValidation = validateId(req.params.id);
  if (!idValidation.valid) {
    res.status(400).json({ error: idValidation.error });
    return;
  }
  
  const id = idValidation.value;

  db.run('DELETE FROM books WHERE id = ?', [id], function(err) {
    if (err) {
      console.error('데이터베이스 오류:', err);
      res.status(500).json({ error: '책을 삭제하는 중 오류가 발생했습니다.' });
      return;
    }
    if (this.changes === 0) {
      res.status(404).json({ error: '책을 찾을 수 없습니다.' });
      return;
    }
    res.json({ message: '책이 삭제되었습니다.', id: id });
  });
});

// 독서 목표 조회 (year, month 쿼리 또는 현재 년월)
app.get('/api/goals', (req, res) => {
  const now = new Date();
  const year = req.query.year ? parseInt(req.query.year, 10) : now.getFullYear();
  const month = req.query.month ? parseInt(req.query.month, 10) : now.getMonth() + 1;
  if (isNaN(year) || isNaN(month) || month < 1 || month > 12) {
    res.status(400).json({ error: '유효한 year, month를 입력하세요.' });
    return;
  }
  db.get('SELECT * FROM reading_goals WHERE year = ? AND month = ?', [year, month], (err, row) => {
    if (err) {
      console.error('데이터베이스 오류:', err);
      res.status(500).json({ error: '목표를 불러오는 중 오류가 발생했습니다.' });
      return;
    }
    res.json(row || { year, month, target_count: 0 });
  });
});

// 독서 목표 설정 (upsert)
app.put('/api/goals', (req, res) => {
  const { year, month, target_count } = req.body;
  const now = new Date();
  const y = year != null ? parseInt(year, 10) : now.getFullYear();
  const m = month != null ? parseInt(month, 10) : now.getMonth() + 1;
  const count = target_count != null ? parseInt(target_count, 10) : 1;
  if (isNaN(y) || isNaN(m) || m < 1 || m > 12 || isNaN(count) || count < 0) {
    res.status(400).json({ error: 'year, month, target_count가 유효해야 합니다.' });
    return;
  }
  db.run(
    'INSERT INTO reading_goals (year, month, target_count) VALUES (?, ?, ?) ON CONFLICT(year, month) DO UPDATE SET target_count = excluded.target_count',
    [y, m, count],
    function(err) {
      if (err) {
        console.error('데이터베이스 오류:', err);
        res.status(500).json({ error: '목표를 저장하는 중 오류가 발생했습니다.' });
        return;
      }
      res.json({ year: y, month: m, target_count: count });
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
    WHERE status = 'completed' AND completed_date IS NOT NULL
    GROUP BY month
    ORDER BY month`,
    (err, rows) => {
      if (err) {
        console.error('데이터베이스 오류:', err);
        res.status(500).json({ error: '통계를 불러오는 중 오류가 발생했습니다.' });
        return;
      }
      res.json(rows);
    }
  );
});

// 프로세스 종료 시 데이터베이스 연결 종료
process.on('SIGINT', () => {
  db.close((err) => {
    if (err) {
      console.error('데이터베이스 종료 오류:', err);
    } else {
      console.log('데이터베이스 연결이 종료되었습니다.');
    }
    process.exit(0);
  });
});

process.on('SIGTERM', () => {
  db.close((err) => {
    if (err) {
      console.error('데이터베이스 종료 오류:', err);
    } else {
      console.log('데이터베이스 연결이 종료되었습니다.');
    }
    process.exit(0);
  });
});

app.listen(PORT, () => {
  console.log(`서버가 포트 ${PORT}에서 실행 중입니다.`);
});
