/**
 * Competition — battle mode
 * GET  /questions   random TCS bank sample
 * POST /submit      save attempt + return personal best / rank
 * GET  /leaderboard top scores for a subject
 */

import express from 'express';
import { getQuestions, submitScore, getLeaderboard } from './competition.controller.js';

const router = express.Router();

// ___________________________________________ competition ___________________________________________

router.get('/questions', getQuestions);
router.post('/submit', submitScore);
router.get('/leaderboard', getLeaderboard);

export default router;
