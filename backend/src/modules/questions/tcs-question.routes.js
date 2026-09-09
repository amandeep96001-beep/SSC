import express from 'express';
import { requireAdmin } from '../../shared/middleware/auth.middleware.js';
import { getTcsStats, bulkUploadTcsQuestions, addQuestionsFromUser } from './tcs-question.controller.js';

const router = express.Router();

// Parent router already applies requireAuth. Admin-only: stats and bulk upload
router.get('/tcs/stats', requireAdmin, getTcsStats);
router.post('/tcs/bulk', requireAdmin, bulkUploadTcsQuestions);

// Any logged-in user can contribute questions to the drill bank
router.post('/add', addQuestionsFromUser);

export default router;
