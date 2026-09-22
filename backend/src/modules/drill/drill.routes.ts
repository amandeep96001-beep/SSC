import express from 'express';
import { drillController } from './drill.controller.js';
import {
  verifyDrillSchema,
  upsertWrongLogSchema,
  migrateWrongLogSchema,
} from './drill.schema.js';
import { validate } from '../../lib/validate.js';

const router = express.Router();

router.get('/next', drillController.getNextDrill);
router.post('/verify', validate(verifyDrillSchema), drillController.verifyDrill);
router.get('/related', drillController.getRelatedQuestions);

router.get('/wrong-log', drillController.listWrongLog);
router.post('/wrong-log', validate(upsertWrongLogSchema), drillController.upsertWrongLog);
router.post('/wrong-log/migrate', validate(migrateWrongLogSchema), drillController.migrateWrongLog);
router.delete('/wrong-log/:id', drillController.removeWrongLog);
router.delete('/wrong-log', drillController.clearWrongLog);

export default router;
