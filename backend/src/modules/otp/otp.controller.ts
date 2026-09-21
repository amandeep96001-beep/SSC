import { asyncHandler } from '../../utils/async-handler.js';
import { ok } from '../../utils/api-response.js';
import { OtpService } from './otp.service.js';

export class OtpController {
  constructor(private readonly otpService = new OtpService()) {}

  requestOtp = asyncHandler(async (req, res) => {
    const result = await this.otpService.requestOtp(req.body?.email);
    return ok(res, { message: result.message, data: result.data });
  });

  verifyOtp = asyncHandler(async (req, res) => {
    const result = await this.otpService.verifyOtp(req.body?.email, req.body?.code);
    return ok(res, { message: result.message, data: result.data });
  });
}

export const otpController = new OtpController();
