import { asyncHandler } from '../../../shared/utils/async-handler.js';
import { ok, created } from '../../../shared/utils/api-response.js';
import * as authService from '../services/auth.service.js';
import * as googleService from '../services/google.service.js';

export const register = asyncHandler(async (req, res) => {
  const result = await authService.register(req.body);
  return created(res, { message: result.message, data: result.data });
});

export const login = asyncHandler(async (req, res) => {
  const result = await authService.login(req.body);
  if (!result.session) {
    return ok(res, { message: result.message, data: result.data });
  }
  return ok(res, { data: result.data });
});

export const getMe = asyncHandler(async (req, res) => {
  const data = await authService.getMe(req.user!.id, req.user!.username, {
    email: req.user!.email,
    role: req.user!.role,
  });
  return ok(res, { data });
});

export const logout = asyncHandler(async (req, res) => {
  const result = await authService.logout(req.user!.id);
  return ok(res, { message: result.message });
});

export const loginWithGoogle = asyncHandler(async (req, res) => {
  const result = await googleService.loginWithGoogle(req.body || {});
  return ok(res, { data: result.data });
});
