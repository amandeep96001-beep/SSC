import { useState, useMemo } from 'react';
import { Clock, CheckCircle, XCircle, MinusCircle, ClipboardList, Target, Award, AlertCircle, BookOpen, TrendingUp, Download } from 'lucide-react';
import { StatCard } from '@/shared/components/ui/StatCard';
import { useExam } from '@/shared/context/useExam';
import { filterProgressForExam, filterMockProgressForExam } from '@/shared/utils/examProgress';
import {
  rowsToCsv,
  downloadTextFile,
  MOCK_PROGRESS_CSV_COLUMNS,
  SYLLABUS_PROGRESS_CSV_COLUMNS,
} from '@/shared/utils/csvExport';
import { showAppToast } from '@/shared/utils/appToast';

function formatTopicLabel(topicId) {
  if (!topicId) return 'Unknown topic';
  let slug = String(topicId);
  slug = slug.replace(/^u-[a-z0-9]+-/i, '');
  return slug
    .split(/[-_]+/)
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ');
}

function formatTimestamp(ts) {
  if (!ts) return '—';
  try {
    return new Date(ts).toLocaleString(undefined, {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    });
  } catch {
    return '—';
  }
}

function statusMeta(status) {
  if (status === 'green') return { label: 'Mastered', tone: 'green' };
  if (status === 'yellow') return { label: 'Reviewing', tone: 'yellow' };
  if (status === 'red') return { label: 'Needs work', tone: 'red' };
  return { label: 'Logged', tone: 'gray' };
}

function ScoreRing({ score, maxScore, tone }) {
  const max = maxScore || 50;
  const pct = max > 0 ? Math.min(100, Math.max(0, Math.round((score / max) * 100))) : 0;
  const r = 18;
  const c = 2 * Math.PI * r;
  const offset = c - (pct / 100) * c;

  return (
    <div className={`perf-score-ring perf-score-ring--${tone}`} aria-label={`Score ${score} of ${max}`}>
      <svg width="52" height="52" viewBox="0 0 52 52">
        <circle className="perf-score-ring__track" cx="26" cy="26" r={r} />
        <circle
          className="perf-score-ring__fill"
          cx="26"
          cy="26"
          r={r}
          strokeDasharray={c}
          strokeDashoffset={offset}
        />
      </svg>
      <div className="perf-score-ring__label">
        <strong>{score}</strong>
        <span>/{max}</span>
      </div>
    </div>
  );
}

function HistoryCard({ title, attempt, tone, score, maxScore, statusLabel, elapsed, timestamp, children, index }) {
  return (
    <article
      className={`perf-log-card perf-log-card--${tone}`}
      style={{ animationDelay: `${Math.min(index, 12) * 40}ms` }}
    >
      <div className="perf-log-card__accent" aria-hidden />
      <ScoreRing score={score} maxScore={maxScore} tone={tone} />
      <div className="perf-log-card__body">
        <div className="perf-log-card__top">
          <div className="perf-log-card__titles">
            <h4 className="perf-log-card__title" title={title}>{title}</h4>
            <span className="perf-attempt-chip">Attempt {attempt}</span>
          </div>
          <span className={`status-badge-pill ${tone}`}>{statusLabel}</span>
        </div>
        <div className="perf-log-card__meta">
          <span className="perf-time">
            <Clock size={13} aria-hidden />
            {elapsed || '—'}
          </span>
          <span className="perf-date">{formatTimestamp(timestamp)}</span>
        </div>
        {children}
      </div>
    </article>
  );
}

