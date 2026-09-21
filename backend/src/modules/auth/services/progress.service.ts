import progressRepository from '../repositories/progress.repository.js';
import mockProgressRepository from '../repositories/mock-progress.repository.js';
import userRepository from '../repositories/user.repository.js';
import { mockProgressToCsv, syllabusProgressToCsv } from '../auth.helpers.js';
import type { ProgressStatus } from '../../../types/domain.js';
import type {
  AdminSummary,
  ProgressExportOptions,
  SaveMockProgressInput,
  SaveProgressInput,
} from '../auth.types.js';
import { badRequest, forbidden } from '../../../shared/errors/http-error.js';

interface ProgressSaveResult {
  data: unknown[];
  lastStudyAt: string;
}

interface CsvExportResult {
  csv: string;
  filename: string;
}

export async function saveProgress(
  username: string,
  userId: string,
  body: SaveProgressInput,
): Promise<ProgressSaveResult> {
  const { topicId, score, maxScore, elapsedTime, examId, subjectName } = body;
  if (!topicId) {
    throw badRequest('topicId is required.');
  }

  let status: ProgressStatus = 'red';
  const dynamicMaxScore = maxScore || 50;
  const scoreNum = Number(score) || 0;
  if (scoreNum >= (dynamicMaxScore * 0.8)) status = 'green';
  else if (scoreNum >= (dynamicMaxScore * 0.4)) status = 'yellow';

  const scopedExamId = examId ? String(examId).trim() : null;
  const scopedSubject = subjectName ? String(subjectName).trim() : null;

  const attemptFilter: { username: string; topicId: string; examId?: string } = {
    username,
    topicId: String(topicId),
  };
  if (scopedExamId) attemptFilter.examId = scopedExamId;

  const existingCount = await progressRepository.countAttempts(attemptFilter);

  await progressRepository.create({
    username,
    examId: scopedExamId,
    subjectName: scopedSubject,
    topicId: String(topicId),
    score: scoreNum,
    maxScore: dynamicMaxScore,
    status,
    elapsedTime: elapsedTime != null ? String(elapsedTime) : undefined,
    attemptNumber: existingCount + 1,
    timestamp: new Date(),
  });

  await userRepository.touchLastStudyAt(userId);

  return {
    data: await progressRepository.findByUsername(username),
    lastStudyAt: new Date().toISOString(),
  };
}

export async function saveMockProgress(
  username: string,
  userId: string,
  body: SaveMockProgressInput,
): Promise<ProgressSaveResult> {
  const {
    mockTestId, title, score, correct, wrong, blank, accuracy,
    elapsedTime, sectionTimes, examId,
  } = body;

  const scopedExamId = examId ? String(examId).trim() : null;
  const attemptFilter: { username: string; mockTestId: string; examId?: string } = {
    username,
    mockTestId: String(mockTestId),
  };
  if (scopedExamId) attemptFilter.examId = scopedExamId;

  const existingCount = await mockProgressRepository.countAttempts(attemptFilter);

  await mockProgressRepository.create({
    username,
    examId: scopedExamId,
    mockTestId: String(mockTestId),
    title: String(title ?? ''),
    score: Number(score) || 0,
    correct: Number(correct) || 0,
    wrong: Number(wrong) || 0,
    blank: Number(blank) || 0,
    accuracy: Number(accuracy) || 0,
    elapsedTime: elapsedTime != null ? String(elapsedTime) : undefined,
    sectionTimes:
      sectionTimes && typeof sectionTimes === 'object'
        ? (sectionTimes as Record<string, unknown>)
        : null,
    attemptNumber: existingCount + 1,
    timestamp: new Date(),
  });

  await userRepository.touchLastStudyAt(userId);

  return {
    data: await mockProgressRepository.findByUsername(username),
    lastStudyAt: new Date().toISOString(),
  };
}

export async function exportMockProgressCsv(opts: ProgressExportOptions): Promise<CsvExportResult> {
  const filter: { username?: string; examId?: string } = {};
  if (opts.scope === 'all') {
    if (opts.role !== 'admin') throw forbidden('Admin access required.');
  } else {
    filter.username = opts.username;
  }
  if (opts.examId) filter.examId = opts.examId;

  const rows = await mockProgressRepository.findFiltered(filter);
  const who = opts.scope === 'all' ? 'all' : opts.username;
  return { csv: mockProgressToCsv(rows), filename: `mock-progress-${who}.csv` };
}

export async function exportSyllabusProgressCsv(opts: ProgressExportOptions): Promise<CsvExportResult> {
  const filter: { username?: string; examId?: string } = {};
  if (opts.scope === 'all') {
    if (opts.role !== 'admin') throw forbidden('Admin access required.');
  } else {
    filter.username = opts.username;
  }
  if (opts.examId) filter.examId = opts.examId;

  const rows = await progressRepository.findFiltered(filter);
  const who = opts.scope === 'all' ? 'all' : opts.username;
  return { csv: syllabusProgressToCsv(rows), filename: `syllabus-progress-${who}.csv` };
}

export async function getAdminSummary(): Promise<AdminSummary> {
  const [userCount, mockAttemptCount, syllabusAttemptCount] = await Promise.all([
    userRepository.countAll(),
    mockProgressRepository.countAll(),
    progressRepository.countAll(),
  ]);
  return { userCount, mockAttemptCount, syllabusAttemptCount };
}
