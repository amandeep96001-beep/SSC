import { asyncHandler } from '../../utils/async-handler.js';
import { ok } from '../../utils/api-response.js';
import { PasswordService } from './password.service.js';

export class PasswordController {
  constructor(private readonly passwordService = new PasswordService()) {}

  forgotPassword = asyncHandler(async (req, res) => {
    const result = await this.passwordService.forgotPassword(req.body?.email);
    return ok(res, { message: result.message, data: result.data });
  });

  verifyPasswordResetOtp = asyncHandler(async (req, res) => {
    const result = await this.passwordService.verifyPasswordResetOtp(
      req.body?.email,
      req.body?.code,
    );
    return ok(res, { message: result.message, data: result.data });
  });

  resetPassword = asyncHandler(async (req, res) => {
    const result = await this.passwordService.resetPassword(req.body?.token, req.body?.password);
    return ok(res, { message: result.message, data: result.data });
  });
}

export const passwordController = new PasswordController();
