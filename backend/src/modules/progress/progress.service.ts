import mongoose from 'mongoose';
import progressRepository from './progress.repository.js';
import mockProgressRepository from './mock-progress.repository.js';
import authRepository from '../auth/auth.repository.js';
import { mockProgressToCsv, syllabusProgressToCsv } from './progress.helpers.js';
import type { ProgressStatus } from '../../types/domain.js';
import type {
  ProgressExportOptions,
  SaveMockProgressInput,
  SaveProgressInput,
} from './progress.interface.js';
import type { AdminSummary } from '../admin/admin.interface.js';
import { badRequest, forbidden } from '../../utils/app-errors.js';

interface ProgressSaveResult {
  data: unknown[];
  lastStudyAt: string;
}

interface CsvExportResult {
  csv: string;
  filename: string;
}

function computeSyllabusScore(body: SaveProgressInput): { score: number; maxScore: number; status: ProgressStatus } {
  const maxScore = Math.min(10_000, Math.max(1, Number(body.maxScore) || 50));
  const hasCounts =
    body.correct !== undefined || body.wrong !== undefined || body.blank !== undefined;

  let score: number;
  if (hasCounts) {
    const correct = Math.max(0, Number(body.correct) || 0);
    const wrong = Math.max(0, Number(body.wrong) || 0);
    const blank = Math.max(0, Number(body.blank) || 0);
    const total = correct + wrong + blank;
    if (total > 0) {
      score = Math.min(maxScore, Math.round((correct / total) * maxScore));
    } else {
      score = Math.min(maxScore, Math.max(0, Number(body.score) || 0));
    }
  } else {
    score = Math.min(maxScore, Math.max(0, Number(body.score) || 0));
  }

  let status: ProgressStatus = 'red';
  if (score >= maxScore * 0.8) status = 'green';
  else if (score >= maxScore * 0.4) status = 'yellow';

  return { score, maxScore, status };
}

function computeMockScore(body: SaveMockProgressInput): {
  score: number;
  correct: number;
  wrong: number;
  blank: number;
  accuracy: number;
} {
  const correct = Math.min(500, Math.max(0, Number(body.correct) || 0));
  const wrong = Math.min(500, Math.max(0, Number(body.wrong) || 0));
  const blank = Math.min(500, Math.max(0, Number(body.blank) || 0));
  const answered = correct + wrong;
  const accuracy =
    answered > 0
      ? Math.round((correct / answered) * 1000) / 10
      : Math.min(100, Math.max(0, Number(body.accuracy) || 0));
  // Prefer count-derived score; ignore client score when counts are present.
  const score = correct - wrong * 0.25;

  return { score, correct, wrong, blank, accuracy };
}

export class ProgressService {
  async saveProgress(
    userId: string,
    username: string,
    body: SaveProgressInput,
  ): Promise<ProgressSaveResult> {
    const topicId = String(body.topicId || '').trim();
    if (!topicId) throw badRequest('topicId is required.');

    const { score, maxScore, status } = computeSyllabusScore(body);
    const scopedExamId = body.examId ? String(body.examId).trim() : null;
    const scopedSubject = body.subjectName ? String(body.subjectName).trim() : null;

    const attemptFilter = {
      userId,
      topicId,
      ...(scopedExamId ? { examId: scopedExamId } : {}),
    };

    const existingCount = await progressRepository.countAttempts(attemptFilter);

    await progressRepository.create({
      userId: new mongoose.Types.ObjectId(userId),
      username,
      examId: scopedExamId,
      subjectName: scopedSubject,
      topicId,
      score,
      maxScore,
      status,
      elapsedTime: body.elapsedTime != null ? String(body.elapsedTime) : undefined,
      attemptNumber: existingCount + 1,
      timestamp: new Date(),
    });

    await authRepository.touchLastStudyAt(userId);

    return {
      data: await progressRepository.findByUserId(userId),
      lastStudyAt: new Date().toISOString(),
    };
  }

