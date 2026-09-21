import { isRecord, type PublicUserPayload } from '../../types/domain.js';

export interface PublicUserSource {
  username: string;
  email?: string | null;
  displayName?: string | null;
  emailVerified?: boolean;
  role?: string;
  lastStudyAt?: Date | string | null;
}

function rowTimestamp(row: unknown): number {
  if (!isRecord(row)) return 0;
  const ts = row.timestamp;
  if (ts instanceof Date) return ts.getTime();
  if (typeof ts === 'string' || typeof ts === 'number') {
    const t = new Date(ts).getTime();
    return Number.isNaN(t) ? 0 : t;
  }
  return 0;
}

export function deriveLastStudyAt(
  progress: unknown[] = [],
  mockProgress: unknown[] = [],
  stored: Date | string | null = null,
): string | null {
  let max = 0;
  if (stored) {
    const t = new Date(stored).getTime();
    if (!Number.isNaN(t)) max = t;
  }
  for (const row of progress) {
    const t = rowTimestamp(row);
    if (t > max) max = t;
  }
  for (const row of mockProgress) {
    const t = rowTimestamp(row);
    if (t > max) max = t;
  }
  return max > 0 ? new Date(max).toISOString() : null;
}

export function publicUserPayload(
  user: PublicUserSource,
  progress: unknown[] = [],
  mockProgress: unknown[] = [],
  token: string | null = null,
): PublicUserPayload {
  const payload: PublicUserPayload = {
    username: user.username,
    email: user.email || null,
    displayName: user.displayName || null,
    emailVerified: Boolean(user.emailVerified),
    role: user.role || 'user',
    lastStudyAt: deriveLastStudyAt(progress, mockProgress, user.lastStudyAt ?? null),
    progress,
    mockProgress,
  };
  if (token) payload.token = token;
  return payload;
}

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
    if (c === 'timestamp') return csvEscape(row.timestamp ? new Date(String(row.timestamp)).toISOString() : '');
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
    if (c === 'timestamp') return csvEscape(row.timestamp ? new Date(String(row.timestamp)).toISOString() : '');
    return csvEscape(row[c]);
  }).join(','));
  return `${header}\n${lines.join('\n')}\n`;
}
