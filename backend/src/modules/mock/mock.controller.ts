import { asyncHandler } from '../../shared/utils/async-handler.js';
import { ok, created } from '../../shared/utils/api-response.js';
import * as mockService from './mock.service.js';

function paramStr(value: string | string[] | undefined): string {
  return Array.isArray(value) ? String(value[0] ?? '') : String(value ?? '');
}

export const createMockTest = asyncHandler(async (req, res) => {
  const result = await mockService.createMockTest(req.body);
  return created(res, { data: result.data });
});

export const getMockTests = asyncHandler(async (req, res) => {
  const result = await mockService.getMockTests(req.query.examId || 'ssc');
  return ok(res, { data: result.data });
});

export const getMockTestById = asyncHandler(async (req, res) => {
  const result = await mockService.getMockTestById(paramStr(req.params.id));
  return ok(res, { data: result.data });
});

export const deleteMockTest = asyncHandler(async (req, res) => {
  const result = await mockService.deleteMockTest(paramStr(req.params.id));
  return ok(res, { message: result.message });
});
