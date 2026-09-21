import express from 'express';
import { passwordController } from './password.controller.js';
import {
  forgotPasswordValidation,
  verifyPasswordResetOtpValidation,
  resetPasswordValidation,
} from './password.validation.js';
import { validateRequest } from '../../middleware/validate.middleware.js';
import { requireDb } from '../../middleware/db.middleware.js';
import { authLimiter, otpLimiter } from '../../middleware/rate-limit.js';

const router = express.Router();

router.post('/password/forgot', otpLimiter, requireDb, forgotPasswordValidation, validateRequest, passwordController.forgotPassword);
router.post('/password/verify-otp', authLimiter, requireDb, verifyPasswordResetOtpValidation, validateRequest, passwordController.verifyPasswordResetOtp);
router.post('/password/reset', authLimiter, requireDb, resetPasswordValidation, validateRequest, passwordController.resetPassword);

export default router;
