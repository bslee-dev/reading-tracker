/**
 * 책 목록을 CSV 문자열로 변환 (BOM 추가로 한글 엑셀 호환)
 */
export function booksToCsv(books) {
  const headers = ['제목', '저자', '장르', '페이지', '완료일', '상태', '평점', '메모'];
  const statusMap = { reading: '읽는 중', wishlist: '읽고 싶음', paused: '중단', completed: '완료' };
  const escape = (v) => {
    if (v == null) return '';
    const s = String(v).replace(/"/g, '""');
    return s.includes(',') || s.includes('"') || s.includes('\n') ? `"${s}"` : s;
  };
  const rows = books.map((b) => [
    b.title,
    b.author,
    b.genre,
    b.pages,
    b.completed_date || '',
    statusMap[b.status] || b.status || '',
    b.rating != null ? b.rating : '',
    (b.memo || '').replace(/\r?\n/g, ' ')
  ].map(escape).join(','));
  const csv = [headers.join(','), ...rows].join('\r\n');
  return '\uFEFF' + csv; // BOM for Excel UTF-8
}

/**
 * CSV 다운로드 트리거
 */
export function downloadCsv(books, filename = 'reading-list.csv') {
  const csv = booksToCsv(books);
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
