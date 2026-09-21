/**
 * Exam config routes — per-exam settings
 */

import express from 'express';
import { listExamConfigs, upsertExamConfig } from './exam-config.controller.js';
import { requireAdmin } from '../../shared/middleware/auth.middleware.js';

const router = express.Router();

// ___________________________________________ exam-config ___________________________________________

router.get('/', listExamConfigs);
router.put('/:examId', requireAdmin, upsertExamConfig);

export default router;
