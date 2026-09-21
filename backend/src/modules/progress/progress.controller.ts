import { asyncHandler } from '../../utils/async-handler.js';
import { ok } from '../../utils/api-response.js';
import { ProgressService } from './progress.service.js';

export class ProgressController {
  constructor(private readonly progressService = new ProgressService()) {}

  saveProgress = asyncHandler(async (req, res) => {
    const result = await this.progressService.saveProgress(
      req.user!.username,
      req.user!.id,
      req.body,
    );
    return ok(res, { data: result.data, lastStudyAt: result.lastStudyAt });
  });

  saveMockProgress = asyncHandler(async (req, res) => {
    const result = await this.progressService.saveMockProgress(
      req.user!.username,
      req.user!.id,
      req.body,
    );
    return ok(res, { data: result.data, lastStudyAt: result.lastStudyAt });
  });

  exportMockProgressCsv = asyncHandler(async (req, res) => {
    const scope = String(req.query.scope || 'me').toLowerCase();
    const examId = req.query.examId ? String(req.query.examId) : null;
    const { csv, filename } = await this.progressService.exportMockProgressCsv({
      scope,
      examId,
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
      username: req.user!.username,
      role: req.user!.role || 'user',
    });
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(`\uFEFF${csv}`);
  });
}

export const progressController = new ProgressController();
