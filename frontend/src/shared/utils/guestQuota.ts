/** Free try-before-login limits (per browser tab session). */
export const GUEST_DRILL_LIMIT = 10;
export const GUEST_MOCK_QUESTION_LIMIT = 10;

const DRILL_KEY = 'ssc_guest_drill_used';
const MOCK_KEY = 'ssc_guest_mock_used';

function readCount(key: string): number {
  try {
    const n = Number(sessionStorage.getItem(key) || '0');
    return Number.isFinite(n) && n > 0 ? Math.floor(n) : 0;
  } catch {
    return 0;
  }
}

function writeCount(key: string, n: number) {
  try {
    sessionStorage.setItem(key, String(Math.max(0, Math.floor(n))));
  } catch {
    /* ignore */
  }
}

export function getGuestDrillUsed(): number {
  return readCount(DRILL_KEY);
}

export function getGuestDrillRemaining(): number {
  return Math.max(0, GUEST_DRILL_LIMIT - getGuestDrillUsed());
}

export function consumeGuestDrill(): number {
  const next = getGuestDrillUsed() + 1;
  writeCount(DRILL_KEY, next);
  return Math.max(0, GUEST_DRILL_LIMIT - next);
}

export function hasGuestDrillQuota(): boolean {
  return getGuestDrillRemaining() > 0;
}

export function hasGuestMockPreview(): boolean {
  try {
    return sessionStorage.getItem(MOCK_KEY) !== '1';
  } catch {
    return true;
  }
}

export function markGuestMockPreviewUsed() {
  try {
    sessionStorage.setItem(MOCK_KEY, '1');
  } catch {
    /* ignore */
  }
}

export function resetGuestQuotas() {
  try {
    sessionStorage.removeItem(DRILL_KEY);
    sessionStorage.removeItem(MOCK_KEY);
  } catch {
    /* ignore */
  }
}
