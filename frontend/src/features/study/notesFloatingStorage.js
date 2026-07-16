const FAB_POS_KEY = 'ssc_notes_fab_pos';

const DEFAULT = { x: 88, y: 82 }; // % of viewport (right/bottom biased)

export function loadFabPosition() {
  try {
    const raw = localStorage.getItem(FAB_POS_KEY);
    if (!raw) return { ...DEFAULT };
    const parsed = JSON.parse(raw);
    if (typeof parsed.x === 'number' && typeof parsed.y === 'number') {
      return {
        x: Math.min(96, Math.max(4, parsed.x)),
        y: Math.min(96, Math.max(8, parsed.y))
      };
    }
  } catch {
    // ignore
  }
  return { ...DEFAULT };
}

export function saveFabPosition(pos) {
  localStorage.setItem(FAB_POS_KEY, JSON.stringify(pos));
}

export function getTopicNotesHtml(topicId, serverNotes, prepareNotesHtml) {
  if (!topicId) return '';
  try {
    const stored = localStorage.getItem(`ssc_notes_${topicId}`);
    return prepareNotesHtml(stored || serverNotes || '');
  } catch {
    return prepareNotesHtml(serverNotes || '');
  }
}
