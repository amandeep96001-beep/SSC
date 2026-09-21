import { asyncHandler } from '../../shared/utils/async-handler.js';
import { ok } from '../../shared/utils/api-response.js';
import * as drillService from './drill.service.js';

export const getNextDrill = asyncHandler(async (req, res) => {
  const type = String(req.query.type || 'table');
  const userId = (req.user as { _id?: unknown } | undefined)?._id ?? null;

  const data = await drillService.getNextDrill({
    type,
    maxBase: req.query.maxBase,
    userId,
  });

  return ok(res, { data });
});

export const verifyDrill = asyncHandler(async (req, res) => {
  const { type, userAnswer, correctAnswer, questionId, question } = req.body;
  const userId = req.user?.id ?? null;

  const data = await drillService.verifyDrill({
    type,
    userAnswer,
    correctAnswer,
    questionId,
    question,
    userId,
  });

  return ok(res, { data });
});

export const getRelatedQuestions = asyncHandler(async (req, res) => {
  const { category, type, excludeQuestion, excludeIds } = req.query;

  const data = await drillService.getRelatedQuestions({
    category,
    type,
    excludeQuestion,
    excludeIds,
  });

  return ok(res, { data });
});
