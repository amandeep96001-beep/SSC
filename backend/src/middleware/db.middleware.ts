import type { RequestHandler } from 'express';
import { getDBStatus } from '../config/db.config.js';
import { serviceUnavailable } from '../utils/app-errors.js';

export const requireDb: RequestHandler = (_req, _res, next) => {
  if (getDBStatus()) return next();
  next(serviceUnavailable('Database unavailable. Please try again shortly.'));
};
