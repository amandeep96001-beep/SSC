import { asyncHandler } from '../../utils/async-handler.js';
import { ok, created } from '../../utils/api-response.js';
import { MockService } from './mock.service.js';

function paramStr(value: string | string[] | undefined): string {
  return Array.isArray(value) ? String(value[0] ?? '') : String(value ?? '');
}

export class MockController {
  constructor(private readonly mockService = new MockService()) {}

  createMockTest = asyncHandler(async (req, res) => {
    const result = await this.mockService.createMockTest(req.body);
    return created(res, { data: result.data });
  });

  getMockTests = asyncHandler(async (req, res) => {
    const result = await this.mockService.getMockTests(req.query.examId || 'ssc');
    return ok(res, { data: result.data });
  });

  getMockTestById = asyncHandler(async (req, res) => {
    const result = await this.mockService.getMockTestById(paramStr(req.params.id));
    return ok(res, { data: result.data });
  });

  deleteMockTest = asyncHandler(async (req, res) => {
    const result = await this.mockService.deleteMockTest(paramStr(req.params.id));
    return ok(res, { message: result.message });
  });
}

export const mockController = new MockController();