export function PerformanceWorkspace({ user }) {
  const [activeTab, setActiveTab] = useState('syllabus');
  const [exporting, setExporting] = useState(false);
  const { exam, examId, examSubjects } = useExam();

  const progress = useMemo(
    () => filterProgressForExam(user.progress || [], { examId, examSubjects }),
    [user.progress, examId, examSubjects]
  );
  const mockProgress = useMemo(
    () => filterMockProgressForExam(user.mockProgress || [], { examId }),
    [user.mockProgress, examId]
  );

  const exportMine = async (kind) => {
    setExporting(true);
    try {
      const rows = kind === 'mock' ? mockProgress : progress;
      if (!rows.length) {
        showAppToast('No attempts to export for this exam yet.', { variant: 'warn' });
        return;
      }

      // Attach username so CSV matches server export shape
      const withUser = rows.map((r) => ({
        username: user?.username || '',
        ...r,
      }));

      const csv = kind === 'mock'
        ? rowsToCsv(withUser, MOCK_PROGRESS_CSV_COLUMNS)
        : rowsToCsv(withUser, SYLLABUS_PROGRESS_CSV_COLUMNS);

      const file = kind === 'mock'
        ? `my-mock-progress-${examId || 'all'}.csv`
        : `my-syllabus-progress-${examId || 'all'}.csv`;

      downloadTextFile(file, csv);
      showAppToast(`Downloaded ${rows.length} row${rows.length === 1 ? '' : 's'}.`, {
        variant: 'success',
        durationMs: 2200,
      });
    } catch (e) {
      showAppToast(e.message || 'Export failed.', { variant: 'error' });
    } finally {
      setExporting(false);
    }
  };

  const syllabusStats = useMemo(() => {
    const progressCount = progress.length;
    const averageScore = progressCount > 0
      ? Math.round(progress.reduce((sum, curr) => sum + curr.score, 0) / progressCount)
      : 0;
    const averageMaxScore = progressCount > 0
      ? Math.round(progress.reduce((sum, curr) => sum + (curr.maxScore || 50), 0) / progressCount)
      : 50;
    return {
      progressCount,
      averageScore,
      averageMaxScore,
      masteredCount: progress.filter(p => p.status === 'green').length,
      reviewingCount: progress.filter(p => p.status === 'yellow').length,
      revisionNeededCount: progress.filter(p => p.status === 'red').length
    };
  }, [progress]);

  const mockStats = useMemo(() => {
    const mockCount = mockProgress.length;
    const marksPerQ = exam?.marking?.correct ?? 2;
    const averageMax = mockCount > 0
      ? Math.round(
          mockProgress.reduce((sum, curr) => {
            const q = (curr.correct || 0) + (curr.wrong || 0) + (curr.blank || 0);
            return sum + (q > 0 ? q * marksPerQ : marksPerQ * 100);
          }, 0) / mockCount
        )
      : marksPerQ * 100;
    return {
      mockCount,
      averageMockScore: mockCount > 0
        ? (mockProgress.reduce((sum, curr) => sum + curr.score, 0) / mockCount).toFixed(1)
        : '0.0',
      averageMax,
      averageMockAccuracy: mockCount > 0
        ? Math.round(mockProgress.reduce((sum, curr) => sum + curr.accuracy, 0) / mockCount)
        : 0,
      totalMockCorrect: mockProgress.reduce((sum, curr) => sum + curr.correct, 0),
      totalMockWrong: mockProgress.reduce((sum, curr) => sum + curr.wrong, 0)
    };
  }, [mockProgress, exam]);

  return (
    <div className="study-workspace perf-workspace">
      <div className="workspace-header-sticky">
        <div className="section-header perf-hero-header">
          <div>
            <h1>Performance Tracker</h1>
            <p className="section-header-sub">
              {exam.name} — syllabus coverage, mock averages, and weak areas for this exam only.
            </p>
          </div>
          <button
            type="button"
            className="perf-export-btn"
            disabled={exporting}
            onClick={() => exportMine(activeTab === 'mock' ? 'mock' : 'syllabus')}
          >
            <Download size={15} strokeWidth={2} />
            {exporting ? 'Exporting…' : 'Export CSV'}
          </button>
        </div>

        <div className="perf-mode-toggle" role="tablist" aria-label="Performance mode">
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'syllabus'}
            className={`perf-mode-btn ${activeTab === 'syllabus' ? 'active' : ''}`}
            onClick={() => setActiveTab('syllabus')}
          >
            <BookOpen size={15} strokeWidth={2} /> Syllabus Practice
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'mock'}
            className={`perf-mode-btn ${activeTab === 'mock' ? 'active' : ''}`}
            onClick={() => setActiveTab('mock')}
          >
            <ClipboardList size={15} strokeWidth={2} /> Full Mock Exams
          </button>
        </div>
      </div>

      <div className="workspace-scrollable-content">
        {activeTab === 'syllabus' ? (
          <>
            <div className="stats-row">
              <StatCard icon={ClipboardList} label="Tests Completed" value={syllabusStats.progressCount} variant="blue" />
              <StatCard icon={Target} label="Average Score" value={`${syllabusStats.averageScore} / ${syllabusStats.averageMaxScore}`} variant="lavender" />
              <StatCard icon={Award} label="Mastered" value={syllabusStats.masteredCount} variant="mint" />
              <StatCard icon={BookOpen} label="Reviewing" value={syllabusStats.reviewingCount} variant="peach" />
              <StatCard icon={AlertCircle} label="Needs Help" value={syllabusStats.revisionNeededCount} variant="rose" />
            </div>

            <section className="performance-history-card">
              <div className="perf-history-head">
                <h3>Syllabus test history</h3>
                <span className="perf-count-chip">{progress.length} logged</span>
              </div>

              {progress.length > 0 ? (
                <div className="perf-log-list">
                  {progress.map((record, i) => {
                    const meta = statusMeta(record.status);
                    return (
                      <HistoryCard
                        key={`${record.topicId}-${record.attemptNumber || 1}-${i}`}
                        index={i}
                        title={formatTopicLabel(record.topicId)}
                        attempt={record.attemptNumber || 1}
                        tone={meta.tone}
                        score={record.score}
                        maxScore={record.maxScore || 50}
                        statusLabel={meta.label}
                        elapsed={record.elapsedTime}
                        timestamp={record.timestamp}
                      />
                    );
                  })}
                </div>
              ) : (
                <div className="empty-state">
                  <p>No tests taken yet. Head over to Syllabus & Notes and start a topic test.</p>
                </div>
              )}
            </section>
          </>
        ) : (
          <>
            <div className="stats-row">
              <StatCard icon={ClipboardList} label="Mocks Completed" value={mockStats.mockCount} variant="blue" />
              <StatCard icon={Target} label="Average Mock Score" value={`${mockStats.averageMockScore} / ${mockStats.averageMax}`} variant="lavender" />
              <StatCard icon={Award} label="Average Accuracy" value={`${mockStats.averageMockAccuracy}%`} variant="mint" />
              <StatCard icon={CheckCircle} label="Total Correct" value={mockStats.totalMockCorrect} variant="peach" />
              <StatCard icon={XCircle} label="Total Wrong" value={mockStats.totalMockWrong} variant="rose" />
            </div>

            <section className="performance-history-card">
              <div className="perf-history-head">
                <h3>Full mock exam history</h3>
                <span className="perf-count-chip">{mockProgress.length} logged</span>
              </div>

              {mockProgress.length > 0 ? (
                <div className="perf-log-list">
                  {mockProgress.map((record, i) => {
                    const tone = record.accuracy >= 80 ? 'green' : record.accuracy >= 50 ? 'yellow' : 'red';
                    return (
                      <HistoryCard
                        key={`${record.mockTestId || record.title}-${record.attemptNumber || 1}-${i}`}
                        index={i}
                        title={record.title}
                        attempt={record.attemptNumber || 1}
                        tone={tone}
                        score={record.score}
                        maxScore={((record.correct || 0) + (record.wrong || 0) + (record.blank || 0)) * (exam?.marking?.correct ?? 2) || 200}
                        statusLabel={`${record.accuracy}% accuracy`}
                        elapsed={record.elapsedTime}
                        timestamp={record.timestamp}
                      >
                        <div className="perf-breakdown">
                          <span className="perf-breakdown-item ok">
                            <CheckCircle size={13} /> {record.correct} correct
                          </span>
                          <span className="perf-breakdown-item bad">
                            <XCircle size={13} /> {record.wrong} wrong
                          </span>
                          <span className="perf-breakdown-item blank">
                            <MinusCircle size={13} /> {record.blank} blank
                          </span>
                        </div>
                        {record.sectionTimes && (
                          <div className="perf-section-times">
                            {Object.entries(record.sectionTimes).map(([sec, secs]) => (
                              <span key={sec} className="perf-section-chip">
                                {sec.slice(0, 3)} {Math.floor(secs / 60)}m {secs % 60}s
                              </span>
                            ))}
                          </div>
                        )}
                      </HistoryCard>
                    );
                  })}
                </div>
              ) : (
                <div className="empty-state">
                  <p>No full mock exams taken yet. Open Full Mock, pick a test, and start.</p>
                </div>
              )}

              {mockProgress.length > 0 && (
                <p className="perf-footnote">Scoring for {exam.name}: {exam.markingLabel}.</p>
              )}
            </section>
          </>
        )}
      </div>
    </div>
  );
}
