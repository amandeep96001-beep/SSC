import { useState, useMemo } from 'react';
import { Target, ChevronRight, Plus, Trash2, Check, BookOpen, Flame, CircleDot } from 'lucide-react';
import { useExam } from '@/shared/context/useExam';
import { APP_NAME } from '@/shared/brand';
import { ExamDatePicker } from '@/shared/components/ui/ExamDatePicker';
import { filterProgressForExam, latestProgressByTopic } from '@/shared/utils/examProgress';
import '@/shared/components/ui/exam-date-picker.css';

function topicLabel(topicId) {
  if (!topicId) return 'Topic';
  return String(topicId)
    .replace(/^u-[a-z0-9]+-/i, '')
    .split(/[-_]+/)
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ');
}

function vocabWordFromWrong(wq) {
  if (wq?.word) return wq.word;
  const m = String(wq?.question || '').match(/"([^"]+)"/);
  return m ? m[1] : null;
}

export function TodayFocusWorkspace({
  user,
  setActiveView,
  skipToSubjects,
  selectSubject,
  wrongQuestions = [],
  onReviewWrongVocab,
  onRemoveWrongVocab,
  onClearWrongVocab,
}) {
  const {
    exam,
    examId,
    examDate,
    setExamDate,
    examSubjects,
    openExamPicker,
    targets,
    addTarget,
    toggleTarget,
    removeTarget,
  } = useExam();

  const [draft, setDraft] = useState('');

  const examProgress = useMemo(
    () => filterProgressForExam(user?.progress || [], { examId, examSubjects }),
    [user?.progress, examId, examSubjects]
  );

  const latestByTopic = useMemo(
    () => latestProgressByTopic(examProgress),
    [examProgress]
  );

  const strong = useMemo(
    () => latestByTopic.filter((p) => p.status === 'green'),
    [latestByTopic]
  );
  const remaining = useMemo(
    () => latestByTopic.filter((p) => p.status === 'red' || p.status === 'yellow'),
    [latestByTopic]
  );
  const openTargets = targets.filter((t) => !t.done);
  const doneTargets = targets.filter((t) => t.done);

  const wrongVocab = useMemo(
    () => (wrongQuestions || []).filter((wq) => wq.type === 'vocab'),
    [wrongQuestions]
  );

  const openSubject = (name) => {
    if (typeof selectSubject === 'function') selectSubject(name);
    else {
      skipToSubjects?.();
      setActiveView?.('subjects');
    }
  };

  const submitTarget = (e) => {
    e.preventDefault();
    addTarget(draft);
    setDraft('');
  };

  const reviewWrongVocab = () => {
    if (typeof onReviewWrongVocab === 'function') onReviewWrongVocab();
    else setActiveView?.('drill');
  };

  return (
    <div className="today-focus">
      <header className="today-focus__hero">
        <div className="today-focus__hero-text">
          <p className="today-focus__eyebrow">{APP_NAME} · Study plan</p>
          <h1>What to study</h1>
          <p className="today-focus__sub">
            Subjects, goals, and progress for <strong>{exam.fullName}</strong>.
          </p>
        </div>
        <button type="button" className="today-focus__exam-chip" onClick={openExamPicker} style={{ '--exam-accent': exam.accent }}>
          <Target size={16} />
          <span>{exam.name}</span>
          <ChevronRight size={14} />
        </button>
      </header>

      <ExamDatePicker
        value={examDate}
        onChange={setExamDate}
        accent={exam.accent}
        examName={exam.name}
      />

      {wrongVocab.length > 0 && (
        <section className="study-block study-block--revise-vocab">
          <div className="study-block__head study-block__head--row">
            <div>
              <h2><BookOpen size={18} /> Weak vocabulary</h2>
              <p>Words that need more practice — remove once you know them.</p>
            </div>
            {typeof onClearWrongVocab === 'function' && (
              <button type="button" className="study-clear-vocab-btn" onClick={onClearWrongVocab}>
                Clear all
              </button>
            )}
          </div>
          <ul className="study-wrong-vocab-list">
            {wrongVocab.map((wq, idx) => {
              const word = vocabWordFromWrong(wq) || 'Word';
              const synonyms = Array.isArray(wq.revealSynonyms) ? wq.revealSynonyms : [];
              const antonyms = Array.isArray(wq.revealAntonyms) ? wq.revealAntonyms : [];
              return (
                <li key={`${word}-${idx}`} className="study-wrong-vocab-item">
                  <div className="study-wrong-vocab-item__top">
                    <div className="study-weak-vocab-title">
                      <strong>{word}</strong>
                      {wq.pos && <span className="study-weak-vocab-pos">{wq.pos}</span>}
                    </div>
                    <div className="study-wrong-vocab-item__actions">
                      <em>weak · {wq.wrongCount || 1}×</em>
                      {typeof onRemoveWrongVocab === 'function' && (
                        <button
                          type="button"
                          className="study-wrong-vocab-remove"
                          aria-label={`Remove ${word} from weak vocabulary`}
                          onClick={() => onRemoveWrongVocab(wq.question)}
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  </div>
                  {wq.revealDefinition && (
                    <p className="study-weak-vocab-def">{wq.revealDefinition}</p>
                  )}
                  {synonyms.length > 0 && (
                    <p className="study-weak-vocab-meta"><span>Synonyms</span> {synonyms.join(', ')}</p>
                  )}
                  {antonyms.length > 0 && (
                    <p className="study-weak-vocab-meta"><span>Antonyms</span> {antonyms.join(', ')}</p>
                  )}
                  {!wq.revealDefinition && wq.correctAnswer && (
                    <p className="study-weak-vocab-meta"><span>Answer</span> {wq.correctAnswer}</p>
                  )}
                </li>
              );
            })}
          </ul>
          <button type="button" className="today-link-btn" onClick={reviewWrongVocab}>
            Practice weak vocab in Drills <ChevronRight size={14} />
          </button>
        </section>
      )}

      <div className="study-status-grid">
        <section className="study-block study-block--status">
          <div className="study-block__head">
            <h2><Flame size={18} /> Strong topics</h2>
            <p>{strong.length} topic{strong.length === 1 ? '' : 's'} with high scores on topic tests.</p>
          </div>
          {strong.length === 0 ? (
            <p className="study-empty">
              {examSubjects.length === 0
                ? `No subjects mapped for ${exam.name} yet — ask admin to add them.`
                : `Complete ${exam.name} topic tests to build your strong list.`}
            </p>
          ) : (
            <ul className="study-status-list study-status-list--scroll">
              {strong.map((p) => (
                <li key={p.topicId}>
                  <span className="dot dot--green" />
                  <span className="study-status-label">{topicLabel(p.topicId)}</span>
                  <em>{p.score}/{p.maxScore || 50}</em>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="study-block study-block--status">
          <div className="study-block__head">
            <h2>Needs attention</h2>
            <p>Weaker topic-test scores — separate from weak vocabulary.</p>
          </div>
          {remaining.length === 0 ? (
            <p className="study-empty">
              {examSubjects.length === 0
                ? `Map subjects for ${exam.name} to track weak topics.`
                : `No weak ${exam.name} topics from topic tests yet.`}
            </p>
          ) : (
            <ul className="study-status-list study-status-list--scroll">
              {remaining.map((p) => (
                <li key={p.topicId}>
                  <span className={`dot dot--${p.status}`} />
                  <span className="study-status-label">{topicLabel(p.topicId)}</span>
                  <em>{p.score}/{p.maxScore || 50}</em>
                </li>
              ))}
            </ul>
          )}
          <button type="button" className="today-link-btn" onClick={() => setActiveView('performance')}>
            View performance <ChevronRight size={14} />
          </button>
        </section>
      </div>

      <section className="study-block">
        <div className="study-block__head">
          <h2><BookOpen size={18} /> Exam subjects</h2>
          <p>Configured for your target exam. Open a subject to view syllabus and topics.</p>
        </div>
        <div className="study-subjects">
          {examSubjects.length === 0 && (
            <p className="study-empty">No subjects configured yet. Ask your admin to map subjects for this exam.</p>
          )}
          {examSubjects.map((name) => (
            <button
              key={name}
              type="button"
              className="study-subject-chip"
              style={{ '--exam-accent': exam.accent }}
              onClick={() => openSubject(name)}
            >
              <span>{name}</span>
              <ChevronRight size={16} />
            </button>
          ))}
        </div>
      </section>

      <section className="study-block">
        <div className="study-block__head">
          <h2><CircleDot size={18} /> Study goals</h2>
          <p>Add what you plan to cover, then mark items complete as you finish.</p>
        </div>
        <form className="study-target-form" onSubmit={submitTarget}>
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="e.g. Revise Profit & Loss, Polity Articles 12–35…"
            maxLength={120}
          />
          <button type="submit" disabled={!draft.trim()}>
            <Plus size={16} /> Add
          </button>
        </form>
        <ul className="study-target-list">
          {targets.length === 0 && (
            <li className="study-empty">No goals yet. Add your first study goal above.</li>
          )}
          {openTargets.map((t) => (
            <li key={t.id} className="study-target">
              <button type="button" className="study-target__check" onClick={() => toggleTarget(t.id)} aria-label="Mark done">
                <span />
              </button>
              <span className="study-target__label">{t.label}</span>
              <button type="button" className="study-target__del" onClick={() => removeTarget(t.id)} aria-label="Delete">
                <Trash2 size={14} />
              </button>
            </li>
          ))}
          {doneTargets.map((t) => (
            <li key={t.id} className="study-target is-done">
              <button type="button" className="study-target__check is-on" onClick={() => toggleTarget(t.id)} aria-label="Mark undone">
                <Check size={12} />
              </button>
              <span className="study-target__label">{t.label}</span>
              <button type="button" className="study-target__del" onClick={() => removeTarget(t.id)} aria-label="Delete">
                <Trash2 size={14} />
              </button>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
