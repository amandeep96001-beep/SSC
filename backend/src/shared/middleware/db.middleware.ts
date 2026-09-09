import type { RequestHandler } from 'express';
import { getDBStatus } from '../../config/db.config.js';

export const requireDb: RequestHandler = (req, res, next) => {
  if (getDBStatus()) return next();

  return res.status(503).json({
    status: 'error',
    message: 'Database unavailable. Please try again shortly.',
  });
};
