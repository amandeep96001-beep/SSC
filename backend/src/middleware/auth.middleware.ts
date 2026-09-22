import type { RequestHandler } from 'express';
import User from '../modules/auth/auth.model.js';
import { verifyToken } from '../utils/token.js';
import { getDBStatus } from '../config/db.config.js';
import { resolveRoleByEmail } from '../utils/auth-identity.js';
import {
  getCachedAuthUser,
  setCachedAuthUser,
  type CachedAuthUser,
} from '../infra/auth-cache.js';

export const requireAuth: RequestHandler = async (req, res, next) => {
  try {
    if (!getDBStatus()) {
      return res.status(503).json({
        status: 'error',
        message: 'Database unavailable. Please try again shortly.',
      });
    }

    const header = req.headers.authorization;
    if (!header?.startsWith('Bearer ')) {
      return res.status(401).json({
        status: 'error',
        message: 'Authentication required. Please sign in again.',
      });
    }

    const token = header.slice(7);
    const payload = verifyToken(token);

    let cached = await getCachedAuthUser(payload.userId);
    if (!cached) {
      const user = await User.findById(payload.userId)
        .select('_id username email role tokenVersion')
        .lean();

      if (!user) {
        return res.status(401).json({
          status: 'error',
          message: 'Session expired. Please sign in again.',
        });
      }

      let role: string = user.role || 'user';
      if (process.env.ADMIN_EMAIL?.trim() && user.email) {
        role = resolveRoleByEmail(user.email);
        if (role !== user.role) {
          User.updateOne({ _id: user._id }, { $set: { role } }).catch(() => {});
        }
      }

      cached = {
        id: user._id.toString(),
        username: user.username,
        email: user.email || undefined,
        role,
        tokenVersion: user.tokenVersion ?? 0,
      } satisfies CachedAuthUser;
      await setCachedAuthUser(cached);
    }

    const claimed = typeof payload.tv === 'number' ? payload.tv : 0;
    if (claimed !== cached.tokenVersion) {
      return res.status(401).json({
        status: 'error',
        code: 'SESSION_SUPERSEDED',
        message: 'Signed in on another device. This session was signed out.',
      });
    }

    req.user = {
      id: cached.id,
      username: cached.username,
      email: cached.email,
      role: cached.role,
    };

    next();
  } catch {
    return res.status(401).json({
      status: 'error',
      message: 'Invalid or expired session. Please sign in again.',
    });
  }
};

export const requireAdmin: RequestHandler = (req, res, next) => {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({
      status: 'error',
      message: 'Admin access required.',
    });
  }
  next();
};
