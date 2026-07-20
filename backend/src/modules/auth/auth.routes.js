import express from 'express';
import rateLimit from 'express-rate-limit';
import {
  register,
  login,
  saveProgress,
  saveMockProgress,
  getMe,
  exportMockProgressCsv,
  exportSyllabusProgressCsv,
  getAdminSummary,
  requestOtp,
  verifyOtp,
  forgotPassword,
  resetPassword,
  loginWithGoogle,
} from './auth.controller.js';
import {
  registerValidation,
  loginValidation,
  progressValidation,
  mockProgressValidation,
  otpRequestValidation,
  otpVerifyValidation,
  forgotPasswordValidation,
  resetPasswordValidation,
  googleAuthValidation,
} from './auth.validation.js';
import { validateRequest } from '../../shared/middleware/validate.middleware.js';
import { requireAuth, requireAdmin } from '../../shared/middleware/auth.middleware.js';
import { requireDb } from '../../shared/middleware/db.middleware.js';

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

// Legacy password auth (kept for scripts / migration; UI uses OTP + Google)
router.post('/register', authLimiter, requireDb, registerValidation, validateRequest, register);
router.post('/login', authLimiter, requireDb, loginValidation, validateRequest, login);

router.post('/otp/request', otpLimiter, requireDb, otpRequestValidation, validateRequest, requestOtp);
router.post('/otp/verify', authLimiter, requireDb, otpVerifyValidation, validateRequest, verifyOtp);
router.post('/password/forgot', otpLimiter, requireDb, forgotPasswordValidation, validateRequest, forgotPassword);
router.post('/password/reset', authLimiter, requireDb, resetPasswordValidation, validateRequest, resetPassword);

// Google Identity Services — frontend sends ID token, backend verifies
router.post('/google', authLimiter, requireDb, googleAuthValidation, validateRequest, loginWithGoogle);

router.get('/me', requireAuth, getMe);
router.post('/progress', requireAuth, progressValidation, validateRequest, saveProgress);
router.post('/mock-progress', requireAuth, mockProgressValidation, validateRequest, saveMockProgress);
router.get('/mock-progress/export', requireAuth, exportMockProgressCsv);
router.get('/progress/export', requireAuth, exportSyllabusProgressCsv);
router.get('/admin/summary', requireAuth, requireAdmin, getAdminSummary);

export default router;
