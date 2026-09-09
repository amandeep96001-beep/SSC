import type { StickyNote } from '@/types/app';

const COLORS = ['yellow', 'mint', 'peach', 'sky', 'lavender'];
const DAILY_KEY = 'ssc_daily_stickies';

export function stickyStorageKey(topicId: string): string {
  return `ssc_stickies_${topicId}`;
}

function parseList(raw: string | null): StickyNote[] {
  try {
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed as StickyNote[] : [];
  } catch {
    return [];
  }
}

export function loadStickies(topicId: string | null | undefined): StickyNote[] {
  if (!topicId) return [];
  return parseList(localStorage.getItem(stickyStorageKey(topicId)));
}

export function saveStickies(topicId: string | null | undefined, list: StickyNote[]): void {
  if (!topicId) return;
  localStorage.setItem(stickyStorageKey(topicId), JSON.stringify(list));
}

export function stickyCountForTopic(topicId: string | null | undefined): number {
  return loadStickies(topicId).length;
}

export function loadDailyStickies(): StickyNote[] {
  return parseList(localStorage.getItem(DAILY_KEY));
}

export function saveDailyStickies(list: StickyNote[]): void {
  localStorage.setItem(DAILY_KEY, JSON.stringify(list));
}

export function dailyStickyCount(): number {
  return loadDailyStickies().length;
}

export function totalStickyCount(topicId: string | null | undefined): number {
  return dailyStickyCount() + (topicId ? stickyCountForTopic(topicId) : 0);
}

export { COLORS as STICKY_COLORS };
