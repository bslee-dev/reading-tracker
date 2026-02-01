# 독서 기록 대시보드

독서 기록을 관리하고 월별 통계를 확인할 수 있는 웹 애플리케이션입니다.

## 기술 스택

- **프론트엔드**: React + Chart.js
- **백엔드**: Node.js + Express
- **데이터베이스**: SQLite

## 기능

- 📚 책 목록 보기
- ➕ 책 추가하기 (제목, 저자, 장르, 페이지 수, 완료일, 상태, 평점)
- ⭐ 평점 (1~5) – 책 카드·추가·수정에서 선택 가능
- 🎯 월별 독서 목표 – 이번 달 목표 권수 설정 및 진행률 표시
- 📊 월별 읽은 책 수 막대 차트
- 🔀 정렬 – 최신/오래된 완료순, 제목순, 페이지 순
- 🏷️ 장르 필터 – 장르별로 목록 필터링

## 프로젝트 구조

```
reading-tracker/
├── client/          # React 프론트엔드
│   ├── public/
│   ├── src/
│   └── package.json
├── server/          # Express 백엔드
│   ├── server.js
│   ├── books.db     # SQLite 데이터베이스 (자동 생성)
│   └── package.json
└── README.md
```

## 실행 방법

### 1. 의존성 설치

#### 백엔드
```bash
cd server
npm install
```

#### 프론트엔드
```bash
cd client
npm install
```

### 2. 서버 실행

#### 백엔드 서버 시작
```bash
cd server
npm start
```

서버는 `http://localhost:3001`에서 실행됩니다.

#### 프론트엔드 개발 서버 시작
새 터미널에서:
```bash
cd client
npm start
```

브라우저에서 `http://localhost:3000`이 자동으로 열립니다.

## 사용 방법

1. **책 추가**: "새 책 추가" 섹션에서 책 정보를 입력하고 "책 추가하기" 버튼을 클릭합니다.
2. **책 목록 확인**: 추가한 책들이 "책 목록" 섹션에 카드 형태로 표시됩니다.
3. **통계 확인**: "월별 읽은 책 수" 차트에서 월별 독서 현황을 확인할 수 있습니다.

## API 엔드포인트

- `GET /api/books` - 모든 책 조회 (`?sort=date|date_asc|title|pages_desc|pages_asc`, `?genre=장르`)
- `GET /api/books/genres` - 장르 목록 조회
- `POST /api/books` - 새 책 추가
- `PUT /api/books/:id` - 책 수정
- `DELETE /api/books/:id` - 책 삭제
- `GET /api/books/monthly` - 월별 통계 조회
- `GET /api/goals` - 독서 목표 조회 (`?year=`, `?month=`)
- `PUT /api/goals` - 독서 목표 설정 (body: `year`, `month`, `target_count`)

## 개발 모드

개발 중에는 `nodemon`을 사용하여 자동 재시작할 수 있습니다:

```bash
cd server
npm run dev
```
