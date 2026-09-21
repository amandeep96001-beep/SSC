import { asyncHandler } from '../../shared/utils/async-handler.js';
import { ok, created } from '../../shared/utils/api-response.js';
import * as prepService from './prep.service.js';

function paramStr(value: string | string[] | undefined): string {
  return Array.isArray(value) ? String(value[0] ?? '') : String(value ?? '');
}

export const getStatus = asyncHandler(async (_req, res) => {
  return ok(res, prepService.getStatus());
});

export const getNotes = asyncHandler(async (req, res) => {
  const result = await prepService.getNotes(req.query.subject);
  return ok(res, result);
});

export const createNote = asyncHandler(async (req, res) => {
  const result = await prepService.createNote(req.body);
  return created(res, result);
});

export const deleteNote = asyncHandler(async (req, res) => {
  const result = await prepService.deleteNote(paramStr(req.params.id));
  return ok(res, { message: result.message });
});
