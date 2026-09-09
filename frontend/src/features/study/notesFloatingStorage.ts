export interface FabPosition {
  x: number;
  y: number;
}

const FAB_POS_KEY = 'ssc_notes_fab_pos';
const FAB_POS_VER = 'ssc_notes_fab_pos_v';

const DEFAULT: FabPosition = { x: 90, y: 84 };

/** Keep button fully on-screen — allow full viewport drag */
export function clampFabPos(pos: FabPosition): FabPosition {
  return {
    x: Math.min(94, Math.max(6, pos.x)),
    y: Math.min(94, Math.max(6, pos.y))
  };
}

export function loadFabPosition(): FabPosition {
  try {
    // Migrate off old "bottom-right only" mobile clamp
    if (localStorage.getItem(FAB_POS_VER) !== '3') {
      localStorage.setItem(FAB_POS_VER, '3');
    }

    const raw = localStorage.getItem(FAB_POS_KEY);
    if (!raw) return { ...DEFAULT };
    const parsed: unknown = JSON.parse(raw);
    if (
      parsed
      && typeof parsed === 'object'
      && typeof (parsed as FabPosition).x === 'number'
      && typeof (parsed as FabPosition).y === 'number'
    ) {
      return clampFabPos(parsed as FabPosition);
    }
  } catch {
    // ignore
  }
  return { ...DEFAULT };
}

export function saveFabPosition(pos: FabPosition): void {
  localStorage.setItem(FAB_POS_KEY, JSON.stringify(clampFabPos(pos)));
}

export function getTopicNotesHtml(
  topicId: string | null | undefined,
  serverNotes: string | null | undefined,
  prepareNotesHtml: (html: string) => string
): string {
  if (!topicId) return '';
  try {
    const stored = localStorage.getItem(`ssc_notes_${topicId}`);
    return prepareNotesHtml(stored || serverNotes || '');
  } catch {
    return prepareNotesHtml(serverNotes || '');
  }
}
