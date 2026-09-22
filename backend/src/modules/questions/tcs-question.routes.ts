import express from 'express';
import { requireAdmin } from '../../middleware/auth.middleware.js';
import { tcsQuestionController } from './tcs-question.controller.js';

const router = express.Router();

router.get('/tcs/stats', requireAdmin, tcsQuestionController.getTcsStats);
router.post('/tcs/bulk', requireAdmin, tcsQuestionController.bulkUploadTcsQuestions);

// Question bank writes are admin-only (spam / poison protection).
router.post('/add', requireAdmin, tcsQuestionController.addQuestionsFromUser);

export default router;
