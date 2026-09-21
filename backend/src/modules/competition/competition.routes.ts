import express from 'express';
import { competitionController } from './competition.controller.js';

const router = express.Router();

router.get('/questions', competitionController.getQuestions);
router.post('/submit', competitionController.submitScore);
router.get('/leaderboard', competitionController.getLeaderboard);

export default router;
