import { asyncHandler } from '../../shared/utils/async-handler.js';
import { ok, created } from '../../shared/utils/api-response.js';
import * as tcsQuestionService from './tcs-question.service.js';

export const getTcsStats = asyncHandler(async (_req, res) => {
  const stats = await tcsQuestionService.getTcsStats();
  return ok(res, { data: stats });
});

export const bulkUploadTcsQuestions = asyncHandler(async (req, res) => {
  const result = await tcsQuestionService.bulkUploadTcsQuestions(req.body);

  if (result.kind === 'partial_success') {
    return res.status(207).json({
      status: 'partial_success',
      message: result.message,
    });
  }

  const respond = result.statusCode === 201 ? created : ok;
  return respond(res, { message: result.message, data: result.data });
});

export const addQuestionsFromUser = asyncHandler(async (req, res) => {
  const result = await tcsQuestionService.addQuestionsFromUser(req.body);

  if (result.kind === 'partial_success') {
    return res.status(207).json({
      status: 'partial_success',
      message: result.message,
    });
  }

  const respond = result.statusCode === 201 ? created : ok;
  return respond(res, { message: result.message, data: result.data });
});
