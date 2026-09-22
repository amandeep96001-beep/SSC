import express from 'express';
import rateLimit from 'express-rate-limit';
import { aiController } from './ai.controller.js';
import { createRateLimitStore } from '../../infra/rate-limit-store.js';

const router = express.Router();

const aiMax = Number(process.env.RATE_LIMIT_AI_MAX || 30);

const aiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: Number.isFinite(aiMax) && aiMax > 0 ? Math.floor(aiMax) : 30,
  message: { status: 'error', message: 'Too many AI requests. Try again in a few minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
  store: createRateLimitStore('ai'),
});

router.post('/explain', aiLimiter, aiController.explainConcept);

export default router;
