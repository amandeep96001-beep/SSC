import { useMemo } from 'react';
import { ChevronDown } from 'lucide-react';
import { TopicRow } from './TopicRow';
import { ProgressRing } from './ProgressRing';
import { TOPIC_STATUS } from '../data/syllabus';

/**
 * Collapsible subject card with categories and topic checklist.
 */
export function SubjectSection({
  subject,
  subjectStats,
  expanded,
  onToggleExpand,
  getTopic,
  onToggle,
  onCycleStatus,
  onOpenNotes,
  filterStatus,
  searchQuery,
}) {
  const q = (searchQuery || '').trim().toLowerCase();

  const visibleCategories = useMemo(() => {
    return subject.categories
      .map((cat) => {
        const topics = cat.topics.filter((topic) => {
          const entry = getTopic(topic.id);
          if (filterStatus === 'completed' && entry.status !== TOPIC_STATUS.COMPLETED) return false;
          if (filterStatus === 'pending' && entry.status === TOPIC_STATUS.COMPLETED) return false;
          if (filterStatus === 'in_progress' && entry.status !== TOPIC_STATUS.IN_PROGRESS) return false;
          if (q && !topic.name.toLowerCase().includes(q) && !cat.name.toLowerCase().includes(q)) {
            return false;
          }
          return true;
        });
        return { ...cat, topics };
      })
      .filter((cat) => cat.topics.length > 0);
  }, [subject.categories, getTopic, filterStatus, q]);

  const Icon = subject._Icon;
  const hiddenByFilter = visibleCategories.length === 0;
  const stats = subjectStats || { percent: 0, completed: 0, total: 0 };

  return (
    <section
      className={`roadmap-subject roadmap-subject--${subject.color} ${expanded ? 'is-expanded' : ''}`}
      aria-labelledby={`roadmap-subject-${subject.id}`}
    >
      <button
        type="button"
        className="roadmap-subject__header"
        onClick={onToggleExpand}
        aria-expanded={expanded}
        id={`roadmap-subject-${subject.id}`}
      >
        <div className="roadmap-subject__title-row">
          <span className="roadmap-subject__icon" aria-hidden>
            {Icon ? <Icon size={20} strokeWidth={1.75} /> : null}
          </span>
          <div className="roadmap-subject__titles">
            <h2>{subject.name}</h2>
            <p>
              {stats.completed}/{stats.total} topics · {stats.percent}% complete
            </p>
          </div>
        </div>

        <div className="roadmap-subject__aside">
          <div className="roadmap-subject__bar" aria-hidden>
            <div
              className="roadmap-subject__bar-fill"
              style={{ width: `${stats.percent}%` }}
            />
          </div>
          <ProgressRing percent={stats.percent} size={56} stroke={5} tone={subject.color} />
          <ChevronDown
            className={`roadmap-subject__chevron ${expanded ? 'is-open' : ''}`}
            size={20}
            aria-hidden
          />
        </div>
      </button>

      {expanded && (
        <div className="roadmap-subject__body">
          {hiddenByFilter ? (
            <p className="roadmap-empty-inline">No topics match your filters in this subject.</p>
          ) : (
            visibleCategories.map((cat) => (
              <div key={cat.id} className="roadmap-category">
                <h3 className="roadmap-category__title">{cat.name}</h3>
                <ul className="roadmap-topic-list">
                  {cat.topics.map((topic, idx) => (
                    <TopicRow
                      key={topic.id}
                      topic={topic}
                      entry={getTopic(topic.id)}
                      onToggle={onToggle}
                      onCycleStatus={onCycleStatus}
                      onOpenNotes={onOpenNotes}
                      style={{ animationDelay: `${Math.min(idx, 20) * 18}ms` }}
                    />
                  ))}
                </ul>
              </div>
            ))
          )}
        </div>
      )}
    </section>
  );
}
