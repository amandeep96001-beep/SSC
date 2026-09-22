import type { RequestHandler } from 'express';
import { ZodError, type ZodType } from 'zod';
import { badRequest } from '../utils/app-errors.js';

type RequestSlice = 'body' | 'query' | 'params';

/**
 * Parse a request slice with Zod. On success, replaces the slice with the
 * parsed value so controllers always see typed, sanitized data.
 */
export function validate<T>(schema: ZodType<T>, slice: RequestSlice = 'body'): RequestHandler {
  return (req, _res, next) => {
    try {
      const parsed = schema.parse(req[slice]);
      if (slice === 'body') {
        req.body = parsed;
      } else if (slice === 'query') {
        // Express 5 query is read-only typed; assign for downstream handlers.
        Object.assign(req.query, parsed as object);
        (req as { query: unknown }).query = parsed;
      } else {
        Object.assign(req.params, parsed as object);
        (req as { params: unknown }).params = parsed;
      }
      next();
    } catch (err) {
      if (err instanceof ZodError) {
        const first = err.issues[0];
        const path = first?.path?.length ? first.path.join('.') : undefined;
        const message = first?.message || 'Invalid request data.';
        next(
          badRequest(path ? `${path}: ${message}` : message).withDetails({
            fields: err.issues.map((issue) => ({
              path: issue.path.join('.'),
              message: issue.message,
            })),
          }),
        );
        return;
      }
      next(err);
    }
  };
}
