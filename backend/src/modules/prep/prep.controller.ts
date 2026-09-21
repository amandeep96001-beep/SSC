import { asyncHandler } from '../../utils/async-handler.js';
import { ok, created } from '../../utils/api-response.js';
import { PrepService } from './prep.service.js';

function paramStr(value: string | string[] | undefined): string {
  return Array.isArray(value) ? String(value[0] ?? '') : String(value ?? '');
}

export class PrepController {
  constructor(private readonly prepService = new PrepService()) {}

  getStatus = asyncHandler(async (_req, res) => {
    return ok(res, this.prepService.getStatus());
  });

  getNotes = asyncHandler(async (req, res) => {
    const result = await this.prepService.getNotes(req.query.subject);
    return ok(res, result);
  });

  createNote = asyncHandler(async (req, res) => {
    const result = await this.prepService.createNote(req.body);
    return created(res, result);
  });

  deleteNote = asyncHandler(async (req, res) => {
    const result = await this.prepService.deleteNote(paramStr(req.params.id));
    return ok(res, { message: result.message });
  });
}

export const prepController = new PrepController();
