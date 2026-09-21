import express from 'express';
import { adminController } from './admin.controller.js';
import { requireAuth, requireAdmin } from '../../middleware/auth.middleware.js';

const router = express.Router();

router.get('/admin/summary', requireAuth, requireAdmin, adminController.getSummary);

export default router;
