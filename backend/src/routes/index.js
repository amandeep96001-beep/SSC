import express from 'express';
import authRoutes from '../modules/auth/auth.routes.js';
import prepRoutes from '../modules/prep/prep.routes.js';
import studyRoutes from '../modules/study/study.routes.js';
import drillRoutes from '../modules/drill/drill.routes.js';
import mockRoutes from '../modules/mock/mock.routes.js';
import aiRoutes from '../modules/ai/ai.routes.js';
import competitionRoutes from '../modules/competition/competition.routes.js';
import examConfigRoutes from '../modules/exam-config/exam-config.routes.js';
import tcsQuestionRoutes from '../modules/questions/tcs-question.routes.js';
import reminderRoutes from '../modules/reminders/reminder.routes.js';
import { requireAuth } from '../shared/middleware/auth.middleware.js';
import { getDBStatus } from '../config/db.config.js';
import { getEnvHealth } from '../config/env.config.js';

const router = express.Router();

// Public diagnostics (no auth)
router.get('/health', (req, res) => {
  const dbOk = getDBStatus();
  res.status(dbOk ? 200 : 503).json({
    status: dbOk ? 'ok' : 'degraded',
    db: dbOk ? 'connected' : 'disconnected',
    env: getEnvHealth(),
  });
});

// Public: register & login only (see auth.routes.js)
router.use('/auth', authRoutes);

// Everything below requires a valid JWT
router.use(requireAuth);
router.use('/prep', prepRoutes);
router.use('/study', studyRoutes);
router.use('/drill', drillRoutes);
router.use('/mock', mockRoutes);
router.use('/ai', aiRoutes);
router.use('/competition', competitionRoutes);
router.use('/exam-config', examConfigRoutes);
router.use('/questions', tcsQuestionRoutes);
router.use('/reminders', reminderRoutes);

export default router;
