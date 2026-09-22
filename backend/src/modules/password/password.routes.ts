import express from 'express';
import { passwordController } from './password.controller.js';
import {
  forgotPasswordSchema,
  verifyPasswordResetOtpSchema,
  resetPasswordSchema,
} from './password.schema.js';
import { validate } from '../../lib/validate.js';
import { requireDb } from '../../middleware/db.middleware.js';
import { authLimiter, otpLimiter } from '../../middleware/rate-limit.js';

const router = express.Router();

router.post('/password/forgot', otpLimiter, requireDb, validate(forgotPasswordSchema), passwordController.forgotPassword);
router.post('/password/verify-otp', authLimiter, requireDb, validate(verifyPasswordResetOtpSchema), passwordController.verifyPasswordResetOtp);
router.post('/password/reset', authLimiter, requireDb, validate(resetPasswordSchema), passwordController.resetPassword);

export default router;
