import { getDBStatus } from '../../config/db.config.js';

export function requireDb(req, res, next) {
  if (getDBStatus()) {
    return next();
  }

  return res.status(503).json({
    status: 'error',
    message: 'Database is not connected. Check MONGODB_URI on the server and Atlas network access (allow 0.0.0.0/0 for Render).',
  });
}
