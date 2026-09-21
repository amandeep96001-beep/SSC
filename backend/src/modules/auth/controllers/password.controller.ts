import { asyncHandler } from '../../../shared/utils/async-handler.js';
import { ok } from '../../../shared/utils/api-response.js';
import * as passwordService from '../services/password.service.js';

export const forgotPassword = asyncHandler(async (req, res) => {
  const result = await passwordService.forgotPassword(req.body.email);
  return ok(res, { message: result.message, data: result.data });
});

export const verifyPasswordResetOtp = asyncHandler(async (req, res) => {
  const result = await passwordService.verifyPasswordResetOtp(req.body.email, req.body.code);
  return ok(res, { message: result.message, data: result.data });
});

export const resetPassword = asyncHandler(async (req, res) => {
  const result = await passwordService.resetPassword(req.body.token, req.body.password);
  return ok(res, { message: result.message, data: result.data });
});
