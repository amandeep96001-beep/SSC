import { asyncHandler } from '../../shared/utils/async-handler.js';
import { ok } from '../../shared/utils/api-response.js';
import * as aiService from './ai.service.js';

export const explainConcept = asyncHandler(async (req, res) => {
  const result = await aiService.explainConcept(req.body);
  return ok(res, result);
});
