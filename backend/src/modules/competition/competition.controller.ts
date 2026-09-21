import { asyncHandler } from '../../shared/utils/async-handler.js';
import { ok } from '../../shared/utils/api-response.js';
import * as competitionService from './competition.service.js';

export const getQuestions = asyncHandler(async (req, res) => {
  const result = await competitionService.getQuestions(req.query.subject, req.query.limit);
  return ok(res, result);
});

export const submitScore = asyncHandler(async (req, res) => {
  const result = await competitionService.submitScore(req.user?.username, req.body);
  return ok(res, result);
});

export const getLeaderboard = asyncHandler(async (req, res) => {
  const result = await competitionService.getLeaderboard(req.query.subject);
  return ok(res, result);
});
