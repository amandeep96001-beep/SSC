import express from 'express';
import { getNextDrill, verifyDrill } from '../controllers/drillController.js';

const router = express.Router();

router.get('/next', getNextDrill);
router.post('/verify', verifyDrill);

export default router;
