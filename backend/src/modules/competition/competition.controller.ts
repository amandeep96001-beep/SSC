import { asyncHandler } from '../../utils/async-handler.js';
import { ok } from '../../utils/api-response.js';
import { CompetitionService } from './competition.service.js';

export class CompetitionController {
  constructor(private readonly competitionService = new CompetitionService()) {}

  getQuestions = asyncHandler(async (req, res) => {
    const result = await this.competitionService.getQuestions(req.query.subject, req.query.limit);
    return ok(res, result);
  });

  submitScore = asyncHandler(async (req, res) => {
    const result = await this.competitionService.submitScore(req.user?.username, req.body);
    return ok(res, result);
  });

  getLeaderboard = asyncHandler(async (req, res) => {
    const result = await this.competitionService.getLeaderboard(req.query.subject);
    return ok(res, result);
  });
}

export const competitionController = new CompetitionController();
