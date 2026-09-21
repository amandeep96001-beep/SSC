import { asyncHandler } from '../../../shared/utils/async-handler.js';
import { ok } from '../../../shared/utils/api-response.js';
import * as progressService from '../services/progress.service.js';

export const getAdminSummary = asyncHandler(async (_req, res) => {
  const data = await progressService.getAdminSummary();
  return ok(res, { data });
});
