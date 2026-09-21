import { isRecord } from '../../types/domain.js';

function csvEscape(v: unknown): string {
  let s = v == null ? '' : String(v);
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

function asCsvRow(row: object): Record<string, unknown> {
  return row as Record<string, unknown>;
}

export function mockProgressToCsv(rows: object[]) {
  const cols = [
    'username', 'examId', 'title', 'score', 'correct', 'wrong', 'blank',
    'accuracy', 'elapsedTime', 'attemptNumber', 'timestamp',
  ];
  const header = cols.join(',');
  const lines = rows.map((r) => cols.map((c) => {
    const row = asCsvRow(r);
    if (c === 'timestamp') {
      return csvEscape(row.timestamp ? new Date(String(row.timestamp)).toISOString() : '');
    }
    return csvEscape(row[c]);
  }).join(','));
  return `${header}\n${lines.join('\n')}\n`;
}

export function syllabusProgressToCsv(rows: object[]) {
  const cols = [
    'username', 'examId', 'topicId', 'subjectName', 'score', 'maxScore',
    'status', 'elapsedTime', 'attemptNumber', 'timestamp',
  ];
  const header = cols.join(',');
  const lines = rows.map((r) => cols.map((c) => {
    const row = asCsvRow(r);
    if (c === 'timestamp') {
      return csvEscape(row.timestamp ? new Date(String(row.timestamp)).toISOString() : '');
    }
    return csvEscape(row[c]);
  }).join(','));
  return `${header}\n${lines.join('\n')}\n`;
}

export function isRecordSafe(value: unknown): value is Record<string, unknown> {
  return isRecord(value);
}
