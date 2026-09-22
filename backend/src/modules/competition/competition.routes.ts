import express from 'express';
import { competitionController } from './competition.controller.js';
import { submitCompetitionSchema } from './competition.schema.js';
import { validate } from '../../lib/validate.js';

const router = express.Router();

router.get('/questions', competitionController.getQuestions);
router.post('/submit', validate(submitCompetitionSchema), competitionController.submitScore);
router.get('/leaderboard', competitionController.getLeaderboard);

export default router;
