import express from 'express';
import rateLimit from 'express-rate-limit';
import { otpController } from './otp.controller.js';
import { otpRequestValidation, otpVerifyValidation } from './otp.validation.js';
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

router.post('/otp/request', otpLimiter, requireDb, otpRequestValidation, validateRequest, otpController.requestOtp);
router.post('/otp/verify', authLimiter, requireDb, otpVerifyValidation, validateRequest, otpController.verifyOtp);

export default router;
