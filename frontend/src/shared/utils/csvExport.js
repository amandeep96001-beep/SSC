/**
 * Escape a CSV cell and join rows.
 */
export function rowsToCsv(rows, columns) {
  const esc = (v) => {
    const s = v == null ? '' : String(v);
    if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
    return s;
  };
  const header = columns.map((c) => esc(c.label)).join(',');
  const lines = (rows || []).map((row) =>
    columns.map((c) => esc(typeof c.get === 'function' ? c.get(row) : row[c.key])).join(',')
  );
  return [header, ...lines].join('\n');
}

export function downloadTextFile(filename, text, mime = 'text/csv;charset=utf-8') {
  const body = typeof text === 'string' && text.charCodeAt(0) !== 0xfeff
    ? `\uFEFF${text}`
    : text;
  const blob = new Blob([body], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.rel = 'noopener';
  a.style.display = 'none';
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2500);
}

export const MOCK_PROGRESS_CSV_COLUMNS = [
  { label: 'username', key: 'username' },
  { label: 'examId', key: 'examId' },
  { label: 'title', key: 'title' },
  { label: 'score', key: 'score' },
  { label: 'correct', key: 'correct' },
  { label: 'wrong', key: 'wrong' },
  { label: 'blank', key: 'blank' },
  { label: 'accuracy', key: 'accuracy' },
  { label: 'elapsedTime', key: 'elapsedTime' },
  { label: 'attemptNumber', key: 'attemptNumber' },
  { label: 'timestamp', get: (r) => (r.timestamp ? new Date(r.timestamp).toISOString() : '') },
];

export const SYLLABUS_PROGRESS_CSV_COLUMNS = [
  { label: 'username', key: 'username' },
  { label: 'examId', key: 'examId' },
  { label: 'topicId', key: 'topicId' },
  { label: 'subjectName', key: 'subjectName' },
  { label: 'score', key: 'score' },
  { label: 'maxScore', key: 'maxScore' },
  { label: 'status', key: 'status' },
  { label: 'elapsedTime', key: 'elapsedTime' },
  { label: 'attemptNumber', key: 'attemptNumber' },
  { label: 'timestamp', get: (r) => (r.timestamp ? new Date(r.timestamp).toISOString() : '') },
];
