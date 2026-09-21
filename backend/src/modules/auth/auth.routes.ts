import express from 'express';
import rateLimit from 'express-rate-limit';
import { authController } from './auth.controller.js';
import {
  registerValidation,
  loginValidation,
  googleAuthValidation,
} from './auth.validation.js';
import { validateRequest } from '../../middleware/validate.middleware.js';
import { requireAuth } from '../../middleware/auth.middleware.js';
import { requireDb } from '../../middleware/db.middleware.js';

const router = express.Router();

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { status: 'error', message: 'Too many auth attempts. Try again in 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
});

router.post('/register', authLimiter, requireDb, registerValidation, validateRequest, authController.register);
router.post('/login', authLimiter, requireDb, loginValidation, validateRequest, authController.login);
router.post('/google', authLimiter, requireDb, googleAuthValidation, validateRequest, authController.loginWithGoogle);

router.get('/me', requireAuth, authController.getMe);
router.post('/logout', requireAuth, authController.logout);

export default router;
