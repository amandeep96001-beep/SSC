export interface CsvColumn<T = Record<string, unknown>> {
  label: string;
  key?: string;
  get?: (row: T) => unknown;
}

export function rowsToCsv<T extends Record<string, unknown>>(
  rows: T[] | null | undefined,
  columns: CsvColumn<T>[]
): string {
  const esc = (v: unknown) => {
    const s = v == null ? '' : String(v);
    if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
    return s;
  };
  const header = columns.map((c) => esc(c.label)).join(',');
  const lines = (rows || []).map((row) =>
    columns.map((c) => esc(typeof c.get === 'function' ? c.get(row) : c.key ? row[c.key] : '')).join(',')
  );
  return [header, ...lines].join('\n');
}

export function downloadTextFile(filename: string, text: string, mime = 'text/csv;charset=utf-8'): void {
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

export const MOCK_PROGRESS_CSV_COLUMNS: CsvColumn[] = [
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
  { label: 'timestamp', get: (r) => (r.timestamp ? new Date(String(r.timestamp)).toISOString() : '') },
];

export const SYLLABUS_PROGRESS_CSV_COLUMNS: CsvColumn[] = [
  { label: 'username', key: 'username' },
  { label: 'examId', key: 'examId' },
  { label: 'topicId', key: 'topicId' },
  { label: 'subjectName', key: 'subjectName' },
  { label: 'score', key: 'score' },
  { label: 'maxScore', key: 'maxScore' },
  { label: 'status', key: 'status' },
  { label: 'elapsedTime', key: 'elapsedTime' },
  { label: 'attemptNumber', key: 'attemptNumber' },
  { label: 'timestamp', get: (r) => (r.timestamp ? new Date(String(r.timestamp)).toISOString() : '') },
];
