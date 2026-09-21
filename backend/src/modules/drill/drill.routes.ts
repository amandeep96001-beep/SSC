import express from 'express';
import { drillController } from './drill.controller.js';

const router = express.Router();

router.get('/next', drillController.getNextDrill);
router.post('/verify', drillController.verifyDrill);
router.get('/related', drillController.getRelatedQuestions);

export default router;
