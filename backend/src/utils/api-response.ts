import type { Response } from 'express';

export interface ApiSuccessBody {
  [key: string]: unknown;
}

export function ok(res: Response, payload: ApiSuccessBody = {}, statusCode = 200): Response {
  return res.status(statusCode).json({ status: 'success', ...payload });
}

export function created(res: Response, payload: ApiSuccessBody = {}): Response {
  return ok(res, payload, 201);
}
