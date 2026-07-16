import express from 'express';
import { listExamConfigs, upsertExamConfig } from './exam-config.controller.js';
import { requireAdmin } from '../../shared/middleware/auth.middleware.js';

const router = express.Router();

router.get('/', listExamConfigs);
router.put('/:examId', requireAdmin, upsertExamConfig);

export default router;
