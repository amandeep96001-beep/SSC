/**
 * express-validator → first error as a stable 400 payload.
 */

import type { RequestHandler } from 'express';
import { validationResult } from 'express-validator';

// ___________________________________________ validateRequest ___________________________________________

export const validateRequest: RequestHandler = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      status: 'error',
      message: errors.array()[0]?.msg || 'Invalid request data.',
    });
  }
  next();
};
