import express from 'express';

import authRoutes from '../modules/auth/auth.routes.js';
import otpRoutes from '../modules/otp/otp.routes.js';
import passwordRoutes from '../modules/password/password.routes.js';
import progressRoutes from '../modules/progress/progress.routes.js';
import adminRoutes from '../modules/admin/admin.routes.js';
import prepRoutes from '../modules/prep/prep.routes.js';
import studyRoutes from '../modules/study/study.routes.js';
import drillRoutes from '../modules/drill/drill.routes.js';
import mockRoutes from '../modules/mock/mock.routes.js';
import aiRoutes from '../modules/ai/ai.routes.js';
import competitionRoutes from '../modules/competition/competition.routes.js';
import examConfigRoutes from '../modules/exam-config/exam-config.routes.js';
import tcsQuestionRoutes from '../modules/questions/tcs-question.routes.js';
import reminderRoutes from '../modules/reminders/reminder.routes.js';

import { studyController } from '../modules/study/study.controller.js';
import { examConfigController } from '../modules/exam-config/exam-config.controller.js';
import { mockController } from '../modules/mock/mock.controller.js';
import { competitionController } from '../modules/competition/competition.controller.js';
import { drillController } from '../modules/drill/drill.controller.js';
import { verifyDrillSchema } from '../modules/drill/drill.schema.js';
import { validate } from '../lib/validate.js';

import { requireAuth } from '../middleware/auth.middleware.js';
import { requireDb } from '../middleware/db.middleware.js';
import { getDBStatus } from '../config/db.config.js';

const router = express.Router();

function googleClientId(): string {
  return process.env.GOOGLE_CLIENT_ID?.trim() || '';
}

/** Mount a feature router behind DB + auth without catching unrelated 404s. */
function mountProtected(path: string, feature: express.Router) {
  router.use(path, requireDb, requireAuth, feature);
}

// ---------------------------------------------------------------------------
// Public routes (no auth)
// ---------------------------------------------------------------------------

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
router.use('/auth', otpRoutes);
router.use('/auth', passwordRoutes);

// ---------------------------------------------------------------------------
// Public browse (guest preview) — read-only catalogue
// ---------------------------------------------------------------------------

router.get('/study/subjects', requireDb, studyController.getSubjects);
router.get('/study/subjects/:subjectName/topics', requireDb, studyController.getTopics);
router.get('/study/topics/:topicId/notes', requireDb, studyController.getTopicNotes);
router.get('/study/vocab', requireDb, studyController.getVocab);
router.get('/exam-config', requireDb, examConfigController.listExamConfigs);
router.get('/mock', requireDb, mockController.getMockTests);
router.get('/mock/:id', requireDb, mockController.getMockTestById);
router.get('/competition/leaderboard', requireDb, competitionController.getLeaderboard);

// Guest try-before-login drills (challenge signed as userId "guest")
router.get('/drill/guest/next', requireDb, drillController.getNextDrillGuest);
router.post('/drill/guest/verify', requireDb, validate(verifyDrillSchema), drillController.verifyDrillGuest);

// ---------------------------------------------------------------------------
// Protected routes (DB + auth per mount)
// ---------------------------------------------------------------------------

mountProtected('/auth', progressRoutes);
mountProtected('/auth', adminRoutes);
mountProtected('/prep', prepRoutes);
mountProtected('/study', studyRoutes);
mountProtected('/drill', drillRoutes);
mountProtected('/mock', mockRoutes);
mountProtected('/ai', aiRoutes);
mountProtected('/competition', competitionRoutes);
mountProtected('/exam-config', examConfigRoutes);
mountProtected('/questions', tcsQuestionRoutes);
mountProtected('/reminders', reminderRoutes);

export default router;
