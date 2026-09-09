/**
 * Exam-scoped progress helpers.
 * Progress / mock history must only show for the current exam.
 */

import { normalizeSubjectKey } from '@/shared/utils/subjectNames';
import type { ExamProgressScope, MockProgressRow, ProgressRow } from '@/types/app';

const DEFAULT_LEGACY_EXAM = 'ssc';

/**
 * Does a progress/mock row belong to this exam?
 * - New rows: examId must match
 * - Legacy rows (no examId): only attributed to SSC
 */
export function belongsToExam(
  row: ProgressRow | MockProgressRow | null | undefined,
  examId?: string | null
): boolean {
  if (!row) return false;
  const current = examId || DEFAULT_LEGACY_EXAM;
  if (row.examId) return row.examId === current;
  return current === DEFAULT_LEGACY_EXAM;
}

/**
 * Subject must be on this exam's list when configured.
 * Empty list = show all progress for this exam (dynamic / not yet configured).
 */
export function subjectOnExam(subjectName: unknown, examSubjects?: string[] | null): boolean {
  const list = examSubjects || [];
  if (!list.length) return true;
  if (!subjectName) return true;
  const key = normalizeSubjectKey(String(subjectName));
  return list.some((s: string) => normalizeSubjectKey(s) === key);
}

/**
 * Filter topic-test progress for the current exam (+ optional subject map).
 */
export function filterProgressForExam(
  progress: ProgressRow[] | null | undefined,
  { examId, examSubjects }: ExamProgressScope = {}
): ProgressRow[] {
  const list = Array.isArray(progress) ? progress : [];
  return list.filter((p) => {
    if (!belongsToExam(p, examId)) return false;
    if (p.subjectName && !subjectOnExam(p.subjectName, examSubjects)) return false;
    return true;
  });
}

/**
 * Filter mock attempts for the current exam.
 */
export function filterMockProgressForExam(
  mockProgress: MockProgressRow[] | null | undefined,
  { examId }: Pick<ExamProgressScope, 'examId'> = {}
): MockProgressRow[] {
  const list = Array.isArray(mockProgress) ? mockProgress : [];
  return list.filter((m) => belongsToExam(m, examId));
}

/**
 * Latest attempt per topicId (by timestamp / attemptNumber).
 */
export function latestProgressByTopic(progress: ProgressRow[] | null | undefined): ProgressRow[] {
  const map = new Map<string, ProgressRow>();
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
export function progressForTopic(
  progress: ProgressRow[] | null | undefined,
  topicId: string,
  examScope?: ExamProgressScope
): ProgressRow | null {
  const scoped = filterProgressForExam(progress, examScope);
  const forTopic = scoped.filter((p) => p.topicId === topicId);
  if (!forTopic.length) return null;
  return latestProgressByTopic(forTopic)[0] || null;
}
