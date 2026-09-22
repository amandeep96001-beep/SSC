import express from 'express';
import { progressController } from './progress.controller.js';
import { saveMockProgressSchema, saveProgressSchema } from './progress.schema.js';
import { validate } from '../../lib/validate.js';

const router = express.Router();

router.post('/progress', validate(saveProgressSchema), progressController.saveProgress);
router.post('/mock-progress', validate(saveMockProgressSchema), progressController.saveMockProgress);
router.get('/progress', progressController.listProgress);
router.get('/mock-progress', progressController.listMockProgress);
router.get('/mock-progress/export', progressController.exportMockProgressCsv);
router.get('/progress/export', progressController.exportSyllabusProgressCsv);

export default router;
