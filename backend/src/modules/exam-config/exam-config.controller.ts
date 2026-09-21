import { asyncHandler } from '../../shared/utils/async-handler.js';
import { ok } from '../../shared/utils/api-response.js';
import * as examConfigService from './exam-config.service.js';

function paramStr(value: string | string[] | undefined): string {
  return Array.isArray(value) ? String(value[0] ?? '') : String(value ?? '');
}

export const listExamConfigs = asyncHandler(async (_req, res) => {
  const result = await examConfigService.listExamConfigs();
  return ok(res, result);
});

export const upsertExamConfig = asyncHandler(async (req, res) => {
  const result = await examConfigService.upsertExamConfig(
    paramStr(req.params.examId),
    req.body.subjects,
  );
  return ok(res, result);
});
