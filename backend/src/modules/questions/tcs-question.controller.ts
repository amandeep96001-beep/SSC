import { asyncHandler } from '../../utils/async-handler.js';
import { ok, created } from '../../utils/api-response.js';
import { TcsQuestionService } from './tcs-question.service.js';

export class TcsQuestionController {
  constructor(private readonly tcsQuestionService = new TcsQuestionService()) {}

  getTcsStats = asyncHandler(async (_req, res) => {
    const stats = await this.tcsQuestionService.getTcsStats();
    return ok(res, { data: stats });
  });

  bulkUploadTcsQuestions = asyncHandler(async (req, res) => {
    const result = await this.tcsQuestionService.bulkUploadTcsQuestions(req.body);

    if (result.kind === 'partial_success') {
      return res.status(207).json({
        status: 'partial_success',
        message: result.message,
      });
    }

    const respond = result.statusCode === 201 ? created : ok;
    return respond(res, { message: result.message, data: result.data });
  });

  addQuestionsFromUser = asyncHandler(async (req, res) => {
    const result = await this.tcsQuestionService.addQuestionsFromUser(req.body);

    if (result.kind === 'partial_success') {
      return res.status(207).json({
        status: 'partial_success',
        message: result.message,
      });
    }

    const respond = result.statusCode === 201 ? created : ok;
    return respond(res, { message: result.message, data: result.data });
  });
}

export const tcsQuestionController = new TcsQuestionController();
