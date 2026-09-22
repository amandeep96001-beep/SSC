import { asyncHandler } from '../../utils/async-handler.js';
import { ok } from '../../utils/api-response.js';
import { CompetitionService } from './competition.service.js';
import type { SubmitCompetitionBody } from './competition.schema.js';

export class CompetitionController {
  constructor(private readonly competitionService = new CompetitionService()) {}

  getQuestions = asyncHandler(async (req, res) => {
    const result = await this.competitionService.getQuestions(
      req.user!.id,
      req.query.subject,
      req.query.limit,
    );
    return ok(res, result);
  });

  submitScore = asyncHandler(async (req, res) => {
    const body = req.body as SubmitCompetitionBody;
    const result = await this.competitionService.submitScore(
      req.user!.id,
      req.user!.username,
      body,
    );
    return ok(res, result);
  });

  getLeaderboard = asyncHandler(async (req, res) => {
    const result = await this.competitionService.getLeaderboard(req.query.subject);
    return ok(res, result);
  });
}

export const competitionController = new CompetitionController();
