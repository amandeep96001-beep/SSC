import { asyncHandler } from '../../utils/async-handler.js';
import { ok } from '../../utils/api-response.js';
import { ExamConfigService } from './exam-config.service.js';

function paramStr(value: string | string[] | undefined): string {
  return Array.isArray(value) ? String(value[0] ?? '') : String(value ?? '');
}

export class ExamConfigController {
  constructor(private readonly examConfigService = new ExamConfigService()) {}

  listExamConfigs = asyncHandler(async (_req, res) => {
    const result = await this.examConfigService.listExamConfigs();
    return ok(res, result);
  });

  upsertExamConfig = asyncHandler(async (req, res) => {
    const result = await this.examConfigService.upsertExamConfig(
      paramStr(req.params.examId),
      req.body?.subjects,
    );
    return ok(res, result);
  });
}

export const examConfigController = new ExamConfigController();