  async saveMockProgress(
    userId: string,
    username: string,
    body: SaveMockProgressInput,
  ): Promise<ProgressSaveResult> {
    const scopedMockTestId = String(body.mockTestId || '').trim();
    if (!scopedMockTestId) throw badRequest('mockTestId is required.');

    const scopedExamId = body.examId ? String(body.examId).trim() : null;
    const { score, correct, wrong, blank, accuracy } = computeMockScore(body);

    const attemptFilter = {
      userId,
      mockTestId: scopedMockTestId,
      ...(scopedExamId ? { examId: scopedExamId } : {}),
    };

    const existingCount = await mockProgressRepository.countAttempts(attemptFilter);

    await mockProgressRepository.create({
      userId: new mongoose.Types.ObjectId(userId),
      username,
      examId: scopedExamId,
      mockTestId: scopedMockTestId,
      title: String(body.title ?? '').slice(0, 200),
      score,
      correct,
      wrong,
      blank,
      accuracy,
      elapsedTime: body.elapsedTime != null ? String(body.elapsedTime) : undefined,
      sectionTimes:
        body.sectionTimes && typeof body.sectionTimes === 'object'
          ? body.sectionTimes
          : null,
      attemptNumber: existingCount + 1,
      timestamp: new Date(),
    });

    await authRepository.touchLastStudyAt(userId);

    return {
      data: await mockProgressRepository.findByUserId(userId),
      lastStudyAt: new Date().toISOString(),
    };
  }

  async listProgress(userId: string, opts: { limit?: number; before?: string } = {}) {
    const limit = Math.min(100, Math.max(1, opts.limit || 50));
    const before = opts.before ? new Date(opts.before) : undefined;
    const rows = await progressRepository.findPageByUserId(userId, {
      limit: limit + 1,
      before: before && !Number.isNaN(before.getTime()) ? before : undefined,
    });
    const hasMore = rows.length > limit;
    const data = hasMore ? rows.slice(0, limit) : rows;
    const nextCursor =
      hasMore && data.length > 0
        ? new Date(data[data.length - 1].timestamp as Date).toISOString()
        : null;
    return { data, nextCursor };
  }

  async listMockProgress(userId: string, opts: { limit?: number; before?: string } = {}) {
    const limit = Math.min(100, Math.max(1, opts.limit || 30));
    const before = opts.before ? new Date(opts.before) : undefined;
    const rows = await mockProgressRepository.findPageByUserId(userId, {
      limit: limit + 1,
      before: before && !Number.isNaN(before.getTime()) ? before : undefined,
    });
    const hasMore = rows.length > limit;
    const data = hasMore ? rows.slice(0, limit) : rows;
    const nextCursor =
      hasMore && data.length > 0
        ? new Date(data[data.length - 1].timestamp as Date).toISOString()
        : null;
    return { data, nextCursor };
  }

  async exportMockProgressCsv(opts: ProgressExportOptions): Promise<CsvExportResult> {
    const filter: { userId?: string; username?: string; examId?: string } = {};
    if (opts.scope === 'all') {
      if (opts.role !== 'admin') throw forbidden('Admin access required.');
    } else {
      filter.userId = opts.userId;
    }
    if (opts.examId) filter.examId = opts.examId;

    const rows = await mockProgressRepository.findFiltered(filter);
    const who = opts.scope === 'all' ? 'all' : opts.username;
    return { csv: mockProgressToCsv(rows), filename: `mock-progress-${who}.csv` };
  }

  async exportSyllabusProgressCsv(opts: ProgressExportOptions): Promise<CsvExportResult> {
    const filter: { userId?: string; username?: string; examId?: string } = {};
    if (opts.scope === 'all') {
      if (opts.role !== 'admin') throw forbidden('Admin access required.');
    } else {
      filter.userId = opts.userId;
    }
    if (opts.examId) filter.examId = opts.examId;

    const rows = await progressRepository.findFiltered(filter);
    const who = opts.scope === 'all' ? 'all' : opts.username;
    return { csv: syllabusProgressToCsv(rows), filename: `syllabus-progress-${who}.csv` };
  }

  async getAdminSummary(): Promise<AdminSummary> {
    const [userCount, mockAttemptCount, syllabusAttemptCount] = await Promise.all([
      authRepository.countAll(),
      mockProgressRepository.countAll(),
      progressRepository.countAll(),
    ]);
    return { userCount, mockAttemptCount, syllabusAttemptCount };
  }
}

export const progressService = new ProgressService();
