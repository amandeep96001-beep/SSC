/**
 * Question bank routes — TCS MCQs + user contributions
 */

import express from 'express';
import { requireAdmin } from '../../shared/middleware/auth.middleware.js';
import { getTcsStats, bulkUploadTcsQuestions, addQuestionsFromUser } from './tcs-question.controller.js';

const router = express.Router();

// ___________________________________________ tcs bank (admin) ___________________________________________

router.get('/tcs/stats', requireAdmin, getTcsStats);
router.post('/tcs/bulk', requireAdmin, bulkUploadTcsQuestions);

// ___________________________________________ contributions ___________________________________________

// Any logged-in user can contribute questions to the drill bank.
router.post('/add', addQuestionsFromUser);

export default router;
