import express from 'express';
import { explainConcept } from './ai.controller.js';

const router = express.Router();

router.post('/explain', explainConcept);

export default router;
