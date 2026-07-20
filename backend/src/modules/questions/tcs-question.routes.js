import express from 'express';
import { requireAdmin } from '../../shared/middleware/auth.middleware.js';
import { getTcsStats, bulkUploadTcsQuestions } from './tcs-question.controller.js';

const router = express.Router();

router.get('/tcs/stats', requireAdmin, getTcsStats);
router.post('/tcs/bulk', requireAdmin, bulkUploadTcsQuestions);

export default router;
