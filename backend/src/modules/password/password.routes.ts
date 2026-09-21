import express from 'express';
import rateLimit from 'express-rate-limit';
import { passwordController } from './password.controller.js';
import {
  forgotPasswordValidation,
  verifyPasswordResetOtpValidation,
  resetPasswordValidation,
} from './password.validation.js';
import { validateRequest } from '../../middleware/validate.middleware.js';
import { requireDb } from '../../middleware/db.middleware.js';

const router = express.Router();

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { status: 'error', message: 'Too many auth attempts. Try again in 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
});

const otpLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { status: 'error', message: 'Too many OTP requests. Try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

router.post('/password/forgot', otpLimiter, requireDb, forgotPasswordValidation, validateRequest, passwordController.forgotPassword);
router.post('/password/verify-otp', authLimiter, requireDb, verifyPasswordResetOtpValidation, validateRequest, passwordController.verifyPasswordResetOtp);
router.post('/password/reset', authLimiter, requireDb, resetPasswordValidation, validateRequest, passwordController.resetPassword);

export default router;
