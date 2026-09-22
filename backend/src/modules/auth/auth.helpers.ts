import { isRecord, type PublicUserPayload } from '../../types/domain.js';
import type { PublicUserSource } from './auth.interface.js';

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
  opts: { includeAvatar?: boolean } = {},
): PublicUserPayload {
  const includeAvatar = opts.includeAvatar !== false;
  const payload: PublicUserPayload = {
    username: user.username,
    email: user.email || null,
    displayName: user.displayName || null,
    avatarUrl: includeAvatar ? (user.avatarUrl || null) : null,
    emailVerified: Boolean(user.emailVerified),
    role: user.role || 'user',
    lastStudyAt: deriveLastStudyAt(progress, mockProgress, user.lastStudyAt ?? null),
    progress,
    mockProgress,
  };
  if (token) payload.token = token;
  return payload;
}
