import express from 'express';
import { authController } from './auth.controller.js';
import {
  registerSchema,
  loginSchema,
  googleAuthSchema,
  updateProfileSchema,
} from './auth.schema.js';
import { validate } from '../../lib/validate.js';
import { requireAuth } from '../../middleware/auth.middleware.js';
import { requireDb } from '../../middleware/db.middleware.js';
import { authLimiter } from '../../middleware/rate-limit.js';

const router = express.Router();

router.post('/register', authLimiter, requireDb, validate(registerSchema), authController.register);
router.post('/login', authLimiter, requireDb, validate(loginSchema), authController.login);
router.post('/google', authLimiter, requireDb, validate(googleAuthSchema), authController.loginWithGoogle);

router.get('/me', requireAuth, authController.getMe);
router.patch('/me', requireAuth, validate(updateProfileSchema), authController.updateProfile);
router.post('/logout', requireAuth, authController.logout);

export default router;
