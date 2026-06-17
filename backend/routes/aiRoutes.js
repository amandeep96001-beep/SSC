import express from 'express';
import { explainConcept } from '../controllers/aiController.js';

const router = express.Router();

router.post('/explain', explainConcept);

export default router;
