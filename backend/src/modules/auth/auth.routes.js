import express from 'express';
import rateLimit from 'express-rate-limit';
import { register, login, saveProgress, saveMockProgress, getMe } from './auth.controller.js';
import {
  registerValidation,
  loginValidation,
  progressValidation,
  mockProgressValidation
} from './auth.validation.js';
import { validateRequest } from '../../shared/middleware/validate.middleware.js';
import { requireAuth } from '../../shared/middleware/auth.middleware.js';

const router = express.Router();

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { status: 'error', message: 'Too many auth attempts. Try again in 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
});

router.post('/register', authLimiter, registerValidation, validateRequest, register);
router.post('/login', authLimiter, loginValidation, validateRequest, login);
router.get('/me', requireAuth, getMe);
router.post('/progress', requireAuth, progressValidation, validateRequest, saveProgress);
router.post('/mock-progress', requireAuth, mockProgressValidation, validateRequest, saveMockProgress);

export default router;
