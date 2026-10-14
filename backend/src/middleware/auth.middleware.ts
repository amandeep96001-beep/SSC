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
import { forbidden, serviceUnavailable, unauthorized } from '../utils/app-errors.js';

export const requireAuth: RequestHandler = async (req, _res, next) => {
  try {
    if (!getDBStatus()) {
      return next(serviceUnavailable('Database unavailable. Please try again shortly.'));
    }

    const header = req.headers.authorization;
    if (!header?.startsWith('Bearer ')) {
      return next(unauthorized('Authentication required. Please sign in again.'));
    }

    const token = header.slice(7);
    const payload = verifyToken(token);

    let cached = await getCachedAuthUser(payload.userId);
    if (!cached) {
      const user = await User.findById(payload.userId)
        .select('_id username email role tokenVersion')
        .lean();

      if (!user) {
        return next(unauthorized('Session expired. Please sign in again.'));
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
      return next(
        unauthorized('Signed in on another device. This session was signed out.', 'SESSION_SUPERSEDED'),
      );
    }

    req.user = {
      id: cached.id,
      username: cached.username,
      email: cached.email,
      role: cached.role,
    };

    next();
  } catch {
    next(unauthorized('Invalid or expired session. Please sign in again.'));
  }
};

export const requireAdmin: RequestHandler = (req, _res, next) => {
  if (req.user?.role !== 'admin') {
    return next(forbidden('Admin access required.'));
  }
  next();
};

export const optionalAuth: RequestHandler = async (req, _res, next) => {
  try {
    const header = req.headers.authorization;
    if (!header?.startsWith('Bearer ')) {
      return next();
    }

    const token = header.slice(7);
    const payload = verifyToken(token);

    let cached = await getCachedAuthUser(payload.userId);
    if (!cached) {
      const user = await User.findById(payload.userId)
        .select('_id username email role tokenVersion')
        .lean();

      if (!user) return next();

      let role: string = user.role || 'user';
      if (process.env.ADMIN_EMAIL?.trim() && user.email) {
        role = resolveRoleByEmail(user.email);
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
    if (claimed === cached.tokenVersion) {
      req.user = {
        id: cached.id,
        username: cached.username,
        email: cached.email,
        role: cached.role,
      };
    }
  } catch {
    // Optional auth never fails the request.
  }
  next();
};
