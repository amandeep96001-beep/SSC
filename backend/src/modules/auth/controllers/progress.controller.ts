import { asyncHandler } from '../../../shared/utils/async-handler.js';
import { ok } from '../../../shared/utils/api-response.js';
import * as progressService from '../services/progress.service.js';

export const saveProgress = asyncHandler(async (req, res) => {
  const result = await progressService.saveProgress(
    req.user!.username,
    req.user!.id,
    req.body,
  );
  return ok(res, { data: result.data, lastStudyAt: result.lastStudyAt });
});

export const saveMockProgress = asyncHandler(async (req, res) => {
  const result = await progressService.saveMockProgress(
    req.user!.username,
    req.user!.id,
    req.body,
  );
  return ok(res, { data: result.data, lastStudyAt: result.lastStudyAt });
});

export const exportMockProgressCsv = asyncHandler(async (req, res) => {
  const scope = String(req.query.scope || 'me').toLowerCase();
  const examId = req.query.examId ? String(req.query.examId) : null;
  const { csv, filename } = await progressService.exportMockProgressCsv({
    scope,
    examId,
    username: req.user!.username,
    role: req.user!.role || 'user',
  });
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.send(`\uFEFF${csv}`);
});

export const exportSyllabusProgressCsv = asyncHandler(async (req, res) => {
  const scope = String(req.query.scope || 'me').toLowerCase();
  const examId = req.query.examId ? String(req.query.examId) : null;
  const { csv, filename } = await progressService.exportSyllabusProgressCsv({
    scope,
    examId,
    username: req.user!.username,
    role: req.user!.role || 'user',
  });
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.send(`\uFEFF${csv}`);
});
