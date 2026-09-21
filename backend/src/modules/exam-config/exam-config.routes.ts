import express from 'express';
import { examConfigController } from './exam-config.controller.js';
import { requireAdmin } from '../../middleware/auth.middleware.js';

const router = express.Router();

router.get('/', examConfigController.listExamConfigs);
router.put('/:examId', requireAdmin, examConfigController.upsertExamConfig);

export default router;
