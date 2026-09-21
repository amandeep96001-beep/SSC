import express from 'express';
import { progressController } from './progress.controller.js';
import { progressValidation, mockProgressValidation } from './progress.validation.js';
import { validateRequest } from '../../middleware/validate.middleware.js';
import { requireAuth } from '../../middleware/auth.middleware.js';

const router = express.Router();

router.post('/progress', requireAuth, progressValidation, validateRequest, progressController.saveProgress);
router.post('/mock-progress', requireAuth, mockProgressValidation, validateRequest, progressController.saveMockProgress);
router.get('/mock-progress/export', requireAuth, progressController.exportMockProgressCsv);
router.get('/progress/export', requireAuth, progressController.exportSyllabusProgressCsv);

export default router;
