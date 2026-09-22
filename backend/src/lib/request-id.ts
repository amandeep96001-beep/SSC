import { randomUUID } from 'crypto';
import type { RequestHandler } from 'express';

declare global {
  namespace Express {
    interface Request {
      requestId?: string;
    }
  }
}

const HEADER = 'x-request-id';

/** Attach a correlation id to every request (echoed on the response). */
export const requestIdMiddleware: RequestHandler = (req, res, next) => {
  const incoming = req.headers[HEADER];
  const fromClient = typeof incoming === 'string' ? incoming.trim().slice(0, 64) : '';
  const requestId = fromClient || randomUUID();
  req.requestId = requestId;
  res.setHeader(HEADER, requestId);
  next();
};
