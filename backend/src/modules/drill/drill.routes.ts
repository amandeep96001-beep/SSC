import express from 'express';
import { getNextDrill, verifyDrill, getRelatedQuestions } from './drill.controller.js';

const router = express.Router();

router.get('/next', getNextDrill);
router.post('/verify', verifyDrill);
router.get('/related', getRelatedQuestions);

export default router;
