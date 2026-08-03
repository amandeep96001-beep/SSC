import { STATUS_LABELS, TOPIC_STATUS } from '../data/syllabus';
import { Check, Circle, StickyNote, Loader } from 'lucide-react';

function formatDate(iso) {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return '—';
  }
}

/**
 * Single topic row with checkbox, status, date, and notes.
 */
export function TopicRow({
  topic,
  entry,
  onToggle,
  onCycleStatus,
  onOpenNotes,
  style,
}) {
  const status = entry?.status || TOPIC_STATUS.PENDING;
  const hasNotes = Boolean(entry?.notes?.trim());
  const isDone = status === TOPIC_STATUS.COMPLETED;
  const isProg = status === TOPIC_STATUS.IN_PROGRESS;

  return (
    <li
      className={`roadmap-topic roadmap-topic--${status}`}
      style={style}
      data-status={status}
    >
      <button
        type="button"
        className="roadmap-topic__check"
        onClick={() => onToggle(topic.id)}
        aria-pressed={isDone}
        aria-label={`${isDone ? 'Unmark' : 'Mark'} ${topic.name} completed`}
      >
        {isDone ? (
          <Check size={14} strokeWidth={2.5} aria-hidden />
        ) : isProg ? (
          <Loader size={14} strokeWidth={2.25} aria-hidden />
        ) : (
          <Circle size={14} strokeWidth={2} aria-hidden />
        )}
      </button>

      <div className="roadmap-topic__body">
        <span className="roadmap-topic__name">{topic.name}</span>
        <div className="roadmap-topic__meta">
          <button
            type="button"
            className={`roadmap-status-chip roadmap-status-chip--${status}`}
            onClick={() => onCycleStatus(topic.id)}
            title="Click to cycle status"
            aria-label={`Status ${STATUS_LABELS[status]}. Click to change.`}
          >
            {STATUS_LABELS[status]}
          </button>
          <time className="roadmap-topic__date" dateTime={entry?.updatedAt || undefined}>
            {formatDate(entry?.updatedAt)}
          </time>
        </div>
      </div>

      <button
        type="button"
        className={`roadmap-topic__notes ${hasNotes ? 'has-notes' : ''}`}
        onClick={() => onOpenNotes(topic)}
        aria-label={hasNotes ? `Edit notes for ${topic.name}` : `Add notes for ${topic.name}`}
        title={hasNotes ? 'Edit notes' : 'Add notes'}
      >
        <StickyNote size={16} strokeWidth={1.75} />
      </button>
    </li>
  );
}
