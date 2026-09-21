/**
 * /api router map
 *
 * Public: health, google-config, auth (login / register / OTP / Google).
 * Protected: everything below requires a live DB + valid JWT.
 */

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

function googleClientId() {
  return process.env.GOOGLE_CLIENT_ID?.trim() || '';
}

// ___________________________________________ health ___________________________________________

router.get('/health', (_req, res) => {
  const dbOk = getDBStatus();
  res.status(dbOk ? 200 : 503).json({
    status: dbOk ? 'ok' : 'degraded',
    db: dbOk ? 'connected' : 'disconnected',
  });
});

// ___________________________________________ auth (public) ___________________________________________

/**
 * GIS client IDs are public by design.
 * Mounted here (not under requireAuth) so the login screen can bootstrap Google.
 */
router.get('/auth/google-config', (_req, res) => {
  const clientId = googleClientId();
  const codeFlowEnabled = Boolean(process.env.GOOGLE_CLIENT_SECRET?.trim());

  res.setHeader('Cache-Control', 'no-store');
  res.json({
    status: 'ok',
    enabled: Boolean(clientId),
    clientId: clientId || null,
    // Auth-code popup needs a server secret; ID-token flow does not.
    codeFlowEnabled,
  });
});

router.use('/auth', authRoutes);

// ___________________________________________ gate: db + jwt ___________________________________________

router.use(requireDb);
router.use(requireAuth);

// ___________________________________________ prep ___________________________________________

router.use('/prep', prepRoutes);

// ___________________________________________ study ___________________________________________

router.use('/study', studyRoutes);

// ___________________________________________ drill ___________________________________________

router.use('/drill', drillRoutes);

// ___________________________________________ mock ___________________________________________

router.use('/mock', mockRoutes);

// ___________________________________________ ai ___________________________________________

router.use('/ai', aiRoutes);

// ___________________________________________ competition ___________________________________________

router.use('/competition', competitionRoutes);

// ___________________________________________ exam-config ___________________________________________

router.use('/exam-config', examConfigRoutes);

// ___________________________________________ questions ___________________________________________

router.use('/questions', tcsQuestionRoutes);

// ___________________________________________ reminders ___________________________________________

router.use('/reminders', reminderRoutes);

export default router;
