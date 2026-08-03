import { useMemo, useState, useCallback, useEffect, useRef } from 'react';
import {
  Search,
  CheckCheck,
  RotateCcw,
  ChevronsDownUp,
  ChevronsUpDown,
  Calculator,
  Brain,
  BookOpen,
  Globe2,
  Map,
  ListFilter,
} from 'lucide-react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { StatCard } from '@/shared/components/ui/StatCard';
import { useExam } from '@/shared/context/useExam';
import { listExamSyllabi } from '../data/syllabus';
import { useRoadmapProgress, resolveSyllabusKey } from '../hooks/useRoadmapProgress';
import { ProgressRing } from './ProgressRing';
import { SubjectSection } from './SubjectSection';
import { NotesModal } from './NotesModal';
import '../roadmap.css';

const ICON_MAP = {
  Calculator,
  Brain,
  BookOpen,
  Globe2,
};

const FILTERS = [
  { id: 'all', label: 'All' },
  { id: 'completed', label: 'Completed' },
  { id: 'pending', label: 'Pending' },
  { id: 'in_progress', label: 'In Progress' },
];

/**
 * SSC Exam Syllabus Roadmap — interactive topic checklist with progress.
 */
export function SyllabusRoadmapWorkspace() {
  const { examId } = useExam();
  const exams = useMemo(() => listExamSyllabi(), []);
  const [examKey, setExamKey] = useState(() => resolveSyllabusKey(examId));
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [expanded, setExpanded] = useState({});
  const [notesTopic, setNotesTopic] = useState(null);
  const [confirmReset, setConfirmReset] = useState(false);
  const rootRef = useRef(null);

  const {
    syllabus,
    stats,
    getTopic,
    toggleCompleted,
    cycleTopicStatus,
    setTopicNotes,
    markAllCompleted,
    resetProgress,
  } = useRoadmapProgress({ examKey });

  // Sync when user switches target exam in the picker
  useEffect(() => {
    setExamKey(resolveSyllabusKey(examId));
  }, [examId]);

  // Expand all subjects by default when syllabus changes
  useEffect(() => {
    const next = {};
    syllabus.subjects.forEach((s) => {
      next[s.id] = true;
    });
    setExpanded(next);
  }, [syllabus.id, syllabus.subjects]);

  const subjectsWithIcons = useMemo(
    () =>
      syllabus.subjects.map((s) => ({
        ...s,
        _Icon: ICON_MAP[s.icon] || BookOpen,
      })),
    [syllabus.subjects]
  );

  const allExpanded = subjectsWithIcons.every((s) => expanded[s.id]);

  const toggleExpandAll = useCallback(() => {
    const nextVal = !allExpanded;
    const next = {};
    subjectsWithIcons.forEach((s) => {
      next[s.id] = nextVal;
    });
    setExpanded(next);
  }, [allExpanded, subjectsWithIcons]);

  const handleReset = useCallback(() => {
    resetProgress();
    setConfirmReset(false);
  }, [resetProgress]);

  useGSAP(
    () => {
      gsap.fromTo(
        '.roadmap-dash-card',
        { y: 16, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.45, stagger: 0.06, ease: 'power2.out', clearProps: 'all' }
      );
      gsap.fromTo(
        '.roadmap-subject',
        { y: 20, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.5, stagger: 0.08, delay: 0.15, ease: 'power2.out', clearProps: 'all' }
      );
    },
    { scope: rootRef, dependencies: [syllabus.id] }
  );

  return (
    <div className="study-workspace roadmap-workspace" ref={rootRef}>
      <div className="workspace-header-sticky">
        <div className="page-header">
          <div className="page-header__title">
            <h1>
              <Map size={22} className="roadmap-title-icon" aria-hidden />
              Syllabus Roadmap
            </h1>
            <p>{syllabus.description}</p>
          </div>
          <div className="page-header__actions roadmap-header-actions">
            <label className="roadmap-exam-select">
              <span className="sr-only">Exam syllabus</span>
              <select
                value={examKey}
                onChange={(e) => setExamKey(e.target.value)}
                aria-label="Select exam syllabus"
              >
                {exams.map((ex) => (
                  <option key={ex.id} value={ex.id}>
                    {ex.name}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </div>
      </div>

      <div className="roadmap-scroll">
        {/* Dashboard stats */}
        <div className="roadmap-dashboard">
          <div className="roadmap-overall-card roadmap-dash-card">
            <ProgressRing percent={stats.percent} size={100} stroke={9} label="Overall" />
            <div className="roadmap-overall-copy">
              <h2>Overall Progress</h2>
              <p>
                <strong>{stats.completed}</strong> of <strong>{stats.total}</strong> topics completed
              </p>
              <div className="roadmap-subject-pills">
                {subjectsWithIcons.map((s) => {
                  const st = stats.bySubject[s.id];
                  return (
                    <span key={s.id} className={`roadmap-pill roadmap-pill--${s.color}`}>
                      {s.shortName}: {st?.percent ?? 0}%
                    </span>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="roadmap-stat-grid">
            <div className="roadmap-dash-card">
              <StatCard icon={ListFilter} label="Total Topics" value={stats.total} variant="blue" />
            </div>
            <div className="roadmap-dash-card">
              <StatCard icon={CheckCheck} label="Completed" value={stats.completed} variant="mint" />
            </div>
            <div className="roadmap-dash-card">
              <StatCard icon={RotateCcw} label="Remaining" value={stats.remaining} variant="peach" />
            </div>
            <div className="roadmap-dash-card">
              <StatCard
                icon={Map}
                label="Completion"
                value={`${stats.percent}%`}
                variant="lavender"
              />
            </div>
          </div>
        </div>

        {/* Toolbar */}
        <div className="roadmap-toolbar">
          <div className="roadmap-search">
            <Search size={16} aria-hidden />
            <input
              type="search"
              placeholder="Search topics…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              aria-label="Search topics"
            />
          </div>

          <div className="roadmap-filters" role="group" aria-label="Filter by status">
            {FILTERS.map((f) => (
              <button
                key={f.id}
                type="button"
                className={`roadmap-filter-btn ${filterStatus === f.id ? 'is-active' : ''}`}
                onClick={() => setFilterStatus(f.id)}
                aria-pressed={filterStatus === f.id}
              >
                {f.label}
              </button>
            ))}
          </div>

          <div className="roadmap-toolbar__actions">
            <button
              type="button"
              className="roadmap-action-btn"
              onClick={toggleExpandAll}
            >
              {allExpanded ? <ChevronsDownUp size={15} /> : <ChevronsUpDown size={15} />}
              <span>{allExpanded ? 'Collapse all' : 'Expand all'}</span>
            </button>
            <button
              type="button"
              className="roadmap-action-btn"
              onClick={markAllCompleted}
            >
              <CheckCheck size={15} />
              <span>Mark all done</span>
            </button>
            <button
              type="button"
              className="roadmap-action-btn roadmap-action-btn--danger"
              onClick={() => setConfirmReset(true)}
            >
              <RotateCcw size={15} />
              <span>Reset</span>
            </button>
          </div>
        </div>

        {/* Subjects */}
        <div className="roadmap-subjects">
          {subjectsWithIcons.map((subject) => (
            <SubjectSection
              key={subject.id}
              subject={subject}
              subjectStats={stats.bySubject[subject.id]}
              expanded={Boolean(expanded[subject.id])}
              onToggleExpand={() =>
                setExpanded((prev) => ({ ...prev, [subject.id]: !prev[subject.id] }))
              }
              getTopic={getTopic}
              onToggle={toggleCompleted}
              onCycleStatus={cycleTopicStatus}
              onOpenNotes={setNotesTopic}
              filterStatus={filterStatus}
              searchQuery={search}
            />
          ))}
        </div>
      </div>

      {notesTopic && (
        <NotesModal
          topic={notesTopic}
          notes={getTopic(notesTopic.id).notes}
          onSave={setTopicNotes}
          onClose={() => setNotesTopic(null)}
        />
      )}

      {confirmReset && (
        <div className="modal-overlay" onClick={() => setConfirmReset(false)} role="presentation">
          <div
            className="modal-content-card roadmap-confirm-modal"
            onClick={(e) => e.stopPropagation()}
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="roadmap-reset-title"
            aria-describedby="roadmap-reset-desc"
          >
            <div className="modal-header">
              <h3 id="roadmap-reset-title">Reset progress?</h3>
            </div>
            <p id="roadmap-reset-desc" className="roadmap-confirm-copy">
              This clears all completion status and notes for <strong>{syllabus.shortName}</strong>.
              This cannot be undone.
            </p>
            <div className="roadmap-notes-modal__actions">
              <button type="button" className="btn-cancel" onClick={() => setConfirmReset(false)}>
                Cancel
              </button>
              <button type="button" className="btn-save-topic roadmap-btn-danger" onClick={handleReset}>
                Reset progress
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
