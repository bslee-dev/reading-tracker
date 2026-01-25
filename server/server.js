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
  PAGES_MIN: 1,
  PAGES_MAX: 100000,
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
    image_url TEXT
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
  });
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
  
  return {
    valid: errors.length === 0,
    errors: errors,
    data: validated
  };
}

// 모든 책 조회
app.get('/api/books', (req, res) => {
  db.all('SELECT * FROM books ORDER BY completed_date DESC, id DESC', (err, rows) => {
    if (err) {
      console.error('데이터베이스 오류:', err);
      res.status(500).json({ error: '책 목록을 불러오는 중 오류가 발생했습니다.' });
      return;
    }
    res.json(rows);
  });
});

// 책 추가
app.post('/api/books', (req, res) => {
  const validation = validateBookData(req.body);
  
  if (!validation.valid) {
    res.status(400).json({ error: validation.errors.join(' ') });
    return;
  }
  
  const { title, author, genre, pages, completed_date, status, image_url } = validation.data;

  db.run(
    'INSERT INTO books (title, author, genre, pages, completed_date, status, image_url) VALUES (?, ?, ?, ?, ?, ?, ?)',
    [title, author, genre, pages, completed_date || null, status, image_url],
    function(err) {
      if (err) {
        console.error('데이터베이스 오류:', err);
        res.status(500).json({ error: '책을 추가하는 중 오류가 발생했습니다.' });
        return;
      }
      res.json({ id: this.lastID, title, author, genre, pages, completed_date, status, image_url });
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
  
  const { title, author, genre, pages, completed_date, status, image_url } = validation.data;
  const id = idValidation.value;

  db.run(
    'UPDATE books SET title = ?, author = ?, genre = ?, pages = ?, completed_date = ?, status = ?, image_url = ? WHERE id = ?',
    [title, author, genre, pages, completed_date || null, status, image_url, id],
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
      res.json({ id: id, title, author, genre, pages, completed_date, status, image_url });
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
