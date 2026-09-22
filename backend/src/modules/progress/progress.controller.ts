import { asyncHandler } from '../../utils/async-handler.js';
import { ok } from '../../utils/api-response.js';
import { ProgressService } from './progress.service.js';
import type { SaveMockProgressInput, SaveProgressInput } from './progress.interface.js';

export class ProgressController {
  constructor(private readonly progressService = new ProgressService()) {}

  saveProgress = asyncHandler(async (req, res) => {
    const result = await this.progressService.saveProgress(
      req.user!.id,
      req.user!.username,
      req.body as SaveProgressInput,
    );
    return ok(res, { data: result.data, lastStudyAt: result.lastStudyAt });
  });

  saveMockProgress = asyncHandler(async (req, res) => {
    const result = await this.progressService.saveMockProgress(
      req.user!.id,
      req.user!.username,
      req.body as SaveMockProgressInput,
    );
    return ok(res, { data: result.data, lastStudyAt: result.lastStudyAt });
  });

  listProgress = asyncHandler(async (req, res) => {
    const result = await this.progressService.listProgress(req.user!.id, {
      limit: req.query.limit ? Number(req.query.limit) : undefined,
      before: req.query.before ? String(req.query.before) : undefined,
    });
    return ok(res, result);
  });

  listMockProgress = asyncHandler(async (req, res) => {
    const result = await this.progressService.listMockProgress(req.user!.id, {
      limit: req.query.limit ? Number(req.query.limit) : undefined,
      before: req.query.before ? String(req.query.before) : undefined,
    });
    return ok(res, result);
  });

  exportMockProgressCsv = asyncHandler(async (req, res) => {
    const scope = String(req.query.scope || 'me').toLowerCase();
    const examId = req.query.examId ? String(req.query.examId) : null;
    const { csv, filename } = await this.progressService.exportMockProgressCsv({
      scope,
      examId,
      userId: req.user!.id,
      username: req.user!.username,
      role: req.user!.role || 'user',
    });
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(`\uFEFF${csv}`);
  });

  exportSyllabusProgressCsv = asyncHandler(async (req, res) => {
    const scope = String(req.query.scope || 'me').toLowerCase();
    const examId = req.query.examId ? String(req.query.examId) : null;
    const { csv, filename } = await this.progressService.exportSyllabusProgressCsv({
      scope,
      examId,
      userId: req.user!.id,
      username: req.user!.username,
      role: req.user!.role || 'user',
    });
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(`\uFEFF${csv}`);
  });
}

export const progressController = new ProgressController();
