/**
 * Drill routes — daily practice queue
 */

import express from 'express';
import { getNextDrill, verifyDrill, getRelatedQuestions } from './drill.controller.js';

const router = express.Router();

// ___________________________________________ drill ___________________________________________

router.get('/next', getNextDrill);
router.post('/verify', verifyDrill);
router.get('/related', getRelatedQuestions);

export default router;
