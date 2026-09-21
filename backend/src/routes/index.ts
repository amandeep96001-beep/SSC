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
import { requireDb } from '../shared/middleware/db.middleware.js';
import { getDBStatus } from '../config/db.config.js';

const router = express.Router();

function googleClientId(): string {
  return process.env.GOOGLE_CLIENT_ID?.trim() || '';
}

router.get('/health', (_req, res) => {
  const dbOk = getDBStatus();
  res.status(dbOk ? 200 : 503).json({
    status: dbOk ? 'ok' : 'degraded',
    db: dbOk ? 'connected' : 'disconnected',
  });
});

router.get('/auth/google-config', (_req, res) => {
  const clientId = googleClientId();
  const codeFlowEnabled = Boolean(process.env.GOOGLE_CLIENT_SECRET?.trim());

  res.setHeader('Cache-Control', 'no-store');
  res.json({
    status: 'ok',
    enabled: Boolean(clientId),
    clientId: clientId || null,
    codeFlowEnabled,
  });
});

router.use('/auth', authRoutes);

router.use(requireDb);
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
