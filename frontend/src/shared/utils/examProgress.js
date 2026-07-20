/**
 * Exam-scoped progress helpers.
 * Progress / mock history must only show for the active exam.
 */

const DEFAULT_LEGACY_EXAM = 'ssc';

function norm(s) {
  return String(s || '').trim().toLowerCase();
}

/**
 * Does a progress/mock row belong to this exam?
 * - New rows: examId must match
 * - Legacy rows (no examId): only attributed to SSC
 */
export function belongsToExam(row, examId) {
  if (!row) return false;
  const current = examId || DEFAULT_LEGACY_EXAM;
  if (row.examId) return row.examId === current;
  return current === DEFAULT_LEGACY_EXAM;
}

/**
 * Subject must be on this exam's official list when subjectName is known.
 * If exam has no subjects mapped, nothing matches (avoids leaking SSC data
 * into empty exams like Banking/UPSC before admin configures them).
 */
export function subjectOnExam(subjectName, examSubjects) {
  const list = examSubjects || [];
  if (!list.length) return false;
  if (!subjectName) return true; // unknown subject — keep if examId matched
  const key = norm(subjectName);
  return list.some((s) => norm(s) === key);
}

/**
 * Filter topic-test progress for the current exam (+ optional subject map).
 */
export function filterProgressForExam(progress, { examId, examSubjects } = {}) {
  const list = Array.isArray(progress) ? progress : [];
  return list.filter((p) => {
    if (!belongsToExam(p, examId)) return false;
    if (p.subjectName && !subjectOnExam(p.subjectName, examSubjects)) return false;
    // Legacy without subjectName: only show when this exam has subjects
    // (still SSC-only via belongsToExam). If subjects empty → hide.
    if (!p.subjectName && !(examSubjects || []).length) return false;
    return true;
  });
}

/**
 * Filter mock attempts for the current exam.
 */
export function filterMockProgressForExam(mockProgress, { examId } = {}) {
  const list = Array.isArray(mockProgress) ? mockProgress : [];
  return list.filter((m) => belongsToExam(m, examId));
}

/**
 * Latest attempt per topicId (by timestamp / attemptNumber).
 */
export function latestProgressByTopic(progress) {
  const map = new Map();
  for (const p of progress || []) {
    if (!p?.topicId) continue;
    const prev = map.get(p.topicId);
    if (!prev) {
      map.set(p.topicId, p);
      continue;
    }
    const prevTs = new Date(prev.timestamp || 0).getTime();
    const nextTs = new Date(p.timestamp || 0).getTime();
    if (nextTs > prevTs || (nextTs === prevTs && (p.attemptNumber || 0) > (prev.attemptNumber || 0))) {
      map.set(p.topicId, p);
    }
  }
  return [...map.values()];
}

/**
 * Syllabus status for a topic card — only from this exam's attempts.
 */
export function progressForTopic(progress, topicId, examScope) {
  const scoped = filterProgressForExam(progress, examScope);
  const forTopic = scoped.filter((p) => p.topicId === topicId);
  if (!forTopic.length) return null;
  return latestProgressByTopic(forTopic)[0] || null;
}
