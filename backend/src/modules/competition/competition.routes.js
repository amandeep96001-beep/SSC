import express from 'express';
import { getQuestions, submitScore, getLeaderboard } from './competition.controller.js';

const router = express.Router();

router.get('/questions', getQuestions);
router.post('/submit', submitScore);
router.get('/leaderboard', getLeaderboard);

export default router;
