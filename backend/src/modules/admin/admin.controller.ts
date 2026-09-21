import { asyncHandler } from '../../utils/async-handler.js';
import { ok } from '../../utils/api-response.js';
import { AdminService } from './admin.service.js';

export class AdminController {
  constructor(private readonly adminService = new AdminService()) {}

  getSummary = asyncHandler(async (_req, res) => {
    const data = await this.adminService.getSummary();
    return ok(res, { data });
  });
}

export const adminController = new AdminController();
