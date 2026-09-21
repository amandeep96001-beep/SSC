import { asyncHandler } from '../../utils/async-handler.js';
import { ok } from '../../utils/api-response.js';
import { DrillService } from './drill.service.js';

export class DrillController {
  constructor(private readonly drillService = new DrillService()) {}

  getNextDrill = asyncHandler(async (req, res) => {
    const type = String(req.query.type || 'table');
    const userId = (req.user as { _id?: unknown } | undefined)?._id ?? null;

    const data = await this.drillService.getNextDrill({
      type,
      maxBase: req.query.maxBase,
      userId,
    });

    return ok(res, { data });
  });

  verifyDrill = asyncHandler(async (req, res) => {
    const { type, userAnswer, correctAnswer, questionId, question } = req.body;
    const userId = req.user?.id ?? null;

    const data = await this.drillService.verifyDrill({
      type,
      userAnswer,
      correctAnswer,
      questionId,
      question,
      userId,
    });

    return ok(res, { data });
  });

  getRelatedQuestions = asyncHandler(async (req, res) => {
    const { category, type, excludeQuestion, excludeIds } = req.query;

    const data = await this.drillService.getRelatedQuestions({
      category,
      type,
      excludeQuestion,
      excludeIds,
    });

    return ok(res, { data });
  });
}

export const drillController = new DrillController();
