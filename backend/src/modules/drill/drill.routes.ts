import express from 'express';
import { drillController } from './drill.controller.js';
import { verifyDrillSchema } from './drill.schema.js';
import { validate } from '../../lib/validate.js';

const router = express.Router();

router.get('/next', drillController.getNextDrill);
router.post('/verify', validate(verifyDrillSchema), drillController.verifyDrill);
router.get('/related', drillController.getRelatedQuestions);

export default router;
