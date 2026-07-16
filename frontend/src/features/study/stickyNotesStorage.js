const COLORS = ['yellow', 'mint', 'peach', 'sky', 'lavender'];

export function stickyStorageKey(topicId) {
  return `ssc_stickies_${topicId}`;
}

export function loadStickies(topicId) {
  if (!topicId) return [];
  try {
    const raw = localStorage.getItem(stickyStorageKey(topicId));
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveStickies(topicId, list) {
  if (!topicId) return;
  localStorage.setItem(stickyStorageKey(topicId), JSON.stringify(list));
}

export function stickyCountForTopic(topicId) {
  return loadStickies(topicId).length;
}

export { COLORS as STICKY_COLORS };
