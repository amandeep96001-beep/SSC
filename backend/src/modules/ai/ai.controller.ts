import { asyncHandler } from '../../utils/async-handler.js';
import { ok } from '../../utils/api-response.js';
import { AiService } from './ai.service.js';

export class AiController {
  constructor(private readonly aiService = new AiService()) {}

  explainConcept = asyncHandler(async (req, res) => {
    const result = await this.aiService.explainConcept(req.body);
    return ok(res, result);
  });
}

export const aiController = new AiController();
