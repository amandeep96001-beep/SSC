import express from 'express';
import rateLimit from 'express-rate-limit';
import { explainConcept } from './ai.controller.js';

const router = express.Router();

const aiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  message: { status: 'error', message: 'Too many AI requests. Try again in a few minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
});

router.post('/explain', aiLimiter, explainConcept);

export default router;
