const COLORS = ['yellow', 'mint', 'peach', 'sky', 'lavender'];
const DAILY_KEY = 'ssc_daily_stickies';

export function stickyStorageKey(topicId) {
  return `ssc_stickies_${topicId}`;
}

function parseList(raw) {
  try {
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function loadStickies(topicId) {
  if (!topicId) return [];
  return parseList(localStorage.getItem(stickyStorageKey(topicId)));
}

export function saveStickies(topicId, list) {
  if (!topicId) return;
  localStorage.setItem(stickyStorageKey(topicId), JSON.stringify(list));
}

export function stickyCountForTopic(topicId) {
  return loadStickies(topicId).length;
}

export function loadDailyStickies() {
  return parseList(localStorage.getItem(DAILY_KEY));
}

export function saveDailyStickies(list) {
  localStorage.setItem(DAILY_KEY, JSON.stringify(list));
}

export function dailyStickyCount() {
  return loadDailyStickies().length;
}

export function totalStickyCount(topicId) {
  return dailyStickyCount() + (topicId ? stickyCountForTopic(topicId) : 0);
}

export { COLORS as STICKY_COLORS };
