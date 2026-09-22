import { asyncHandler } from '../../utils/async-handler.js';
import { ok, created } from '../../utils/api-response.js';
import { DrillService } from './drill.service.js';
import type {
  VerifyDrillBody,
  UpsertWrongLogBody,
  MigrateWrongLogBody,
} from './drill.schema.js';

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

  listWrongLog = asyncHandler(async (req, res) => {
    const data = await this.drillService.listWrongLog(req.user!.id);
    return ok(res, { data });
  });

  upsertWrongLog = asyncHandler(async (req, res) => {
    const body = req.body as UpsertWrongLogBody;
    const data = await this.drillService.upsertWrongLog(req.user!.id, body);
    return created(res, { data });
  });

  migrateWrongLog = asyncHandler(async (req, res) => {
    const body = req.body as MigrateWrongLogBody;
    const result = await this.drillService.migrateWrongLog(req.user!.id, body.items);
    return ok(res, result);
  });

  removeWrongLog = asyncHandler(async (req, res) => {
    const id = req.params.id ? String(req.params.id) : undefined;
    const question = req.query.question ? String(req.query.question) : undefined;
    const result = await this.drillService.removeWrongLog(req.user!.id, { id, question });
    return ok(res, result);
  });

  clearWrongLog = asyncHandler(async (req, res) => {
    const question = req.query.question ? String(req.query.question) : undefined;
    if (question) {
      const result = await this.drillService.removeWrongLog(req.user!.id, { question });
      return ok(res, result);
    }
    const type = req.query.type ? String(req.query.type) : undefined;
    const result = await this.drillService.clearWrongLog(req.user!.id, type);
    return ok(res, result);
  });
}

export const drillController = new DrillController();
