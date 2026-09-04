import express from 'express';
import { explainConcept } from './ai.controller.js';

const router = express.Router();

// Existing: wrong-answer drill explainer (used by DrillWorkspace)
router.post('/explain', explainConcept);

// New: free-form SSC question explainer with Pollinations → Gemini fallback

export default router;
