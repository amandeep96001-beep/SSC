import { asyncHandler } from '../../../shared/utils/async-handler.js';
import { ok } from '../../../shared/utils/api-response.js';
import * as otpFlow from '../services/otp-flow.service.js';

export const requestOtp = asyncHandler(async (req, res) => {
  const result = await otpFlow.requestOtp(req.body.email);
  return ok(res, { message: result.message, data: result.data });
});

export const verifyOtp = asyncHandler(async (req, res) => {
  const result = await otpFlow.verifyOtp(req.body.email, req.body.code);
  return ok(res, { message: result.message, data: result.data });
});
