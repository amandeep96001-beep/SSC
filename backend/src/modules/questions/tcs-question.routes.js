import express from 'express';
import { requireAdmin, requireAuth } from '../../shared/middleware/auth.middleware.js';
import { getTcsStats, bulkUploadTcsQuestions, addQuestionsFromUser } from './tcs-question.controller.js';

const router = express.Router();

// Admin-only: stats and bulk upload
router.get('/tcs/stats',  requireAdmin, getTcsStats);
router.post('/tcs/bulk',  requireAdmin, bulkUploadTcsQuestions);

// User-facing: add questions to the drill bank (any logged-in user)
router.post('/add', requireAuth, addQuestionsFromUser);

export default router;
