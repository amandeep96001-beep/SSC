import express from 'express';
import { requireAdmin } from '../../middleware/auth.middleware.js';
import { tcsQuestionController } from './tcs-question.controller.js';

const router = express.Router();

router.get('/tcs/stats', requireAdmin, tcsQuestionController.getTcsStats);
router.post('/tcs/bulk', requireAdmin, tcsQuestionController.bulkUploadTcsQuestions);

// Any logged-in user can contribute questions to the drill bank.
router.post('/add', tcsQuestionController.addQuestionsFromUser);

export default router;
