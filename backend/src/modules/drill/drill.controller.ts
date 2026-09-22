import { asyncHandler } from '../../utils/async-handler.js';
import { ok } from '../../utils/api-response.js';
import { DrillService } from './drill.service.js';
import type { VerifyDrillBody } from './drill.schema.js';

export class DrillController {
  constructor(private readonly drillService = new DrillService()) {}

  getNextDrill = asyncHandler(async (req, res) => {
    const type = String(req.query.type || 'table');
    const data = await this.drillService.getNextDrill({
      type,
      maxBase: req.query.maxBase,
      userId: req.user!.id,
    });
    return ok(res, { data });
  });

  verifyDrill = asyncHandler(async (req, res) => {
    const body = req.body as VerifyDrillBody;
    const data = await this.drillService.verifyDrill({
      challengeToken: body.challengeToken,
      userAnswer: body.userAnswer,
      userId: req.user!.id,
    });
    return ok(res, { data });
  });

  getRelatedQuestions = asyncHandler(async (req, res) => {
    const data = await this.drillService.getRelatedQuestions({
      category: req.query.category,
      type: req.query.type,
      excludeQuestion: req.query.excludeQuestion,
      excludeIds: req.query.excludeIds,
    });
    return ok(res, { data });
  });
}

export const drillController = new DrillController();
