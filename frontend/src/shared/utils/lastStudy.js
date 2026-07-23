/**
 * Derive / format last study activity from progress rows + optional user field.
 */

export function deriveLastStudyAt({ progress = [], mockProgress = [], lastStudyAt = null } = {}) {
  let max = 0;
  if (lastStudyAt) {
    const t = new Date(lastStudyAt).getTime();
    if (!Number.isNaN(t)) max = t;
  }
  for (const row of progress) {
    const t = new Date(row?.timestamp || 0).getTime();
    if (t > max) max = t;
  }
  for (const row of mockProgress) {
    const t = new Date(row?.timestamp || 0).getTime();
    if (t > max) max = t;
  }
  return max > 0 ? new Date(max).toISOString() : null;
}

/**
 * Human-friendly relative label for last study time.
 * @returns {string}
 */
export function formatLastStudyLabel(iso, now = new Date()) {
  if (!iso) return 'Not yet';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return 'Not yet';

  const diffMs = now.getTime() - d.getTime();
  if (diffMs < 0) return 'Just now';
  if (diffMs < 60_000) return 'Just now';
  if (diffMs < 3_600_000) {
    const m = Math.floor(diffMs / 60_000);
    return `${m} min ago`;
  }
  if (diffMs < 24 * 3_600_000) {
    const h = Math.floor(diffMs / 3_600_000);
    if (h < 12) return `${h}h ago`;
  }

  const startToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startYesterday = new Date(startToday);
  startYesterday.setDate(startYesterday.getDate() - 1);
  const time = d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });

  if (d >= startToday) return `Today · ${time}`;
  if (d >= startYesterday) return `Yesterday · ${time}`;

  const dayDiff = Math.floor((startToday - new Date(d.getFullYear(), d.getMonth(), d.getDate())) / 86_400_000);
  if (dayDiff < 7) {
    const weekday = d.toLocaleDateString(undefined, { weekday: 'short' });
    return `${weekday} · ${time}`;
  }

  return d.toLocaleDateString(undefined, {
    day: 'numeric',
    month: 'short',
    ...(d.getFullYear() !== now.getFullYear() ? { year: 'numeric' } : {}),
  });
}
