import { ProgressService } from '../progress/progress.service.js';
import type { AdminSummary } from './admin.interface.js';

export class AdminService {
  constructor(private readonly progressService = new ProgressService()) {}

  async getSummary(): Promise<AdminSummary> {
    return this.progressService.getAdminSummary();
  }
}

export const adminService = new AdminService();
